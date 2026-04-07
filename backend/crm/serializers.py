from rest_framework import serializers
from .models import Lead, Note

class NoteSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Note
        fields = ['id', 'text', 'user_name', 'created_at']

class LeadSerializer(serializers.ModelSerializer):
    notes = NoteSerializer(many=True, read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = Lead
        fields = ['id', 'name', 'phone', 'city', 'electricity_units', 'status', 'assigned_to', 'assigned_to_name', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']