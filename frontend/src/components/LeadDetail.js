import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

const CAPACITY_OPTIONS = [3, 5, 10];
const SYSTEM_TYPE_OPTIONS = [
  { value: 'on_grid', label: 'On-Grid' },
  { value: 'off_grid', label: 'Off-Grid' },
  { value: 'hybrid', label: 'Hybrid' },
];

// Ordered pipeline (terminal 'lost' is handled separately — reachable from any open stage)
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

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  site_visit: 'bg-purple-100 text-purple-800',
  proposal: 'bg-pink-100 text-pink-800',
  won: 'bg-teal-100 text-teal-800',
  lost: 'bg-red-100 text-red-800',
};

/**
 * Returns statuses the lead is allowed to transition TO from currentStatus.
 * Rules:
 *  - Only forward movement in the main pipeline
 *  - 'lost' always available from any open stage
 *  - 'won' and 'lost' are terminal — no further transitions
 */
function getValidNextStatuses(currentStatus) {
  if (currentStatus === 'won' || currentStatus === 'lost') return [];
  const idx = PIPELINE_ORDER.indexOf(currentStatus);
  if (idx === -1) return [];
  const forward = PIPELINE_ORDER.slice(idx + 1); // statuses ahead in pipeline
  return [...forward, 'lost'];
}

/** Horizontal step-tracker showing the pipeline with the current stage highlighted. */
const PipelineIndicator = ({ currentStatus }) => {
  const isLost = currentStatus === 'lost';
  const currentIdx = PIPELINE_ORDER.indexOf(currentStatus);

  return (
    <div className="w-full py-2">
      <div className="flex items-start">
        {PIPELINE_ORDER.map((key, index) => {
          const isCompleted = !isLost && index < currentIdx;
          const isCurrent = !isLost && key === currentStatus;

          return (
            <React.Fragment key={key}>
              <div className="flex flex-col items-center min-w-0" style={{ flex: '0 0 auto' }}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white ring-2 ring-blue-200'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span className={`text-xs mt-1 font-medium text-center leading-tight ${
                  isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
                }`} style={{ minWidth: 52, maxWidth: 60 }}>
                  {statusDisplay[key]}
                </span>
              </div>
              {index < PIPELINE_ORDER.length - 1 && (
                <div className={`flex-1 h-0.5 mt-3.5 mx-1 min-w-[8px] transition-colors ${
                  index < currentIdx ? 'bg-green-400' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {isLost && (
        <div className="mt-3 text-center">
          <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
            Lead Lost — Pipeline Closed
          </span>
        </div>
      )}
    </div>
  );
};

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ show: false, newStatus: null });
  const [followUps, setFollowUps] = useState([]);
  const [followUpForm, setFollowUpForm] = useState({
    next_followup_date: '',
    notes: '',
    status: 'pending',
  });
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Proposal pricing state
  const [proposalCapacity, setProposalCapacity] = useState('');
  const [proposalSystemType, setProposalSystemType] = useState('');
  const [proposalPrice, setProposalPrice] = useState(null);
  const [proposalPriceLoading, setProposalPriceLoading] = useState(false);
  const [proposalPriceError, setProposalPriceError] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Format dates - simple logic, memoize to avoid re-formatting on every render
  const createdDate = lead
    ? new Date(lead.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const updatedDate = lead
    ? new Date(lead.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const fetchLeadDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getLead(id);
      setLead(response.data);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch lead details. Please check your API configuration.';
      setError(errorMessage);
      console.error('Error fetching lead details:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

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

  const fetchFollowUps = useCallback(async () => {
    try {
      const response = await api.getFollowUps({ lead: id, ordering: 'next_followup_date' });
      const followUpData = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);
      setFollowUps(followUpData);
    } catch (err) {
      console.error('Failed to fetch follow-ups:', err);
      setFollowUps([]);
    }
  }, [id]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setAuditLoading(true);
      const response = await api.getAuditLogs({ lead: id, ordering: '-timestamp' });
      const auditData = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);
      setAuditLogs(auditData);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeadDetails();
    fetchFollowUps();
    fetchAuditLogs();
  }, [fetchLeadDetails, fetchFollowUps, fetchAuditLogs, id]);

  const getActivityMessage = (log) => {
    const actor = log.user_name || 'System';
    const model = log.model_name || 'Record';
    if (log.action === 'create') {
      return `${actor} created ${model}${log.new_value ? `: ${log.new_value}` : ''}`;
    }
    if (log.action === 'delete') {
      return `${actor} deleted ${model}${log.old_value ? `: ${log.old_value}` : ''}`;
    }
    if (log.action === 'update') {
      if (log.field_name) {
        return `${actor} updated ${model} field '${log.field_name}' from '${log.old_value || '-'}' to '${log.new_value || '-'}'`;
      }
      return `${actor} updated ${model}`;
    }
    return `${actor} performed ${log.action} on ${model}`;
  };

  const getActionBadge = (action) => {
    if (action === 'create') return 'bg-green-100 text-green-700';
    if (action === 'update') return 'bg-blue-100 text-blue-700';
    if (action === 'delete') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  useEffect(() => {
    if (currentUser.is_staff || currentUser.is_superuser) {
      setIsAdmin(true);
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  // Fetch price whenever capacity + system_type both selected (Proposal stage only)
  useEffect(() => {
    if (!proposalCapacity || !proposalSystemType) {
      setProposalPrice(null);
      setProposalPriceError(null);
      return;
    }
    let cancelled = false;
    setProposalPriceLoading(true);
    setProposalPriceError(null);
    setProposalPrice(null);
    api.getSalesProducts({ capacity: proposalCapacity, system_type: proposalSystemType })
      .then((res) => {
        if (cancelled) return;
        const results = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        if (results.length > 0) {
          setProposalPrice(results[0].price);
        } else {
          setProposalPriceError('No pricing found for this configuration.');
        }
      })
      .catch((err) => {
        if (!cancelled) setProposalPriceError(err.message || 'Failed to fetch price');
      })
      .finally(() => {
        if (!cancelled) setProposalPriceLoading(false);
      });
    return () => { cancelled = true; };
  }, [proposalCapacity, proposalSystemType]);

  const handleStatusChange = (newStatus) => {
    setConfirmModal({ show: true, newStatus });
  };

  const confirmStatusChange = async () => {
    try {
      await api.updateLead(id, { status: confirmModal.newStatus });
      setConfirmModal({ show: false, newStatus: null });
      fetchLeadDetails();
      fetchAuditLogs();
    } catch (err) {
      setConfirmModal({ show: false, newStatus: null });
      setError(err.message || 'Failed to update lead status');
      console.error(err);
    }
  };

  const handleAssignLead = async (userId) => {
    try {
      await api.assignLead(id, userId);
      fetchLeadDetails();
      fetchAuditLogs();
    } catch (err) {
      setError('Failed to assign lead');
      console.error(err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setIsAddingNote(true);
      await api.addNote(id, newNote);
      setNewNote('');
      fetchLeadDetails();
      fetchAuditLogs();
    } catch (err) {
      setError('Failed to add note');
      console.error(err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleFollowUpInputChange = (e) => {
    const { name, value } = e.target;
    setFollowUpForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpForm.next_followup_date) return;

    try {
      setIsSavingFollowUp(true);
      await api.createFollowUp({
        lead: Number(id),
        next_followup_date: followUpForm.next_followup_date,
        notes: followUpForm.notes,
        status: followUpForm.status,
      });
      setFollowUpForm({
        next_followup_date: '',
        notes: '',
        status: 'pending',
      });
      fetchFollowUps();
      fetchAuditLogs();
    } catch (err) {
      setError('Failed to add follow-up');
      console.error(err);
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  const handleMarkFollowUpDone = async (followUpId) => {
    try {
      await api.updateFollowUp(followUpId, { status: 'done' });
      fetchFollowUps();
      fetchAuditLogs();
    } catch (err) {
      setError('Failed to update follow-up status');
      console.error(err);
    }
  };

  const now = new Date();
  const pendingFollowUps = followUps.filter((item) => item.status === 'pending');
  const overdueFollowUps = pendingFollowUps.filter((item) => new Date(item.next_followup_date) < now);
  const upcomingFollowUps = pendingFollowUps.filter((item) => new Date(item.next_followup_date) >= now);

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/leads')}
          className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          ← Back to Leads
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">{error}</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/leads')}
          className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          ← Back to Leads
        </button>
        <div className="text-center py-12 text-gray-500">Lead not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/leads')}
        className="mb-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
      >
        ← Back to Leads
      </button>

      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{lead.name}</h1>
            <p className="text-lg text-blue-600 font-mono font-semibold">{lead.lead_id}</p>
          </div>
          <div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[lead.status]}`}>
              {statusDisplay[lead.status]}
            </span>
          </div>
        </div>

        {/* Pipeline step indicator */}
        <div className="border-t border-b py-4 mb-6 overflow-x-auto">
          <PipelineIndicator currentStatus={lead.status} />
        </div>

        {/* Lead Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase">Phone</label>
                <p className="text-lg text-gray-900">{lead.phone}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">City</label>
                <p className="text-lg text-gray-900">{lead.city}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Electricity Units</label>
                <p className="text-lg text-gray-900">{lead.electricity_units} kWh/month</p>
              </div>
            </div>
          </div>

          {/* Lead Status and Assignment */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Lead Status</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="status-select" className="text-xs text-gray-500 uppercase">Current Status</label>
                {(lead.status === 'won' || lead.status === 'lost') ? (
                  <div className={`w-full px-4 py-2 rounded-lg text-sm font-medium border ${statusColors[lead.status]}`}>
                    {statusDisplay[lead.status]} — Pipeline Closed
                  </div>
                ) : (
                  <select
                    id="status-select"
                    value={lead.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors border ${statusColors[lead.status]}`}
                    aria-label="Change lead status"
                  >
                    {/* Current stage (read-only reference) */}
                    <option value={lead.status}>{statusDisplay[lead.status]} (current)</option>
                    {/* Only valid forward stages */}
                    {getValidNextStatuses(lead.status).map((s) => (
                      <option key={s} value={s}>{statusDisplay[s]}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="assigned-select" className="text-xs text-gray-500 uppercase">Assigned To</label>
                {isAdmin ? (
                  <select
                    id="assigned-select"
                    value={lead.assigned_to || ''}
                    onChange={(e) => handleAssignLead(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Assign lead to team member"
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-lg text-gray-900 font-medium">
                    {lead.assigned_to_name || '—'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Timeline</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Created</label>
              <p className="text-gray-900">{createdDate}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Last Updated</label>
              <p className="text-gray-900">{updatedDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Proposal Pricing Section — visible only when status is 'proposal' */}
      {lead.status === 'proposal' && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 border-l-4 border-blue-500">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Pricing</h2>
          <p className="text-sm text-gray-500 mb-6">Select a system configuration to auto-fetch the price from the catalogue.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (kW)</label>
              <select
                value={proposalCapacity}
                onChange={(e) => setProposalCapacity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select capacity…</option>
                {CAPACITY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c} kW</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Type</label>
              <select
                value={proposalSystemType}
                onChange={(e) => setProposalSystemType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type…</option>
                {SYSTEM_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Price</label>
              <div className={`w-full px-3 py-2 rounded-md border text-sm font-semibold min-h-[42px] flex items-center ${
                proposalPrice ? 'bg-green-50 border-green-300 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                {proposalPriceLoading
                  ? 'Fetching…'
                  : proposalPrice
                  ? `₹${Number(proposalPrice).toLocaleString('en-IN')}`
                  : proposalPriceError
                  ? <span className="text-red-600 font-normal">{proposalPriceError}</span>
                  : 'Select capacity and type'}
              </div>
            </div>
          </div>

          {/* Configuration summary */}
          {proposalCapacity && proposalSystemType && proposalPrice && (
            <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Selected Configuration</p>
                <p className="text-lg font-bold text-blue-900">
                  {proposalCapacity}kW {SYSTEM_TYPE_OPTIONS.find((o) => o.value === proposalSystemType)?.label} System
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Final Proposal Price</p>
                <p className="text-2xl font-bold text-blue-900">₹{Number(proposalPrice).toLocaleString('en-IN')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remarks / Notes Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Remarks & Notes</h2>

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="mb-8">
          <div className="mb-4">
            <label htmlFor="note-input" className="block text-sm font-medium text-gray-700 mb-2">
              Add a Note
            </label>
            <textarea
              id="note-input"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add your thoughts, updates, or next steps..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="4"
              aria-label="Add a note to this lead"
            />
          </div>
          <button
            type="submit"
            disabled={isAddingNote || !newNote.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isAddingNote ? 'Adding...' : 'Add Note'}
          </button>
        </form>

        {/* Notes List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Notes ({lead.notes ? lead.notes.length : 0})
          </h3>
          {lead.notes && lead.notes.length > 0 ? (
            <div className="space-y-4">
              {lead.notes.map(note => (
                <div key={note.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-900">{note.user_name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{note.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No notes yet. Add one to get started!</p>
          )}
        </div>
      </div>

      {/* Follow-ups Section */}
      <div className="bg-white rounded-lg shadow-md p-8 mt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Follow-ups</h2>

        {/* Add Follow-up Form */}
        <form onSubmit={handleAddFollowUp} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="next-followup-date" className="block text-sm font-medium text-gray-700 mb-2">
                Next Follow-up Date
              </label>
              <input
                id="next-followup-date"
                type="datetime-local"
                name="next_followup_date"
                value={followUpForm.next_followup_date}
                onChange={handleFollowUpInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="followup-status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="followup-status"
                name="status"
                value={followUpForm.status}
                onChange={handleFollowUpInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={isSavingFollowUp}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {isSavingFollowUp ? 'Saving...' : 'Add Follow-up'}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="followup-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="followup-notes"
              name="notes"
              value={followUpForm.notes}
              onChange={handleFollowUpInputChange}
              placeholder="Add follow-up context..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
            />
          </div>
        </form>

        {/* Overdue Follow-ups */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-red-700 mb-3">Overdue ({overdueFollowUps.length})</h3>
          {overdueFollowUps.length > 0 ? (
            <div className="space-y-3">
              {overdueFollowUps.map((item) => (
                <div key={item.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-sm font-semibold text-red-800">Due: {new Date(item.next_followup_date).toLocaleString()}</p>
                      <p className="text-gray-700 mt-1 whitespace-pre-wrap">{item.notes || 'No notes'}</p>
                    </div>
                    <button
                      onClick={() => handleMarkFollowUpDone(item.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                    >
                      Mark Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No overdue follow-ups.</p>
          )}
        </div>

        {/* Upcoming Follow-ups */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming ({upcomingFollowUps.length})</h3>
          {upcomingFollowUps.length > 0 ? (
            <div className="space-y-3">
              {upcomingFollowUps.map((item) => (
                <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Due: {new Date(item.next_followup_date).toLocaleString()}</p>
                      <p className="text-gray-700 mt-1 whitespace-pre-wrap">{item.notes || 'No notes'}</p>
                    </div>
                    <button
                      onClick={() => handleMarkFollowUpDone(item.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                    >
                      Mark Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming follow-ups.</p>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow-md p-8 mt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Activity Timeline</h2>
        {auditLoading ? (
          <p className="text-gray-500">Loading activity...</p>
        ) : auditLogs.length > 0 ? (
          <div className="space-y-4">
            {auditLogs.slice(0, 25).map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${getActionBadge(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-gray-800 text-sm">{getActivityMessage(log)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No activity logged for this lead yet.</p>
        )}
      </div>

      {/* Status Change Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Status Change</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to change the status from <strong>{statusDisplay[lead.status]}</strong> to <strong>{statusDisplay[confirmModal.newStatus]}</strong>?
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setConfirmModal({ show: false, newStatus: null })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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

export default LeadDetail;
