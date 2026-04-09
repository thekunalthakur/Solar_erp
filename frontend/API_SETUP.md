# API Configuration Guide

## Environment Setup

### For GitHub Codespaces
1. Use your local backend URL (`http://localhost:8000`)
2. Update `frontend/.env`:
   ```
   REACT_APP_API_URL=http://localhost:8000/api/
   ```

### For Local Development
The default fallback is `http://localhost:8000`, so no changes needed for local development.

## How It Works

- The `src/api.js` file creates a configured axios instance
- It automatically adds CSRF tokens for Django requests
- All API calls go through the centralized API utility
- Error handling provides meaningful messages

## API Usage Examples

```javascript
import { api } from '../api';

// Get all leads
const leads = await api.getLeads({ status: 'new' });

// Get single lead
const lead = await api.getLead(123);

// Update lead status
await api.updateLead(123, { status: 'qualified' });

// Assign lead to user
await api.assignLead(123, userId);

// Add note to lead
await api.addNote(123, 'Followed up with customer');

// Get users
const users = await api.getUsers();
```

## Troubleshooting

- **"Failed to fetch leads"**: Check that `REACT_APP_API_URL` is set correctly
- **CSRF errors**: Ensure Django is configured to send CSRF cookies
- **CORS errors**: Make sure Django allows requests from your frontend domain