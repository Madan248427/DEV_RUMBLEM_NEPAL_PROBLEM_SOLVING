from django.contrib import admin
from .models import (
    Book,
    BookAdditionalDetails,
    BookTransaction,
    Category,
    Author,
    LibraryReport,Notification
)

# -------------------------------
# Book Admin
# -------------------------------
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'authors', 'isbn', 'added_by', 'number_of_copies', 'status', 'created_at']
    search_fields = ['title', 'authors', 'isbn', 'added_by__username']
    list_filter = ['status', 'category']

    # Automatically fill added_by with current user
    def save_model(self, request, obj, form, change):
        if not obj.added_by:
            obj.added_by = request.user
        super().save_model(request, obj, form, change)


# -------------------------------
# BookAdditionalDetails Admin
# -------------------------------
@admin.register(BookAdditionalDetails)
class BookAdditionalDetailsAdmin(admin.ModelAdmin):
    list_display = ['book', 'no_of_issued_book', 'no_of_reserved_book', 'no_of_available_book']
    search_fields = ['book__title']


# -------------------------------
# BookTransaction Admin
# -------------------------------
@admin.register(BookTransaction)
class BookTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'book',
        'user',
        'transaction_type',
        'issued_at',
        'due_at',
        'returned_at',
        'expires_at',
        'extra_payment',
    )

    list_filter = (
        'transaction_type',
        'issued_at',
        'due_at',
        'returned_at',
    )

    search_fields = (
        'book__title',
        'book__isbn',
        'user__username',
        'user__email',
    )

    ordering = ('-created_at',)

    readonly_fields = (
        'issued_at',
        'created_at',
    )

    autocomplete_fields = ('book', 'user')

    fieldsets = (
        ('Transaction Info', {
            'fields': (
                'user',
                'book',
                'transaction_type',
            )
        }),
        ('Dates', {
            'fields': (
                'issued_at',
                'due_at',
                'expires_at',
                'returned_at',
            )
        }),
        ('Payment', {
            'fields': ('extra_payment',)
        }),
    )


# -----------------------------------
# Notification Admin
# -----------------------------------
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'book',
        'short_message',
        'is_read',
        'created_at',
    )

    list_filter = (
        'is_read',
        'created_at',
    )

    search_fields = (
        'user__username',
        'user__email',
        'book__title',
        'message',
    )

    ordering = ('-created_at',)

    readonly_fields = ('created_at',)

    autocomplete_fields = ('user', 'book', 'transaction')

    actions = ['mark_as_read', 'mark_as_unread']

    def short_message(self, obj):
        return obj.message[:50] + ('...' if len(obj.message) > 50 else '')
    short_message.short_description = 'Message'

    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
    mark_as_read.short_description = "Mark selected as read ✅"

    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
    mark_as_unread.short_description = "Mark selected as unread ❌"

# -------------------------------
# Category Admin
# -------------------------------
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'created_at']
    search_fields = ['name']


# -------------------------------
# Author Admin
# -------------------------------
@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'created_at']
    search_fields = ['name']


# -------------------------------
# LibraryReport Admin
# -------------------------------
@admin.register(LibraryReport)
class LibraryReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'created_at']
    search_fields = ['title']

from django.contrib import admin
from .models import BookComment

@admin.register(BookComment)
class BookCommentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'book',
        'user',
        'stars',
        'created_at',
        'updated_at',
        'parent',
    )
    list_filter = (
        'stars',
        'created_at',
        'updated_at',
        'book',
        'user',
    )
    search_fields = (
        'book__title',
        'user__username',
        'content',
    )
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('book', 'user', 'parent')
    ordering = ('-created_at',)
from django.contrib import admin
from .models import Notice, NoticeRead

@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'created_at')
    readonly_fields = ('created_at',)
    search_fields = ('title', 'message', 'created_by__username')
    list_filter = ('created_at',)

@admin.register(NoticeRead)
class NoticeReadAdmin(admin.ModelAdmin):
    list_display = ('notice', 'user', 'read_at')
    readonly_fields = ('notice', 'user', 'read_at')
    search_fields = ('notice__title', 'user__username')
    list_filter = ('read_at',)
