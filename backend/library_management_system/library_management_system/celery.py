from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'library_management_system.settings')

app = Celery('library_management_system')

# Load settings with CELERY_ prefix from Django settings.py
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto discover tasks.py in all installed apps
app.autodiscover_tasks()


# ======================================================
# 🔁 CELERY BEAT SCHEDULE
# ======================================================
app.conf.beat_schedule = {

    # ⏳ Expire reservations every 30 minutes
    'expire-reservations-every-30-minutes': {
        'task': 'library_admin.tasks.expire_reservations',
        'schedule': crontab(minute='*/10'),
    },

    # 📅 Check issued book due dates daily at 8 AM
    'notify-due-books-daily': {
        'task': 'library_admin.tasks.check_due_dates_and_notify',
        'schedule': crontab(hour=8, minute=0),
    },
}

# Optional: set timezone (recommended)
app.conf.timezone = 'Asia/Kathmandu'
