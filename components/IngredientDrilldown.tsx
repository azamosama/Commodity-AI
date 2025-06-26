import React, { useState } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function IngredientDrilldown() {
  const { state } = useCostManagement();
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(
    state.recipes.length > 0 ? state.recipes[0].id : null
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const selectedRecipe = state.recipes.find(r => r.id === selectedRecipeId);

  const handleToggle = (productId: string) => {
    setExpanded(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Ingredient Drill-Down</h3>
      {state.recipes.length === 0 ? (
        <div className="text-gray-500">No recipes available yet.</div>
      ) : (
        <>
          <label className="block mb-2 font-medium">Select Recipe/Menu Item:</label>
          <select
            className="mb-4 p-2 border rounded"
            value={selectedRecipeId || ''}
            onChange={e => setSelectedRecipeId(e.target.value)}
          >
            {state.recipes.map(recipe => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
          </select>

          {selectedRecipe && (
            <div>
              <h4 className="font-medium mb-2">Ingredients</h4>
              <ul className="divide-y divide-gray-200">
                {selectedRecipe.ingredients.map(ingredient => {
                  const product = state.products.find(p => p.id === ingredient.productId);
                  const inventory = state.inventory.find(i => i.productId === ingredient.productId);
                  return (
                    <li key={ingredient.productId} className="py-4">
                      <button
                        className="w-full text-left font-semibold text-indigo-700 hover:underline focus:outline-none"
                        onClick={() => handleToggle(ingredient.productId)}
                      >
                        {product ? product.name : 'Unknown Ingredient'}
                        <span className="ml-2 text-sm text-gray-500">(Click to {expanded[ingredient.productId] ? 'collapse' : 'expand'})</span>
                      </button>
                      {expanded[ingredient.productId] && (
                        <div className="mt-4 space-y-6">
                          {/* Price History Chart */}
                          <div>
                            <h5 className="font-medium mb-1">Price History</h5>
                            {product && product.priceHistory && product.priceHistory.length > 0 ? (
                              <div style={{ width: '100%', height: 180 }}>
                                <ResponsiveContainer>
                                  <LineChart data={product.priceHistory.map(entry => ({
                                    date: new Date(entry.date).toLocaleDateString(),
                                    price: entry.price,
                                  }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="price" stroke="#ef4444" strokeWidth={2} dot={true} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-sm">No price history available.</div>
                            )}
                          </div>
                          {/* Inventory History Chart */}
                          <div>
                            <h5 className="font-medium mb-1">Inventory Level History</h5>
                            {inventory && inventory.stockHistory && inventory.stockHistory.length > 0 ? (
                              <div style={{ width: '100%', height: 180 }}>
                                <ResponsiveContainer>
                                  <LineChart data={inventory.stockHistory.map(entry => ({
                                    date: new Date(entry.date).toLocaleDateString(),
                                    stock: entry.stock,
                                  }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="stock" stroke="#3b82f6" strokeWidth={2} dot={true} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-sm">No inventory history available.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
} 