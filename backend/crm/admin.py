from django.contrib import admin
from .models import (
	Lead,
	Note,
	Campaign,
	CampaignLead,
	Broadcast,
	BroadcastRecipient,
	EngagementActivity,
	Task,
	FollowUp,
	Customer,
	CustomerDocument,
	Survey,
	Installation,
	Supplier,
	Product,
	Stock,
	Loan,
	Subsidy,
	AutomationRule,
	AuditLog,
)


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
	list_display = ('lead_id', 'name', 'city', 'status', 'assigned_to', 'created_at')
	list_filter = ('status', 'city', 'assigned_to')
	search_fields = ('lead_id', 'name', 'phone', 'city')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
	list_display = ('title', 'assigned_to', 'status', 'priority', 'due_date', 'created_at')
	list_filter = ('status', 'priority', 'assigned_to')
	search_fields = ('title', 'description')


@admin.register(FollowUp)
class FollowUpAdmin(admin.ModelAdmin):
	list_display = ('lead', 'next_followup_date', 'status', 'created_at')
	list_filter = ('status', 'next_followup_date')


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
	list_display = ('name', 'source', 'start_date', 'end_date', 'created_by')
	list_filter = ('source', 'start_date', 'end_date')
	search_fields = ('name', 'source')


@admin.register(Broadcast)
class BroadcastAdmin(admin.ModelAdmin):
	list_display = ('subject', 'sent_by', 'recipient_count', 'sent_at')
	list_filter = ('sent_by', 'sent_at')
	search_fields = ('subject', 'message')


@admin.register(EngagementActivity)
class EngagementActivityAdmin(admin.ModelAdmin):
	list_display = ('lead', 'activity_type', 'performed_by', 'performed_at')
	list_filter = ('activity_type', 'performed_by', 'performed_at')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
	list_display = ('lead', 'created_at')
	search_fields = ('lead__lead_id', 'lead__name', 'lead__phone')


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
	list_display = ('lead', 'scheduled_date', 'engineer')
	list_filter = ('scheduled_date', 'engineer')


@admin.register(Installation)
class InstallationAdmin(admin.ModelAdmin):
	list_display = ('lead', 'engineer', 'status', 'completed_at')
	list_filter = ('status', 'engineer')


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
	list_display = ('name', 'contact', 'phone', 'email', 'created_at')
	search_fields = ('name', 'contact', 'phone', 'email')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
	list_display = ('name', 'category', 'price', 'supplier')
	list_filter = ('category', 'supplier')
	search_fields = ('name',)


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
	list_display = ('product', 'quantity', 'updated_at')
	list_filter = ('product__category',)


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
	list_display = ('lead', 'amount', 'status', 'created_at')
	list_filter = ('status',)


@admin.register(Subsidy)
class SubsidyAdmin(admin.ModelAdmin):
	list_display = ('lead', 'application_number', 'status', 'created_at')
	list_filter = ('status',)


@admin.register(AutomationRule)
class AutomationRuleAdmin(admin.ModelAdmin):
	list_display = ('name', 'trigger_status', 'action_type', 'is_active', 'created_at')
	list_filter = ('trigger_status', 'action_type', 'is_active')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
	list_display = ('timestamp', 'user', 'action', 'model_name', 'object_id', 'field_name')
	list_filter = ('action', 'model_name', 'timestamp', 'user')
	search_fields = ('model_name', 'object_id', 'field_name', 'old_value', 'new_value', 'user__username')


admin.site.register(Note)
admin.site.register(CampaignLead)
admin.site.register(BroadcastRecipient)
admin.site.register(CustomerDocument)
