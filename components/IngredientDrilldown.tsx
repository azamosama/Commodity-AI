import React, { useState, useEffect } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getInventoryTimeline, TimelineEvent } from '@/lib/utils';

export default function IngredientDrilldown() {
  const { state, isLoading } = useCostManagement();
  const [hasMounted, setHasMounted] = useState(false);
  
  // Hooks must be declared before any conditional returns
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Compute derived data regardless of loading state
  const recipesWithSales = state.recipes.filter(recipe => 
    state.sales.some(sale => sale.recipeName === recipe.name)
  );

  useEffect(() => { setHasMounted(true); }, []);

  // Initialize selected recipe when data becomes available
  useEffect(() => {
    if (recipesWithSales.length > 0 && !selectedRecipeId) {
      setSelectedRecipeId(recipesWithSales[0].id);
    }
  }, [recipesWithSales, selectedRecipeId]);

  if (!hasMounted) return null;

  // Wait for data to be loaded
  if (isLoading || (state.recipes.length === 0 && state.sales.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Ingredient Drill-Down</h3>
        <div className="text-gray-500">Loading data...</div>
      </div>
    );
  }

  const selectedRecipe = state.recipes.find(r => r.id === selectedRecipeId);

  // DEBUG: Log detailed state information
  console.log('[IngredientDrilldown] Debug Info:', {
    recipesWithSales: recipesWithSales.map(r => ({ id: r.id, name: r.name })),
    selectedRecipeId,
    selectedRecipe: selectedRecipe ? { id: selectedRecipe.id, name: selectedRecipe.name } : null,
    productsCount: state.products.length,
    products: state.products.map(p => ({ id: p.id, name: p.name, priceHistory: p.priceHistory?.length || 0 })),
    // Additional debugging
    totalRecipes: state.recipes.length,
    totalSales: state.sales.length,
    isLoading: state.recipes.length === 0 && state.sales.length === 0
  });

  const handleToggle = (productId: string) => {
    setExpanded(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Ingredient Drill-Down</h3>
      {recipesWithSales.length === 0 ? (
        <div className="text-gray-500">No recipes available yet.</div>
      ) : (
        <>
          <label className="block mb-2 font-medium">Select Recipe/Menu Item:</label>
          <select
            className="mb-4 p-2 border rounded"
            value={selectedRecipeId || ''}
            onChange={e => setSelectedRecipeId(e.target.value)}
          >
            {recipesWithSales.map(recipe => (
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
                  const inventoryTimeline: TimelineEvent[] = product ? getInventoryTimeline(product.id, state) : [];
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
                                  <LineChart data={product.priceHistory
                                    .slice()
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .map(entry => ({
                                      date: new Date(entry.date).toISOString().slice(0, 10),
                                      price: entry.price,
                                    }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" domain={['dataMin', 'dataMax']} type="category" />
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
                            {inventoryTimeline.length > 0 ? (
                              <div style={{ width: '100%', height: 180 }}>
                                <ResponsiveContainer>
                                  <LineChart data={inventoryTimeline.map(event => ({
                                    date: event.date.slice(0, 10),
                                    stock: event.stock,
                                  }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" domain={['dataMin', 'dataMax']} type="category" />
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