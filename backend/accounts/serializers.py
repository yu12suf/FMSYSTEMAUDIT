# backend/accounts/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User, Group
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('id', 'name')

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=False, # <-- allow not required
        allow_blank=True, # <-- allow blank string
        validators=[UniqueValidator(queryset=User.objects.all(), message="A user with that email already exists.")]
    )
    # Make password write-only and not required for updates (but required for creation)
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])

    # --- FIX START ---
    # Change to SlugRelatedField to return/accept group names
    groups = serializers.SlugRelatedField(
        many=True,
        read_only=False, # This allows it to be writable
        slug_field='name', # Use the 'name' field of the Group model for serialization/deserialization
        queryset=Group.objects.all(), # Provide queryset for validation
        required=False # Groups are optional
    )
    # --- FIX END ---

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'date_joined', 'last_login', 'groups')
        read_only_fields = ('date_joined', 'last_login')

    def create(self, validated_data):
        # Pop password and groups data
        password = validated_data.pop('password', None)
        groups_data = validated_data.pop('groups', []) # This will be a list of Group instances due to SlugRelatedField

        user = User.objects.create(**validated_data) # Create user with remaining validated data
        if password:
            user.set_password(password) # Hash and set the password
        user.save()
        user.groups.set(groups_data) # Assign Group instances
        return user

    def update(self, instance, validated_data):
        # Pop password and groups data
        password = validated_data.pop('password', None)
        groups_data = validated_data.pop('groups', None) # This will be a list of Group instances

        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password: # Only set password if provided
            instance.set_password(password)

        if groups_data is not None: # Only update groups if provided in the payload
            instance.groups.set(groups_data)

        instance.save()
        return instance

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class UserRoleSerializer(serializers.Serializer):
    group_name = serializers.CharField(max_length=100)

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add user's group names to the token
        token['groups'] = list(user.groups.values_list('name', flat=True))
        return token