from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.db.models import Count, Q, F
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django.contrib.auth.models import User
from django.utils.dateparse import parse_date
from .models import Lead, Note, Campaign, Broadcast, BroadcastRecipient, EngagementActivity, Task, FollowUp, Customer, CustomerDocument, Survey, Installation, Supplier, Product, Stock, Loan, Subsidy, AutomationRule, SalesProduct, AuditLog
from .serializers import (
    LeadSerializer,
    NoteSerializer,
    CampaignSerializer,
    BroadcastSerializer,
    BroadcastCreateSerializer,
    EngagementActivitySerializer,
    TaskSerializer,
    FollowUpSerializer,
    CustomerSerializer,
    CustomerDocumentSerializer,
    SurveySerializer,
    InstallationSerializer,
    SupplierSerializer,
    ProductSerializer,
    StockSerializer,
    LoanSerializer,
    SubsidySerializer,
    AutomationRuleSerializer,
    UserListSerializer,
    SalesProductSerializer,
    AuditLogSerializer,
)


def is_admin_user(user):
    return bool(user and (user.is_staff or user.is_superuser))


def _to_audit_text(value):
    if value is None:
        return ''
    if isinstance(value, User):
        return value.username
    return str(value)


def _create_audit_log(*, user, action, model_name, object_id, field_name=None, old_value='', new_value=''):
    AuditLog.objects.create(
        user=user if (user and user.is_authenticated) else None,
        action=action,
        model_name=model_name,
        object_id=str(object_id),
        field_name=field_name,
        old_value=_to_audit_text(old_value),
        new_value=_to_audit_text(new_value),
    )


def _log_create_event(user, instance, summary=''):
    _create_audit_log(
        user=user,
        action='create',
        model_name=instance.__class__.__name__,
        object_id=instance.pk,
        new_value=summary,
    )


def _log_delete_event(user, instance, summary=''):
    _create_audit_log(
        user=user,
        action='delete',
        model_name=instance.__class__.__name__,
        object_id=instance.pk,
        old_value=summary,
    )


def _log_field_updates(user, *, model_name, object_id, old_instance, new_instance, tracked_fields):
    for field in tracked_fields:
        old_val = _to_audit_text(getattr(old_instance, field, ''))
        new_val = _to_audit_text(getattr(new_instance, field, ''))
        if old_val != new_val:
            _create_audit_log(
                user=user,
                action='update',
                model_name=model_name,
                object_id=object_id,
                field_name=field,
                old_value=old_val,
                new_value=new_val,
            )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['user', 'model_name', 'action']
    ordering_fields = ['timestamp', 'model_name', 'action']
    ordering = ['-timestamp']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not is_admin_user(user):
            queryset = queryset.filter(user=user)

        model_name = self.request.query_params.get('model') or self.request.query_params.get('model_name')
        if model_name:
            queryset = queryset.filter(model_name__iexact=model_name)

        object_id = self.request.query_params.get('object_id')
        if object_id:
            queryset = queryset.filter(object_id=str(object_id))

        date = parse_date(self.request.query_params.get('date', ''))
        if date:
            queryset = queryset.filter(timestamp__date=date)

        start_date = parse_date(self.request.query_params.get('start_date', ''))
        if start_date:
            queryset = queryset.filter(timestamp__date__gte=start_date)

        end_date = parse_date(self.request.query_params.get('end_date', ''))
        if end_date:
            queryset = queryset.filter(timestamp__date__lte=end_date)

        lead_id = self.request.query_params.get('lead')
        if lead_id:
            task_ids = Task.objects.filter(lead_id=lead_id).values_list('id', flat=True)
            followup_ids = FollowUp.objects.filter(lead_id=lead_id).values_list('id', flat=True)
            queryset = queryset.filter(
                Q(model_name='Lead', object_id=str(lead_id)) |
                Q(model_name='Task', object_id__in=[str(task_id) for task_id in task_ids]) |
                Q(model_name='FollowUp', object_id__in=[str(followup_id) for followup_id in followup_ids])
            )

        return queryset


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only user list endpoint for assignment/task dropdowns."""

    queryset = User.objects.all().order_by('username')
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]

class LeadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing leads.
    Provides CRUD operations with filtering by status, city, assigned_to.
    - Only superuser/admin can assign leads
    - All authenticated users can view and update status
    """
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'city', 'assigned_to']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Lead.objects.all()
        if is_admin_user(self.request.user):
            return queryset
        return queryset.filter(assigned_to=self.request.user)

    @staticmethod
    def _safe_format_template(template, context):
        class SafeDict(dict):
            def __missing__(self, key):
                return '{' + key + '}'

        if not template:
            return ''
        try:
            return template.format_map(SafeDict(context))
        except Exception:
            return template

    def perform_update(self, serializer):
        """
        Override perform_update to restrict assigned_to updates to superusers.
        Regular users can update status and other fields.
        """
        # Check if user is trying to change assigned_to
        if 'assigned_to' in self.request.data:
            if not is_admin_user(self.request.user):
                # If not admin, prevent assigning to someone
                if self.request.data.get('assigned_to') is not None:
                    raise PermissionDenied('Only admins can assign leads.')
        
        old_lead = self.get_object()
        tracked_fields = ['status', 'assigned_to']
        old_snapshot = type('Snapshot', (), {field: getattr(old_lead, field, None) for field in tracked_fields})()
        lead = serializer.save()

        _log_field_updates(
            self.request.user,
            model_name='Lead',
            object_id=lead.pk,
            old_instance=old_snapshot,
            new_instance=lead,
            tracked_fields=tracked_fields,
        )

        if old_lead.status != lead.status:
            self._run_automation_rules(lead, actor=self.request.user)

    def perform_create(self, serializer):
        lead = serializer.save()
        _log_create_event(self.request.user, lead, summary=f"Lead created: {lead.name}")

    def destroy(self, request, *args, **kwargs):
        lead = self.get_object()
        _log_delete_event(request.user, lead, summary=f"Lead deleted: {lead.name}")
        return super().destroy(request, *args, **kwargs)

    def _run_automation_rules(self, lead, actor=None):
        rules = AutomationRule.objects.filter(is_active=True, trigger_status=lead.status)
        template_context = {
            'lead_name': lead.name,
            'lead_id': lead.lead_id,
            'city': lead.city,
        }
        for rule in rules:
            if rule.action_type == 'create_task':
                task = Task.objects.create(
                    title=rule.task_title_template or f"Follow up: {lead.name}",
                    description=self._safe_format_template(rule.task_description_template, template_context),
                    assigned_to=lead.assigned_to,
                    lead=lead,
                    status='pending',
                )
                _log_create_event(actor, task, summary=f"Task created by automation for lead {lead.lead_id}")
            elif rule.action_type == 'create_followup':
                followup = FollowUp.objects.create(
                    lead=lead,
                    next_followup_date=timezone.localdate() + timedelta(days=rule.followup_days),
                    notes=self._safe_format_template(rule.followup_notes_template, template_context),
                    status='pending',
                )
                _log_create_event(actor, followup, summary=f"Follow-up created by automation for lead {lead.lead_id}")

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def assign(self, request, pk=None):
        """
        Custom action to assign a lead to a user.
        Only accessible by superuser/admin.
        """
        lead = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
            lead.assigned_to = user
            lead.save()
            return Response(
                self.get_serializer(lead).data,
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """
        Custom action to add a note to a lead.
        """
        lead = self.get_object()
        text = request.data.get('text')
        
        if not text:
            return Response(
                {'error': 'text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        note = Note.objects.create(
            lead=lead,
            user=request.user,
            text=text
        )
        
        return Response(
            NoteSerializer(note).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'])
    def conversions(self, request):
        """
        List conversion leads where status is won or lost.
        Optional query param: status=won|lost
        """
        queryset = self.filter_queryset(
            self.get_queryset().filter(status__in=['won', 'lost'])
        )

        selected_status = request.query_params.get('status')
        if selected_status in ['won', 'lost']:
            queryset = queryset.filter(status=selected_status)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class NoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notes on leads.
    Provides CRUD operations with filtering by lead and user.
    """
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['lead', 'user']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        """Set the current user as the note creator"""
        serializer.save(user=self.request.user)

class CampaignViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing marketing campaigns.
    """
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['source', 'created_by']
    ordering_fields = ['created_at', 'start_date', 'end_date']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        """Set the current user as the campaign creator"""
        serializer.save(created_by=self.request.user)

class BroadcastViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing broadcast messages.
    """
    queryset = Broadcast.objects.all()
    serializer_class = BroadcastSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['sent_by']
    ordering_fields = ['sent_at']
    ordering = ['-sent_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return BroadcastCreateSerializer
        return BroadcastSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        broadcast = serializer.save()
        response_serializer = BroadcastSerializer(broadcast, context={'request': request})
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        """Set the current user as the broadcast sender"""
        serializer.save(sent_by=self.request.user)

class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tasks.
    CRUD and filter by user, status, due_date.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['assigned_to', 'status', 'due_date', 'priority', 'lead']
    ordering_fields = ['due_date', 'priority', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Task.objects.all()
        if is_admin_user(self.request.user):
            return queryset
        return queryset.filter(assigned_to=self.request.user)

    def _validate_non_admin_lead_access(self, lead):
        if lead is not None and lead.assigned_to_id != self.request.user.id:
            raise PermissionDenied('You can only link tasks to your assigned leads.')

    def perform_create(self, serializer):
        task = None
        if is_admin_user(self.request.user):
            task = serializer.save()
        else:
            lead = serializer.validated_data.get('lead')
            self._validate_non_admin_lead_access(lead)
            task = serializer.save(assigned_to=self.request.user)

        _log_create_event(self.request.user, task, summary=f"Task created: {task.title}")

    def perform_update(self, serializer):
        existing = serializer.instance
        tracked_fields = ['status', 'assigned_to', 'due_date']
        old_snapshot = type('Snapshot', (), {field: getattr(existing, field, None) for field in tracked_fields})()

        if is_admin_user(self.request.user):
            task = serializer.save()
        else:
            if 'assigned_to' in serializer.validated_data and serializer.validated_data.get('assigned_to') != self.request.user:
                raise PermissionDenied('You cannot assign tasks to other users.')

            lead = serializer.validated_data.get('lead', existing.lead)
            self._validate_non_admin_lead_access(lead)
            task = serializer.save(assigned_to=self.request.user)

        _log_field_updates(
            self.request.user,
            model_name='Task',
            object_id=task.pk,
            old_instance=old_snapshot,
            new_instance=task,
            tracked_fields=tracked_fields,
        )

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        _log_delete_event(request.user, task, summary=f"Task deleted: {task.title}")
        return super().destroy(request, *args, **kwargs)

class EngagementActivityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing engagement activities.
    """
    queryset = EngagementActivity.objects.all()
    serializer_class = EngagementActivitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['lead', 'activity_type', 'performed_by']
    ordering_fields = ['performed_at']
    ordering = ['-performed_at']

    def perform_create(self, serializer):
        """Set the current user as the activity performer"""
        serializer.save(performed_by=self.request.user)


class FollowUpViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing lead follow-ups.
    Supports CRUD and filtering by lead, status, and next_followup_date.
    """
    queryset = FollowUp.objects.select_related('lead').all()
    serializer_class = FollowUpSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['lead', 'status', 'next_followup_date']
    ordering_fields = ['next_followup_date', 'created_at', 'updated_at']
    ordering = ['next_followup_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        if not is_admin_user(self.request.user):
            queryset = queryset.filter(lead__assigned_to=self.request.user)

        date_filter = self.request.query_params.get('date_filter')
        now = timezone.now()

        if date_filter == 'overdue':
            queryset = queryset.filter(status='pending', next_followup_date__lt=now)
        elif date_filter == 'upcoming':
            queryset = queryset.filter(status='pending', next_followup_date__gte=now)

        return queryset

    def _validate_non_admin_lead_access(self, lead):
        if lead is not None and lead.assigned_to_id != self.request.user.id:
            raise PermissionDenied('You can only manage follow-ups for your assigned leads.')

    def perform_create(self, serializer):
        followup = None
        if is_admin_user(self.request.user):
            followup = serializer.save()
        else:
            lead = serializer.validated_data.get('lead')
            self._validate_non_admin_lead_access(lead)
            followup = serializer.save()

        _log_create_event(self.request.user, followup, summary=f"Follow-up added for lead {followup.lead.lead_id}")

    def perform_update(self, serializer):
        existing = serializer.instance
        tracked_fields = ['status', 'next_followup_date']
        old_snapshot = type('Snapshot', (), {field: getattr(existing, field, None) for field in tracked_fields})()

        if is_admin_user(self.request.user):
            followup = serializer.save()
        else:
            lead = serializer.validated_data.get('lead', existing.lead)
            self._validate_non_admin_lead_access(lead)
            followup = serializer.save()

        _log_field_updates(
            self.request.user,
            model_name='FollowUp',
            object_id=followup.pk,
            old_instance=old_snapshot,
            new_instance=followup,
            tracked_fields=tracked_fields,
        )

    def destroy(self, request, *args, **kwargs):
        followup = self.get_object()
        _log_delete_event(request.user, followup, summary=f"Follow-up deleted for lead {followup.lead.lead_id}")
        return super().destroy(request, *args, **kwargs)


class CustomerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for converted customers (leads with won status).
    """
    queryset = Customer.objects.select_related('lead', 'lead__assigned_to').prefetch_related('documents').all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['lead__assigned_to', 'lead__city']
    ordering_fields = ['created_at', 'updated_at', 'lead__name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = self.queryset.filter(lead__status='won')
        if is_admin_user(self.request.user):
            return queryset
        return queryset.filter(lead__assigned_to=self.request.user)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_document(self, request, pk=None):
        customer = self.get_object()
        serializer = CustomerDocumentSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(customer=customer, uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CustomerDocumentViewSet(viewsets.ModelViewSet):
    queryset = CustomerDocument.objects.select_related('customer', 'uploaded_by').all()
    serializer_class = CustomerDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['customer']
    ordering_fields = ['uploaded_at']
    ordering = ['-uploaded_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        if is_admin_user(self.request.user):
            return queryset
        return queryset.filter(customer__lead__assigned_to=self.request.user)

    def _validate_non_admin_customer_access(self, customer):
        if customer is not None and customer.lead.assigned_to_id != self.request.user.id:
            raise PermissionDenied('You can only upload documents for your assigned customers.')

    def perform_create(self, serializer):
        if not is_admin_user(self.request.user):
            customer = serializer.validated_data.get('customer')
            self._validate_non_admin_customer_access(customer)
        serializer.save(uploaded_by=self.request.user)


class SurveyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for scheduling and assigning surveys.
    """
    queryset = Survey.objects.select_related('lead', 'engineer').all()
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['lead', 'engineer', 'scheduled_date']
    ordering_fields = ['scheduled_date', 'created_at']
    ordering = ['scheduled_date']


class InstallationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for tracking installations and completion status.
    """
    queryset = Installation.objects.select_related('lead', 'engineer').all()
    serializer_class = InstallationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['lead', 'engineer', 'status']
    ordering_fields = ['created_at', 'updated_at', 'completed_at']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        installation = self.get_object()
        if installation.status != 'completed':
            installation.status = 'completed'
            installation.completed_at = timezone.now()
            installation.save(update_fields=['status', 'completed_at', 'updated_at'])
        serializer = self.get_serializer(installation)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('supplier').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['category', 'supplier']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['name']

    def perform_create(self, serializer):
        product = serializer.save()
        Stock.objects.get_or_create(product=product)
        _log_create_event(self.request.user, product, summary=f"Product created: {product.name}")

    def perform_update(self, serializer):
        existing = serializer.instance
        old_snapshot = type('Snapshot', (), {'price': getattr(existing, 'price', None)})()
        product = serializer.save()
        _log_field_updates(
            self.request.user,
            model_name='Product',
            object_id=product.pk,
            old_instance=old_snapshot,
            new_instance=product,
            tracked_fields=['price'],
        )

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        _log_delete_event(request.user, product, summary=f"Product deleted: {product.name}")
        return super().destroy(request, *args, **kwargs)


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.select_related('product').all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['product', 'product__category']
    ordering_fields = ['quantity', 'updated_at']
    ordering = ['-updated_at']

    @action(detail=True, methods=['post'])
    def increase(self, request, pk=None):
        stock = self.get_object()
        try:
            amount = int(request.data.get('amount', 1))
        except (TypeError, ValueError):
            return Response({'error': 'amount must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({'error': 'amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            stock.quantity += amount
            stock.save(update_fields=['quantity', 'updated_at'])

        return Response(self.get_serializer(stock).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def decrease(self, request, pk=None):
        stock = self.get_object()
        try:
            amount = int(request.data.get('amount', 1))
        except (TypeError, ValueError):
            return Response({'error': 'amount must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({'error': 'amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)

        if stock.quantity < amount:
            return Response({'error': 'insufficient stock quantity'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            stock.quantity -= amount
            stock.save(update_fields=['quantity', 'updated_at'])

        return Response(self.get_serializer(stock).data, status=status.HTTP_200_OK)


class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.select_related('lead').all()
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['lead', 'status']
    ordering_fields = ['created_at', 'updated_at', 'amount']
    ordering = ['-created_at']


class SubsidyViewSet(viewsets.ModelViewSet):
    queryset = Subsidy.objects.select_related('lead').all()
    serializer_class = SubsidySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['lead', 'status']
    ordering_fields = ['created_at', 'updated_at', 'application_number']
    ordering = ['-created_at']


class AutomationRuleViewSet(viewsets.ModelViewSet):
    queryset = AutomationRule.objects.all()
    serializer_class = AutomationRuleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['trigger_status', 'action_type', 'is_active']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']


class SalesProductViewSet(viewsets.ModelViewSet):
    """
    CRUD for the solar system pricing catalogue.
    Filterable by capacity and system_type to support instant proposal pricing lookups.
    """
    queryset = SalesProduct.objects.all()
    serializer_class = SalesProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['capacity', 'system_type']
    ordering_fields = ['capacity', 'system_type', 'price']
    ordering = ['capacity', 'system_type']

    def perform_create(self, serializer):
        sales_product = serializer.save()
        _log_create_event(self.request.user, sales_product, summary=f"Sales product created: {sales_product.name}")

    def perform_update(self, serializer):
        existing = serializer.instance
        old_snapshot = type('Snapshot', (), {'price': getattr(existing, 'price', None)})()
        sales_product = serializer.save()
        _log_field_updates(
            self.request.user,
            model_name='SalesProduct',
            object_id=sales_product.pk,
            old_instance=old_snapshot,
            new_instance=sales_product,
            tracked_fields=['price'],
        )

    def destroy(self, request, *args, **kwargs):
        sales_product = self.get_object()
        _log_delete_event(request.user, sales_product, summary=f"Sales product deleted: {sales_product.name}")
        return super().destroy(request, *args, **kwargs)


def _apply_date_filter(queryset, start_date, end_date, field_name='created_at'):
    if start_date:
        queryset = queryset.filter(**{f'{field_name}__date__gte': start_date})
    if end_date:
        queryset = queryset.filter(**{f'{field_name}__date__lte': end_date})
    return queryset


def _parsed_report_filters(request):
    start_date = parse_date(request.query_params.get('start_date', ''))
    end_date = parse_date(request.query_params.get('end_date', ''))
    user_id = request.query_params.get('user')
    return start_date, end_date, user_id


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reports_sales(request):
    start_date, end_date, user_id = _parsed_report_filters(request)
    leads_qs = Lead.objects.all()
    leads_qs = _apply_date_filter(leads_qs, start_date, end_date)
    if user_id:
        leads_qs = leads_qs.filter(assigned_to_id=user_id)

    total_leads = leads_qs.count()
    won_leads = leads_qs.filter(status='won').count()
    lost_leads = leads_qs.filter(status='lost').count()
    conversion_rate = round((won_leads / total_leads) * 100, 2) if total_leads else 0

    return Response(
        {
            'total_leads': total_leads,
            'won_leads': won_leads,
            'lost_leads': lost_leads,
            'conversion_rate': conversion_rate,
        }
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reports_leads(request):
    start_date, end_date, user_id = _parsed_report_filters(request)
    leads_qs = Lead.objects.all()
    leads_qs = _apply_date_filter(leads_qs, start_date, end_date)
    if user_id:
        leads_qs = leads_qs.filter(assigned_to_id=user_id)

    leads_by_status = {
        row['status']: row['count']
        for row in leads_qs.values('status').annotate(count=Count('id')).order_by('status')
    }
    leads_by_city = {
        row['city']: row['count']
        for row in leads_qs.values('city').annotate(count=Count('id')).order_by('-count', 'city')
    }

    return Response({'leads_by_status': leads_by_status, 'leads_by_city': leads_by_city})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reports_tasks(request):
    start_date, end_date, user_id = _parsed_report_filters(request)
    tasks_qs = Task.objects.all()
    tasks_qs = _apply_date_filter(tasks_qs, start_date, end_date)
    if user_id:
        tasks_qs = tasks_qs.filter(assigned_to_id=user_id)

    today = timezone.localdate()
    total_tasks = tasks_qs.count()
    completed_tasks = tasks_qs.filter(status='done').count()
    pending_tasks = tasks_qs.filter(status__in=['pending', 'in_progress']).count()
    overdue_tasks = tasks_qs.filter(status__in=['pending', 'in_progress'], due_date__lt=today).count()

    return Response(
        {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'overdue_tasks': overdue_tasks,
        }
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reports_inventory(request):
    start_date, end_date, _user_id = _parsed_report_filters(request)

    products_qs = Product.objects.all()
    products_qs = _apply_date_filter(products_qs, start_date, end_date)
    total_products = products_qs.count()

    low_stock_items = Stock.objects.select_related('product').filter(quantity__lte=5)
    if start_date or end_date:
        low_stock_items = _apply_date_filter(low_stock_items, start_date, end_date, field_name='product__created_at')

    low_stock_list = [
        {
            'product_id': item.product_id,
            'product_name': item.product.name,
            'quantity': item.quantity,
        }
        for item in low_stock_items.order_by('quantity', 'product__name')[:50]
    ]

    return Response({'total_products': total_products, 'low_stock_items': low_stock_list})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reports_finance(request):
    start_date, end_date, user_id = _parsed_report_filters(request)

    loans_qs = Loan.objects.all()
    loans_qs = _apply_date_filter(loans_qs, start_date, end_date)
    if user_id:
        loans_qs = loans_qs.filter(lead__assigned_to_id=user_id)

    subsidy_qs = Subsidy.objects.all()
    subsidy_qs = _apply_date_filter(subsidy_qs, start_date, end_date)
    if user_id:
        subsidy_qs = subsidy_qs.filter(lead__assigned_to_id=user_id)

    return Response(
        {
            'loans_pending': loans_qs.filter(status='pending').count(),
            'loans_approved': loans_qs.filter(status='approved').count(),
            'subsidy_applied': subsidy_qs.filter(status='submitted').count(),
            'subsidy_received': subsidy_qs.filter(status='approved').count(),
        }
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_overview(request):
    today = timezone.localdate()
    now = timezone.now()
    low_stock_threshold = 5

    lead_summary = Lead.objects.aggregate(
        total_leads=Count('id'),
        new_leads_today=Count('id', filter=Q(created_at__date=today)),
        won_conversions=Count('id', filter=Q(status='won')),
        lost_conversions=Count('id', filter=Q(status='lost')),
    )
    task_summary = Task.objects.aggregate(
        pending_tasks=Count('id', filter=Q(status__in=['pending', 'in_progress'])),
        overdue_tasks=Count('id', filter=Q(status__in=['pending', 'in_progress'], due_date__lt=today)),
    )
    followup_summary = FollowUp.objects.aggregate(
        pending_followups=Count('id', filter=Q(status='pending')),
        upcoming_followups=Count('id', filter=Q(status='pending', next_followup_date__gte=now)),
    )
    operations_summary = Installation.objects.aggregate(
        installations_pending=Count('id', filter=Q(status='pending')),
        installations_in_progress=Count('id', filter=Q(status='in_progress')),
        completed_installations=Count('id', filter=Q(status='completed')),
    )

    leads_by_status_rows = Lead.objects.values('status').annotate(count=Count('id'))
    leads_by_status = {row['status']: row['count'] for row in leads_by_status_rows}

    todays_tasks = list(
        Task.objects.select_related('lead')
        .filter(due_date=today)
        .order_by('priority', '-created_at')[:8]
        .values('id', 'title', 'status', 'priority', 'due_date', 'lead__name')
    )
    overdue_tasks = list(
        Task.objects.select_related('lead')
        .filter(status__in=['pending', 'in_progress'], due_date__lt=today)
        .order_by('due_date')[:8]
        .values('id', 'title', 'status', 'priority', 'due_date', 'lead__name')
    )
    upcoming_followups = list(
        FollowUp.objects.select_related('lead')
        .filter(status='pending', next_followup_date__gte=now)
        .order_by('next_followup_date')[:8]
        .values('id', 'lead__name', 'next_followup_date', 'status', 'notes')
    )

    surveys_scheduled = Survey.objects.filter(scheduled_date__gte=today).count()

    low_stock_items = list(
        Stock.objects.select_related('product')
        .filter(quantity__lte=low_stock_threshold)
        .order_by('quantity', '-updated_at')[:8]
        .values('id', 'quantity', 'updated_at', 'product__name', 'product__category')
    )
    recently_updated_stock = list(
        Stock.objects.select_related('product')
        .order_by('-updated_at')[:8]
        .values('id', 'quantity', 'updated_at', 'product__name', 'product__category')
    )

    finance_summary = {
        'loans': {
            'pending': Loan.objects.filter(status='pending').count(),
            'approved': Loan.objects.filter(status='approved').count(),
        },
        'subsidies': {
            'applied': Subsidy.objects.filter(status='submitted').count(),
            'received': Subsidy.objects.filter(status='approved').count(),
        },
    }

    recent_leads = [
        {
            'type': 'lead_added',
            'timestamp': lead['created_at'],
            'message': f"Lead added: {lead['name']} ({lead['city']})",
            'ref_id': lead['id'],
            'path': f"/leads/{lead['id']}",
        }
        for lead in Lead.objects.order_by('-created_at').values('id', 'name', 'city', 'created_at')[:5]
    ]
    recent_tasks = [
        {
            'type': 'task_created',
            'timestamp': task['created_at'],
            'message': f"Task created: {task['title']}",
            'ref_id': task['id'],
            'path': '/tasks',
        }
        for task in Task.objects.order_by('-created_at').values('id', 'title', 'created_at')[:5]
    ]
    recent_status_changes = [
        {
            'type': 'status_changed',
            'timestamp': lead['updated_at'],
            'message': f"Lead status updated: {lead['name']} -> {lead['status']}",
            'ref_id': lead['id'],
            'path': f"/leads/{lead['id']}",
        }
        for lead in Lead.objects.filter(updated_at__gt=timezone.now() - timedelta(days=7))
        .exclude(updated_at=F('created_at'))
        .order_by('-updated_at')
        .values('id', 'name', 'status', 'updated_at')[:5]
    ]

    recent_activity = sorted(
        recent_leads + recent_tasks + recent_status_changes,
        key=lambda item: item['timestamp'],
        reverse=True,
    )[:10]

    data = {
        'summary': {
            'total_leads': lead_summary['total_leads'],
            'new_leads_today': lead_summary['new_leads_today'],
            'won_conversions': lead_summary['won_conversions'],
            'pending_followups': followup_summary['pending_followups'],
            'pending_tasks': task_summary['pending_tasks'],
            'installations_in_progress': operations_summary['installations_in_progress'],
        },
        'sales_overview': {
            'leads_by_status': leads_by_status,
            'conversion': {
                'won': lead_summary['won_conversions'],
                'lost': lead_summary['lost_conversions'],
            },
        },
        'tasks_followups': {
            'todays_tasks': todays_tasks,
            'overdue_tasks': overdue_tasks,
            'upcoming_followups': upcoming_followups,
        },
        'operations': {
            'surveys_scheduled': surveys_scheduled,
            'installations_pending': operations_summary['installations_pending'],
            'installations_in_progress': operations_summary['installations_in_progress'],
            'completed_installations': operations_summary['completed_installations'],
        },
        'inventory_alerts': {
            'low_stock_items': low_stock_items,
            'recently_updated_stock': recently_updated_stock,
        },
        'finance_snapshot': finance_summary,
        'recent_activity': recent_activity,
    }

    return Response(data, status=status.HTTP_200_OK)
