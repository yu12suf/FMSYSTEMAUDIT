from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User, Group

# Unregister default if needed
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """
    Custom User Admin without duplicating 'groups' (already in BaseUserAdmin).
    """
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_active')
    # DO NOT add 'groups' again in fieldsets — it's already included
    filter_horizontal = ('groups',)

@admin.register(Group)
class CustomGroupAdmin(admin.ModelAdmin):
    """
    Custom Group Admin.
    """
    list_display = ('name',)
    search_fields = ('name',)
