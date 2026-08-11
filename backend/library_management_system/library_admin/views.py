from rest_framework.viewsets import ModelViewSet
from rest_framework import viewsets, permissions, mixins, status,generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import (
    Book, Category, Author, LibraryReport,
    BookAdditionalDetails, BookTransaction, Notification,
    Notice, NoticeRead
)
from .Serializers import *
from .permissions import *
from accounts.authentication import JWTAuthenticationFromCookie


# ---------------------------
# BOOK VIEWSET
# ---------------------------
class BookViewSet(ModelViewSet):
    queryset = Book.objects.all()
    authentication_classes = [JWTAuthenticationFromCookie]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BookDetailSerializer
        return BookSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        title = self.request.query_params.get('title')
        author = self.request.query_params.get('author')
        category = self.request.query_params.get('category')

        if title:
            queryset = queryset.filter(title__icontains=title)
        if author:
            queryset = queryset.filter(authors__icontains=author)
        if category:
            queryset = queryset.filter(category__icontains=category)

        return queryset


# ---------------------------
# CATEGORY VIEWSET
# ---------------------------
class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    authentication_classes = [JWTAuthenticationFromCookie]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAdmin()]


# ---------------------------
# AUTHOR VIEWSET
# ---------------------------
class AuthorViewSet(ModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    authentication_classes = [JWTAuthenticationFromCookie]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAdmin()]


# ---------------------------
# LIBRARY REPORT VIEWSET
# ---------------------------
class LibraryReportViewSet(ModelViewSet):
    queryset = LibraryReport.objects.all()
    serializer_class = LibraryReportSerializer
    authentication_classes = [JWTAuthenticationFromCookie]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsEmployee()]
        return [IsAdmin()]


# ---------------------------
# BOOK ADDITIONAL DETAILS VIEWSET
# ---------------------------
class BookAdditionalDetailsViewSet(ModelViewSet):
    queryset = BookAdditionalDetails.objects.all()
    serializer_class = BookAdditionalDetailsSerializer
    authentication_classes = [JWTAuthenticationFromCookie]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAdmin()]


# ---------------------------
# BOOK TRANSACTION VIEWSET
# ---------------------------
class BookTransactionViewSet(viewsets.ModelViewSet):
    queryset = BookTransaction.objects.all().order_by('-created_at')
    serializer_class = BookTransactionSerializer
    authentication_classes = [JWTAuthenticationFromCookie]
    permission_classes = [IsAuthenticated]

    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        # Restrict to current user if role is 'user'
        if getattr(user, "Role", None) == 'user':
            qs = qs.filter(user=user)

        # Search/filter parameters
        book_title = self.request.query_params.get('title')
        transaction_type = self.request.query_params.get('transaction_type')

        if book_title:
            # Filter transactions where related book title contains the query
            qs = qs.filter(book__title__icontains=book_title)

        if transaction_type:
            qs = qs.filter(transaction_type=transaction_type)

        return qs


# ---------------------------
# NOTIFICATION VIEWSET
# ---------------------------
class NotificationViewSet(ModelViewSet):
    serializer_class = NotificationSerializer
    authentication_classes = [JWTAuthenticationFromCookie]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).order_by('-created_at')

    def partial_update(self, request, *args, **kwargs):
        notification = self.get_object()

        if set(request.data.keys()) != {'is_read'}:
            return Response(
                {"detail": "You can only update 'is_read'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(
            notification, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["patch"], url_path="mark-all-read")
    def mark_all_read(self, request):
        updated = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(is_read=True)

        return Response(
            {"detail": "All notifications marked as read", "updated": updated},
            status=status.HTTP_200_OK
        )


# ---------------------------
# NOTICE VIEWSET
# ---------------------------
class NoticeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Only GET methods allowed. Employees can view notices.
    """
    queryset = Notice.objects.all().order_by('-created_at')
    serializer_class = NoticeSerializer
    authentication_classes = [JWTAuthenticationFromCookie]
    permission_classes = [IsEmployee]


# ---------------------------
# NOTICE READ VIEWSET
# ---------------------------
class NoticeReadViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    Employees can mark notice as read (POST only)
    """
    queryset = NoticeRead.objects.all()
    serializer_class = NoticeReadSerializer
    authentication_classes = [JWTAuthenticationFromCookie]
    permission_classes = [IsEmployee]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class Recomandation(viewsets.ReadOnlyModelViewSet):
    authentication_classes=[JWTAuthenticationFromCookie]   
    permission_classes=[IsUser] 
    serializer_class = Recomandation

class Recomandation(viewsets.ReadOnlyModelViewSet):
    authentication_classes = [JWTAuthenticationFromCookie]
    permission_classes = [IsUser]
    serializer_class = BookSerializer

    def get_queryset(self):
        user = self.request.user

        user_transactions = BookTransaction.objects.filter(
            user=user,
            transaction_type__in=['issued', 'reserved']
        )

        categories = Book.objects.filter(
            id__in=user_transactions.values_list('book_id', flat=True)
        ).values_list('category', flat=True).distinct()
        language = Book.objects.filter(
            id__in=user_transactions.values_list('book_id', flat=True)
        ).values_list('language', flat=True).distinct()

        user_book_ids = user_transactions.values_list('book_id', flat=True)

        recommended_books = Book.objects.filter(
            category__in=categories,language__in=language

        ).exclude(
            id__in=user_book_ids
        )

        if not recommended_books.exists():
            recommended_books = Book.objects.exclude(
                id__in=user_book_ids
            )

        return recommended_books.order_by('-created_at')[:5]


        

 

