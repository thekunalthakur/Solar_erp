import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

const Installation = () => {
  const [installations, setInstallations] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    lead: '',
    engineer: '',
    status: 'pending',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [installationRes, leadRes, userRes] = await Promise.all([
        api.getInstallations(),
        api.getLeads(),
        api.getUsers(),
      ]);

      const installationData = Array.isArray(installationRes.data)
        ? installationRes.data
        : (installationRes.data?.results || []);
      const leadData = Array.isArray(leadRes.data) ? leadRes.data : (leadRes.data?.results || []);
      const userData = Array.isArray(userRes.data) ? userRes.data : (userRes.data?.results || []);

      setInstallations(installationData);
      setLeads(leadData);
      setUsers(userData);
    } catch (err) {
      setError(err.message || 'Failed to load installation data');
      setInstallations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.lead) return;

    try {
      setIsSubmitting(true);
      await api.createInstallation({
        lead: Number(formData.lead),
        engineer: formData.engineer || null,
        status: formData.status,
        notes: formData.notes,
      });
      setFormData({ lead: '', engineer: '', status: 'pending', notes: '' });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to create installation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (installation, nextStatus) => {
    try {
      await api.updateInstallation(installation.id, { status: nextStatus });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update installation status');
    }
  };

  const handleMarkCompleted = async (installationId) => {
    try {
      await api.markInstallationCompleted(installationId);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to mark installation completed');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Installation</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Track installation progress and completion</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Installation</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead</label>
              <select
                name="lead"
                value={formData.lead}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>{lead.lead_id} - {lead.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engineer</label>
              <select
                name="engineer"
                value={formData.engineer}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Saving...' : 'Add Installation'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Lead</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Engineer</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Status</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Completed At</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {installations.map((installation, index) => (
                  <tr key={installation.id} className={index % 2 === 0 ? 'bg-white border-b' : 'bg-gray-50 border-b'}>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{installation.lead_id} - {installation.lead_name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{installation.engineer_name || 'Unassigned'}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <select
                        value={installation.status}
                        onChange={(e) => handleStatusChange(installation, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[installation.status]}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
                      {installation.completed_at
                        ? new Date(installation.completed_at).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      {installation.status !== 'completed' ? (
                        <button
                          onClick={() => handleMarkCompleted(installation.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Mark Completed
                        </button>
                      ) : (
                        <span className="text-green-700 font-medium">Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {installations.length === 0 && <div className="text-center py-8 text-gray-500">No installations added yet.</div>}
        </div>
      </div>
    </div>
  );
};

export default Installation;
