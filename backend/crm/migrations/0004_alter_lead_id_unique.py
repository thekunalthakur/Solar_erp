# Final migration: Make lead_id unique and not nullable

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0003_populate_lead_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lead',
            name='lead_id',
            field=models.CharField(
                editable=False,
                help_text='Auto-generated unique lead identifier (e.g., SVK-0001)',
                max_length=20,
                unique=True,
            ),
        ),
    ]
