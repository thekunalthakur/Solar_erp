from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Lead, AutomationRule, Task, BroadcastRecipient


class LeadAutomationTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='sales', password='sales123')
		self.client.force_authenticate(user=self.user)
		self.lead = Lead.objects.create(
			name='John Doe',
			phone='9999999999',
			city='Mumbai',
			electricity_units=1200,
			status='new',
			assigned_to=self.user,
		)

	def test_invalid_template_placeholder_does_not_break_status_update(self):
		AutomationRule.objects.create(
			name='Create task on contacted',
			trigger_status='contacted',
			action_type='create_task',
			task_title_template='Call {lead_name}',
			task_description_template='Unknown field {unknown_key}',
			is_active=True,
		)

		response = self.client.patch(f'/api/leads/{self.lead.id}/', {'status': 'contacted'}, format='json')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		created_task = Task.objects.filter(lead=self.lead).first()
		self.assertIsNotNone(created_task)
		self.assertIn('{unknown_key}', created_task.description)


class BroadcastCreateTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='marketer', password='marketer123')
		self.client.force_authenticate(user=self.user)
		self.lead_1 = Lead.objects.create(
			name='Alice',
			phone='1111111111',
			city='Pune',
			electricity_units=900,
			status='new',
		)
		self.lead_2 = Lead.objects.create(
			name='Bob',
			phone='2222222222',
			city='Delhi',
			electricity_units=1000,
			status='new',
		)

	def test_rejects_invalid_lead_ids(self):
		payload = {
			'subject': 'Test Broadcast',
			'message': 'Hello',
			'lead_ids': [self.lead_1.id, 999999],
		}

		response = self.client.post('/api/broadcasts/', payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('lead_ids', response.data)

	def test_deduplicates_lead_ids_and_creates_recipients_once(self):
		payload = {
			'subject': 'Dedup Broadcast',
			'message': 'Hello team',
			'lead_ids': [self.lead_1.id, self.lead_1.id, self.lead_2.id],
		}

		response = self.client.post('/api/broadcasts/', payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data['recipient_count'], 2)
		self.assertEqual(BroadcastRecipient.objects.filter(broadcast_id=response.data['id']).count(), 2)


class ValidationTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='validator', password='validator123')
		self.client.force_authenticate(user=self.user)
		self.lead = Lead.objects.create(
			name='Validation Lead',
			phone='3333333333',
			city='Bangalore',
			electricity_units=1100,
			status='new',
		)

	def test_campaign_rejects_end_date_before_start_date(self):
		payload = {
			'name': 'Invalid Date Campaign',
			'source': 'Email',
			'budget': '1000.00',
			'start_date': '2026-04-10',
			'end_date': '2026-04-09',
		}

		response = self.client.post('/api/campaigns/', payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('end_date', response.data)

	def test_loan_rejects_negative_amount(self):
		payload = {
			'lead': self.lead.id,
			'amount': '-2500.00',
			'status': 'pending',
			'notes': 'Should fail',
		}

		response = self.client.post('/api/loans/', payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('amount', response.data)
