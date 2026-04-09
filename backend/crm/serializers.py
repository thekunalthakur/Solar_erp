from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Lead, Note, Campaign, CampaignLead, Broadcast, BroadcastRecipient, EngagementActivity, Task, FollowUp, Customer, CustomerDocument, Survey, Installation, Supplier, Product, Stock, Loan, Subsidy, AutomationRule, SalesProduct, AuditLog


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_superuser']

class NoteSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Note
        fields = ['id', 'text', 'user_name', 'created_at']

# Ordered pipeline stages (excluding 'lost' which is a terminal stage reachable from anywhere)
STATUS_PIPELINE = ['new', 'contacted', 'qualified', 'site_visit', 'proposal', 'won']


class LeadSerializer(serializers.ModelSerializer):
    notes = NoteSerializer(many=True, read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)

    class Meta:
        model = Lead
        fields = ['id', 'lead_id', 'name', 'phone', 'city', 'electricity_units', 'status', 'assigned_to', 'assigned_to_name', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'lead_id', 'created_at', 'updated_at', 'notes']

    def validate(self, attrs):
        if self.instance is not None and 'status' in attrs:
            current = self.instance.status
            new_status = attrs['status']

            # No-op: same status
            if current == new_status:
                return attrs

            # 'lost' is always reachable from any non-terminal stage
            if new_status == 'lost':
                if current in ('won', 'lost'):
                    raise serializers.ValidationError(
                        {'status': f'Lead is already closed ({current}). Status cannot be changed.'}
                    )
                return attrs

            # Once closed, no further transitions
            if current in ('won', 'lost'):
                raise serializers.ValidationError(
                    {'status': f'Lead is already closed ({current}). Status cannot be changed.'}
                )

            # Enforce forward-only progression within the main pipeline
            try:
                current_idx = STATUS_PIPELINE.index(current)
                new_idx = STATUS_PIPELINE.index(new_status)
            except ValueError:
                # Unknown status value — let model-level validation handle it
                return attrs

            if new_idx <= current_idx:
                raise serializers.ValidationError(
                    {'status': 'Cannot move lead to a previous stage.'}
                )

        return attrs

class CampaignSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    lead_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    leads = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = ['id', 'name', 'source', 'budget', 'start_date', 'end_date', 'created_by', 'created_by_name', 'lead_ids', 'leads', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        start_date = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({'end_date': 'end_date must be greater than or equal to start_date.'})
        return attrs

    def get_leads(self, obj):
        return [
            {
                'id': membership.lead.id,
                'lead_id': membership.lead.lead_id,
                'name': membership.lead.name,
            }
            for membership in obj.campaign_leads.select_related('lead').all()
        ]

    def create(self, validated_data):
        lead_ids = validated_data.pop('lead_ids', [])
        campaign = Campaign.objects.create(**validated_data)
        for lead_id in lead_ids:
            CampaignLead.objects.get_or_create(campaign=campaign, lead_id=lead_id)
        return campaign

    def update(self, instance, validated_data):
        lead_ids = validated_data.pop('lead_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lead_ids is not None:
            CampaignLead.objects.filter(campaign=instance).exclude(lead_id__in=lead_ids).delete()
            for lead_id in lead_ids:
                CampaignLead.objects.get_or_create(campaign=instance, lead_id=lead_id)
        return instance

class BroadcastSerializer(serializers.ModelSerializer):
    sent_by_name = serializers.CharField(source='sent_by.username', read_only=True, allow_null=True)
    recipients = serializers.SerializerMethodField()

    class Meta:
        model = Broadcast
        fields = ['id', 'subject', 'message', 'sent_by', 'sent_by_name', 'sent_at', 'recipient_count', 'recipients']
        read_only_fields = ['id', 'sent_at', 'recipients']

    def get_recipients(self, obj):
        return [
            {
                'lead_id': recipient.lead.lead_id,
                'name': recipient.lead.name,
                'sent_at': recipient.sent_at,
            }
            for recipient in obj.recipients.select_related('lead').all()
        ]

class BroadcastCreateSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=255)
    message = serializers.CharField()
    lead_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=True)

    def validate_lead_ids(self, value):
        unique_ids = list(dict.fromkeys(value))
        existing_ids = set(Lead.objects.filter(id__in=unique_ids).values_list('id', flat=True))
        missing_ids = sorted(set(unique_ids) - existing_ids)
        if missing_ids:
            raise serializers.ValidationError(f'Invalid lead IDs: {missing_ids}')
        return unique_ids

    def create(self, validated_data):
        from .models import Broadcast, BroadcastRecipient
        subject = validated_data['subject']
        message = validated_data['message']
        lead_ids = validated_data['lead_ids']
        
        # Create broadcast
        broadcast = Broadcast.objects.create(
            subject=subject,
            message=message,
            sent_by=self.context['request'].user,
            recipient_count=len(lead_ids)
        )

        if lead_ids:
            BroadcastRecipient.objects.bulk_create([
                BroadcastRecipient(broadcast=broadcast, lead_id=lead_id)
                for lead_id in lead_ids
            ])
        
        return broadcast


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)
    lead_name = serializers.CharField(source='lead.name', read_only=True, allow_null=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'assigned_to', 'assigned_to_name',
            'lead', 'lead_name', 'due_date', 'priority', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'assigned_to_name', 'lead_name']

class EngagementActivitySerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True, allow_null=True)

    class Meta:
        model = EngagementActivity
        fields = ['id', 'lead', 'lead_name', 'activity_type', 'description', 'performed_by', 'performed_by_name', 'performed_at']
        read_only_fields = ['id', 'performed_at']


class FollowUpSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)

    class Meta:
        model = FollowUp
        fields = ['id', 'lead', 'lead_name', 'next_followup_date', 'notes', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'lead_name']


class CustomerDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True, allow_null=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomerDocument
        fields = ['id', 'customer', 'title', 'file', 'file_url', 'uploaded_by', 'uploaded_by_name', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_by_name', 'uploaded_at', 'file_url']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not obj.file:
            return None
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


class CustomerSerializer(serializers.ModelSerializer):
    lead_id = serializers.CharField(source='lead.lead_id', read_only=True)
    name = serializers.CharField(source='lead.name', read_only=True)
    phone = serializers.CharField(source='lead.phone', read_only=True)
    city = serializers.CharField(source='lead.city', read_only=True)
    assigned_to_name = serializers.CharField(source='lead.assigned_to.username', read_only=True, allow_null=True)
    documents = CustomerDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'lead', 'lead_id', 'name', 'phone', 'city', 'assigned_to_name',
            'created_at', 'updated_at', 'documents'
        ]
        read_only_fields = ['id', 'lead_id', 'name', 'phone', 'city', 'assigned_to_name', 'created_at', 'updated_at', 'documents']


class SurveySerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    lead_id = serializers.CharField(source='lead.lead_id', read_only=True)
    engineer_name = serializers.CharField(source='engineer.username', read_only=True, allow_null=True)

    class Meta:
        model = Survey
        fields = [
            'id', 'lead', 'lead_name', 'lead_id', 'scheduled_date',
            'engineer', 'engineer_name', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'lead_name', 'lead_id', 'engineer_name', 'created_at', 'updated_at']


class InstallationSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    lead_id = serializers.CharField(source='lead.lead_id', read_only=True)
    engineer_name = serializers.CharField(source='engineer.username', read_only=True, allow_null=True)

    class Meta:
        model = Installation
        fields = [
            'id', 'lead', 'lead_name', 'lead_id', 'engineer', 'engineer_name',
            'status', 'notes', 'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'lead_name', 'lead_id', 'engineer_name', 'completed_at', 'created_at', 'updated_at']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact', 'phone', 'email', 'address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True, allow_null=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'price', 'supplier', 'supplier_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'supplier_name', 'created_at', 'updated_at']


class StockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    category = serializers.CharField(source='product.category', read_only=True)

    class Meta:
        model = Stock
        fields = ['id', 'product', 'product_name', 'category', 'quantity', 'updated_at']
        read_only_fields = ['id', 'product_name', 'category', 'updated_at']


class LoanSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    lead_id = serializers.CharField(source='lead.lead_id', read_only=True)

    def validate_amount(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('amount cannot be negative.')
        return value

    class Meta:
        model = Loan
        fields = ['id', 'lead', 'lead_name', 'lead_id', 'amount', 'status', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'lead_name', 'lead_id', 'created_at', 'updated_at']


class SubsidySerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    lead_id = serializers.CharField(source='lead.lead_id', read_only=True)

    class Meta:
        model = Subsidy
        fields = ['id', 'lead', 'lead_name', 'lead_id', 'application_number', 'status', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'lead_name', 'lead_id', 'created_at', 'updated_at']


class AutomationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomationRule
        fields = [
            'id', 'name', 'trigger_status', 'action_type',
            'task_title_template', 'task_description_template',
            'followup_days', 'followup_notes_template',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SalesProductSerializer(serializers.ModelSerializer):
    system_type_display = serializers.CharField(source='get_system_type_display', read_only=True)

    class Meta:
        model = SalesProduct
        fields = ['id', 'name', 'capacity', 'system_type', 'system_type_display', 'price', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        capacity = attrs.get('capacity', getattr(self.instance, 'capacity', None))
        system_type = attrs.get('system_type', getattr(self.instance, 'system_type', None))
        qs = SalesProduct.objects.filter(capacity=capacity, system_type=system_type)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                {'non_field_errors': f'A pricing entry for {capacity}kW {system_type} already exists.'}
            )
        return attrs


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True, allow_null=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'action', 'model_name', 'object_id',
            'field_name', 'old_value', 'new_value', 'timestamp'
        ]
        read_only_fields = fields