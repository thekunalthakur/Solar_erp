import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const FollowUps = () => {
  const [followUps, setFollowUps] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', overdueOnly: false });
  const [formData, setFormData] = useState({
    lead: '',
    next_followup_date: '',
    notes: '',
    status: 'pending',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.overdueOnly) params.date_filter = 'overdue';

      const [followUpResponse, leadResponse] = await Promise.all([
        api.getFollowUps(params),
        api.getLeads(),
      ]);

      const followUpData = Array.isArray(followUpResponse.data)
        ? followUpResponse.data
        : (followUpResponse.data?.results || []);
      const leadData = Array.isArray(leadResponse.data)
        ? leadResponse.data
        : (leadResponse.data?.results || []);

      setFollowUps(followUpData);
      setLeads(leadData);
    } catch (err) {
      setError(err.message || 'Failed to load follow-ups');
      setFollowUps([]);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusClass = useMemo(() => ({
    pending: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800',
  }), []);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.lead || !formData.next_followup_date) return;

    try {
      setIsSubmitting(true);
      await api.createFollowUp({
        lead: Number(formData.lead),
        next_followup_date: formData.next_followup_date,
        notes: formData.notes,
        status: formData.status,
      });
      setFormData({
        lead: '',
        next_followup_date: '',
        notes: '',
        status: 'pending',
      });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to create follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.updateFollowUp(id, { status });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update follow-up status');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Follow-ups</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Track upcoming and overdue follow-up activities</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Follow-up</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
              <input
                type="datetime-local"
                name="next_followup_date"
                value={formData.next_followup_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
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
                <option value="done">Done</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add follow-up notes"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Saving...' : 'Create Follow-up'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="overdueOnly"
                  checked={filters.overdueOnly}
                  onChange={handleFilterChange}
                />
                Overdue only
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Lead Name</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Date</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Status</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Notes</th>
                </tr>
              </thead>
              <tbody>
                {followUps.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white border-b' : 'bg-gray-50 border-b'}>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{item.lead_name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{new Date(item.next_followup_date).toLocaleString()}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-medium border ${statusClass[item.status] || 'bg-gray-100 text-gray-700'}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {followUps.length === 0 && (
            <div className="text-center py-10 text-gray-500">No follow-ups found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowUps;