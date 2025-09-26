from rest_framework import serializers
from .models import Record, RecordFile, AuditLog
import hashlib

class RecordFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecordFile
        fields = '__all__'

class RecordSerializer(serializers.ModelSerializer):
    files = RecordFileSerializer(many=True, read_only=True)  # Read-only for related files

    class Meta:
        model = Record
        fields = '__all__'

    def to_internal_value(self, data):
        # DO NOT copy data here; just use it as-is!
        # data = data.copy()  # REMOVE THIS LINE

        # Auto-format 4-digit year to full date format
        date_fields = ['LastTaxPaymtDate', 'lastDatePayPropTax', 'EndLeasePayPeriod']
        for field in date_fields:
            val = data.get(field)
            if val and len(val) == 4 and val.isdigit():
                data[field] = f"{val}-01-01"
        return super().to_internal_value(data)

    def validate_LastTaxPaymtDate(self, value):
        if value and value.year < 1900:
            raise serializers.ValidationError("LastTaxPaymtDate must be after 1900.")
        return value

        ''' def validate(self, data):
        # Ensure date fields are in the correct order
        if data.get('LastTaxPaymtDate') and data.get('EndLeasePayPeriod'):
            if data['LastTaxPaymtDate'] > data['EndLeasePayPeriod']:
                raise serializers.ValidationError("LastTaxPaymtDate cannot be after EndLeasePayPeriod.")
        return data'''

    def create(self, validated_data):
        """
        Override the create method to handle related files.
        """
        # Extract files from the context (request)
        request = self.context.get('request')
        files = request.FILES.getlist('uploaded_files') if request else []

        # Create the record
        record = super().create(validated_data)

        # Save related files
        for file in files:
             # Generate hash for the file content
             hasher = hashlib.sha256()
             for chunk in file.chunks():
                 hasher.update(chunk)
             file_hash = hasher.hexdigest()

             # Prevent duplicate files
             if not RecordFile.objects.filter(file_hash=file_hash, record=record).exists():
                 RecordFile.objects.create(record=record, uploaded_file=file, file_hash=file_hash)

        return record

    def update(self, instance, validated_data):
        """
        Override the update method to handle related files.
        """
        # Extract files from the context (request)
        request = self.context.get('request')
        files = request.FILES.getlist('uploaded_files') if request else []

        # Update the record
        instance = super().update(instance, validated_data)

        # Save new related files
        for file in files:
            # Generate hash for the file content
            hasher = hashlib.sha256()
            for chunk in file.chunks():
              hasher.update(chunk)
            file_hash = hasher.hexdigest()

             # Prevent duplicate files
            if not RecordFile.objects.filter(file_hash=file_hash, record=instance).exists():
               RecordFile.objects.create(record=instance, uploaded_file=file, file_hash=file_hash)

        return instance

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'