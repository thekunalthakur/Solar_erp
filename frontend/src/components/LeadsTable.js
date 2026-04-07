import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = '/api/';

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  site_visit: 'bg-purple-100 text-purple-800',
  proposal: 'bg-pink-100 text-pink-800',
  won: 'bg-teal-100 text-teal-800',
  lost: 'bg-red-100 text-red-800',
};

const LeadsTable =() => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', city: '' });

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.city) params.city = filters.city;
      const response = await axios.get(`${API_BASE_URL}leads/`, { params });
      setLeads(response.data.results || response.data);
    } catch (err) {
      setError('Failed to fetch leads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}leads/${leadId}/`, { status: newStatus });
      fetchLeads();
    } catch (err) {
      setError('Failed to update lead status');
      console.error(err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads Management</h1>
      <p className="text-gray-600 mb-6">Manage and track your solar sales leads</p>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="site_visit">Site Visit</option>
            <option value="proposal">Proposal</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>

          {/* City Filter */}
          <input
            type="text"
            name="city"
            value={filters.city}
            onChange={handleFilterChange}
            placeholder="Filter by city..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">City</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Electricity Units</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Assigned To</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {leads.map((lead, index) => (
                <tr
                  key={lead.id}
                  className={`border-b border-gray-200 hover:bg-blue-50 transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{lead.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.city}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.electricity_units} kWh</td>
                  <td className="px-6 py-4">
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                        statusColors[lead.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="site_visit">Site Visit</option>
                      <option value="proposal">Proposal</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="bg-gray-200 px-3 py-1 rounded-full text-xs font-medium">
                      {lead.assigned_to_name || 'Unassigned'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state */}
      {leads.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No leads found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default LeadsTable;
