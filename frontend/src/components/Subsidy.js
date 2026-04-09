import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

const Subsidy = () => {
  const [subsidies, setSubsidies] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ lead: '', application_number: '', status: 'pending', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [subsidyRes, leadRes] = await Promise.all([api.getSubsidies(), api.getLeads()]);
      const subsidyData = Array.isArray(subsidyRes.data) ? subsidyRes.data : (subsidyRes.data?.results || []);
      const leadData = Array.isArray(leadRes.data) ? leadRes.data : (leadRes.data?.results || []);
      setSubsidies(subsidyData);
      setLeads(leadData);
    } catch (err) {
      setError(err.message || 'Failed to load subsidies');
      setSubsidies([]);
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
      await api.createSubsidy({
        lead: Number(formData.lead),
        application_number: formData.application_number,
        status: formData.status,
        notes: formData.notes,
      });
      setFormData({ lead: '', application_number: '', status: 'pending', notes: '' });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to create subsidy application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (item, status) => {
    try {
      await api.updateSubsidy(item.id, { status });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update subsidy status');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Subsidy</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Track subsidy application status</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Subsidy Application</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Number</label>
              <input
                type="text"
                name="application_number"
                value={formData.application_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                {isSubmitting ? 'Saving...' : 'Add Subsidy'}
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
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Application No.</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Status</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Notes</th>
                </tr>
              </thead>
              <tbody>
                {subsidies.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white border-b' : 'bg-gray-50 border-b'}>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{item.lead_id} - {item.lead_name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{item.application_number || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item, e.target.value)}
                        className="px-2 py-1 rounded border border-gray-300 text-xs"
                      >
                        <option value="pending">Pending</option>
                        <option value="submitted">Submitted</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {subsidies.length === 0 && <div className="text-center py-8 text-gray-500">No subsidy applications yet.</div>}
        </div>
      </div>
    </div>
  );
};

export default Subsidy;
