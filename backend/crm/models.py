from django.db import models, IntegrityError, transaction
from django.apps import apps
from django.contrib.auth.models import User

class Lead(models.Model):
    """
    Model representing a sales lead in the solar ERP system.
    Tracks customer information and sales pipeline status.
    """
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('site_visit', 'Site Visit'),
        ('proposal', 'Proposal'),
        ('won', 'Won'),
        ('lost', 'Lost'),
    ]

    lead_id = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        blank=False,
        null=False,
        help_text="Auto-generated unique lead identifier (e.g., SVK-0001)"
    )
    name = models.CharField(max_length=255, help_text="Full name of the lead")
    phone = models.CharField(max_length=20, help_text="Phone number")
    city = models.CharField(max_length=100, help_text="City of residence")
    electricity_units = models.PositiveIntegerField(help_text="Monthly electricity consumption in units")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', help_text="Current status in sales pipeline")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads', help_text="Sales user assigned to this lead")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @staticmethod
    def _next_lead_id():
        """Generate the next sequential lead ID."""
        last_lead_id = (
            Lead.objects.filter(lead_id__startswith='SVK-')
            .order_by('-id')
            .values_list('lead_id', flat=True)
            .first()
        )
        if not last_lead_id:
            return 'SVK-0001'

        try:
            last_num = int(last_lead_id.split('-')[1])
        except (IndexError, ValueError):
            last_num = 0
        return f"SVK-{last_num + 1:04d}"

    def save(self, *args, **kwargs):
        """Generate lead_id automatically with retry on unique collisions."""
        if self.pk or self.lead_id:
            super().save(*args, **kwargs)
        else:
            for _ in range(5):
                self.lead_id = self._next_lead_id()
                try:
                    with transaction.atomic():
                        super().save(*args, **kwargs)
                    break
                except IntegrityError:
                    # Another transaction may have taken the same generated ID.
                    self.lead_id = ''
            else:
                raise IntegrityError('Unable to generate a unique lead_id after multiple retries.')

        # Ensure a customer record exists once a lead is converted to won.
        if self.status == 'won':
            Customer = apps.get_model('crm', 'Customer')
            Customer.objects.get_or_create(lead=self)

    def __str__(self):
        return f"{self.lead_id} - {self.name} ({self.city})"

class Note(models.Model):
    """
    Model for tracking notes and activities on leads.
    """
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='notes', help_text="The lead this note belongs to")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, help_text="User who created the note")
    text = models.TextField(help_text="Content of the note")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Note on {self.lead.name} by {self.user.username if self.user else 'Unknown'}"

class Campaign(models.Model):
    """
    Model representing a marketing campaign.
    """
    name = models.CharField(max_length=255, help_text="Campaign name")
    source = models.CharField(max_length=100, help_text="Campaign source (e.g., Facebook, Google, Email)")
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Campaign budget")
    start_date = models.DateField(help_text="Campaign start date")
    end_date = models.DateField(help_text="Campaign end date")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, help_text="User who created the campaign")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class CampaignLead(models.Model):
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='campaign_leads')
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='campaign_memberships')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('campaign', 'lead')

    def __str__(self):
        return f"{self.campaign.name} -> {self.lead.name}"

class Broadcast(models.Model):
    """
    Model representing a broadcast message sent to multiple leads.
    """
    subject = models.CharField(max_length=255, help_text="Broadcast subject")
    message = models.TextField(help_text="Broadcast message content")
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, help_text="User who sent the broadcast")
    sent_at = models.DateTimeField(auto_now_add=True)
    recipient_count = models.PositiveIntegerField(default=0, help_text="Number of recipients")

    def __str__(self):
        return f"Broadcast: {self.subject}"

class BroadcastRecipient(models.Model):
    """
    Model linking broadcasts to leads who received them.
    """
    broadcast = models.ForeignKey(Broadcast, on_delete=models.CASCADE, related_name='recipients')
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='broadcasts_received')
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('broadcast', 'lead')

    def __str__(self):
        return f"{self.broadcast.subject} -> {self.lead.name}"

class EngagementActivity(models.Model):
    """
    Model tracking engagement activities with leads.
    """
    ACTIVITY_TYPES = [
        ('call', 'Call'),
        ('message', 'Message'),
        ('email', 'Email'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='engagement_activities', help_text="The lead this activity is for")
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES, help_text="Type of engagement activity")
    description = models.TextField(blank=True, help_text="Description of the activity")
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, help_text="User who performed the activity")
    performed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.activity_type} - {self.lead.name}"

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ]
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='tasks')
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    due_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_priority_display()})"


class FollowUp(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('done', 'Done'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='followups')
    next_followup_date = models.DateTimeField()
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"FollowUp for {self.lead.name} on {self.next_followup_date} ({self.status})"


class Customer(models.Model):
    lead = models.OneToOneField(Lead, on_delete=models.CASCADE, related_name='customer')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Customer: {self.lead.name} ({self.lead.lead_id})"


class CustomerDocument(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255, blank=True)
    file = models.FileField(upload_to='customer_documents/%Y/%m/%d/')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or self.file.name


class Survey(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='surveys')
    scheduled_date = models.DateField()
    engineer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='surveys')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Survey for {self.lead.name} on {self.scheduled_date}"


class Installation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='installations')
    engineer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='installations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Installation for {self.lead.name} ({self.status})"


class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Stock(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='stock')
    quantity = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product.name}: {self.quantity}"


class Loan(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('disbursed', 'Disbursed'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='loans')
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Loan for {self.lead.name} ({self.status})"


class Subsidy(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='subsidies')
    application_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Subsidy for {self.lead.name} ({self.status})"


class AutomationRule(models.Model):
    TRIGGER_STATUS_CHOICES = Lead.STATUS_CHOICES
    ACTION_CHOICES = [
        ('create_task', 'Create Task'),
        ('create_followup', 'Create Follow-up'),
    ]

    name = models.CharField(max_length=255)
    trigger_status = models.CharField(max_length=20, choices=TRIGGER_STATUS_CHOICES)
    action_type = models.CharField(max_length=30, choices=ACTION_CHOICES)
    task_title_template = models.CharField(max_length=255, blank=True)
    task_description_template = models.TextField(blank=True)
    followup_days = models.PositiveIntegerField(default=1)
    followup_notes_template = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rule: {self.name} ({self.trigger_status} -> {self.action_type})"


class SalesProduct(models.Model):
    """
    Pricing catalogue for solar system configurations sold to customers.
    Each unique (capacity, system_type) combination has a single price.
    """
    SYSTEM_TYPE_CHOICES = [
        ('on_grid', 'On-Grid'),
        ('off_grid', 'Off-Grid'),
        ('hybrid', 'Hybrid'),
    ]

    name = models.CharField(max_length=255, help_text="Product display name (e.g. '5kW On-grid')")
    capacity = models.PositiveIntegerField(help_text="System capacity in kW (e.g. 3, 5, 10)")
    system_type = models.CharField(max_length=20, choices=SYSTEM_TYPE_CHOICES, help_text="Grid connection type")
    price = models.DecimalField(max_digits=12, decimal_places=2, help_text="Selling price")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('capacity', 'system_type')
        ordering = ['capacity', 'system_type']

    def __str__(self):
        return f"{self.name} ({self.capacity}kW {self.get_system_type_display()})"


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=64)
    field_name = models.CharField(max_length=100, null=True, blank=True)
    old_value = models.TextField(blank=True, default='')
    new_value = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp} | {self.model_name}({self.object_id}) {self.action}"
