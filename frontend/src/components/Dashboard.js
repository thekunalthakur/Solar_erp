import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  site_visit: 'Site Visit',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

const formatRelativeTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getDashboardData();
      setDashboard(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleTaskDone = async (taskId) => {
    try {
      await api.updateTask(taskId, { status: 'done' });
      fetchDashboard();
    } catch (err) {
      setError(err.message || 'Failed to update task status');
    }
  };

  const handleFollowUpDone = async (followupId) => {
    try {
      await api.updateFollowUp(followupId, { status: 'done' });
      fetchDashboard();
    } catch (err) {
      setError(err.message || 'Failed to update follow-up status');
    }
  };

  const salesStatusRows = useMemo(() => {
    const statuses = dashboard?.sales_overview?.leads_by_status || {};
    return Object.entries(statuses)
      .map(([key, count]) => ({ key, label: STATUS_LABELS[key] || key, count }))
      .sort((a, b) => b.count - a.count);
  }, [dashboard]);

  const maxStatusCount = useMemo(
    () => Math.max(1, ...(salesStatusRows.map((item) => item.count))),
    [salesStatusRows]
  );

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-4">{error}</div>
        <button onClick={fetchDashboard} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  const summary = dashboard?.summary || {};
  const sales = dashboard?.sales_overview || {};
  const tasksFollowups = dashboard?.tasks_followups || {};
  const operations = dashboard?.operations || {};
  const inventory = dashboard?.inventory_alerts || {};
  const finance = dashboard?.finance_snapshot || {};
  const activities = dashboard?.recent_activity || [];

  const summaryCards = [
    { label: 'Total Leads', value: summary.total_leads || 0, path: '/leads' },
    { label: 'New Leads (Today)', value: summary.new_leads_today || 0, path: '/leads' },
    { label: 'Conversions (Won)', value: summary.won_conversions || 0, path: '/conversions' },
    { label: 'Pending Follow-ups', value: summary.pending_followups || 0, path: '/follow-ups' },
    { label: 'Pending Tasks', value: summary.pending_tasks || 0, path: '/tasks' },
    { label: 'Installations In Progress', value: summary.installations_in_progress || 0, path: '/installation' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-gray-200 bg-white">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Complete business overview for sales, operations, inventory and finance</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {summaryCards.map((card) => (
            <button
              key={card.label}
              onClick={() => navigate(card.path)}
              className="text-left bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="text-sm text-gray-600 mb-1">{card.label}</div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-5 shadow-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sales Overview</h2>
            <div className="space-y-3">
              {salesStatusRows.map((row) => (
                <div key={row.key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{row.label}</span>
                    <span className="font-semibold text-gray-900">{row.count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${(row.count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-700">Won</div>
                <div className="text-xl font-bold text-green-800">{sales.conversion?.won || 0}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs text-red-700">Lost</div>
                <div className="text-xl font-bold text-red-800">{sales.conversion?.lost || 0}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Operations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-blue-700">Surveys Scheduled</div>
                <div className="text-xl font-bold text-blue-800">{operations.surveys_scheduled || 0}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-xs text-yellow-700">Installations Pending</div>
                <div className="text-xl font-bold text-yellow-800">{operations.installations_pending || 0}</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3">
                <div className="text-xs text-indigo-700">In Progress</div>
                <div className="text-xl font-bold text-indigo-800">{operations.installations_in_progress || 0}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-700">Completed</div>
                <div className="text-xl font-bold text-green-800">{operations.completed_installations || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-5 shadow-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tasks & Follow-ups</h2>

            <h3 className="text-sm font-semibold text-gray-700 mb-2">Today's Tasks</h3>
            <div className="space-y-2 mb-4">
              {(tasksFollowups.todays_tasks || []).slice(0, 4).map((task) => (
                <div key={task.id} className="border rounded-lg p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.lead__name || 'No lead linked'}</p>
                  </div>
                  <button onClick={() => handleTaskDone(task.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Mark Done</button>
                </div>
              ))}
              {(tasksFollowups.todays_tasks || []).length === 0 && <p className="text-sm text-gray-500">No tasks due today.</p>}
            </div>

            <h3 className="text-sm font-semibold text-red-700 mb-2">Overdue Tasks</h3>
            <div className="space-y-2 mb-4">
              {(tasksFollowups.overdue_tasks || []).slice(0, 4).map((task) => (
                <div key={task.id} className="border border-red-200 bg-red-50 rounded-lg p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-red-900">{task.title}</p>
                    <p className="text-xs text-red-700">Due: {task.due_date || '-'}</p>
                  </div>
                  <button onClick={() => handleTaskDone(task.id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Mark Done</button>
                </div>
              ))}
              {(tasksFollowups.overdue_tasks || []).length === 0 && <p className="text-sm text-gray-500">No overdue tasks.</p>}
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-2">Upcoming Follow-ups</h3>
            <div className="space-y-2">
              {(tasksFollowups.upcoming_followups || []).slice(0, 4).map((item) => (
                <div key={item.id} className="border rounded-lg p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.lead__name}</p>
                    <p className="text-xs text-gray-500">{new Date(item.next_followup_date).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleFollowUpDone(item.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Mark Done</button>
                    <button onClick={() => navigate('/follow-ups')} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">View</button>
                  </div>
                </div>
              ))}
              {(tasksFollowups.upcoming_followups || []).length === 0 && <p className="text-sm text-gray-500">No upcoming follow-ups.</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-5 shadow-md">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Inventory Alerts</h2>
              <h3 className="text-sm font-semibold text-red-700 mb-2">Low Stock Items</h3>
              <div className="space-y-2 mb-4">
                {(inventory.low_stock_items || []).slice(0, 5).map((item) => (
                  <div key={item.id} className="border border-red-200 bg-red-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-900">{item.product__name}</p>
                      <p className="text-xs text-red-700">{item.product__category || '-'}</p>
                    </div>
                    <span className="text-sm font-bold text-red-800">Qty: {item.quantity}</span>
                  </div>
                ))}
                {(inventory.low_stock_items || []).length === 0 && <p className="text-sm text-gray-500">No low stock alerts.</p>}
              </div>

              <h3 className="text-sm font-semibold text-gray-700 mb-2">Recently Updated Stock</h3>
              <div className="space-y-2">
                {(inventory.recently_updated_stock || []).slice(0, 5).map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.product__name}</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(item.updated_at)}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-md">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Finance Snapshot</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="text-xs text-yellow-700">Loan Pending</div>
                  <div className="text-xl font-bold text-yellow-800">{finance.loans?.pending || 0}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-700">Loan Approved</div>
                  <div className="text-xl font-bold text-green-800">{finance.loans?.approved || 0}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-700">Subsidy Applied</div>
                  <div className="text-xl font-bold text-blue-800">{finance.subsidies?.applied || 0}</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <div className="text-xs text-indigo-700">Subsidy Received</div>
                  <div className="text-xl font-bold text-indigo-800">{finance.subsidies?.received || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-md">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {activities.map((item, idx) => (
              <button
                key={`${item.type}-${item.ref_id}-${idx}`}
                onClick={() => item.path && navigate(item.path)}
                className="w-full text-left border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-800">{item.message}</p>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{formatRelativeTime(item.timestamp)}</span>
                </div>
              </button>
            ))}
            {activities.length === 0 && <p className="text-sm text-gray-500">No recent activity available.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;