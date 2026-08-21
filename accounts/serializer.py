from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    UserProfile,
    Users,
)

# Get the custom user model
User = get_user_model()


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'Role']  


from rest_framework import serializers

class RegistrationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Users
        fields = [
            'email',
            'username',
            'password',
            'Role',
            'citizenship_number',
            'pan_number',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'citizenship_number': {'required': False},
            'pan_number': {'required': False},
        }

    def validate(self, attrs):
        role = attrs.get('Role', 'citizen').lower()

        citizenship_number = attrs.get('citizenship_number')
        pan_number = attrs.get('pan_number')

        if role == 'citizen':
            if not citizenship_number:
                raise serializers.ValidationError({
                    'citizenship_number': 'Citizenship number is required for citizens.'
                })

            # Citizen should not provide PAN
            attrs['pan_number'] = None

        elif role == 'organizer':
            if not pan_number:
                raise serializers.ValidationError({
                    'pan_number': 'PAN number is required for organizers.'
                })

            # Organizer should not provide citizenship
            attrs['citizenship_number'] = None

        elif role == 'admin':
            attrs['citizenship_number'] = None
            attrs['pan_number'] = None

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')

        user = Users.objects.create_user(
            password=password,
            **validated_data
        )

        return user
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        
        if not email or not password:
            raise serializers.ValidationError("Both email and password are required")
        
        user = authenticate(username=email, password=password)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Incorrect credentials")
    

class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=4)
    current_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'current_password']

    def validate(self, attrs):
        """Validate current password if user is changing password"""
        password = attrs.get('password')
        current_password = attrs.get('current_password')
        
        if password and not current_password:
            raise serializers.ValidationError({
                'current_password': 'Current password is required when changing password'
            })
        
        if password and current_password:
            user = self.context['request'].user
            if not user.check_password(current_password):
                raise serializers.ValidationError({
                    'current_password': 'Current password is incorrect'
                })
        
        return attrs

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        validated_data.pop('current_password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Auto set is_staff if role is employee
        if getattr(instance, 'Role', '').lower() == 'employee':
            instance.is_staff = True

        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['email', 'bio', 'birth_date', 'location', 'phone_number', 'profile_image', 'profile_image_url']

    def get_profile_image_url(self, obj):
        request = self.context.get('request')
        if obj.profile_image and hasattr(obj.profile_image, 'url'):
            return request.build_absolute_uri(obj.profile_image.url)
        return None

    def create(self, validated_data):
        user = self.context['request'].user
        return UserProfile.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = ['id', 'email', 'username', 'Role', 'is_active', 'date_joined']


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["token_version"] = user.token_version
        return token


from django.core.mail import send_mail
from django.conf import settings
from .models import PasswordResetOTP


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not Users.objects.filter(email=value).exists():
            raise serializers.ValidationError("Account with this email does not exist")
        return value

    def save(self):
        email = self.validated_data['email']
        user = Users.objects.get(email=email)

        otp = PasswordResetOTP.generate_otp()

        PasswordResetOTP.objects.create(user=user, otp=otp)

        send_mail(
            subject="Your Password Reset OTP",
            message=f"Your OTP is {otp}",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
        )


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=4)

    def validate(self, attrs):
        email = attrs.get("email")
        otp = attrs.get("otp")

        try:
            user = Users.objects.get(email=email)
            otp_obj = PasswordResetOTP.objects.filter(user=user, otp=otp).latest('created_at')
        except:
            raise serializers.ValidationError("Invalid OTP")

        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        password = self.validated_data['new_password']

        user.set_password(password)
        user.save()
        PasswordResetOTP.objects.filter(user=user).delete()
