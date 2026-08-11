from django.db import models
from django.conf import settings
from uuid import uuid4
import os
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError



User = settings.AUTH_USER_MODEL

import random

def generate_isbn():
    """
    Generates a unique 13-digit ISBN-like number
    """
    while True:
        isbn = ''.join([str(random.randint(0, 9)) for _ in range(13)])
        if not Book.objects.filter(isbn=isbn).exists():
            return isbn


# Upload paths
def book_cover_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid4().hex}.{ext}"
    return os.path.join('book_covers', str(instance.added_by.id), filename)

def category_icon_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid4().hex}.{ext}"
    return os.path.join('category_icons', filename)

def author_image_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid4().hex}.{ext}"
    return os.path.join('author_images', filename)

def default_due_date():
    return timezone.now() + timedelta(days=7)

# -------------------------------
# Book Model
# -------------------------------
from django.conf import settings
User = settings.AUTH_USER_MODEL

class Book(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('issued', 'Issued'),
        ('reserved', 'Reserved'),
        ('lost', 'Lost'),
    ]

    isbn = models.CharField(max_length=13, unique=True, blank=True, null=True)

    title = models.CharField(max_length=255)
    authors = models.CharField(
    max_length=255,
    blank=True,
    null=True
)
    publisher = models.CharField(max_length=255, blank=True, null=True)
    year_of_publication = models.PositiveIntegerField(blank=True, null=True)
    edition = models.CharField(max_length=50, blank=True, null=True)
    language = models.CharField(max_length=50, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    number_of_copies = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    cover_image = models.ImageField(upload_to=book_cover_path, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    shelf_location = models.CharField(max_length=100, blank=True, null=True)

    # ✅ Added_by field
    added_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='books_added',
        limit_choices_to={'Role__in': ['admin', 'employee']}
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.isbn:
            self.isbn = generate_isbn()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class BookAdditionalDetails(models.Model):
    book = models.OneToOneField(
        Book,
        on_delete=models.CASCADE,
        related_name='additional_details'
    )

    no_of_issued_book = models.PositiveIntegerField(default=0)
    no_of_reserved_book = models.PositiveIntegerField(default=0)
    no_of_available_book = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        # Auto-calculate available books
        total = self.book.number_of_copies
        self.no_of_available_book = max(
            total - self.no_of_issued_book - self.no_of_reserved_book, 0
        )

        # Auto-update book status
        if self.no_of_available_book == 0:
            if self.no_of_reserved_book > 0:
                self.book.status = 'reserved'
            else:
                self.book.status = 'issued'
        else:
            self.book.status = 'available'

        self.book.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Details for {self.book.title}"
class BookTransaction(models.Model):
    TRANSACTION_TYPE = [
        ('issued', 'Issued'),
        ('reserved', 'Reserved'),
        ('returned', 'Returned'),
        ('expired', 'expired'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE)
    issued_at = models.DateTimeField(default=timezone.now)
    due_at = models.DateTimeField(default=default_due_date)
    created_at = models.DateTimeField(default=timezone.now)
    returned_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    extra_payment = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def clean(self):
        details = self.book.additional_details
        now = timezone.now()

        is_create = self.pk is None

        # 🚫 Cannot create a "returned" transaction
        if is_create and self.transaction_type == 'returned':
            raise ValidationError({
                "transaction_type": "You cannot return a book while creating a transaction."
            })

        # 🔁 On update: validate state transitions
        if not is_create:
            previous = BookTransaction.objects.get(pk=self.pk)

            # Only allow issued → returned
            if (
                previous.transaction_type != 'issued'
                and self.transaction_type == 'returned'
            ):
                raise ValidationError({
                    "transaction_type": "Only issued books can be returned."
                })

        # 📘 Issue rules
        if self.transaction_type == 'issued':
            issued_count = BookTransaction.objects.filter(
                user=self.user,
                transaction_type='issued',
                returned_at__isnull=True
            ).exclude(pk=self.pk).count()

            if issued_count >= 4:
                raise ValidationError({
                    "transaction_type": "User cannot issue more than 4 books."
                })

            if details.no_of_available_book <= 0:
                raise ValidationError({
                    "book": "No copies available."
                })

        # 📌 Reserve rules
        elif self.transaction_type == 'reserved':
            if details.no_of_available_book <= 0:
                raise ValidationError({
                    "book": "No copies available."
                })
            self.expires_at = now + timedelta(hours=0.1)

        # 📗 Return rules
        # elif self.transaction_type == 'returned':
        #     if self.user.Role == 'user':
        #         raise ValidationError({
        #             "transaction_type": "Users cannot return books directly."
        #         })
        #     self.returned_at = now

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.book.title} - {self.transaction_type} by {self.user}"




class BookComment(models.Model):
    book = models.ForeignKey(
        'Book',
        on_delete=models.CASCADE,
        related_name='comments'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='book_comments'
    )
    content = models.TextField()
    stars = models.PositiveSmallIntegerField(
        default=0,
        help_text='Rating out of 5',
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='replies',
        help_text='For replies to a comment'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Book Comment'
        verbose_name_plural = 'Book Comments'

    def __str__(self):
        return f"{self.user.username} on {self.book.title} ({self.stars}/5)"

    def save(self, *args, **kwargs):
        # Ensure stars are between 0 and 5
        if self.stars < 0:
            self.stars = 0
        elif self.stars > 5:
            self.stars = 5
        super().save(*args, **kwargs)


# -------------------------------
# Admin-only Models
# -------------------------------
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.ImageField(upload_to=category_icon_path, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,  limit_choices_to={'Role__in': ['admin', 'employee']})
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Author(models.Model):
    name = models.CharField(max_length=255, unique=True)
    bio = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to=author_image_path, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'Role': 'admin'})
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class LibraryReport(models.Model):
    title = models.CharField(max_length=255)
    report_file = models.FileField(upload_to='library_reports/')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'Role': 'admin'})
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    transaction = models.ForeignKey(BookTransaction, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Notice(models.Model):
    title = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        limit_choices_to={'Role': 'admin'}
    )

    def __str__(self):
        return self.title

class NoticeRead(models.Model):
    notice = models.ForeignKey(Notice, on_delete=models.CASCADE, related_name='reads')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('notice', 'user')  # avoid duplicate read records

    def __str__(self):
        return f"{self.user.username} read {self.notice.title}"
  



