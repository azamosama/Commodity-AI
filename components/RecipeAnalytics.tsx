import React, { useState } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function RecipeAnalytics() {
  const { state } = useCostManagement();
  const recipesWithHistory = state.recipes.filter(r => (r.costHistory && r.costHistory.length > 0) || (r.salesHistory && r.salesHistory.length > 0));
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(
    recipesWithHistory.length > 0 ? recipesWithHistory[0].id : null
  );
  const selectedRecipe = state.recipes.find(r => r.id === selectedRecipeId);

  // Prepare cost history data
  const costData = selectedRecipe?.costHistory?.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    cost: entry.cost,
  })) || [];

  // Prepare sales history data
  const salesData = selectedRecipe?.salesHistory?.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    quantity: entry.quantity,
  })) || [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Recipe/Menu Item Analytics</h3>
      {recipesWithHistory.length === 0 ? (
        <div className="text-gray-500">No recipe analytics available yet.</div>
      ) : (
        <>
          <label className="block mb-2 font-medium">Select Recipe/Menu Item:</label>
          <select
            className="mb-4 p-2 border rounded"
            value={selectedRecipeId || ''}
            onChange={e => setSelectedRecipeId(e.target.value)}
          >
            {recipesWithHistory.map(recipe => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
          </select>

          <div className="mb-8">
            <h4 className="font-medium mb-2">Cost History</h4>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={costData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="cost" stroke="#82ca9d" strokeWidth={2} dot={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Sales History</h4>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={salesData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#8884d8" name="Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 