# Generated migration for adding lead_id field
# Step 1: Add the field as nullable to allow existing records

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='lead',
            name='lead_id',
            field=models.CharField(
                default='',
                editable=False,
                help_text='Auto-generated unique lead identifier (e.g., SVK-0001)',
                max_length=20,
                null=True,
                blank=True,
            ),
            preserve_default=False,
        ),
    ]
