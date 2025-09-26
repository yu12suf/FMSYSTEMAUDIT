# backend/accounts/urls.py

from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views
from .views import MyTokenObtainPairView, MyTokenBlacklistView

urlpatterns = [
    # Authentication URLs
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', MyTokenObtainPairView.as_view(), name='login'),  # Use custom JWT login
    path('logout/', views.UserLogoutView.as_view(), name='logout'),
    path('token/obtain/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- FIX START ---
    # User Management URLs (Admin only)
    # This endpoint now handles both GET (list) and POST (create)
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    # --- FIX END ---

    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/roles/', views.UserRoleManagementView.as_view(), name='user-role-management'),
    path('groups/', views.GroupListView.as_view(), name='group-list'),

    # Token management URLs
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/blacklist/', MyTokenBlacklistView.as_view(), name='token_blacklist'),
]
