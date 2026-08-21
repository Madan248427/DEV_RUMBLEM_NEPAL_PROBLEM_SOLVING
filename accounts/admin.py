from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import mark_safe
from .models import (
    Users, UserProfile,
)

# Custom User Admin
class CustomUserAdmin(UserAdmin):
    ordering = ['email']
    list_display = ('email', 'username', 'Role', 'is_superuser', 'is_staff', 'is_active')
    list_filter = ('Role', 'is_staff', 'is_superuser', 'is_active')

    fieldsets = (
        ('Basic Info', {'fields': ('email', 'username', 'password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Role', {'fields': ('Role',)}),
        ('Important dates', {'fields': ('last_login',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'Role'),
        }),
    )

admin.site.register(Users, CustomUserAdmin)

# UserProfile Admin
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'profile_image_tag',
        'phone_number',
        'location',
        'birth_date',
        'created_at',
    )
    readonly_fields = ('profile_image_tag',)
    search_fields = ('user__email', 'user__username', 'phone_number')
    list_filter = ('location', 'birth_date')

    def profile_image_tag(self, obj):
        if obj.profile_image:
            return mark_safe(
                f'<img src="{obj.profile_image.url}" width="80" height="80" style="object-fit: cover; border-radius: 5px;" />'
            )
        return "Image not available"

    profile_image_tag.short_description = "Profile Image"





from django.contrib import admin
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

# @admin.register(OutstandingToken)
# class OutstandingTokenAdmin(admin.ModelAdmin):
#     list_display = ('user', 'jti', 'token_type', 'created_at', 'expires_at')
#     readonly_fields = ('user', 'jti', 'token_type', 'created_at', 'expires_at')
#     actions = ['delete_selected_tokens']

#     def has_delete_permission(self, request, obj=None):
#         # Allow delete
#         return True

#     def delete_selected_tokens(self, request, queryset):
#         count = queryset.count()
#         queryset.delete()
#         self.message_user(request, f"Deleted {count} outstanding token(s).")
#     delete_selected_tokens.short_description = "Delete selected outstanding tokens"

# @admin.register(BlacklistedToken)
# class BlacklistedTokenAdmin(admin.ModelAdmin):
#     list_display = ('token', 'blacklisted_at')
#     actions = ['delete_selected_tokens']

#     def has_delete_permission(self, request, obj=None):
#         return True

#     def delete_selected_tokens(self, request, queryset):
#         count = queryset.count()
#         queryset.delete()
#         self.message_user(request, f"Deleted {count} blacklisted token(s).")
#     delete_selected_tokens.short_description = "Delete selected blacklisted tokens"
