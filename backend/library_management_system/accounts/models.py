from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from django.conf import settings
import os
from uuid import uuid4
from django.utils.html import mark_safe

# Custom User Manager
class CustomAccountManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        role = extra_fields.get('Role', 'user')
        if role.lower() == 'employee':
            extra_fields['is_staff'] = True

        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('Role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, username, password, **extra_fields)

# Custom User Model
class Users(AbstractBaseUser, PermissionsMixin):
    
    ROLES = (
    ('admin', 'Admin'),
    ('employee', 'Employee'),
    ('user', 'Member'),
    )
    token_version = models.IntegerField(default=0)
    last_logout = models.DateTimeField(null=True, blank=True)
    Role = models.CharField(max_length=20, choices=ROLES, default='user')
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=255, unique=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomAccountManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email


# User Profile
def user_directory_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid4().hex}.{ext}"
    return os.path.join('user_images', str(instance.user.id), filename)

class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    profile_image = models.ImageField(upload_to=user_directory_path, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"

    def profile_image_tag(self):
        if self.profile_image:
            return mark_safe(
                f'<img src="{self.profile_image.url}" width="60" height="60" style="object-fit: cover; border-radius: 5px;" />'
            )
        return "Image not available"

    profile_image_tag.short_description = 'Image'

# import os
# from uuid import uuid4

# def pdf_upload_path(instance, filename):
#     ext = filename.split('.')[-1]  # get file extension
#     filename = f"{uuid4().hex}.{ext}"  # rename file with unique id
#     return os.path.join('uploaded_pdfs', str(instance.uploaded_by.id), filename)
# class UploadedPDF(models.Model):
#     file = models.FileField(upload_to=pdf_upload_path)
#     uploaded_by = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.CASCADE,
#         limit_choices_to={'Role__in': ['admin', 'teacher']}
#     )
#     uploaded_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"PDF by {self.uploaded_by.username} on {self.uploaded_at.strftime('%Y-%m-%d')}"
# models.py

import random

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def generate_otp():
        return str(random.randint(100000, 999999))


# models.py

User = settings.AUTH_USER_MODEL
from django.db import models
from datetime import timedelta
from django.utils import timezone


class Membership(models.Model):
    MEMBERSHIP_TYPE = (
        ('MONTHLY', 'Monthly'),
        ('YEARLY', 'Yearly'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    membership_type = models.CharField(max_length=20, choices=MEMBERSHIP_TYPE)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=False)

    def activate_membership(self):
        self.start_date = timezone.now()

        if self.membership_type == "MONTHLY":
            self.end_date = self.start_date + timedelta(days=30)
        else:
            self.end_date = self.start_date + timedelta(days=365)

        self.is_active = True
        self.save()


class PaymentRecord(models.Model):
    """Record of eSewa payment transactions"""
    
    PAYMENT_STATUS = (
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments',
        null=True,
        blank=True
    )
    transaction_id = models.CharField(max_length=255, unique=True)
    reference_id = models.CharField(max_length=255, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=50)  # MEMBERSHIP_MONTHLY, MEMBERSHIP_YEARLY
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    email = models.EmailField()  # Email from registration
    
    def __str__(self):
        return f"{self.transaction_id} - {self.status}"
    
    class Meta:
        ordering = ['-created_at']

