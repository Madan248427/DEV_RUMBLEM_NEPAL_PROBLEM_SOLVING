import numpy as np

from library_admin.models import (
    Book,
    BookTransaction,
    BookComment,
)

from chatbot.vector_db import (
    get_book_vector,
    search_books,
)


def build_user_vector(user_id):
    """
    Build a user's preference vector from
    their borrowing history and ratings.
    """

    vectors = []
    weights = []

    # =====================================================
    # BORROWED BOOKS
    # =====================================================

    transactions = (
        BookTransaction.objects
        .filter(
            user_id=user_id,
            transaction_type="issued",
        )
        .select_related("book")
    )

    for transaction in transactions:

        vector = get_book_vector(
            transaction.book_id
        )

        if vector is None:
            continue

        vectors.append(vector)

        # Borrowed book = positive interest
        weights.append(2.0)

    # =====================================================
    # RATINGS
    # =====================================================

    comments = (
        BookComment.objects
        .filter(
            user_id=user_id,
            stars__gt=0,
        )
        .select_related("book")
    )

    for comment in comments:

        vector = get_book_vector(
            comment.book_id
        )

        if vector is None:
            continue

        vectors.append(vector)

        # Rating 1-5 becomes weight
        weights.append(
            float(comment.stars)
        )

    # =====================================================
    # NO HISTORY
    # =====================================================

    if not vectors:
        return None

    vectors = np.array(
        vectors,
        dtype=np.float32
    )

    weights = np.array(
        weights,
        dtype=np.float32
    )

    # =====================================================
    # WEIGHTED AVERAGE
    # =====================================================

    user_vector = np.average(
        vectors,
        axis=0,
        weights=weights
    )

    # =====================================================
    # NORMALIZE
    # =====================================================

    norm = np.linalg.norm(
        user_vector
    )

    if norm > 0:

        user_vector = (
            user_vector / norm
        )

    return user_vector.tolist()


def get_user_read_book_ids(user_id):

    transaction_ids = (
        BookTransaction.objects
        .filter(
            user_id=user_id,
            transaction_type="issued",
        )
        .values_list(
            "book_id",
            flat=True
        )
    )

    comment_ids = (
        BookComment.objects
        .filter(
            user_id=user_id
        )
        .values_list(
            "book_id",
            flat=True
        )
    )

    return set(
        list(transaction_ids)
        + list(comment_ids)
    )


def recommend_books_for_user(
    user_id,
    limit=10
):
    """
    Main recommendation function.

    This is the function your chatbot
    will call.
    """

    user_vector = build_user_vector(
        user_id
    )

    # =====================================================
    # NEW USER
    # =====================================================

    if user_vector is None:

        return get_popular_books(
            limit=limit
        )

    # =====================================================
    # BOOKS USER ALREADY INTERACTED WITH
    # =====================================================

    excluded_ids = (
        get_user_read_book_ids(
            user_id
        )
    )

    # =====================================================
    # SEARCH QDRANT
    # =====================================================

    results = search_books(

        vector=user_vector,

        # Get extra results because
        # some will be excluded.
        limit=limit + 20,

        exclude_book_ids=excluded_ids
    )

    if not results:

        return get_popular_books(
            limit=limit
        )

    # =====================================================
    # GET ACTUAL BOOKS FROM POSTGRESQL
    # =====================================================

    book_ids = [
        item["book_id"]
        for item in results
    ]

    books = Book.objects.filter(
        id__in=book_ids,
        status="available",
        number_of_copies__gt=0,
    )

    book_map = {
        book.id: book
        for book in books
    }

    # =====================================================
    # FINAL RESULTS
    # =====================================================

    recommendations = []

    for item in results:

        book = book_map.get(
            item["book_id"]
        )

        if not book:
            continue

        recommendations.append({

            "book_id":
                book.id,

            "title":
                book.title,

            "authors":
                book.authors,

            "category":
                book.category,

            "description":
                book.description,

            "cover_image":
                (
                    book.cover_image.url
                    if book.cover_image
                    else None
                ),

            "score":
                round(
                    item["score"],
                    4
                ),
        })

        if len(
            recommendations
        ) >= limit:

            break

    return recommendations


def get_popular_books(limit=10):
    """
    Fallback recommendation for new users.

    Uses books with the most issued transactions.
    """

    from django.db.models import Count

    books = (
        Book.objects
        .filter(
            status="available",
            number_of_copies__gt=0,
        )
        .annotate(
            borrow_count=Count(
                "booktransaction"
            )
        )
        .order_by(
            "-borrow_count"
        )[:limit]
    )

    return [

        {
            "book_id": book.id,

            "title": book.title,

            "authors": book.authors,

            "category": book.category,

            "description":
                book.description,

            "cover_image":
                (
                    book.cover_image.url
                    if book.cover_image
                    else None
                ),

            "score": None,
        }

        for book in books
    ]