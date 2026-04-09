from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, NoteViewSet, CampaignViewSet, BroadcastViewSet, EngagementActivityViewSet, TaskViewSet, UserViewSet, FollowUpViewSet, CustomerViewSet, CustomerDocumentViewSet, SurveyViewSet, InstallationViewSet, SupplierViewSet, ProductViewSet, StockViewSet, LoanViewSet, SubsidyViewSet, AutomationRuleViewSet, SalesProductViewSet, AuditLogViewSet, dashboard_overview, reports_sales, reports_leads, reports_tasks, reports_inventory, reports_finance

router = DefaultRouter()
router.register(r'leads', LeadViewSet)
router.register(r'notes', NoteViewSet)
router.register(r'campaigns', CampaignViewSet)
router.register(r'broadcasts', BroadcastViewSet)
router.register(r'engagement-activities', EngagementActivityViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'users', UserViewSet, basename='user')
router.register(r'followups', FollowUpViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'customer-documents', CustomerDocumentViewSet)
router.register(r'surveys', SurveyViewSet)
router.register(r'installations', InstallationViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'products', ProductViewSet)
router.register(r'stocks', StockViewSet)
router.register(r'loans', LoanViewSet)
router.register(r'subsidies', SubsidyViewSet)
router.register(r'automation-rules', AutomationRuleViewSet)
router.register(r'sales-products', SalesProductViewSet)
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('dashboard/', dashboard_overview, name='dashboard_overview'),
    path('reports/sales/', reports_sales, name='reports_sales'),
    path('reports/leads/', reports_leads, name='reports_leads'),
    path('reports/tasks/', reports_tasks, name='reports_tasks'),
    path('reports/inventory/', reports_inventory, name='reports_inventory'),
    path('reports/finance/', reports_finance, name='reports_finance'),
    path('', include(router.urls)),
]