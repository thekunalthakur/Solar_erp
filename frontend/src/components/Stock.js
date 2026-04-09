import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adjustValues, setAdjustValues] = useState({});

  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getStocks();
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setStocks(data);
    } catch (err) {
      setError(err.message || 'Failed to load stock');
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const handleAdjustChange = (stockId, value) => {
    setAdjustValues((prev) => ({ ...prev, [stockId]: value }));
  };

  const getAdjustAmount = (stockId) => {
    const raw = adjustValues[stockId];
    const amount = Number(raw);
    if (!raw || Number.isNaN(amount) || amount <= 0) {
      return 1;
    }
    return Math.floor(amount);
  };

  const handleIncrease = async (stockId) => {
    try {
      const amount = getAdjustAmount(stockId);
      await api.increaseStock(stockId, amount);
      fetchStocks();
    } catch (err) {
      setError(err.message || 'Failed to increase stock');
    }
  };

  const handleDecrease = async (stockId) => {
    try {
      const amount = getAdjustAmount(stockId);
      await api.decreaseStock(stockId, amount);
      fetchStocks();
    } catch (err) {
      setError(err.message || 'Failed to decrease stock');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stock</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Track product quantity and adjust inventory</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Product</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Category</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Quantity</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Adjust</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock, index) => (
                  <tr key={stock.id} className={index % 2 === 0 ? 'bg-white border-b' : 'bg-gray-50 border-b'}>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium">{stock.product_name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{stock.category || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-semibold">{stock.quantity}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <input
                        type="number"
                        min="1"
                        value={adjustValues[stock.id] || ''}
                        onChange={(e) => handleAdjustChange(stock.id, e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                        placeholder="1"
                      />
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleIncrease(stock.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          + Increase
                        </button>
                        <button
                          onClick={() => handleDecrease(stock.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          - Decrease
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stocks.length === 0 && <div className="text-center py-8 text-gray-500">No stock records found.</div>}
        </div>
      </div>
    </div>
  );
};

export default Stock;
