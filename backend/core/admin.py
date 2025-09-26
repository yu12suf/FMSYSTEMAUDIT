from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "user", "action", "ip_address", "details")
    search_fields = ("user", "action", "details", "ip_address")
    list_filter = ("action", "timestamp")
