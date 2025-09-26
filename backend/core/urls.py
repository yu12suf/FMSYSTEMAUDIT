from django.urls import path
from .views import (
    RecordListCreateView,
    RecordSearchView,
    RecordDetailView,
    RecordUpdateByUPIN,  # ✅ import the new view
    RecentRecordsView,
    ProofOfPossessionStats,
    ServiceOfEstateStats,
    RecordUpdateView,
    ReplaceFileView,
    UploadFileView,
    DeleteFileView,
    search_records_by_service,  # Add this line
    search_records_by_kebele,  # Add this line
    search_records_by_proof,  # Add this line
    search_records_by_possession,  # Add this line
    amount_paid_statistics,
)
from .views import  upload_files, check_upin
from .views import AuditLogListView

from rest_framework.routers import DefaultRouter
from .views import RecordViewSet, upload_record_files, dashboard_metrics
from .views import RecordViewSet

# Initialize the router for viewsets
router = DefaultRouter()
router.register(r'records', RecordViewSet, basename='record')

# Define urlpatterns
urlpatterns = [
    path('api/records/', RecordListCreateView.as_view(), name='record-list-create'),  # GET all records / POST new record
    path('api/records/search/', RecordSearchView.as_view(), name='record-search'),  # GET search by UPIN or File Code
    path('api/records/upin/<str:upin>', RecordUpdateByUPIN.as_view(), name='record-update-by-upin'),  # PUT/DELETE individual record by UPIN
    path('api/records/<int:pk>', RecordDetailView.as_view(), name='record-detail'),  # PUT/DELETE individual record by ID
    path('api/records/search-by-service/', search_records_by_service, name='search-by-service'),  # Search by Service of Estate
    path('api/records/search-by-kebele/', search_records_by_kebele, name='search-by-kebele'),  # Search by Kebele
    path('api/records/search-by-proof/', search_records_by_proof, name='search-by-proof'),  # Search by Proof of Possession
    path('api/records/search-by-possession/', search_records_by_possession, name='search-by-possession'),  # Search by Possession Status
    path('api/records/recent/', RecentRecordsView.as_view(), name='recent-records'),  # GET recent records
    path("api/statistics/proof-of-possession", ProofOfPossessionStats.as_view(), name='proof-of-possession-stats'),  # Proof of Possession Stats
    path("api/statistics/service-of-estate", ServiceOfEstateStats.as_view(), name='service-of-estate-stats'),  # Service of Estate Stats
    path('api/records/<str:upin>/files/', upload_record_files, name='upload_record_files'),  # Upload or list files for a record
    path('api/records/check-upin/<str:upin>/', check_upin, name='check-upin'),  # Check if a UPIN exists
    
    # File operations using fileId
    path("api/files/<int:fileId>/replace/", ReplaceFileView.as_view(), name="replace_file"),
    path("api/files/<int:fileId>/delete/", DeleteFileView.as_view(), name="delete-file"),

    # File upload using upin
    path("api/files/<str:upin>/upload/", UploadFileView.as_view(), name="upload-file"),

    # Record update using upin
    path("api/records/<str:upin>/", RecordUpdateView.as_view(), name="record-update"),

    # Audit logs
    path('api/audit-logs/', AuditLogListView.as_view(), name='audit-logs'),

    #grapg3 path
    path("api/statistics/amount-paid", amount_paid_statistics, name='service-of-estate-stats'),  # Service of Estate Stats
   
    path('api/dashboard-metrics/', dashboard_metrics, name='dashboard-metrics'),
    ]

# Add router URLs
urlpatterns += router.urls