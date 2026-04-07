from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .models import Lead, Note
from .serializers import LeadSerializer, NoteSerializer

class LeadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing leads.
    Provides CRUD operations with filtering by status, city, assigned_to.
    """
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'city', 'assigned_to']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']

class NoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notes on leads.
    Provides CRUD operations with filtering by lead and user.
    """
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['lead', 'user']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
