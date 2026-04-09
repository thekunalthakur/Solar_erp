from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model with safe fields only
    """
    role = serializers.SerializerMethodField()

    def get_role(self, obj):
        return 'admin' if (obj.is_staff or obj.is_superuser) else 'user'

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'is_staff', 'is_superuser', 'is_active', 'date_joined']
        read_only_fields = ['id', 'is_staff', 'is_superuser', 'is_active', 'date_joined']


class LoginSerializer(serializers.Serializer):
    """
    Serializer for login request
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class UserCreateSerializer(serializers.Serializer):
    """Serializer for admin-driven user creation with a simple role model."""

    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('user', 'User'),
    )

    username = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(required=True, write_only=True, min_length=6)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    role = serializers.ChoiceField(required=True, choices=ROLE_CHOICES)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists.')
        return value

    def create(self, validated_data):
        role = validated_data.pop('role')
        user = User.objects.create_user(**validated_data)
        user.is_staff = role == 'admin'
        user.is_superuser = role == 'admin'
        user.save(update_fields=['is_staff', 'is_superuser'])
        return user


class UserUpdateSerializer(serializers.Serializer):
    """Serializer for admin-driven user updates with role mapping."""

    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('user', 'User'),
    )

    username = serializers.CharField(required=False, max_length=150)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    role = serializers.ChoiceField(required=False, choices=ROLE_CHOICES)
    is_active = serializers.BooleanField(required=False)
    password = serializers.CharField(required=False, write_only=True, min_length=6)

    def validate_username(self, value):
        user = self.context.get('user')
        if User.objects.filter(username=value).exclude(id=user.id if user else None).exists():
            raise serializers.ValidationError('Username already exists.')
        return value

    def update(self, user, validated_data):
        role = validated_data.pop('role', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(user, attr, value)

        if role is not None:
            is_admin = role == 'admin'
            user.is_staff = is_admin
            user.is_superuser = is_admin

        if password:
            user.set_password(password)

        user.save()
        return user