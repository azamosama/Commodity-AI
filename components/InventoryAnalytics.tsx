import React, { useState, useEffect } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getInventoryTimeline, TimelineEvent } from '@/lib/utils';

export function InventoryAnalytics() {
  const { state } = useCostManagement();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  
  // Mount flag
  useEffect(() => { setHasMounted(true); }, []);

  // Initialize selected product once products are available
  useEffect(() => {
    if (!selectedProductId && state.products.length > 0) {
      setSelectedProductId(state.products[0].id);
    }
  }, [state.products, selectedProductId]);

  if (!hasMounted) return null;
  if (state.products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory Levels (Sales & Restocks)</h3>
        <div className="text-gray-500">Loading data...</div>
      </div>
    );
  }

  // Generate mock inventory data for demo purposes
  const generateMockInventoryData = (productId: string) => {
    const dates = [];
    const today = new Date();
    for (let i = 14; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().slice(0, 10));
    }

    return dates.map((date, index) => ({
      date,
      stock: Math.max(0, 50 - (index * 2) + Math.floor(Math.random() * 10) - 5),
      type: index % 3 === 0 ? 'restock' : 'sale',
      source: index % 3 === 0 ? 'manual' : 'sale'
    }));
  };

  const productOptions = state.products.slice(0, 8); // Show first 8 products
  const selectedProduct = state.products.find(p => p.id === selectedProductId) || productOptions[0];

  // Generate mock chart data
  const chartData = generateMockInventoryData(selectedProduct?.id || '');
  
  // Generate mock restock log data
  const restockLog = chartData
    .filter(item => item.type === 'restock')
    .map(item => ({
      date: item.date,
      amount: Math.floor(Math.random() * 20) + 10,
      stock: item.stock,
      source: item.source,
      cost: selectedProduct?.cost || 0
    }));

  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
      <h3 className="text-lg font-semibold mb-3 sm:mb-4">Inventory Levels (Sales & Restocks)</h3>
      {productOptions.length === 0 ? (
        <div className="text-gray-500">No inventory history available yet.</div>
      ) : (
        <>
          <label className="block mb-2 font-medium text-sm sm:text-base">Select Product:</label>
          <select
            className="mb-4 p-2 border rounded w-full sm:w-auto text-sm sm:text-base"
            value={selectedProductId || ''}
            onChange={e => setSelectedProductId(e.target.value)}
          >
            {productOptions.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="mb-6 sm:mb-8">
            <h4 className="font-medium mb-2 text-sm sm:text-base">Inventory Level Over Time</h4>
            <div style={{ width: '100%', height: '200px' }} className="sm:h-[250px]">
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" domain={['dataMin', 'dataMax']} type="category" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="stock" stroke="#3b82f6" strokeWidth={2} dot={true} name="Stock" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <h4 className="font-medium mb-2 text-sm sm:text-base">Recent Restocks</h4>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Stock After</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {restockLog.map((restock, index) => (
                    <tr key={index}>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{restock.date}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{restock.amount}</div>
                          <div className="text-gray-500 sm:hidden">Stock: {restock.stock}</div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">{restock.stock}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{restock.source}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">${restock.cost?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 