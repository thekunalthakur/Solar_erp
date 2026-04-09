import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

const Broadcasts = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ subject: '', message: '', lead_ids: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [broadcastRes, leadRes] = await Promise.all([api.getBroadcasts(), api.getLeads()]);
      const broadcastData = Array.isArray(broadcastRes.data) ? broadcastRes.data : (broadcastRes.data?.results || []);
      const leadData = Array.isArray(leadRes.data) ? leadRes.data : (leadRes.data?.results || []);
      setBroadcasts(broadcastData);
      setLeads(leadData);
    } catch (err) {
      setError(err.message || 'Failed to load broadcasts');
      setBroadcasts([]);
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

  const handleLeadSelection = (e) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) => Number(opt.value));
    setFormData((prev) => ({ ...prev, lead_ids: selected }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) return;

    try {
      setIsSubmitting(true);
      await api.createBroadcast(formData);
      setFormData({ subject: '', message: '', lead_ids: [] });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to send broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Broadcasts</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Send messages to leads and store recipient logs</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Broadcast</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input name="subject" value={formData.subject} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea name="message" value={formData.message} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
              <select multiple value={formData.lead_ids.map(String)} onChange={handleLeadSelection} className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[120px]">
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>{lead.lead_id} - {lead.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                {isSubmitting ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Subject</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Sent At</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Recipient Count</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Logs</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white border-b' : 'bg-gray-50 border-b'}>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{item.subject}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{new Date(item.sent_at).toLocaleString()}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{item.recipient_count}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
                      {Array.isArray(item.recipients) && item.recipients.length > 0
                        ? item.recipients.map((r) => r.name).join(', ')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {broadcasts.length === 0 && <div className="text-center py-8 text-gray-500">No broadcasts sent yet.</div>}
        </div>
      </div>
    </div>
  );
};

export default Broadcasts;
