from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


class UserManagementApiTests(APITestCase):
	def setUp(self):
		self.admin = User.objects.create_superuser(username='admin', email='admin@example.com', password='admin123')
		self.normal_user = User.objects.create_user(username='user1', email='user1@example.com', password='user123')

	def test_non_admin_cannot_access_users_management(self):
		self.client.force_authenticate(user=self.normal_user)

		response = self.client.get('/api/auth/users/')

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_admin_can_create_user_with_role(self):
		self.client.force_authenticate(user=self.admin)
		payload = {
			'username': 'salesrep',
			'password': 'sales123',
			'first_name': 'Sales',
			'last_name': 'Rep',
			'email': 'sales@example.com',
			'role': 'user',
		}

		response = self.client.post('/api/auth/users/', payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data['role'], 'user')
		created_user = User.objects.get(username='salesrep')
		self.assertFalse(created_user.is_staff)
		self.assertFalse(created_user.is_superuser)

	def test_admin_can_update_user_role(self):
		self.client.force_authenticate(user=self.admin)

		response = self.client.patch(
			f'/api/auth/users/{self.normal_user.id}/',
			{'role': 'admin'},
			format='json'
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['role'], 'admin')
		self.normal_user.refresh_from_db()
		self.assertTrue(self.normal_user.is_staff)
		self.assertTrue(self.normal_user.is_superuser)
