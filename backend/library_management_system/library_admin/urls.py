from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookViewSet,
    CategoryViewSet,
    AuthorViewSet,
    LibraryReportViewSet,
    BookAdditionalDetailsViewSet,
    BookTransactionViewSet,
    NotificationViewSet,
    NoticeViewSet, NoticeReadViewSet,Recomandation
)

router = DefaultRouter()

router.register(r'books', BookViewSet, basename='books')
router.register(r'categories', CategoryViewSet, basename='categories')
router.register(r'authors', AuthorViewSet, basename='authors')
router.register(r'reports', LibraryReportViewSet, basename='reports')
router.register(r'book-additional-details', BookAdditionalDetailsViewSet, basename='book-additional-details')
router.register(r'transactions', BookTransactionViewSet, basename='transactions')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'recomandation',Recomandation,basename='recomandation')


router.register('notices', NoticeViewSet, basename='notices')
router.register('notice-read', NoticeReadViewSet, basename='notice-read')

urlpatterns = [
    path('', include(router.urls)),
]
