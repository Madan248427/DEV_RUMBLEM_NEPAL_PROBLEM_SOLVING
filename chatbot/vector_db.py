from django.conf import settings

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
)


COLLECTION_NAME = settings.QDRANT_COLLECTION


client = QdrantClient(
    url=settings.QDRANT_URL
)


def create_collection():
    """
    Create the book vector collection
    if it doesn't already exist.
    """

    collections = client.get_collections()

    exists = any(
        collection.name == COLLECTION_NAME
        for collection in collections.collections
    )

    if not exists:

        client.create_collection(

            collection_name=COLLECTION_NAME,

            vectors_config=VectorParams(
                size=384,
                distance=Distance.COSINE,
            ),
        )


def store_book(book, vector):
    """
    Store/update one book embedding.
    """

    point = PointStruct(

        id=book.id,

        vector=vector,

        payload={
            "book_id": book.id,

            "title": book.title,

            "authors": book.authors or "",

            "category": book.category or "",

            "isbn": book.isbn or "",

            "publisher": book.publisher or "",

            "language": book.language or "",

            "year_of_publication":
                book.year_of_publication,

        }
    )

    client.upsert(

        collection_name=COLLECTION_NAME,

        points=[point]
    )


def store_books(points):
    """
    Store multiple books at once.
    """

    client.upsert(

        collection_name=COLLECTION_NAME,

        points=points
    )


def get_book_vector(book_id):
    """
    Retrieve one book vector.
    """

    result = client.retrieve(

        collection_name=COLLECTION_NAME,

        ids=[book_id],

        with_vectors=True,
    )

    if not result:
        return None

    return result[0].vector


def search_books(
    vector,
    limit=10,
    exclude_book_ids=None
):
    """
    Search Qdrant for books similar to a vector.
    """

    exclude_book_ids = (
        exclude_book_ids or []
    )

    results = client.query_points(

        collection_name=COLLECTION_NAME,

        query=vector,

        limit=limit,

        with_payload=True,
    )

    recommendations = []

    for result in results.points:

        book_id = result.payload.get(
            "book_id"
        )

        if book_id in exclude_book_ids:
            continue

        recommendations.append({

            "book_id": book_id,

            "score": float(
                result.score
            ),

            "title":
                result.payload.get(
                    "title"
                ),

            "authors":
                result.payload.get(
                    "authors"
                ),

            "category":
                result.payload.get(
                    "category"
                ),
        })

    return recommendations