from langchain_core.tools import tool

from library_admin.models import (
    Book,
    BookTransaction
)
from chatbot.embeddings import create_text_embedding
from chatbot.vector_db import search_books


current_user = None



def set_user(user):
    global current_user
    current_user=user







@tool
def get_my_books():
    """
    Get current user's borrowed books.
    """

    transactions = BookTransaction.objects.filter(
        user=current_user,
        transaction_type="issued"
    )


    return [
        t.book.title
        for t in transactions
    ]



@tool
def borrow_book(title: str):
    """
    Borrow a book by title.
    Never use or generate a database ID.
    """

    if not  current_user or not current_user.is_authenticated:
        return "Please log in before borrowing a book."

    if getattr(current_user, "Role", None) != "employee":
        return "Permission denied only employee or admin can borrow books kindly visite the library."

    books = Book.objects.filter(
        title__iexact=title
    )

    if not books.exists():
        return f'I could not find a book titled "{title}".'

    if books.count() > 1:
        return (
            f'Multiple books titled "{title}" were found. '
            "Please specify which one."
        )

    book = books.first()

    BookTransaction.objects.create(
        user=current_user,
        book=book,
        transaction_type="issued"
    )

    return f'Book "{book.title}" borrowed successfully.'



@tool
def return_book(transaction_id:int):
    """
    Return borrowed book.
    """


    transaction = BookTransaction.objects.get(
        id=transaction_id
    )


    if transaction.user != current_user:
        return "You cannot return this book"


    transaction.transaction_type="returned"
    transaction.save()


    return "Book returned"



@tool
def search_book(title: str):
    """
    Search for one book by title.
    The search is case-insensitive and supports partial title matching.
    """
    book = Book.objects.filter(
        title__icontains=title
    ).first()

    if not book:
        return {
            "error": "No book found"
        }

    return {
        "id": book.id,
        "title": book.title,
    }
@tool
def reserve_book(title: str):
    """
    Reserve a book by its title.
    The AI must provide the actual book title fromthe
    conversation. The database determines the bookID.
    NEVER provide or invent a book ID.
    """
    if not current_user or not current_user.is_authenticated:
        return "Please login before reserving abook."
    if getattr(current_user, "Role", None) != "user":
        return "Permission denied."
    books = Book.objects.filter(
        title__iexact=title
    )
    if not books.exists():
        return (
            f'I could not find a book titled {title}". '
            "Please search for the book first."
        )
    if books.count() > 1:
        return (
            f'Multiple books titled "{title}" werefound. '
            "Please specify which one you want."
        )
    book = books.first()
    BookTransaction.objects.create(
        user=current_user,
        book=book,
        transaction_type="reserved"
    )
    return (
        f'Book "{book.title}" has been reservedsuccessfully.'
    )
# @tool
# def recommend_books(genre: str):
#     """
#     Recommend books based on genre.
#     """
#     books = Book.objects.filter(
#         category__iexact=genre
#     )
#     return [
#         {
#             "id": book.id,
#             "title": book.title,
#             "author": book.authors,
#             "genre": book.category,
#             "description": book.description,
#         }
#         for book in books
#     ]
@tool
def recommend_books(query: str):
    """
    Recommend books based on the user's request.

    Works for both guests and logged-in users.

    Guests:
        Semantic search using the query.

    Logged-in users:
        Semantic search using the query while
        excluding books they already interacted with.
    """

    print("i am inside recommend_books function")
    # ==========================================
    # 1. Create embedding from user's request
    # ==========================================

    vector = create_text_embedding(query)

    # ==========================================
    # 2. Get user's previous books if logged in
    # ==========================================

    excluded_ids = []

    if current_user and current_user.is_authenticated:

        excluded_ids = list(
            BookTransaction.objects.filter(
                user=current_user
            ).values_list(
                "book_id",
                flat=True
            )
        )

    # ==========================================
    # 3. Search Qdrant
    # ==========================================

    results = search_books(
        vector=vector,
        limit=20,
        exclude_book_ids=excluded_ids
    )

    if not results:
        return "I couldn't find suitable books."

    # ==========================================
    # 4. Get books from PostgreSQL
    # ==========================================

    book_ids = [
        result["book_id"]
        for result in results
    ]

    books = Book.objects.filter(
        id__in=book_ids
    )

    book_map = {
        book.id: book
        for book in books
    }

    # ==========================================
    # 5. Build recommendations
    # ==========================================

    recommendations = []

    for result in results:

        book = book_map.get(
            result["book_id"]
        )

        if not book:
            continue

        recommendations.append({

            "book_id": book.id,

            "title":
                book.title,

            "authors":
                book.authors or "",

            "category":
                book.category or "",

            "description":
                book.description or "",

            "publisher":
                book.publisher or "",

            "year":
                book.year_of_publication,

            "language":
                book.language or "",

            "isbn":
                book.isbn or "",

            "cover_image":
                (
                    book.cover_image.url
                    if book.cover_image
                    else None
                ),

            "similarity_score":
                round(
                    result["score"],
                    4
                ),
        })

        if len(recommendations) >= 5:
            break

    if not recommendations:
        return "I couldn't find suitable books."

    return recommendations

def create_tools(user):
    set_user(user)

    return [
        search_book,
        get_my_books,
        borrow_book,
        return_book,
        reserve_book,
        recommend_books,
    ]


