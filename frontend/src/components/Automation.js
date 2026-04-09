import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

const Automation = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger_status: 'new',
    action_type: 'create_task',
    task_title_template: '',
    task_description_template: '',
    followup_days: 1,
    followup_notes_template: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAutomationRules();
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setRules(data);
    } catch (err) {
      setError(err.message || 'Failed to load automation rules');
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      setIsSubmitting(true);
      await api.createAutomationRule({
        ...formData,
        followup_days: Number(formData.followup_days || 1),
      });
      setFormData({
        name: '',
        trigger_status: 'new',
        action_type: 'create_task',
        task_title_template: '',
        task_description_template: '',
        followup_days: 1,
        followup_notes_template: '',
        is_active: true,
      });
      fetchRules();
    } catch (err) {
      setError(err.message || 'Failed to create automation rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRule = async (rule) => {
    try {
      await api.updateAutomationRule(rule.id, { is_active: !rule.is_active });
      fetchRules();
    } catch (err) {
      setError(err.message || 'Failed to update rule');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Automation</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Basic rule engine for lead status actions</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Rule</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
              <input name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Lead Status</label>
              <select name="trigger_status" value={formData.trigger_status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="site_visit">Site Visit</option>
                <option value="proposal">Proposal</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
              <select name="action_type" value={formData.action_type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="create_task">Create Task</option>
                <option value="create_followup">Create Follow-up</option>
              </select>
            </div>

            {formData.action_type === 'create_task' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Title Template</label>
                  <input name="task_title_template" value={formData.task_title_template} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Description Template</label>
                  <textarea name="task_description_template" value={formData.task_description_template} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </>
            )}

            {formData.action_type === 'create_followup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up After Days</label>
                  <input type="number" min="1" name="followup_days" value={formData.followup_days} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Notes Template</label>
                  <textarea name="followup_notes_template" value={formData.followup_notes_template} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </>
            )}

            <div className="md:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="rule-active" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
              <label htmlFor="rule-active" className="text-sm text-gray-700">Rule is active</label>
            </div>

            <div className="md:col-span-2">
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                {isSubmitting ? 'Saving...' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Name</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Trigger</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Action</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Active</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, index) => (
                  <tr key={rule.id} className={index % 2 === 0 ? 'bg-white border-b' : 'bg-gray-50 border-b'}>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{rule.name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{rule.trigger_status}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{rule.action_type}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <button onClick={() => toggleRule(rule)} className={`px-3 py-1 rounded ${rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                        {rule.is_active ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rules.length === 0 && <div className="text-center py-8 text-gray-500">No automation rules yet.</div>}
        </div>
      </div>
    </div>
  );
};

export default Automation;
