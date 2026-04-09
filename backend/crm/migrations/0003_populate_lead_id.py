# Data migration: Populate lead_id for existing leads

from django.db import migrations


def populate_lead_id(apps, schema_editor):
    """Generate lead_id for existing leads"""
    Lead = apps.get_model('crm', 'Lead')
    
    # Get all leads without lead_id
    leads_without_id = Lead.objects.filter(lead_id__isnull=True) | Lead.objects.filter(lead_id='')
    
    for index, lead in enumerate(leads_without_id, start=1):
        lead.lead_id = f"SVK-{index:04d}"
        lead.save()


def reverse_populate_lead_id(apps, schema_editor):
    """Reverse: Clear lead_id values"""
    Lead = apps.get_model('crm', 'Lead')
    Lead.objects.all().update(lead_id=None)


class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0002_add_lead_id'),
    ]

    operations = [
        migrations.RunPython(populate_lead_id, reverse_populate_lead_id),
    ]
