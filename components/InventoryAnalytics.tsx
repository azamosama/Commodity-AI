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
        let matchedEvent = null as any;
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
            {productOptions.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="mb-8">
            <h4 className="font-medium mb-2">Inventory Level Over Time</h4>
            <div style={{ width: '100%', height: 250 }}>
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
        </>
      )}
    </div>
  );
} 