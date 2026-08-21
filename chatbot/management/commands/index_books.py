from django.core.management.base import BaseCommand

from qdrant_client.models import PointStruct

from library_admin.models import Book

from chatbot.embeddings import (
    create_book_embedding,
)

from chatbot.vector_db import (
    create_collection,
    store_books,
)


class Command(BaseCommand):

    help = (
        "Create embeddings for all books "
        "and store them in Qdrant."
    )

    def handle(self, *args, **options):

        self.stdout.write(
            "Creating Qdrant collection..."
        )

        create_collection()

        books = Book.objects.all()

        total = books.count()

        self.stdout.write(
            f"Found {total} books."
        )

        points = []

        for index, book in enumerate(
            books,
            start=1
        ):

            try:

                self.stdout.write(
                    f"[{index}/{total}] "
                    f"{book.title}"
                )

                vector = (
                    create_book_embedding(
                        book
                    )
                )

                point = PointStruct(

                    id=book.id,

                    vector=vector,

                    payload={

                        "book_id":
                            book.id,

                        "title":
                            book.title,

                        "authors":
                            book.authors or "",

                        "category":
                            book.category or "",

                        "isbn":
                            book.isbn or "",

                        "publisher":
                            book.publisher or "",

                        "language":
                            book.language or "",

                        "year_of_publication":
                            book.year_of_publication,

                    }
                )

                points.append(point)

                # Upload every 50 books
                if len(points) >= 50:

                    store_books(
                        points
                    )

                    points = []

                    self.stdout.write(
                        self.style.SUCCESS(
                            "  Uploaded batch"
                        )
                    )

            except Exception as e:

                self.stdout.write(
                    self.style.ERROR(
                        f"  Error: {e}"
                    )
                )

        # Upload remaining books
        if points:

            store_books(
                points
            )

        self.stdout.write(
            self.style.SUCCESS(
                "\nFinished indexing books!"
            )
        )