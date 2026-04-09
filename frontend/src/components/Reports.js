import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const Reports = () => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    user: '',
  });

  const [sales, setSales] = useState(null);
  const [leads, setLeads] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [finance, setFinance] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const queryParams = useMemo(() => {
    const params = {};
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.user) params.user = filters.user;
    return params;
  }, [filters]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [salesRes, leadsRes, tasksRes, inventoryRes, financeRes] = await Promise.all([
        api.getSalesReport(queryParams),
        api.getLeadsReport(queryParams),
        api.getTasksReport(queryParams),
        api.getInventoryReport(queryParams),
        api.getFinanceReport(queryParams),
      ]);

      setSales(salesRes.data || {});
      setLeads(leadsRes.data || {});
      setTasks(tasksRes.data || {});
      setInventory(inventoryRes.data || {});
      setFinance(financeRes.data || {});
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.getUsers();
      const usersData = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setUsers(usersData);
    } catch (_err) {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ start_date: '', end_date: '', user: '' });
  };

  if (loading && !sales) {
    return <div className="p-6 text-center text-gray-600">Loading reports...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Reports</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">End Date</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">User</label>
            <select
              name="user"
              value={filters.user}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Report</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg"><p className="text-xs text-gray-500 uppercase">Total Leads</p><p className="text-2xl font-bold">{sales?.total_leads ?? 0}</p></div>
          <div className="p-4 border rounded-lg"><p className="text-xs text-gray-500 uppercase">Won Leads</p><p className="text-2xl font-bold text-green-600">{sales?.won_leads ?? 0}</p></div>
          <div className="p-4 border rounded-lg"><p className="text-xs text-gray-500 uppercase">Lost Leads</p><p className="text-2xl font-bold text-red-600">{sales?.lost_leads ?? 0}</p></div>
          <div className="p-4 border rounded-lg"><p className="text-xs text-gray-500 uppercase">Conversion Rate</p><p className="text-2xl font-bold text-blue-600">{sales?.conversion_rate ?? 0}%</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads by Status</h2>
          <div className="space-y-2">
            {Object.entries(leads?.leads_by_status || {}).length === 0 && (
              <p className="text-gray-500 text-sm">No data available.</p>
            )}
            {Object.entries(leads?.leads_by_status || {}).map(([status, count]) => (
              <div key={status} className="flex justify-between border-b pb-1 text-sm">
                <span className="capitalize">{status.replace('_', ' ')}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads by City</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(leads?.leads_by_city || {}).length === 0 && (
              <p className="text-gray-500 text-sm">No data available.</p>
            )}
            {Object.entries(leads?.leads_by_city || {}).map(([city, count]) => (
              <div key={city} className="flex justify-between border-b pb-1 text-sm">
                <span>{city || 'Unknown'}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks Report</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg"><p className="text-xs text-gray-500 uppercase">Total Tasks</p><p className="text-2xl font-bold">{tasks?.total_tasks ?? 0}</p></div>
          <div className="p-4 border rounded-lg"><p className="text-xs text-gray-500 uppercase">Completed</p><p className="text-2xl font-bold text-green-600">{tasks?.completed_tasks ?? 0}</p></div>
          <div className="p-4 border rounded-lg"><p className="text-xs text-gray-500 uppercase">Pending</p><p className="text-2xl font-bold text-yellow-600">{tasks?.pending_tasks ?? 0}</p></div>
          <div className="p-4 border rounded-lg"><p className="text-xs text-gray-500 uppercase">Overdue</p><p className="text-2xl font-bold text-red-600">{tasks?.overdue_tasks ?? 0}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Report</h2>
          <div className="mb-4 p-4 border rounded-lg">
            <p className="text-xs text-gray-500 uppercase">Total Products</p>
            <p className="text-2xl font-bold">{inventory?.total_products ?? 0}</p>
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Low Stock Items</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {(inventory?.low_stock_items || []).length === 0 && (
              <p className="text-gray-500 text-sm">No low stock items.</p>
            )}
            {(inventory?.low_stock_items || []).map((item) => (
              <div key={item.product_id} className="flex justify-between border-b pb-1 text-sm">
                <span>{item.product_name}</span>
                <span className="font-semibold text-red-600">Qty: {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Finance Report</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg"><p className="text-xs text-gray-500 uppercase">Loans Pending</p><p className="text-2xl font-bold text-yellow-600">{finance?.loans_pending ?? 0}</p></div>
            <div className="p-4 border rounded-lg"><p className="text-xs text-gray-500 uppercase">Loans Approved</p><p className="text-2xl font-bold text-green-600">{finance?.loans_approved ?? 0}</p></div>
            <div className="p-4 border rounded-lg"><p className="text-xs text-gray-500 uppercase">Subsidy Applied</p><p className="text-2xl font-bold text-blue-600">{finance?.subsidy_applied ?? 0}</p></div>
            <div className="p-4 border rounded-lg"><p className="text-xs text-gray-500 uppercase">Subsidy Received</p><p className="text-2xl font-bold text-teal-600">{finance?.subsidy_received ?? 0}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
