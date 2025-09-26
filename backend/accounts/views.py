# backend/accounts/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate, login, logout
from rest_framework_simplejwt.views import TokenObtainPairView, TokenBlacklistView
from core.views import log_audit
from django.contrib.auth import get_user_model
from accounts.permissions import IsAdministrator, IsAdminOrEditor
# Import the new GroupSerializer
from .serializers import UserSerializer, UserLoginSerializer, UserRoleSerializer, GroupSerializer, MyTokenObtainPairSerializer
#below new imports
"""from django.contrib.auth.models import User
from django.core.mail import send_mail
from rest_framework.decorators import api_view
"""

class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    Allows creating new user accounts.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [] # No authentication required for registration

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "message": "User registered successfully.",
            "user_id": user.id,
            "username": user.username
        }, status=status.HTTP_201_CREATED)

class UserLoginView(APIView):
    """
    API endpoint for user login.
    Returns JWT access and refresh tokens upon successful authentication.
    """
    permission_classes = [] # No authentication required for login

    def post(self, request, *args, **kwargs):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(request, username=username, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_id': user.id,
                'username': user.username,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'email': user.email,
            }, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

class UserLogoutView(APIView):
    """
    API endpoint for user logout.
    Blacklists the refresh token, effectively logging out the user.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        username = str(request.user)
        role = request.user.groups.first().name if request.user.is_authenticated and request.user.groups.exists() else "User"
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            log_audit(request, "LOGOUT", f"User {username} logged out.", username=username, role=role)
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing all users and creating new users.
    Only accessible by admin users.
    """
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [IsAdministrator]

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, or deleting a single user.
    Only accessible by admin users.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdministrator]
    lookup_field = 'pk'

class UserRoleManagementView(APIView):
    """
    API endpoint for managing user roles (groups).
    Only accessible by admin users.
    """
    permission_classes = [IsAdministrator]

    def post(self, request, pk, *args, **kwargs):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        group_name = serializer.validated_data['group_name']
        action = serializer.validated_data['action']

        try:
            group = Group.objects.get(name=group_name)
        except Group.DoesNotExist:
            return Response({"detail": f"Group '{group_name}' not found."}, status=status.HTTP_404_NOT_FOUND)

        if action == 'add':
            if group not in user.groups.all(): # Prevent adding same group multiple times
                user.groups.add(group)
                message = f"User '{user.username}' added to group '{group_name}'."
            else:
                message = f"User '{user.username}' is already in group '{group_name}'."
        elif action == 'remove':
            if group in user.groups.all(): # Prevent removing non-existent group
                user.groups.remove(group)
                message = f"User '{user.username}' removed from group '{group_name}'."
            else:
                message = f"User '{user.username}' is not in group '{group_name}'."
        else:
            message = "Invalid action."
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": message}, status=status.HTTP_200_OK)

class GroupListView(generics.ListAPIView):
    """
    API endpoint for listing all available groups.
    Accessible by admin users.
    """
    queryset = Group.objects.all().order_by('name')
    serializer_class = GroupSerializer # Use the new GroupSerializer
    permission_classes = [IsAdministrator]

class MyTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            username = request.data.get("username")
            User = get_user_model()
            user_obj = User.objects.filter(username=username).first()
            role = user_obj.groups.first().name if user_obj and user_obj.groups.exists() else "User"
            log_audit(request, "LOGIN", f"User {username} logged in.", username=username, role=role)
        return response

class MyTokenBlacklistView(TokenBlacklistView):
    def post(self, request, *args, **kwargs):
        username = str(request.user)
        role = request.user.groups.first().name if request.user.is_authenticated and request.user.groups.exists() else "User"
        response = super().post(request, *args, **kwargs)
        if response.status_code in [200, 205]:
            log_audit(request, "LOGOUT", f"User {username} logged out.", username=username, role=role)
        return response


#new forgot password code
""" 
@api_view(['POST'])
def request_password_reset(request):
    username_or_email = request.data.get('username_or_email')
    # Find user by username or email
    user = User.objects.filter(username=username_or_email).first() or \
           User.objects.filter(email=username_or_email).first()
    if user and user.email:
        # Generate reset link (use Django's built-in system in production)
        reset_link = f"http://localhost:3000/reset-password/{user.id}/"
        send_mail(
            "Password Reset Request",
            f"Click the link to reset your password: {reset_link}",
            "noreply@yourdomain.com",
            [user.email],
        )
    return Response({"message": "If your account exists, a reset link has been sent."}, status=status.HTTP_200_OK)
"""