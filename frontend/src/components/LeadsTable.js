import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const PIPELINE_ORDER = ['new', 'contacted', 'qualified', 'site_visit', 'proposal', 'won'];

const statusDisplay = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  site_visit: 'Site Visit',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

function getValidNextStatuses(currentStatus) {
  if (currentStatus === 'won' || currentStatus === 'lost') return [];
  const idx = PIPELINE_ORDER.indexOf(currentStatus);
  if (idx === -1) return [];
  return [...PIPELINE_ORDER.slice(idx + 1), 'lost'];
}

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
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', city: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ show: false, leadId: null, newStatus: null });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.city) params.city = filters.city;
      const response = await api.getLeads(params);
      setLeads(response.data.results || response.data);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch leads. Please check your API configuration.';
      setError(errorMessage);
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.getUsers();
      const usersData = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    // Check if current user is admin
    if (currentUser.is_staff || currentUser.is_superuser) {
      setIsAdmin(true);
      fetchUsers();
    }
  }, [fetchLeads, fetchUsers, currentUser.is_staff, currentUser.is_superuser]);

  const handleStatusChange = (leadId, newStatus) => {
    setConfirmModal({ show: true, leadId, newStatus });
  };

  const confirmStatusChange = async () => {
    const { leadId, newStatus } = confirmModal;
    try {
      await api.updateLead(leadId, { status: newStatus });
      setConfirmModal({ show: false, leadId: null, newStatus: null });
      fetchLeads();
    } catch (err) {
      setConfirmModal({ show: false, leadId: null, newStatus: null });
      setError(err.message || 'Failed to update lead status');
      console.error(err);
    }
  };

  const handleAssignLead = async (leadId, userId) => {
    try {
      await api.assignLead(leadId, userId);
      fetchLeads();
    } catch (err) {
      setError('Failed to assign lead');
      console.error(err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleRowClick = (leadId) => {
    navigate(`/leads/${leadId}`);
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Leads Management</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage and track your solar sales leads</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Status Filter */}
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Lead ID</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Name</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Phone</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">City</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Units</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Status</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Assigned To</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {leads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-gray-200 hover:bg-blue-50 transition-all duration-200 cursor-pointer ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-mono font-semibold text-blue-700">{lead.lead_id}</td>
                    <td 
                      className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 underline"
                      onClick={() => handleRowClick(lead.id)}
                    >
                      {lead.name}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{lead.phone}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{lead.city}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{lead.electricity_units}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      {(lead.status === 'won' || lead.status === 'lost') ? (
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusDisplay[lead.status]}
                        </span>
                      ) : (
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className={`px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
                            statusColors[lead.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value={lead.status}>{statusDisplay[lead.status]}</option>
                          {getValidNextStatuses(lead.status).map((s) => (
                            <option key={s} value={s}>{statusDisplay[s]}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                      {isAdmin ? (
                        <select
                          defaultValue={lead.assigned_to || ''}
                          onChange={(e) => handleAssignLead(lead.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.username}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="bg-gray-200 px-2 sm:px-3 py-1 rounded-full text-xs font-medium inline-block">
                          {lead.assigned_to_name || 'Unassigned'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="sm:hidden space-y-4">
          {leads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => handleRowClick(lead.id)}
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow"
            >
              {/* Lead Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-mono text-blue-700 font-semibold">{lead.lead_id}</p>
                  <p className="text-base font-bold text-gray-900 mt-1">{lead.name}</p>
                </div>
                {(lead.status === 'won' || lead.status === 'lost') ? (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
                    {statusDisplay[lead.status]}
                  </span>
                ) : (
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors flex-shrink-0 ${
                      statusColors[lead.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <option value={lead.status}>{statusDisplay[lead.status]}</option>
                    {getValidNextStatuses(lead.status).map((s) => (
                      <option key={s} value={s}>{statusDisplay[s]}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Lead Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Phone:</span>
                  <span className="text-gray-900 font-medium">{lead.phone}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">City:</span>
                  <span className="text-gray-900 font-medium">{lead.city}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Units:</span>
                  <span className="text-gray-900 font-medium">{lead.electricity_units}</span>
                </div>
              </div>

              {/* Assigned To */}
              <div className="pt-3 border-t">
                {isAdmin ? (
                  <select
                    defaultValue={lead.assigned_to || ''}
                    onChange={(e) => handleAssignLead(lead.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Assign to...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-gray-600">
                    Assigned to: <span className="font-semibold text-gray-900">{lead.assigned_to_name || 'Unassigned'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {leads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No leads found. Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* Status Change Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Confirm Status Change</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Are you sure you want to change the status? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setConfirmModal({ show: false, leadId: null, newStatus: null })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
              >
                Yes, Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsTable;
