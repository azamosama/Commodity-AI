import React, { useState, useEffect } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

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
  let timeline: { date: string; type: 'sale' | 'restock' | 'initial'; amount: number; stock: number | null; info?: any }[] = [];
  if (selectedInventory) {
    // 1. Gather all restock events (manual updates where stock increases)
    const stockHistory = [...selectedInventory.stockHistory]
      .map(entry => ({ ...entry, date: new Date(entry.date) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    let prevStock = stockHistory.length > 0 ? stockHistory[0].stock : 0;

    // 2. Gather all sales that use this product
    const salesForProduct = state.sales
      .map(sale => {
        const recipe = state.recipes.find(r => r.id === sale.recipeId);
        if (!recipe) return null;
        const ingredient = recipe.ingredients.find(ing => ing.productId === selectedInventory.productId);
        if (!ingredient) return null;
        // Calculate usage for this sale
        let usage = ingredient.quantity * sale.quantity;
        return {
          date: new Date(sale.date),
          type: 'sale' as const,
          amount: -usage,
          sale,
          recipeName: recipe.name,
        };
      })
      .filter(Boolean) as { date: Date; type: 'sale'; amount: number; sale: any; recipeName: string }[];

    // 3. Find the earliest date among stockHistory and sales
    let allDates = [];
    if (stockHistory.length > 0) allDates.push(stockHistory[0].date);
    if (salesForProduct.length > 0) allDates.push(salesForProduct[0].date);
    const earliestDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();

    // 4. Add explicit initial stock event just before the earliest event
    let initialStock = stockHistory.length > 0 ? stockHistory[0].stock : (state.products.find(p => p.id === selectedInventory.productId)?.quantity || 0);
    // Subtract 1 second to ensure initial stock is first
    const initialStockDate = new Date(earliestDate.getTime() - 1000);
    timeline.push({ date: initialStockDate.toISOString(), type: 'initial', amount: initialStock, stock: initialStock });

    // 5. Add restock events (skip the first, which is initial stock)
    stockHistory.forEach((entry, idx) => {
      if (idx === 0) return;
      if (entry.stock > prevStock) {
        timeline.push({ date: entry.date.toISOString(), type: 'restock', amount: entry.stock - prevStock, stock: entry.stock });
      }
      prevStock = entry.stock;
    });

    // 6. Add sales events
    salesForProduct.forEach(saleEvent => {
      timeline.push({
        date: saleEvent.date.toISOString(),
        type: 'sale',
        amount: saleEvent.amount,
        stock: null,
        info: { sale: saleEvent.sale, recipeName: saleEvent.recipeName },
      });
    });

    // 7. Sort all events by full ISO timestamp
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 8. Replay events to compute stock after each event
    let runningStock = initialStock;
    timeline = timeline.map((event, idx) => {
      if (event.type === 'initial') {
        runningStock = event.stock !== null ? event.stock : runningStock;
      } else if (event.type === 'restock') {
        runningStock = event.stock !== null ? event.stock : runningStock;
      } else if (event.type === 'sale') {
        runningStock += event.amount; // amount is negative
      }
      return { ...event, stock: runningStock };
    });
  }

  // Prepare chart data
  let chartData = timeline.map(event => ({
    date: event.date.slice(0, 10),
    stock: event.stock,
    type: event.type,
    ...(event.info ? { recipe: event.info.recipeName } : {}),
  }));
  // Sort by date ascending
  chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // Add explicit index to each point
  chartData = chartData.map((d, i) => ({ ...d, index: i }));

  // Prepare restock log data
  const restockLog = timeline.filter(event => event.type === 'restock' && event.amount > 0).map(event => ({
    date: event.date.slice(0, 10),
    amount: event.amount,
    stock: event.stock,
  }));

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
                  if (idx === 0 && type === 'initial') {
                    return [`${value} (initial stock)`, 'Stock'];
                  } else if (type === 'sale') {
                    return [`${value} (after sale${props.payload.recipe ? ' of ' + props.payload.recipe : ''})`, 'Stock'];
                  } else if (type === 'restock') {
                    return [`${value} (after restock)`, 'Stock'];
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {restockLog.map((entry, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.amount}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.stock}</td>
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