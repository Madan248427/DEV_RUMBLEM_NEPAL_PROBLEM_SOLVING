from celery import shared_task
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings

from .models import BookTransaction, Notification
from accounts.models import Membership


# ==========================================================
# 1️⃣ EXPIRE RESERVATIONS (Every 30 Minutes)
# ==========================================================
@shared_task
def expire_reservations():
    now = timezone.now()

    expired_reservations = BookTransaction.objects.filter(
        transaction_type='reserved',
        returned_at__isnull=True,
        expires_at__isnull=False,
        expires_at__lt=now
    ).select_related('book', 'book__additional_details', 'user')

    for reservation in expired_reservations:
        with transaction.atomic():

            details = reservation.book.additional_details

            reservation.transaction_type = 'expired'
            reservation.returned_at = now
            reservation.save(update_fields=['transaction_type', 'returned_at'])

            # Update counts
            details.no_of_reserved_book = max(
                details.no_of_reserved_book - 1, 0
            )
            details.no_of_available_book = min(
                details.no_of_available_book + 1,
                reservation.book.number_of_copies
            )
            details.save()

            reservation.book.status = (
                'available'
                if details.no_of_available_book > 0
                else 'issued'
            )
            reservation.book.save()

            message = (
                f"⏳ Your reservation for '{reservation.book.title}' "
                f"has expired. You may reserve it again."
            )

            Notification.objects.create(
                user=reservation.user,
                book=reservation.book,
                transaction=reservation,
                message=message
            )

            # ✅ EMAIL
            send_mail(
                "Reservation Expired",
                message,
                settings.DEFAULT_FROM_EMAIL,
                [reservation.user.email],
                fail_silently=True,
            )


# ==========================================================
# 2️⃣ CHECK DUE DATES DAILY (8 AM) + EMAIL
# ==========================================================
@shared_task
def check_due_dates_and_notify():
    today = timezone.now().date()

    issued_books = BookTransaction.objects.filter(
        transaction_type='issued',
        returned_at__isnull=True,
        due_at__isnull=False
    ).select_related('book', 'user')

    for transaction in issued_books:
        days_left = (transaction.due_at.date() - today).days

        # -----------------------------
        # 🔔 1 DAY LEFT REMINDER
        # -----------------------------
        if days_left == 1:

            message = (
                f"⏰ Reminder: Only 1 day left to return "
                f"'{transaction.book.title}'. "
                f"₹25 per day fine applies after due date."
            )

            Notification.objects.get_or_create(
                user=transaction.user,
                book=transaction.book,
                transaction=transaction,
                message=message
            )

            # ✅ EMAIL
            send_mail(
                "Book Return Reminder",
                message,
                settings.DEFAULT_FROM_EMAIL,
                [transaction.user.email],
                fail_silently=True,
            )

        # -----------------------------
        # ⚠️ OVERDUE BOOK
        # -----------------------------
        elif days_left < 0:

            overdue_days = abs(days_left)
            fine_amount = overdue_days * 25

            message = (
                f"⚠️ '{transaction.book.title}' is overdue by "
                f"{overdue_days} day(s). "
                f"Current fine: ₹{fine_amount}."
            )

            Notification.objects.get_or_create(
                user=transaction.user,
                book=transaction.book,
                transaction=transaction,
                message=message
            )

            # Update fine
            transaction.extra_payment = fine_amount
            transaction.save(update_fields=['extra_payment'])

            # ✅ EMAIL
            send_mail(
                "Book Overdue Notice",
                message,
                settings.DEFAULT_FROM_EMAIL,
                [transaction.user.email],
                fail_silently=True,
            )


# ==========================================================
# 3️⃣ MEMBERSHIP EXPIRY CHECK (Daily)
# ==========================================================
# ==========================================================
# 3️⃣ MEMBERSHIP EXPIRY CHECK (Daily)
# ==========================================================
@shared_task
def check_membership_expiry():

    now = timezone.now()

    expired_memberships = Membership.objects.filter(
        is_active=True,
        end_date__lt=now
    ).select_related('user')

    for membership in expired_memberships:

        user = membership.user

        # ✅ deactivate membership
        membership.is_active = False
        membership.save(update_fields=["is_active"])

        # ✅ ALSO deactivate USER account
        user.is_active = False
        user.save(update_fields=["is_active"])

        message = (
            "Your library membership has expired.\n\n"
            "Your account has been temporarily deactivated. "
            "Please renew your membership to continue using library services."
        )

        # ✅ SEND EMAIL
        from django.core.mail import send_mail
        from django.conf import settings

        send_mail(
            "Membership Expired",
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=True,
        )