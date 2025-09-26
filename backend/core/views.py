from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes, permission_classes
from django.db.models import Count
from rest_framework.generics import ListAPIView
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser # IMPORT THIS
from rest_framework import generics, permissions

from .models import Record, RecordFile, AuditLog
from .serializers import RecordSerializer, RecordFileSerializer, AuditLogSerializer

import mimetypes
import hashlib

from accounts.permissions import IsAdministrator, IsAdminOrEditor

# Create or List Records
class RecordListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication

    def get(self, request):
        records = Record.objects.all().order_by('-id')
        serializer = RecordSerializer(records, many=True)
        return Response(serializer.data)

    def post(self, request):
        print("Incoming request data:", request.data)

        files = request.FILES.getlist('files')
        # DO NOT .copy() request.data if it contains files!
        data = request.data  # Use as-is

        # Check if a record with the same UPIN already exists
        upin = data.get('UPIN')
        if Record.objects.filter(UPIN=upin).exists():
            return Response(
                {'error': f"A record with UPIN '{upin}' already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = RecordSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            record = serializer.save()

            # Save related files
            for idx, file in enumerate(files):
                display_name = request.data.getlist('names[]')[idx] if idx < len(request.data.getlist('names[]')) else file.name
                category = request.data.getlist('categories[]')[idx] if idx < len(request.data.getlist('categories[]')) else "Uncategorized"
                RecordFile.objects.create(
                    record=record,
                    uploaded_file=file,
                    display_name=display_name,
                    category=category
                )

            return Response(RecordSerializer(record).data, status=status.HTTP_201_CREATED)

        print("Validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Search by UPIN or File Code
class RecordSearchView(APIView):
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication

    def get(self, request):
        upin = request.query_params.get('UPIN')
        file_code = request.query_params.get('ExistingArchiveCode')

        if upin:
            records = Record.objects.filter(UPIN=upin)
        elif file_code:
            records = Record.objects.filter(ExistingArchiveCode=file_code)
        else:
            return Response({'error': 'No search parameter provided'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = RecordSerializer(records, many=True)
        return Response(serializer.data)

# Edit or Delete a record by PK
class RecordDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication

    def get_object(self, pk):
        return get_object_or_404(Record, pk=pk)

    def put(self, request, pk):
        record = self.get_object(pk)
        files = request.FILES.getlist('uploaded_files')
        data = request.data.copy()
        data.pop('uploaded_files', None)

        serializer = RecordSerializer(record, data=data, context={'request': request})
        if serializer.is_valid():
            updated_record = serializer.save()

            # Save new uploaded files if any
            for f in files:
                print(f"Saving file: {f.name}")  # Debugging log
                RecordFile.objects.create(record=updated_record, uploaded_file=f)

            return Response(RecordSerializer(updated_record).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        record = self.get_object(pk)
        record.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Update a record by UPIN
class RecordUpdateByUPIN(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication

    def put(self, request, upin):
        record = get_object_or_404(Record, UPIN=upin)
        serializer = RecordSerializer(record, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Search by Service of Estate
@api_view(['GET'])
@parser_classes([MultiPartParser, FormParser]) # Added parser_classes for consistency, though not strictly needed for GET
def search_records_by_service(request):
    # For function-based views, permissions are applied via decorator
    if not request.user.is_authenticated: # Manual check for function-based view
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    service = request.GET.get('ServiceOfEstate')
    if service:
        records = Record.objects.filter(ServiceOfEstate=service)
        serializer = RecordSerializer(records, many=True)
        return Response(serializer.data, status=200)
    return Response({'error': 'ServiceOfEstate parameter is required'}, status=400)

# Search by Kebele
@api_view(['GET'])
@parser_classes([MultiPartParser, FormParser])
def search_records_by_kebele(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
    
    kebele = request.GET.get('kebele')
    if kebele:
       records = Record.objects.filter(kebele=kebele) 
       serializer = RecordSerializer(records, many=True)
       return Response(serializer.data, status=200)
    return Response({'error': 'kebele parameter is required'}, status=400)

# Search by Proof of Possession
@api_view(['GET'])
@parser_classes([MultiPartParser, FormParser])
def search_records_by_proof(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
    
    proof = request.GET.get('proofOfPossession')
    if proof:
      records = Record.objects.filter(proofOfPossession=proof) 
      serializer = RecordSerializer(records, many=True)
      return Response(serializer.data, status=200)
    return Response({'error': 'proofOfPossession parameter is required'}, status=400)

# Search by Possession Status
@api_view(['GET'])
@parser_classes([MultiPartParser, FormParser])
def search_records_by_possession(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
    
    possession = request.GET.get('possessionStatus')
    if possession:
      records = Record.objects.filter(possessionStatus=possession) 
      serializer = RecordSerializer(records, many=True)
      return Response(serializer.data, status=200)
    return Response({'error': 'possessionStatus parameter is required'}, status=400)

class RecentRecordsView(ListAPIView):
    serializer_class = RecordSerializer
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication

    def get_queryset(self):
        return Record.objects.all().order_by('-created_at')[:4]

class ProofOfPossessionStats(APIView):
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication
    def get(self, request):
        stats = (
            Record.objects
            .values("proofOfPossession")
            .annotate(count=Count("proofOfPossession"))
            .order_by("-count")
        )
        return Response(stats)

class ServiceOfEstateStats(APIView):
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication
    def get(self, request):
        stats = (
            Record.objects
            .values("ServiceOfEstate")
            .annotate(count=Count("ServiceOfEstate"))
            .order_by("-count")
        )
        return Response(stats)

@api_view(['GET'])
@parser_classes([MultiPartParser, FormParser])
def check_upin(request, upin):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
    
    exists = Record.objects.filter(UPIN=upin).exists()
    return Response({"exists": exists}, status=200)

# Handles uploading files after a record is created (via UPIN) AND listing files for a record
@api_view(['GET', 'PUT'])
@parser_classes([MultiPartParser, FormParser])
def upload_record_files(request, upin):
    if request.method == 'GET':
        record = get_object_or_404(Record, UPIN=upin)
        files = RecordFile.objects.filter(record=record)
        serializer = RecordFileSerializer(files, many=True)
        return Response(serializer.data)
    # ... handle PUT if needed ...

    return Response({'error': 'Method not allowed'}, status=405)

class RecordViewSet(viewsets.ModelViewSet):
    queryset = Record.objects.all()
    serializer_class = RecordSerializer
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication

    def list(self, request, *args, **kwargs):
        upin = request.query_params.get('upin')
        if upin:
            records = Record.objects.filter(UPIN=upin)
            serializer = self.get_serializer(records, many=True)
            return Response(serializer.data)
        return super().list(request, *args, **kwargs)


@api_view(['GET', 'PUT'])
@parser_classes([MultiPartParser, FormParser])
def upload_files(request, upin):
    """
    Handles uploading files to a record identified by UPIN and retrieving files for a record.
    """
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
    
    record = get_object_or_404(Record, UPIN=upin)

    if request.method == 'GET':
        files = RecordFile.objects.filter(record=record)

        if not files.exists():
            return Response({'error': f"No files found for the record with UPIN '{upin}'."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RecordFileSerializer(files, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        files = request.FILES.getlist('files')
        names = request.data.getlist('names[]') or request.data.getlist('names')
        categories = request.data.getlist('categories[]') or request.data.getlist('categories')

        if len(files) != len(names) or len(files) != len(categories):
            return Response({'error': 'Mismatch between files, names, and categories.'}, status=status.HTTP_400_BAD_REQUEST)

        for idx, file in enumerate(files):
            display_name = names[idx] if idx < len(names) else file.name
            category = categories[idx] if idx < len(categories) else "Uncategorized"
            content_type = file.content_type or mimetypes.guess_type(file.name)[0] or "Unknown"

            # Generate hash for the file content
            hasher = hashlib.sha256()
            for chunk in file.chunks():
                hasher.update(chunk)
            file_hash = hasher.hexdigest()

            # Prevent duplicate files
            if not RecordFile.objects.filter(
                file_hash=file_hash, record=record,
                display_name=display_name,
                uploaded_file__name=file.name,
                category=category,
                type=content_type
            ).exists():
                RecordFile.objects.create(
                    record=record,
                    uploaded_file=file,
                    display_name=display_name,
                    category=category,
                    type=content_type
                )

        return Response({'status': 'files uploaded successfully'}, status=status.HTTP_200_OK)

    return Response({'error': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


##############
#######
class ReplaceFileView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, fileId):
        file_obj = get_object_or_404(RecordFile, id=fileId)
        uploaded_file = request.FILES.get('uploaded_file')
        if uploaded_file:
            file_obj.uploaded_file = uploaded_file
            file_obj.save()
            return Response({'message': 'File replaced successfully.'}, status=200)
        return Response({'error': 'No file provided.'}, status=400)

class DeleteFileView(APIView):
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication
    def delete(self, request, fileId):
        file = get_object_or_404(RecordFile, id=fileId)
        if file.category == "required":
            return Response(
                {"error": "Required files cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class UploadFileView(APIView):
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication
    def post(self, request, upin):
        record = get_object_or_404(Record, UPIN=upin)
        uploaded_file = request.FILES.get("uploaded_file")
        display_name = request.data.get("display_name")
        category = request.data.get("category", "additional")

        if uploaded_file and display_name:
            RecordFile.objects.create(
                record=record,
                uploaded_file=uploaded_file,
                display_name=display_name,
                category=category,
            )
            return Response({"message": "File uploaded successfully."}, status=status.HTTP_201_CREATED)
        return Response({"error": "Invalid file or display name."}, status=status.HTTP_400_BAD_REQUEST)


from .models import Record, RecordFile, AuditLog
from .serializers import RecordSerializer, RecordFileSerializer, AuditLogSerializer

import mimetypes
import hashlib

# Create or List Records
class RecordListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication

    def get(self, request):
        records = Record.objects.all().order_by('-id')
        serializer = RecordSerializer(records, many=True)
        return Response(serializer.data)

    def post(self, request):
        print("Incoming request data:", request.data)

        files = request.FILES.getlist('files')
        # DO NOT .copy() request.data if it contains files!
        data = request.data  # Use as-is

        # Check if a record with the same UPIN already exists
        upin = data.get('UPIN')
        if Record.objects.filter(UPIN=upin).exists():
            return Response(
                {'error': f"A record with UPIN '{upin}' already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = RecordSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            record = serializer.save()

            # Save related files
            for idx, file in enumerate(files):
                display_name = request.data.getlist('names[]')[idx] if idx < len(request.data.getlist('names[]')) else file.name
                category = request.data.getlist('categories[]')[idx] if idx < len(request.data.getlist('categories[]')) else "Uncategorized"
                RecordFile.objects.create(
                    record=record,
                    uploaded_file=file,
                    display_name=display_name,
                    category=category
                )

            # LOG THE ACTION HERE:
            log_audit(request, "CREATE", f"Created record with UPIN {upin}")

            return Response(RecordSerializer(record).data, status=status.HTTP_201_CREATED)

        print("Validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Search by UPIN or File Code
class RecordSearchView(APIView):
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication

    def get(self, request):
        upin = request.query_params.get('UPIN')
        file_code = request.query_params.get('ExistingArchiveCode')

        if upin:
            records = Record.objects.filter(UPIN=upin)
        elif file_code:
            records = Record.objects.filter(ExistingArchiveCode=file_code)
        else:
            return Response({'error': 'No search parameter provided'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = RecordSerializer(records, many=True)
        return Response(serializer.data)

# Edit or Delete a record by PK
class RecordDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication

    def get_object(self, pk):
        return get_object_or_404(Record, pk=pk)

    def put(self, request, pk):
        record = self.get_object(pk)
        files = request.FILES.getlist('uploaded_files')
        data = request.data.copy()
        data.pop('uploaded_files', None)

        serializer = RecordSerializer(record, data=data, context={'request': request})
        if serializer.is_valid():
            updated_record = serializer.save()
            # LOG THE ACTION HERE:
            log_audit(request, "UPDATE", f"Updated record with ID {pk}")

            # Save new uploaded files if any
            for f in files:
                print(f"Saving file: {f.name}")  # Debugging log
                RecordFile.objects.create(record=updated_record, uploaded_file=f)

            return Response(RecordSerializer(updated_record).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        record = self.get_object(pk)
        record.delete()
        # LOG THE ACTION HERE:
        log_audit(request, "DELETE", f"Deleted record with ID {pk}")
        return Response(status=status.HTTP_204_NO_CONTENT)

# Update a record by UPIN
class RecordUpdateByUPIN(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication

    def put(self, request, upin):
        record = get_object_or_404(Record, UPIN=upin)
        serializer = RecordSerializer(record, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Search by Service of Estate
@api_view(['GET'])
@parser_classes([MultiPartParser, FormParser]) # Added parser_classes for consistency, though not strictly needed for GET
def search_records_by_service(request):
    # For function-based views, permissions are applied via decorator
    if not request.user.is_authenticated: # Manual check for function-based view
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    service = request.GET.get('ServiceOfEstate')
    if service:
        records = Record.objects.filter(ServiceOfEstate=service)
        serializer = RecordSerializer(records, many=True)
        return Response(serializer.data, status=200)
    return Response({'error': 'ServiceOfEstate parameter is required'}, status=400)

# Search by Kebele
@api_view(['GET'])
@parser_classes([MultiPartParser, FormParser])
def search_records_by_kebele(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
    
    kebele = request.GET.get('kebele')
    if kebele:
       records = Record.objects.filter(kebele=kebele) 
       serializer = RecordSerializer(records, many=True)
       return Response(serializer.data, status=200)
    return Response({'error': 'kebele parameter is required'}, status=400)

# Search by Proof of Possession
@api_view(['GET'])
@parser_classes([MultiPartParser, FormParser])
def search_records_by_proof(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
    
    proof = request.GET.get('proofOfPossession')
    if proof:
      records = Record.objects.filter(proofOfPossession=proof) 
      serializer = RecordSerializer(records, many=True)
      return Response(serializer.data, status=200)
    return Response({'error': 'proofOfPossession parameter is required'}, status=400)

# Search by Possession Status
@api_view(['GET'])
@parser_classes([MultiPartParser, FormParser])
def search_records_by_possession(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
    
    possession = request.GET.get('possessionStatus')
    if possession:
      records = Record.objects.filter(possessionStatus=possession) 
      serializer = RecordSerializer(records, many=True)
      return Response(serializer.data, status=200)
    return Response({'error': 'possessionStatus parameter is required'}, status=400)

class RecentRecordsView(ListAPIView):
    serializer_class = RecordSerializer
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication

    def get_queryset(self):
        return Record.objects.all().order_by('-created_at')[:4]

class ProofOfPossessionStats(APIView):
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication
    def get(self, request):
        stats = (
            Record.objects
            .values("proofOfPossession")
            .annotate(count=Count("proofOfPossession"))
            .order_by("-count")
        )
        return Response(stats)

class ServiceOfEstateStats(APIView):
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication
    def get(self, request):
        stats = (
            Record.objects
            .values("ServiceOfEstate")
            .annotate(count=Count("ServiceOfEstate"))
            .order_by("-count")
        )
        return Response(stats)

@api_view(['GET'])
@parser_classes([MultiPartParser, FormParser])
def check_upin(request, upin):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
    
    exists = Record.objects.filter(UPIN=upin).exists()
    return Response({"exists": exists}, status=200)

# Handles uploading files after a record is created (via UPIN) AND listing files for a record
@api_view(['GET', 'PUT'])
@parser_classes([MultiPartParser, FormParser])
def upload_record_files(request, upin):
    if request.method == 'GET':
        record = get_object_or_404(Record, UPIN=upin)
        files = RecordFile.objects.filter(record=record)
        serializer = RecordFileSerializer(files, many=True)
        return Response(serializer.data)
    # ... handle PUT if needed ...

    return Response({'error': 'Method not allowed'}, status=405)

class RecordViewSet(viewsets.ModelViewSet):
    queryset = Record.objects.all()
    serializer_class = RecordSerializer
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication

    def list(self, request, *args, **kwargs):
        upin = request.query_params.get('upin')
        if upin:
            records = Record.objects.filter(UPIN=upin)
            serializer = self.get_serializer(records, many=True)
            return Response(serializer.data)
        return super().list(request, *args, **kwargs)


@api_view(['GET', 'PUT'])
@parser_classes([MultiPartParser, FormParser])
def upload_files(request, upin):
    """
    Handles uploading files to a record identified by UPIN and retrieving files for a record.
    """
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
    
    record = get_object_or_404(Record, UPIN=upin)

    if request.method == 'GET':
        files = RecordFile.objects.filter(record=record)

        if not files.exists():
            return Response({'error': f"No files found for the record with UPIN '{upin}'."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RecordFileSerializer(files, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        files = request.FILES.getlist('files')
        names = request.data.getlist('names[]') or request.data.getlist('names')
        categories = request.data.getlist('categories[]') or request.data.getlist('categories')

        if len(files) != len(names) or len(files) != len(categories):
            return Response({'error': 'Mismatch between files, names, and categories.'}, status=status.HTTP_400_BAD_REQUEST)

        for idx, file in enumerate(files):
            display_name = names[idx] if idx < len(names) else file.name
            category = categories[idx] if idx < len(categories) else "Uncategorized"
            content_type = file.content_type or mimetypes.guess_type(file.name)[0] or "Unknown"

            # Generate hash for the file content
            hasher = hashlib.sha256()
            for chunk in file.chunks():
                hasher.update(chunk)
            file_hash = hasher.hexdigest()

            # Prevent duplicate files
            if not RecordFile.objects.filter(
                file_hash=file_hash, record=record,
                display_name=display_name,
                uploaded_file__name=file.name,
                category=category,
                type=content_type
            ).exists():
                RecordFile.objects.create(
                    record=record,
                    uploaded_file=file,
                    display_name=display_name,
                    category=category,
                    type=content_type
                )

        return Response({'status': 'files uploaded successfully'}, status=status.HTTP_200_OK)

    return Response({'error': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


##############
#######
class ReplaceFileView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, fileId):
        file_obj = get_object_or_404(RecordFile, id=fileId)
        uploaded_file = request.FILES.get('uploaded_file')
        if uploaded_file:
            file_obj.uploaded_file = uploaded_file
            file_obj.save()
            return Response({'message': 'File replaced successfully.'}, status=200)
        return Response({'error': 'No file provided.'}, status=400)

class DeleteFileView(APIView):
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication
    def delete(self, request, fileId):
        file = get_object_or_404(RecordFile, id=fileId)
        if file.category == "required":
            return Response(
                {"error": "Required files cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class UploadFileView(APIView):
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication
    def post(self, request, upin):
        record = get_object_or_404(Record, UPIN=upin)
        uploaded_file = request.FILES.get("uploaded_file")
        display_name = request.data.get("display_name")
        category = request.data.get("category", "additional")

        if uploaded_file and display_name:
            RecordFile.objects.create(
                record=record,
                uploaded_file=uploaded_file,
                display_name=display_name,
                category=category,
            )
            return Response({"message": "File uploaded successfully."}, status=status.HTTP_201_CREATED)
        return Response({"error": "Invalid file or display name."}, status=status.HTTP_400_BAD_REQUEST)


class RecordUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, upin):
        record = Record.objects.filter(UPIN=upin).first()
        if not record:
            return Response({"error": "Record not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RecordSerializer(record, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Get the user's role
            role = request.user.groups.first().name if request.user.is_authenticated and request.user.groups.exists() else "User"
            # Log the update action with the role
            log_audit(request, "UPDATE", f"Updated record with UPIN {upin}", role=role)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AuditLogListView(APIView):
    permission_classes = [IsAuthenticated, IsAdministrator]

    def get(self, request):
        logs = AuditLog.objects.all().order_by('-timestamp')[:500]  # Limit for performance
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)

from .models import AuditLog

def log_audit(request, action, details="", username=None, role=None):
    # Use provided username if given (for login), else use request.user
    user_str = username or (str(request.user) if request.user.is_authenticated else "Anonymous")
    AuditLog.objects.create(
        user=user_str,
        action=action,
        details=details,
        ip_address=request.META.get("REMOTE_ADDR"),
        role=role  # Add this if you add a role field to your model
    )

def log_login(request, username):
    """
    Log the login action of a user.
    """
    role = None
    # Determine the role of the user if possible
    if request.user.is_authenticated:
        role = request.user.groups.first().name if request.user.groups.exists() else None

    log_audit(request, "LOGIN", f"User {username} logged in.", username=username, role=role)

def log_logout(request, username):
    """
    Log the logout action of a user.
    """
    role = None
    # Determine the role of the user if possible
    if request.user.is_authenticated:
        role = request.user.groups.first().name if request.user.groups.exists() else None

    log_audit(request, "LOGOUT", f"User {username} logged out.", username=username, role=role)

class RecordUpdateView(APIView):
    permission_classes = [IsAuthenticated] # ADDED: Requires authentication
    def put(self, request, upin):
        record = Record.objects.filter(UPIN=upin).first()
        if not record:
            return Response({"error": "Record not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RecordSerializer(record, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

 #graph 3

@api_view(['GET'])
def amount_paid_statistics(request):
    first_paid = Record.objects.filter(FirstAmount__gt=0).count()
    second_paid = Record.objects.filter(SecondAmount__gt=0).count()
    third_paid = Record.objects.filter(ThirdAmount__gt=0).count()
    return Response([
        {"name": "FirstAmount Paid", "count": first_paid},
        {"name": "SecondAmount Paid", "count": second_paid},
        {"name": "ThirdAmount Paid", "count": third_paid},
    ])

class AuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.all().order_by('-timestamp')[:100]
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOrEditor]  # Only admins can view

@api_view(['GET'])
@permission_classes([IsAdminOrEditor])
def recent_records(request):
    records = Record.objects.order_by('-id')[:10]
    data = [
        {
            "id": r.id,
            "UPIN": r.UPIN,
            "owner": getattr(r, "owner", ""),  # Adjust if your model uses a different field
            "created_at": r.created_at.isoformat() if hasattr(r, "created_at") else "",
        }
        for r in records
    ]
    return Response(data)

class UserListView(APIView):
    permission_classes = [IsAdminOrEditor]

    def get(self, request):
        User = get_user_model()
        users = User.objects.all()
        data = [{"id": u.id, "username": u.username} for u in users]
        return Response(data)


from datetime import timedelta
from django.utils import timezone

@api_view(['GET'])
@permission_classes([IsAdministrator])
def dashboard_metrics(request):
    total_records = Record.objects.count()
    User = get_user_model()
    registered_users = User.objects.count()
    
    # Reports Generated: Now explicitly tracking "REPORT_GENERATED"
    # Also include "VIEW" actions if those are considered "reports" for the dashboard metric.
    reports_generated = AuditLog.objects.filter(action__in=['REPORT_GENERATED', 'VIEW']).count() 

    now = timezone.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    files_uploaded = RecordFile.objects.filter(uploaded_at__gte=start_of_month).count()
    seven_days_ago = now - timedelta(days=7)
    recent_users = (
        AuditLog.objects.filter(action="LOGIN", timestamp__gte=seven_days_ago)
        .values_list("user", flat=True)
        .distinct()
        .count()
    )

    return Response({
        "totalRecords": total_records,
        "registeredUsers": registered_users,
        "reportsGenerated": reports_generated,
        "filesUploaded": files_uploaded,
        "recentActiveUsers": recent_users,
    })