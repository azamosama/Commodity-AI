import React, { useState, useEffect } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getInventoryTimeline, TimelineEvent } from '@/lib/utils';

export function InventoryAnalytics() {
  const { state } = useCostManagement();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    state.products.length > 0 ? state.products[0].id : null
  );
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);
  if (!hasMounted) return null;

  const productsWithHistory = state.inventory.filter(item => item.stockHistory && item.stockHistory.length > 0);
  const selectedInventory = productsWithHistory.find(item => item.productId === selectedProductId);
  // DEBUG: Print stockHistory for the selected product
  if (selectedInventory) {
    console.log("[DEBUG] Stock History for", selectedInventory.productId, selectedInventory.stockHistory);
  }
  const productOptions = state.products.filter(p => productsWithHistory.some(i => i.productId === p.id));

  // --- Replay logic ---
  let timeline: TimelineEvent[] = [];
  if (selectedInventory) {
    timeline = getInventoryTimeline(selectedInventory.productId, state);
  }

  // Prepare chart data
  let chartData = timeline.map(event => ({
    date: event.date.slice(0, 10),
    stock: event.stock,
    type: event.type,
    ...(event.info ? { recipe: event.info.recipeName } : {}),
    ...(event.source ? { source: event.source } : {}),
  }));
  // Sort by date ascending
  chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // Add explicit index to each point
  chartData = chartData.map((d, i) => ({ ...d, index: i }));

  // Prepare restock log data
  let restockLog: { date: string; amount: number; stock: number; source: string; cost?: number }[] = [];
  if (selectedInventory) {
    // Manual restocks from restockHistory, using timeline for stock after restock
    const product = state.products.find(p => p.id === selectedInventory.productId);
    if (product && Array.isArray(product.restockHistory)) {
      // Get all manual restock events from timeline in order
      const timelineManualRestocks = timeline.filter(event => event.type === 'restock' && event.source === 'manual');
      let timelineIdx = 0;
      product.restockHistory.forEach(restock => {
        // Find the next matching manual restock event in timeline (in order)
        let matchedEvent = null;
        while (timelineIdx < timelineManualRestocks.length) {
          const event = timelineManualRestocks[timelineIdx];
          timelineIdx++;
          // Match by date (to the day) and amount (float-safe)
          if (event.date.slice(0, 10) === restock.date.slice(0, 10) && Math.abs(event.amount - restock.quantity) < 1e-6) {
            matchedEvent = event;
            break;
          }
        }
        restockLog.push({
          date: restock.date.slice(0, 10),
          amount: restock.quantity,
          stock: matchedEvent ? matchedEvent.stock ?? NaN : NaN,
          source: 'manual',
          cost: restock.cost,
        });
      });
    }
    // Resets/quantity changes from stockHistory with source 'reset', using timeline for stock after reset
    selectedInventory.stockHistory.forEach(entry => {
      if (entry.source === 'reset') {
        const timelineEvent = timeline.find(event =>
          event.type === 'restock' &&
          event.source === 'reset' &&
          event.date.slice(0, 10) === entry.date.slice(0, 10)
        );
        restockLog.push({
          date: entry.date.slice(0, 10),
          amount: entry.stock, // this is the new quantity after reset
          stock: timelineEvent ? timelineEvent.stock ?? NaN : entry.stock,
          source: 'reset',
        });
      }
    });
    // Sort by date
    restockLog.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Inventory Levels (Sales & Restocks)</h3>
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
                <XAxis dataKey="date" domain={['dataMin', 'dataMax']} type="category" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value, name, props) => {
                  const idx = props && props.payload && props.payload.index !== undefined ? props.payload.index : null;
                  const type = props && props.payload && props.payload.type;
                  const source = props && props.payload && props.payload.source;
                  if (idx === 0 && type === 'initial') {
                    return [`${value} (initial stock)`, 'Stock'];
                  } else if (type === 'sale') {
                    return [`${value} (after sale${props.payload.recipe ? ' of ' + props.payload.recipe : ''})`, 'Stock'];
                  } else if (type === 'restock') {
                    if (source === 'reset') {
                      return [`${value} (after quantity reset)`, 'Stock'];
                    } else {
                      return [`${value} (after manual restock)`, 'Stock'];
                    }
                  }
                  return [`${value}`, 'Stock'];
                }} />
                <Line type="monotone" dataKey="stock" stroke="#8884d8" strokeWidth={2} dot={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Restock Log */}
          <div className="mt-8">
            <h4 className="text-md font-semibold mb-2">Restock Log</h4>
            {restockLog.length === 0 ? (
              <div className="text-gray-500">No restocks recorded for this product.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 bg-white rounded shadow">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Restocked</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock After Restock</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {restockLog.map((entry, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.amount}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{Number.isFinite(entry.stock) ? entry.stock : "N/A"}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.source === 'reset' ? 'Quantity Change' : 'Manual'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
} 