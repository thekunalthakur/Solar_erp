from django.db import models
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

    name = models.CharField(max_length=255, help_text="Full name of the lead")
    phone = models.CharField(max_length=20, help_text="Phone number")
    city = models.CharField(max_length=100, help_text="City of residence")
    electricity_units = models.PositiveIntegerField(help_text="Monthly electricity consumption in units")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', help_text="Current status in sales pipeline")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads', help_text="Sales user assigned to this lead")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.city}"

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
