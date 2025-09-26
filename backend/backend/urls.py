from django.contrib import admin
from django.urls import path, include  # ✅ Clean single import

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),  # ✅ This correctly routes to your app's views
    path('api/', include('core.urls')), 
    path('api/accounts/', include('accounts.urls')),
]

# ✅ This line allows you to serve uploaded files (like documents/images) during development
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
