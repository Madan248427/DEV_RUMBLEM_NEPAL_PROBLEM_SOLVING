import time
import requests

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import transaction

from library_admin.models import Book, BookAdditionalDetails


OPEN_LIBRARY_URL = "https://openlibrary.org/search.json"

USER_AGENT = (
    "LibraryManagementSystem/1.0 "
    "(contact: your-email@example.com)"
)


class Command(BaseCommand):

    help = "Import books from Open Library with cover images"

    def add_arguments(self, parser):

        parser.add_argument(
            "--count",
            type=int,
            default=1000,
            help="Number of books to import"
        )

        parser.add_argument(
            "--copies",
            type=int,
            default=5,
            help="Number of copies for each imported book"
        )

    def handle(self, *args, **options):

        target_count = options["count"]
        copies = options["copies"]

        self.stdout.write(
            self.style.SUCCESS(
                f"\nStarting import of {target_count} books...\n"
            )
        )

        queries = [
            # Programming
            # "python programming",
            # "computer science",
            # "machine learning",
            # "artificial intelligence",
            # "data science",
            # "web development",
            # "software engineering",
            # "programming",
            # "database",
            # "cybersecurity",
            # "javascript",
            # "django programming",
            # "java programming",
            # "c programming",
            # "cpp programming",

            # Fiction
            "fiction",
            "fantasy",
            "science fiction",
            "mystery",
            "thriller",
            "romance",
            "historical fiction",
            "adventure",
            "horror",
            "young adult",

            # Business
            "business",
            "economics",
            "finance",
            "marketing",
            "entrepreneurship",
            "management",

            # Science / Education
            "psychology",
            "philosophy",
            "history",
            "biography",
            "self help",
            "mathematics",
            "physics",
            "chemistry",
            "biology",
            "education",

            # Literature
            "poetry",
            "drama",
            "world literature",
            "indian literature",
            "asian literature",
            "nepal",
        ]

        imported = 0
        skipped = 0

        for query in queries:

            if imported >= target_count:
                break

            self.stdout.write(
                self.style.WARNING(
                    f"\nSearching: {query}"
                )
            )

            try:

                books = self.search_open_library(
                    query=query,
                    limit=100
                )

                for data in books:

                    if imported >= target_count:
                        break

                    try:

                        result = self.create_book(
                            data,
                            copies
                        )

                        if result == "created":

                            imported += 1

                            self.stdout.write(
                                self.style.SUCCESS(
                                    f"[{imported}/{target_count}] "
                                    f"{data.get('title', 'Unknown')}"
                                )
                            )

                        elif result == "duplicate":

                            skipped += 1

                    except Exception as e:

                        skipped += 1

                        self.stdout.write(
                            self.style.ERROR(
                                f"Skipping "
                                f"{data.get('title', 'Unknown')}: "
                                f"{str(e)}"
                            )
                        )

                # Don't hammer Open Library
                time.sleep(1)

            except Exception as e:

                self.stdout.write(
                    self.style.ERROR(
                        f"Error searching {query}: {str(e)}"
                    )
                )

        self.stdout.write("\n")

        self.stdout.write(
            self.style.SUCCESS(
                f"===================================="
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported : {imported}"
            )
        )

        self.stdout.write(
            self.style.WARNING(
                f"Skipped  : {skipped}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Finished!"
            )
        )

    # ==========================================================
    # SEARCH OPEN LIBRARY
    # ==========================================================

    def search_open_library(self, query, limit=100):

        params = {
            "q": query,
            "limit": limit,

            "fields": ",".join([
                "title",
                "author_name",
                "first_publish_year",
                "isbn",
                "publisher",
                "language",
                "subject",
                "cover_i",
            ])
        }

        headers = {
            "User-Agent": USER_AGENT
        }

        response = requests.get(
            OPEN_LIBRARY_URL,
            params=params,
            headers=headers,
            timeout=30
        )

        response.raise_for_status()

        return response.json().get(
            "docs",
            []
        )

    # ==========================================================
    # CREATE BOOK
    # ==========================================================

    @transaction.atomic
    def create_book(self, data, copies):

        title = data.get("title")

        if not title:
            return "duplicate"

        title = title.strip()

        # ------------------------------------------------------
        # AUTHORS
        # ------------------------------------------------------

        authors = data.get(
            "author_name",
            []
        )

        author_string = ", ".join(
            authors[:5]
        )

        # ------------------------------------------------------
        # ISBN
        # ------------------------------------------------------

        isbn = None

        for value in data.get("isbn", []):

            value = str(value).replace(
                "-",
                ""
            ).strip()

            if len(value) == 13 and value.isdigit():

                isbn = value

                break

        # ------------------------------------------------------
        # DUPLICATE CHECK
        # ------------------------------------------------------

        if isbn:

            if Book.objects.filter(
                isbn=isbn
            ).exists():

                return "duplicate"

        else:

            if Book.objects.filter(
                title__iexact=title,
                authors__iexact=author_string
            ).exists():

                return "duplicate"

        # ------------------------------------------------------
        # PUBLISHER
        # ------------------------------------------------------

        publishers = data.get(
            "publisher",
            []
        )

        publisher = (
            publishers[0]
            if publishers
            else None
        )

        # ------------------------------------------------------
        # LANGUAGE
        # ------------------------------------------------------

        languages = data.get(
            "language",
            []
        )

        language = None

        if languages:

            language = str(
                languages[0]
            )

        # ------------------------------------------------------
        # CATEGORY
        #
        # Your model uses:
        #
        # category = CharField(...)
        #
        # NOT Category ForeignKey.
        # ------------------------------------------------------

        subjects = data.get(
            "subject",
            []
        )

        category = self.get_category(
            subjects
        )

        # ------------------------------------------------------
        # YEAR
        # ------------------------------------------------------

        year = data.get(
            "first_publish_year"
        )

        if not isinstance(year, int):

            year = None

        # ------------------------------------------------------
        # DESCRIPTION
        # ------------------------------------------------------

        description = title

        if author_string:

            description += (
                f" by {author_string}."
            )

        # ------------------------------------------------------
        # CREATE BOOK
        # ------------------------------------------------------

        book = Book.objects.create(

            isbn=isbn,

            title=title[:255],

            authors=(
                author_string[:255]
                if author_string
                else None
            ),

            publisher=(
                publisher[:255]
                if publisher
                else None
            ),

            year_of_publication=year,

            language=(
                language[:50]
                if language
                else None
            ),

            category=category,

            number_of_copies=copies,

            status="available",

            description=description,

            shelf_location=None,

            added_by=None,
        )

        # ------------------------------------------------------
        # COVER IMAGE
        # ------------------------------------------------------

        cover_id = data.get(
            "cover_i"
        )

        if cover_id:

            self.download_cover(
                book,
                cover_id
            )

        # ------------------------------------------------------
        # ADDITIONAL DETAILS
        # ------------------------------------------------------

        # Your project may already create this automatically.
        #
        # update_or_create prevents the OneToOne duplicate error.

        details, created = (
            BookAdditionalDetails.objects.update_or_create(

                book=book,

                defaults={
                    "no_of_issued_book": 0,
                    "no_of_reserved_book": 0,
                }
            )
        )

        # The save() method of your
        # BookAdditionalDetails calculates:
        #
        # no_of_available_book
        #
        # automatically.

        if created:

            details.save()

        return "created"

    # ==========================================================
    # CATEGORY
    # ==========================================================

    def get_category(self, subjects):

        if not subjects:

            return "General"

        cleaned = []

        for subject in subjects:

            if not subject:
                continue

            subject = str(
                subject
            ).strip()

            if subject:

                cleaned.append(
                    subject
                )

        if not cleaned:

            return "General"

        # Remove duplicates
        cleaned = list(
            dict.fromkeys(
                cleaned
            )
        )

        # We only store one category because
        # your Book.category is a CharField.

        category = cleaned[0]

        return category[:100]

    # ==========================================================
    # DOWNLOAD COVER
    # ==========================================================

    def download_cover(self, book, cover_id):

        try:

            cover_url = (
                f"https://covers.openlibrary.org/"
                f"b/id/{cover_id}-M.jpg"
                f"?default=false"
            )

            headers = {
                "User-Agent": USER_AGENT
            }

            response = requests.get(
                cover_url,
                headers=headers,
                timeout=20
            )

            if response.status_code != 200:

                return False

            content_type = response.headers.get(
                "Content-Type",
                ""
            )

            if "image" not in content_type:

                return False

            filename = (
                f"openlibrary_{cover_id}.jpg"
            )

            book.cover_image.save(

                filename,

                ContentFile(
                    response.content
                ),

                save=True
            )

            self.stdout.write(
                self.style.NOTICE(
                    "    ✓ Cover downloaded"
                )
            )

            return True

        except Exception as e:

            self.stdout.write(
                self.style.WARNING(
                    f"    Cover failed: {str(e)}"
                )
            )

            return False