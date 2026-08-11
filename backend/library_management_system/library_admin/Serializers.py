from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Book, Category, Author, LibraryReport, BookAdditionalDetails, BookTransaction,Notification

# -------------------------------
# Book Serializer
# -------------------------------
class BookSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()
    # Optional: get shelf_location from related BookAdditionalDetails
    shelf_location = serializers.CharField(source='additional_details.shelf_location', read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'authors', 'isbn', 'publisher', 'year_of_publication',
            'edition', 'language', 'category', 'number_of_copies', 'status',
            'cover_image', 'cover_image_url', 'description', 'shelf_location',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at', 'status')

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            return obj.cover_image.url
        return None

# -------------------------------
# Category Serializer
# -------------------------------
class CategorySerializer(serializers.ModelSerializer):
    icon_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'icon_url', 'created_by', 'created_at']

    def get_icon_url(self, obj):
        if obj.icon:
            return obj.icon.url
        return None

# -------------------------------
# Author Serializer
# -------------------------------
class AuthorSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = ['id', 'name', 'bio', 'image', 'image_url', 'created_by', 'created_at']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

# -------------------------------
# Library Report Serializer
# -------------------------------
class LibraryReportSerializer(serializers.ModelSerializer):
    report_file_url = serializers.SerializerMethodField()

    class Meta:
        model = LibraryReport
        fields = ['id', 'title', 'report_file', 'report_file_url', 'created_by', 'created_at']

    def get_report_file_url(self, obj):
        if obj.report_file:
            return obj.report_file.url
        return None

# -------------------------------
# BookAdditionalDetails Serializer
# -------------------------------
class BookAdditionalDetailsSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_isbn = serializers.CharField(source='book.isbn', read_only=True)

    class Meta:
        model = BookAdditionalDetails
        fields = [
            'id',
            'book',
            'book_title',
            'book_isbn',
            'no_of_issued_book',
            'no_of_reserved_book',
            'no_of_available_book',
        ]
        read_only_fields = ['no_of_issued_book', 'no_of_reserved_book', 'no_of_available_book']

# -------------------------------
# BookTransaction Serializer
# -------------------------------
class TransactionBookSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            'id',
            'title',
            'isbn',
            'cover_image_url',
        ]

    def get_cover_image_url(self, obj):
        return obj.cover_image.url if obj.cover_image else None


from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import BookTransaction, Book
from django.contrib.auth import get_user_model

User = get_user_model()

class TransactionBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'isbn']

from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone
from .models import BookTransaction, Book, User

class BookTransactionSerializer(serializers.ModelSerializer):
    book = TransactionBookSerializer(read_only=True)

    # write-only fields for create
    book_input = serializers.PrimaryKeyRelatedField(
        queryset=Book.objects.all(),
        source='book',
        write_only=True,
        required=True  # should be required
    )

    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True,
        required=False  # optional
    )

    # read-only user info
    user = serializers.SerializerMethodField()

    class Meta:
        model = BookTransaction
        fields = [
            'id', 'book', 'book_input', 'user', 'user_id',
            'transaction_type', 'issued_at', 'due_at',
            'expires_at', 'returned_at', 'created_at', 'extra_payment',
        ]
        read_only_fields = ('issued_at', 'created_at', 'extra_payment', 'returned_at')

    def get_user(self, obj):
        if obj.user:
            return {
                "id": obj.user.id,
                "username": obj.user.username,
                "email": obj.user.email,
                "role": obj.user.Role,
            }
        return None

    def validate(self, data):
        request_user = self.context['request'].user

        # fallback to request.user if user not sent
        if 'user' not in data or data['user'] is None:
            data['user'] = request_user

        if 'book' not in data or data['book'] is None:
            raise serializers.ValidationError({"book": "Book is required."})

        t_type = data.get('transaction_type')
        book = data['book']
        user = data['user']
        now = timezone.now()
        details = book.additional_details

        # Clear expired reservations
        expired = BookTransaction.objects.filter(
            book=book,
            transaction_type='reserved',
            returned_at__isnull=True,
            expires_at__lt=now
        )
        for tx in expired:
            tx.returned_at = now
            tx.save(update_fields=['returned_at'])
            details.no_of_reserved_book = max(details.no_of_reserved_book - 1, 0)

        details.save()

        # ISSUE RULES
        if t_type == 'issued':
            issued_count = BookTransaction.objects.filter(
                user=user,
                transaction_type='issued',
                returned_at__isnull=True
            ).exclude(id=getattr(self.instance, 'id', None)).count()
            if issued_count >= 4:
                raise serializers.ValidationError("User cannot issue more than 4 books.")
            if details.no_of_available_book <= 0:
                raise serializers.ValidationError("No copies available.")

        # RESERVE RULES
        elif t_type == 'reserved':
            if details.no_of_available_book <= 0:
                raise serializers.ValidationError("No copies available.")
            # set expires_at only on create
            if not getattr(self.instance, 'id', None):
                data['expires_at'] = now + timedelta(hours=1)

        # RETURNED RULES
        elif t_type == 'returned':
            if not getattr(self.instance, 'id', None):
                raise serializers.ValidationError("Returned transactions must be updates, not creates.")

        return data

    def create(self, validated_data):
        
        if 'user' not in validated_data or validated_data['user'] is None:
            validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class BookDetailSerializer(serializers.ModelSerializer):
    # authors = AuthorSerializer(many=True, read_only=True)

    additional_details = BookAdditionalDetailsSerializer(read_only=True)
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            'id',
            'title',
            'isbn',
            'publisher',
            'year_of_publication',
            'edition',
            'language',
            'status',
            'number_of_copies',
            'cover_image_url',
            'description',
            'shelf_location',
            'authors',
            'category',
            'additional_details',
            'created_at',
            'updated_at',
        ]

    def get_cover_image_url(self, obj):
        return obj.cover_image.url if obj.cover_image else None


from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'book',
            'book_title',
            'transaction',
            'message',
            'is_read',
            'created_at',
        ]
        read_only_fields = (
            'id', 'user', 'book', 'book_title', 'transaction', 'message', 'created_at'
        )
        
from rest_framework import serializers
from .models import Notice, NoticeRead

class NoticeSerializer(serializers.ModelSerializer):
    read = serializers.SerializerMethodField()

    class Meta:
        model = Notice
        fields = ('id', 'title', 'message', 'created_at', 'read')

    def get_read(self, obj):
        user = self.context['request'].user
        return obj.reads.filter(user=user).exists()


class NoticeReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoticeRead
        fields = ('id', 'notice', 'user', 'read_at')
        read_only_fields = ('user', 'read_at')

    def create(self, validated_data):
        user = self.context['request'].user
        notice = validated_data['notice']
        # avoid duplicates
        obj, created = NoticeRead.objects.get_or_create(notice=notice, user=user)
        return obj


class Recomandation(serializers.ModelSerializer):
    book=BookSerializer(read_only=True)
    class Meta:
        model =BookTransaction
        fields=('user','book','transaction_type','issued_at')