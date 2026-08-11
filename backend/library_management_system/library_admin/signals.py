from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import BookTransaction, Notification

@receiver(post_save, sender=BookTransaction)
def update_book_counts(sender, instance, created, **kwargs):
    """
    Automatically update BookAdditionalDetails counts, book status,
    and handle notifications, including expired reservations.
    """
    details = instance.book.additional_details
    now = timezone.now()

    # -------------------------------
    # STEP 0: Expire old reservations
    # -------------------------------
    expired_reservations = BookTransaction.objects.filter(
        book=instance.book,
        transaction_type='reserved',
        returned_at__isnull=True,
        expires_at__lt=now
    )

    for reservation in expired_reservations:
        # Mark as returned
        BookTransaction.objects.filter(pk=reservation.pk).update(returned_at=now,
        transaction_type='expired')
        print('hello')

        details.no_of_reserved_book = max(details.no_of_reserved_book - 1, 0)
        details.no_of_available_book = min(
            details.no_of_available_book + 1,
            instance.book.number_of_copies
        )

        # Notify user that reservation expired
        Notification.objects.create(
            user=reservation.user,
            book=reservation.book,
            transaction=reservation,
            message=(
                f"Your reservation for '{reservation.book.title}' ⏳ has expired. "
                f"Please try to reserve again if needed."
            )
        )

    # -------------------------------
    # STEP 1: Handle current transaction
    # -------------------------------

    # ISSUED
    if instance.transaction_type == 'issued' and created:
        details.no_of_issued_book += 1
        details.no_of_available_book = max(details.no_of_available_book - 1, 0)

        if instance.expires_at:
            Notification.objects.create(
                user=instance.user,
                book=instance.book,
                transaction=instance,
                message=(
                    f"Thank you for reading '{instance.book.title}' 📖. "
                    f"Your due date is {instance.expires_at.strftime('%d %b %Y')}. "
                    f"Late return will be charged ₹25 per day."
                )
            )

    # RESERVED
    elif instance.transaction_type == 'reserved' and created:
        details.no_of_reserved_book += 1
        details.no_of_available_book = max(details.no_of_available_book - 1, 0)

        # Set reservation expiry if not set
        if instance.expires_at is None:
            instance.expires_at = now + timedelta(hours=1)
            instance.save(update_fields=['expires_at'])

        # Notify user of reservation
        Notification.objects.create(
            user=instance.user,
            book=instance.book,
            transaction=instance,
            message=(
                f"Your reservation for '{instance.book.title}' is confirmed ✅. "
                f"It is valid until {instance.expires_at.strftime('%d %b %Y %H:%M')}."
            )
        )

    # RETURNED
    elif instance.transaction_type == 'returned':
        details.no_of_issued_book = max(details.no_of_issued_book - 1, 0)
        details.no_of_available_book = min(
            details.no_of_available_book + 1,
            instance.book.number_of_copies
        )

        if instance.returned_at is None:
            BookTransaction.objects.filter(pk=instance.pk).update(returned_at=now)

        Notification.objects.create(
            user=instance.user,
            book=instance.book,
            transaction=instance,
            message=(
                f"Thank you for returning '{instance.book.title}' 🙏. "
                f"We hope you enjoyed reading it!"
            )
        )

    # -------------------------------
    # STEP 2: Update book status
    # -------------------------------
    if details.no_of_available_book > 0:
        instance.book.status = 'available'
    elif details.no_of_reserved_book > 0:
        instance.book.status = 'reserved'
    elif details.no_of_issued_book > 0:
        instance.book.status = 'issued'
    else:
        instance.book.status = 'lost'

    # -------------------------------
    # STEP 3: Save details
    # -------------------------------
    details.save()
    instance.book.save()

    
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Book, Category, BookAdditionalDetails

@receiver(post_save, sender=Book)
def create_book_additional_details(sender, instance, created, **kwargs):
    if not created:
        return

    # Create book additional details
    BookAdditionalDetails.objects.create(
        book=instance,
        no_of_issued_book=0,
        no_of_reserved_book=0,
        no_of_available_book=instance.number_of_copies
    )

    # Create category only if it does not exist
    Category.objects.get_or_create(
        name=instance.category,
        defaults={
            'created_by': getattr(instance, 'created_by', None)
        }
    )
from django.db.models.signals import post_delete

@receiver(post_delete, sender=Book)
def delete_unused_category(sender, instance, **kwargs):
    category_name = instance.category

    if not category_name:
        return

    # If no other book uses this category name
    if not Book.objects.filter(category=category_name).exists():
        Category.objects.filter(name=category_name).delete()