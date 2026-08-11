from datetime import datetime
import logging

from django.contrib.auth import get_user_model
from django.utils.timezone import now
from rest_framework_simplejwt.exceptions import TokenError

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone


from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings


from .serializer import (
    RegistrationSerializer,
    CustomUserSerializer,
    UserUpdateSerializer,
    UserProfileSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,  
     ForgotPasswordSerializer,ResetPasswordSerializer # 🔥 IMPORTANT
)

from .models import Users, UserProfile

logger = logging.getLogger(__name__)
User = get_user_model()


# =====================================================
# JWT Authentication from HttpOnly Cookie (WITH REVOKE)
# =====================================================
class JWTAuthenticationFromCookie(JWTAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get("access_token")
        source = "cookie"

        if not token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                source = "header"

        if not token:
            return None

        validated_token = self.get_validated_token(token)
        user = self.get_user(validated_token)

        # Only check token_version for cookie-based auth (webpage)
        # Skip for header-based auth (Rasa bot)
        if source == "cookie":
            if validated_token.get("token_version") != user.token_version:
                raise InvalidToken("Token revoked")

        return user, validated_token



# ======================
# Registration View
# ======================
class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        response = Response(
            {"user": CustomUserSerializer(user).data},
            status=status.HTTP_201_CREATED
        )

        response.set_cookie(
            "access_token",
            access_token,
            httponly=True,
            secure=True,
            samesite="None",
            max_age=300,
            path="/",
        )

        response.set_cookie(
            "refresh_token",
            str(refresh),
            httponly=True,
            secure=True,
            samesite="None",
            max_age=7 * 24 * 3600,
            path="/",
        )

        return response


# ======================
# Login View (JWT Cookie)
# ======================
class CookieTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer  # 🔥 REQUIRED

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        access_token = response.data.pop("access", None)
        refresh_token = response.data.pop("refresh", None)

        if access_token:
            response.set_cookie(
                "access_token",
                access_token,
                httponly=True,
                secure=True,
                samesite="None",
                max_age=300,
                path="/",
            )

        if refresh_token:
            response.set_cookie(
                "refresh_token",
                refresh_token,
                httponly=True,
                secure=True,
                samesite="None",
                max_age=7 * 24 * 3600,
                path="/",
            )

        return response


# ======================
# Refresh Access Token
# ======================
class RefreshFromCookie(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")   # NOT "refresh"

        if not refresh_token:
            return Response({"detail": "No refresh token"}, status=401)

        try:
            refresh = RefreshToken(refresh_token)

            # Grab user_id from token payload to inject token_version
            user_id = refresh["user_id"]
            user = User.objects.get(id=user_id)

            # Generate new access token WITH token_version
            access = refresh.access_token
            access["token_version"] = user.token_version   # CRITICAL for your auth check

            res = Response({"detail": "Token refreshed"})

            res.set_cookie(
                "access_token",              # NOT "access"
                str(access),
                httponly=True,
                secure=True,                 # NOT False
                samesite="None",             # NOT "Lax"
                max_age=300,
                path="/",
            )

            if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS"):
                refresh.blacklist()
                new_refresh = RefreshToken.for_user(user)  # NOT refresh.user
                # Also inject token_version into the new refresh token
                new_refresh["token_version"] = user.token_version

                res.set_cookie(
                    "refresh_token",         # NOT "refresh"
                    str(new_refresh),
                    httponly=True,
                    secure=True,             # NOT False
                    samesite="None",         # NOT "Lax"
                    max_age=7 * 24 * 3600,
                    path="/",
                )

            return res

        except Exception as e:
            logger.error(f"Refresh failed: {e}")
            return Response({"detail": "Invalid refresh token"}, status=401)

# class RefreshFromCookie(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         refresh_token = request.COOKIES.get("refresh_token")
#         if not refresh_token:
#             return Response({"detail": "No refresh token"}, status=400)
#         try:
#             refresh = RefreshToken(refresh_token)
#             new_access = str(refresh.access_token)
#         except TokenError:
#             # token is blacklisted
#             return Response({"detail": "Refresh token is invalid"}, status=401)

#         response = Response({"access": new_access}, status=200)
#         response.set_cookie(
#             "access_token",
#             new_access,
#             httponly=True,
#             secure=True,
#             samesite="None",
#             max_age=1800,
#             path="/",
#         )

#         return response

# Logout View (INSTANT)
# ======================
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthenticationFromCookie]

    def post(self, request):
        # 🔥 Kill all existing access tokens
        request.user.last_logout = timezone.now()
        request.user.save()
        request.user.token_version += 1
        request.user.save(update_fields=["token_version"])

        refresh_token = request.COOKIES.get("refresh_token")
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass

        response = Response(
            {"detail": "Logged out successfully"},
            status=status.HTTP_205_RESET_CONTENT,
        )

        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")

        return response


# ======================
# User Info
# ======================
class UserDetail(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthenticationFromCookie]

    def get(self, request):
        return Response(CustomUserSerializer(request.user).data)


# ======================
# User Update
# ======================
class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthenticationFromCookie]

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}   # 🔥 ADD THIS
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)



# ======================
# User List / Detail
# ======================
class UserListView(generics.ListAPIView):
    queryset = Users.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthenticationFromCookie]


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Users.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthenticationFromCookie]


# ======================
# User Profile
# ======================
class UserProfileListView(generics.ListAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthenticationFromCookie]


class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthenticationFromCookie]
class CurrentUserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthenticationFromCookie]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import jwt


@api_view(['GET'])
@authentication_classes([JWTAuthenticationFromCookie])

@permission_classes([IsAuthenticated])
def rasa_get_token(request):
    try:
        user = request.user

        if not user.is_authenticated:
            return Response(
                {
                    "authenticated": False,
                    "error": "User not authenticated"
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate token (SimpleJWT if installed)
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            token_str = str(AccessToken.for_user(user))
        except ImportError:
            payload = {
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
            }
            token_str = jwt.encode(
                payload,
                settings.SECRET_KEY,
                algorithm="HS256"
            )

        return Response(
            {
                "authenticated": True,
                "jwt_token": token_str,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response(
            {
                "authenticated": False,
                "error": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@authentication_classes([JWTAuthenticationFromCookie])

@permission_classes([IsAuthenticated])
def rasa_verify_token(request):
    return Response(
        {
            "authenticated": True,
            "user_id": request.user.id,
            "username": request.user.username,
        },
        status=status.HTTP_200_OK
    )

# views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [] 
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "OTP sent to email"}, status=200)
        return Response(serializer.errors, status=400)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [] 
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password changed successfully"}, status=200)
        return Response(serializer.errors, status=400)

# Add these views to your existing views.py file

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from .models import PaymentRecord, Membership, UserProfile
from .serializer import RegistrationSerializer

User = get_user_model()


class RegisterWithPaymentView(APIView):
    """
    Register a user after successful eSewa payment
    POST /accounts/register-with-payment/
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            # Extract registration and payment data
            email = request.data.get('email')
            username = request.data.get('username')
            password1 = request.data.get('password1')
            password2 = request.data.get('password2')
            role = request.data.get('Role', 'user')
            membership_type = request.data.get('membership_type')
            payment_reference = request.data.get('payment_reference')
            transaction_id = request.data.get('transaction_id')

            # Validate payment record exists and is in pending status
            try:
                payment = PaymentRecord.objects.get(
                    transaction_id=transaction_id,
                    status='PENDING',
                    email=email
                )
            except PaymentRecord.DoesNotExist:
                return Response(
                    {'error': 'Invalid or completed payment. Please try again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Register user using existing serializer
            serializer = RegistrationSerializer(data={
                'email': email,
                'username': username,
                'password1': password1,
                'password2': password2,
                'Role': role,
            })

            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Create user
            user = serializer.save()

            # Update payment record
            payment.user = user
            payment.reference_id = payment_reference
            payment.status = 'COMPLETED'
            payment.completed_at = timezone.now()
            payment.save()

            # Create membership record
            start_date = timezone.now()
            if membership_type == 'MONTHLY':
                end_date = start_date + timedelta(days=30)
            else:  # YEARLY
                end_date = start_date + timedelta(days=365)

            membership = Membership.objects.create(
                user=user,
                membership_type=membership_type,
                start_date=start_date,
                end_date=end_date,
                is_active=True
            )

            # Create user profile
            UserProfile.objects.create(user=user)

            return Response(
                {
                    'message': 'Registration completed successfully',
                    'user_id': user.id,
                    'membership_id': membership.id,
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {'error': f'Registration failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


from .utils import generate_esewa_signature
from django.conf import settings


class InitiatePaymentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            email = request.data.get('email')
            amount = request.data.get('amount')
            membership_type = request.data.get('membership_type')
            transaction_id = request.data.get('transaction_id')

            if not all([email, amount, membership_type, transaction_id]):
                return Response({'error': 'Missing required fields'}, status=400)

            if User.objects.filter(email=email).exists():
                return Response({'error': 'Email already registered'}, status=400)

            payment = PaymentRecord.objects.create(
                transaction_id=transaction_id,
                amount=amount,
                payment_type=f'MEMBERSHIP_{membership_type}',
                status='PENDING',
                email=email,
            )

            # 🔐 Generate signature
            signature = generate_esewa_signature(amount, transaction_id)

            # ✅ PRINT HERE (DEBUG)
            print("SIGNED DATA:")
            print("total_amount:", str(amount))
            print("transaction_uuid:", transaction_id)
            print("product_code:", settings.ESEWA_MERCHANT_CODE)

            data_string = f"total_amount={str(amount)},transaction_uuid={transaction_id},product_code={settings.ESEWA_MERCHANT_CODE}"
            print("data_string:", data_string)
            print("signature:", signature)

            return Response({
                "gateway": settings.ESEWA_GATEWAY,
                "amount": str(amount),
                "tax_amount": "0",
                "total_amount": str(amount),
                "transaction_uuid": transaction_id,
                "product_code": settings.ESEWA_MERCHANT_CODE,
                "product_service_charge": "0",
                "product_delivery_charge": "0",
                "success_url": settings.ESEWA_SUCCESS_URL,
                "failure_url": settings.ESEWA_FAILURE_URL,
                "signed_field_names": "total_amount,transaction_uuid,product_code",
                "signature": signature,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=400)


class VerifyPaymentView(APIView):
    """
    Verify eSewa payment callback
    POST /accounts/verify-payment/
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            transaction_id = request.data.get('transaction_id')
            reference_id = request.data.get('reference_id')

            # Validate inputs
            if not transaction_id or not reference_id:
                return Response(
                    {'error': 'Missing transaction or reference ID'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Find payment record
            try:
                payment = PaymentRecord.objects.get(transaction_id=transaction_id)
            except PaymentRecord.DoesNotExist:
                return Response(
                    {'error': 'Payment not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # In production, you would verify with eSewa API here
            # For testing, we just mark as completed
            if payment.status == 'PENDING':
                payment.reference_id = reference_id
                payment.status = 'COMPLETED'
                payment.completed_at = timezone.now()
                payment.save()

            return Response(
                {
                    'message': 'Payment verified',
                    'status': payment.status,
                    'payment_id': payment.id,
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {'error': f'Verification failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    