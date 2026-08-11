import time
import requests

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db.models import Q

from library_admin.models import Book


class Command(BaseCommand):

    help = "Update missing book metadata and covers from Open Library"

    def handle(self, *args, **options):

        books = Book.objects.filter(
            Q(cover_image__isnull=True) |
            Q(cover_image="") |
            Q(description__isnull=True) |
            Q(description="") |
            Q(publisher__isnull=True) |
            Q(publisher="")
        ).order_by("id")

        total = books.count()

        self.stdout.write(
            self.style.SUCCESS(
                f"Found {total} books to process."
            )
        )

        success = 0
        failed = 0

        for index, book in enumerate(
            books.iterator(),
            start=1
        ):

            self.stdout.write(
                f"\n[{index}/{total}] "
                f"{book.title}"
            )

            try:

                data = self.search_open_library(book)

                if not data:

                    self.stdout.write(
                        self.style.WARNING(
                            "  No Open Library result"
                        )
                    )

                    failed += 1
                    time.sleep(1)
                    continue

                self.update_metadata(
                    book,
                    data
                )

                self.download_cover(
                    book,
                    data
                )

                book.save(
                    update_fields=[
                        "isbn",
                        "authors",
                        "publisher",
                        "year_of_publication",
                        "description",
                    ]
                )

                success += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        "  ✓ Updated"
                    )
                )

            except Exception as e:

                failed += 1

                self.stdout.write(
                    self.style.ERROR(
                        f"  ✗ Error: {e}"
                    )
                )

            # Don't hammer Open Library.
            time.sleep(1)

        self.stdout.write("\n")

        self.stdout.write(
            self.style.SUCCESS(
                f"Finished.\n"
                f"Success: {success}\n"
                f"Failed: {failed}"
            )
        )

    # --------------------------------------------------
    # SEARCH
    # --------------------------------------------------

    def search_open_library(self, book):

        title = (book.title or "").strip()
        author = (book.authors or "").strip()

        if not title:
            return None

        params = {
            "title": title,
            "limit": 5,
            "fields": (
                "key,title,author_name,"
                "isbn,publisher,"
                "first_publish_year,"
                "cover_i,subject"
            ),
        }

        # Search by title + author when possible
        if author:
            params["q"] = (
                f'title:"{title}" '
                f'author:"{author}"'
            )
            params.pop("title", None)

        headers = {
            "User-Agent": (
                "LibraryManagementSystem/"
                "1.0 "
                "(your-email@example.com)"
            )
        }

        response = requests.get(
            "https://openlibrary.org/search.json",
            params=params,
            headers=headers,
            timeout=20
        )

        response.raise_for_status()

        data = response.json()

        docs = data.get("docs", [])

        if not docs:
            return None

        # Try to find the best matching result
        for doc in docs:

            doc_title = (
                doc.get("title") or ""
            ).lower().strip()

            if doc_title == title.lower().strip():

                return doc

        # Otherwise use most relevant result
        return docs[0]

    # --------------------------------------------------
    # METADATA
    # --------------------------------------------------

    def update_metadata(self, book, data):

        authors = data.get(
            "author_name",
            []
        )

        publishers = data.get(
            "publisher",
            []
        )

        isbns = data.get(
            "isbn",
            []
        )

        year = data.get(
            "first_publish_year"
        )

        subjects = data.get(
            "subject",
            []
        )

        # Authors
        if authors:

            book.authors = ", ".join(
                authors[:5]
            )

        # Publisher
        if publishers:

            book.publisher = publishers[0]

        # Publication year
        if year:

            book.year_of_publication = year

        # ISBN
        #
        # IMPORTANT:
        # Your current generate_isbn() creates
        # random 13-digit numbers.
        #
        # Replace only if Open Library gives
        # us a real ISBN.
        if isbns:

            real_isbn = self.find_valid_isbn(
                isbns
            )

            if real_isbn:

                # Don't cause unique constraint problems
                existing = Book.objects.filter(
                    isbn=real_isbn
                ).exclude(
                    id=book.id
                ).exists()

                if not existing:

                    book.isbn = real_isbn

        # Category
        if subjects and not book.category:

            category = self.guess_category(
                subjects
            )

            if category:

                book.category = category

        # Description
        #
        # Open Library search results do not
        # reliably provide a description.
        #
        # So don't overwrite an existing description.
        if not book.description:

            book.description = (
                self.create_description(
                    book,
                    data
                )
            )

    # --------------------------------------------------
    # ISBN
    # --------------------------------------------------

    def find_valid_isbn(self, isbns):

        for isbn in isbns:

            isbn = str(isbn).replace(
                "-",
                ""
            ).strip()

            if len(isbn) in (10, 13):

                return isbn

        return None

    # --------------------------------------------------
    # CATEGORY
    # --------------------------------------------------

    def guess_category(self, subjects):

        text = " ".join(
            subjects
        ).lower()

        categories = {

            "machine learning": [
                "machine learning",
                "deep learning",
            ],

            "artificial intelligence": [
                "artificial intelligence",
                "artificial intelligence",
            ],

            "computer science": [
                "computer science",
                "computers",
            ],

            "programming": [
                "programming",
                "python",
                "java",
                "software",
            ],

            "database": [
                "database",
                "databases",
            ],

            "business": [
                "business",
                "management",
            ],

            "economics": [
                "economics",
                "economic",
            ],

            "fiction": [
                "fiction",
                "novel",
            ],

            "fantasy": [
                "fantasy",
            ],

            "science fiction": [
                "science fiction",
                "science fiction",
            ],

            "mystery": [
                "mystery",
                "detective",
            ],

            "romance": [
                "romance",
            ],

            "history": [
                "history",
                "historical",
            ],
        }

        for category, keywords in categories.items():

            for keyword in keywords:

                if keyword in text:

                    return category

        return None

    # --------------------------------------------------
    # DESCRIPTION
    # --------------------------------------------------

    def create_description(self, book, data):

        subjects = data.get(
            "subject",
            []
        )

        subject_text = ", ".join(
            subjects[:8]
        )

        author = (
            book.authors
            or "the author"
        )

        if subject_text:

            return (
                f"{book.title} by {author}. "
                f"This book explores topics including "
                f"{subject_text}."
            )

        return (
            f"{book.title} by {author}."
        )

    # --------------------------------------------------
    # COVER
    # --------------------------------------------------

    def download_cover(self, book, data):

        # Don't download if already present
        if book.cover_image:

            return

        cover_id = data.get(
            "cover_i"
        )

        if not cover_id:

            self.stdout.write(
                "  No cover available"
            )

            return

        url = (
            "https://covers.openlibrary.org/"
            f"b/id/{cover_id}-L.jpg"
        )

        headers = {
            "User-Agent": (
                "LibraryManagementSystem/"
                "1.0 "
                "(your-email@example.com)"
            )
        }

        response = requests.get(
            url,
            headers=headers,
            timeout=20
        )

        if response.status_code != 200:

            self.stdout.write(
                "  Cover download failed"
            )

            return

        filename = (
            f"openlibrary_{book.id}.jpg"
        )

        book.cover_image.save(
            filename,
            ContentFile(
                response.content
            ),
            save=False
        )

        self.stdout.write(
            "  ✓ Cover downloaded"
        )