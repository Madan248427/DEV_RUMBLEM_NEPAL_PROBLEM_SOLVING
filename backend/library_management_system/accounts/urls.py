from django.urls import path
from . import views
from django.urls import path
from .views import rasa_get_token, rasa_verify_token

urlpatterns = [
    # Get JWT token for Rasa (requires authentication via cookies)
    path('rasa-token/', rasa_get_token, name='rasa-get-token'),
    
    # Verify if user is authenticated
    path('rasa-verify/', rasa_verify_token, name='rasa-verify-token'),



    # ==========================
    # 🔐 Authentication
    # ==========================
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.CookieTokenObtainPairView.as_view(), name="login"),

    # ⚠️ refresh MUST allow AllowAny
    path("refresh/", views.RefreshFromCookie.as_view(), name="token-refresh"),

    path("logout/", views.LogoutView.as_view(), name="logout"),

    # ==========================
    # 👤 Current User
    # ==========================
    path("me/", views.UserDetail.as_view(), name="user-detail"),
    path("update-user/", views.UserUpdateView.as_view(), name="user-update"),

    # ==========================
    # 👥 Admin User Management
    # ==========================
    path("users/", views.UserListView.as_view(), name="user-list"),
    path("users/<int:pk>/", views.UserDetailView.as_view(), name="user-detail-by-id"),

    # ==========================
    # 🧾 User Profiles
    # ==========================
    path("profile/", views.CurrentUserProfileView.as_view(), name="current-user-profile"),

    # ❗ these should be admin-only OR authenticated
    path("user-profiles/", views.UserProfileListView.as_view(), name="user-profile-list"),
    path("user-profiles/<int:pk>/", views.UserProfileDetailView.as_view(), name="user-profile-detail"),
    # urls.py





    # Payment endpoints
    path('register-with-payment/', views.RegisterWithPaymentView.as_view(), name='register-with-payment'),
    path('initiate-payment/', views.InitiatePaymentView.as_view(), name='initiate-payment'),
    path('verify-payment/', views.VerifyPaymentView.as_view(), name='verify-payment'),


    path('forgot-password/', views.ForgotPasswordView.as_view()),
    path('reset-password/', views.ResetPasswordView.as_view()),
]


