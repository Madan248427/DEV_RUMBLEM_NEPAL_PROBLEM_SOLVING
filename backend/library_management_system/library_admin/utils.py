# # library_admin/utils.py

# from django.utils import timezone
# from .models import BookTransaction, Notification

# def check_due_dates_and_notify():
#     today = timezone.now().date()

#     transactions = BookTransaction.objects.filter(
#         transaction_type='issued',
#         returned_at__isnull=True,
#         expires_at__isnull=False
#     )

#     for t in transactions:
#         days_left = (t.expires_at.date() - today).days

#         # 🔔 1 DAY LEFT
#         if days_left == 1:
#             Notification.objects.get_or_create(
#                 user=t.user,
#                 book=t.book,
#                 transaction=t,
#                 message=(
#                     f"⏰ Reminder: Only 1 day left to return "
#                     f"'{t.book.title}'. "
#                     f"₹25 per day fine applies after due date."
#                 )
#             )

#         # ⚠️ DUE DATE PASSED
#         elif days_left < 0:
#             overdue_days = abs(days_left)
#             Notification.objects.get_or_create(
#                 user=t.user,
#                 book=t.book,
#                 transaction=t,
#                 message=(
#                     f"⚠️ '{t.book.title}' is overdue by {overdue_days} day(s). "
#                     f"Fine: ₹{overdue_days * 25}."
#                 )
#             )
