import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const statusBadge = {
  won: 'bg-teal-100 text-teal-800',
  lost: 'bg-red-100 text-red-800',
};

const statusLabel = {
  won: 'Won',
  lost: 'Lost',
};

const Conversions = () => {
  const navigate = useNavigate();
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchConversions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await api.getConversions(params);
      const items = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);
      setConversions(items);
    } catch (err) {
      setError(err.message || 'Failed to load conversions');
      setConversions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchConversions();
  }, [fetchConversions]);

  const wonCount = useMemo(
    () => conversions.filter((lead) => lead.status === 'won').length,
    [conversions]
  );

  const lostCount = useMemo(
    () => conversions.filter((lead) => lead.status === 'lost').length,
    [conversions]
  );

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Conversions</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Track won vs lost lead outcomes</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-teal-500">
            <p className="text-sm text-gray-600">Won Leads</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">{wonCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Lost Leads</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{lostCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-64 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            <option value="">All Conversion Statuses</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <div className="hidden sm:block bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Lead ID</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Name</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Phone</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">City</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Status</th>
                </tr>
              </thead>
              <tbody>
                {conversions.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-gray-200 hover:bg-blue-50 transition-all duration-200 cursor-pointer ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-mono font-semibold text-blue-700">{lead.lead_id}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{lead.name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{lead.phone}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{lead.city}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge[lead.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabel[lead.status] || lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {conversions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No conversion records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversions;
