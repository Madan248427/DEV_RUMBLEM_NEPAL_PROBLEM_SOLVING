from sentence_transformers import SentenceTransformer
from django.conf import settings


_model = None


def get_embedding_model():
    """
    Load the embedding model only once.
    """

    global _model

    if _model is None:
        _model = SentenceTransformer(
            settings.EMBEDDING_MODEL
        )

    return _model


def create_book_text(book):


    parts = []

    if book.title:
        parts.append(
            f"Title: {book.title}"
        )

    if book.authors:
        parts.append(
            f"Authors: {book.authors}"
        )

    if book.category:
        parts.append(
            f"Category: {book.category}"
        )

    if book.publisher:
        parts.append(
            f"Publisher: {book.publisher}"
        )

    if book.language:
        parts.append(
            f"Language: {book.language}"
        )

    if book.year_of_publication:
        parts.append(
            f"Year: {book.year_of_publication}"
        )

    if book.edition:
        parts.append(
            f"Edition: {book.edition}"
        )

    if book.description:
        parts.append(
            f"Description: {book.description}"
        )

    return "\n".join(parts)


def create_book_embedding(book):
    """
    Create a vector for one book.
    """

    text = create_book_text(book)

    model = get_embedding_model()

    vector = model.encode(
        text,
        normalize_embeddings=True
    )

    return vector.tolist()


def create_text_embedding(text):
    """
    Create embedding from arbitrary text.
    Useful for chatbot queries such as:

    'I want a fantasy adventure book'
    """

    model = get_embedding_model()

    vector = model.encode(
        text,
        normalize_embeddings=True
    )

    return vector.tolist()