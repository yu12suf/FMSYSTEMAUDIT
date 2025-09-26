from django.db import models
import hashlib
class Record(models.Model):
    PropertyOwnerName = models.CharField(max_length=255)
    ExistingArchiveCode = models.CharField(max_length=255, db_index=True)  # searchable
    UPIN = models.CharField(max_length=255, unique=True, db_index=True)  # searchable
    PhoneNumber = models.CharField(max_length=255, null=True, blank=True)
    NationalId = models.CharField(max_length=255, null=True, blank=True)
    ServiceOfEstate = models.CharField(max_length=255)
    placeLevel = models.CharField(max_length=255)
    possessionStatus = models.CharField(max_length=255)
    spaceSize = models.CharField(max_length=255)
    kebele = models.CharField(max_length=255)
    proofOfPossession = models.CharField(max_length=255)
    DebtRestriction = models.CharField(max_length=255)
    LastTaxPaymtDate = models.DateField(null=True, blank=True)
    unpaidTaxDebt = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    InvoiceNumber = models.CharField(max_length=255, null=True, blank=True)
    FirstAmount = models.CharField(max_length=255, null=True, blank=True)
    lastDatePayPropTax = models.DateField(null=True, blank=True)
    unpaidPropTaxDebt = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    InvoiceNumber2 = models.CharField(max_length=255, null=True, blank=True)
    SecondAmount = models.CharField(max_length=255, null=True, blank=True)
    filePath = models.CharField(max_length=255, null=True, blank=True)
    EndLeasePayPeriod = models.DateField(null=True, blank=True)
    unpaidLeaseDebt = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    InvoiceNumber3  = models.CharField(max_length=255, null=True, blank=True)
    ThirdAmount  = models.CharField(max_length=255, null=True, blank=True)
    FolderNumber = models.CharField(max_length=255, null=True, blank=True)
    Row = models.CharField(max_length=255, null=True, blank=True)
    ShelfNumber = models.CharField(max_length=255, null=True, blank=True)
    NumberOfPages = models.IntegerField(null=True, blank=True)
    sortingNumber = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)  # optional: tracking
    updated_at = models.DateTimeField(auto_now=True)      # optional: tracking

    def __str__(self):
        return f"{self.UPIN} - {self.PropertyOwnerName}"


class RecordFile(models.Model):
    record = models.ForeignKey(Record, related_name='files', on_delete=models.CASCADE)
    uploaded_file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    display_name = models.CharField(max_length=255, blank=True)  # Add this
    category = models.CharField(max_length=32, blank=True)       # Add this 
    type = models.CharField(max_length=50, blank=True)  # Add this field
    file_hash = models.CharField(max_length=64, blank=True, null=True)  # Remove unique constraint temporarily

    # def save(self, *args, **kwargs):
    #     if not self.file_hash:
    #         # Generate hash for the file content
    #         hasher = hashlib.sha256()
    #         for chunk in self.uploaded_file.chunks():
    #             hasher.update(chunk)
    #         self.file_hash = hasher.hexdigest()
    #     super().save(*args, **kwargs)

# # def backfill_file_hash():
#     files = RecordFile.objects.filter(file_hash__isnull=True)  # Find rows with null file_hash
#     for record_file in files:
#         hasher = hashlib.sha256()
#         for chunk in record_file.uploaded_file.chunks():
#             hasher.update(chunk)
#         record_file.file_hash = hasher.hexdigest()
#         record_file.save()
#     print(f"Updated {files.count()} records with unique file_hash.")

# # Run the script
# backfill_file_hash()

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("LOGIN", "Login"),
        ("LOGOUT", "Logout"),
        ("CREATE", "Create"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
        ("DOWNLOAD", "Download"),
        ("VIEW", "View"),
        ("OTHER", "Other"),
    ]
    user = models.CharField(max_length=255, blank=True, null=True)
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    details = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    role = models.CharField(max_length=64, blank=True, null=True)  # Add this line

    def __str__(self):
        return f"{self.timestamp} - {self.user} - {self.action}"