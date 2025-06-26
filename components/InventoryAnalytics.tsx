import React, { useState } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function InventoryAnalytics() {
  const { state } = useCostManagement();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    state.products.length > 0 ? state.products[0].id : null
  );

  const productsWithHistory = state.inventory.filter(item => item.stockHistory && item.stockHistory.length > 0);
  const selectedInventory = productsWithHistory.find(item => item.productId === selectedProductId);
  const productOptions = state.products.filter(p => productsWithHistory.some(i => i.productId === p.id));

  // Prepare chart data
  const chartData = selectedInventory
    ? selectedInventory.stockHistory!.map(entry => ({
        date: new Date(entry.date).toLocaleDateString(),
        stock: entry.stock,
      }))
    : [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Inventory Levels Over Time</h3>
      {productOptions.length === 0 ? (
        <div className="text-gray-500">No inventory history available yet.</div>
      ) : (
        <>
          <label className="block mb-2 font-medium">Select Product:</label>
          <select
            className="mb-4 p-2 border rounded"
            value={selectedProductId || ''}
            onChange={e => setSelectedProductId(e.target.value)}
          >
            {productOptions.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="stock" stroke="#8884d8" strokeWidth={2} dot={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
} 