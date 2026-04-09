#!/usr/bin/env python
"""
Helper script to safely backfill lead_id for existing leads
and verify the migration status.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from crm.models import Lead
from django.db import connection

def check_migrations():
    """Check if migrations have been applied"""
    from django.db.migrations.executor import MigrationExecutor
    executor = MigrationExecutor(connection)
    plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
    
    print("=" * 60)
    print("MIGRATION STATUS")
    print("=" * 60)
    
    applied = executor.applied_migrations
    crm_migrations = [m for m in applied if m[0] == 'crm']
    
    for migration in crm_migrations:
        print(f"✓ {migration[0]}: {migration[1]}")
    
    return crm_migrations

def verify_lead_id_column():
    """Check if lead_id column exists in database"""
    print("\n" + "=" * 60)
    print("DATABASE COLUMN CHECK")
    print("=" * 60)
    
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(crm_lead)")
        columns = cursor.fetchall()
        
        lead_id_exists = any(col[1] == 'lead_id' for col in columns)
        
        if lead_id_exists:
            print("✓ lead_id column exists in database")
            return True
        else:
            print("✗ lead_id column NOT found in database")
            print("\nColumns in crm_lead table:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
            return False

def backfill_lead_id():
    """Backfill lead_id for existing leads"""
    print("\n" + "=" * 60)
    print("BACKFILL LEAD_ID")
    print("=" * 60)
    
    leads_without_id = Lead.objects.filter(
        lead_id__isnull=True
    ) | Lead.objects.filter(lead_id='')
    
    count = leads_without_id.count()
    
    if count == 0:
        print("✓ All leads already have lead_id")
        return
    
    print(f"Found {count} leads without lead_id")
    print("Generating lead_id values...")
    
    # Start from the highest existing lead_id number
    existing_leads = Lead.objects.exclude(
        lead_id__isnull=True
    ).exclude(lead_id='').order_by('id')
    
    if existing_leads.exists():
        last_lead = existing_leads.last()
        # Extract the number from SVK-XXXX
        try:
            last_num = int(last_lead.lead_id.split('-')[1])
            start_num = last_num + 1
        except (IndexError, ValueError):
            start_num = leads_without_id.count() + 1
    else:
        start_num = 1
    
    for index, lead in enumerate(leads_without_id):
        lead_num = start_num + index
        lead.lead_id = f"SVK-{lead_num:04d}"
        lead.save()
        print(f"  {index + 1}. {lead.name} → {lead.lead_id}")
    
    print(f"\n✓ Successfully backfilled {count} leads")

def show_lead_summary():
    """Show summary of all leads"""
    print("\n" + "=" * 60)
    print("LEADS SUMMARY")
    print("=" * 60)
    
    leads = Lead.objects.all()
    print(f"Total leads: {leads.count()}")
    
    if leads.exists():
        print("\nLead Details:")
        for lead in leads:
            print(f"  {lead.lead_id} - {lead.name} ({lead.city}) - {lead.status}")
    else:
        print("No leads found")

def main():
    """Main function"""
    print("\n" + "=" * 60)
    print("SOLAR ERP - LEAD_ID FIX HELPER")
    print("=" * 60)
    
    # Check migrations
    check_migrations()
    
    # Verify column exists
    if not verify_lead_id_column():
        print("\n⚠ You need to run migrations first!")
        print("  Command: python manage.py migrate crm")
        return
    
    # Backfill lead_id
    backfill_lead_id()
    
    # Show summary
    show_lead_summary()
    
    print("\n" + "=" * 60)
    print("✓ All steps completed successfully!")
    print("=" * 60)
    print("\nYou can now:")
    print("  1. Run: python manage.py runserver")
    print("  2. Test: curl http://localhost:8000/api/leads/")

if __name__ == '__main__':
    main()
