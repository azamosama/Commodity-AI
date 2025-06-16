import React, { useState } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { InventoryItem, SalesRecord, Product, Recipe } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export function InventoryTracker() {
  const { state, dispatch } = useCostManagement();
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [quantitySold, setQuantitySold] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);

  // Helper to get remaining stock for a product
  const getRemainingStock = (productId: string) => {
    const inventory = state.inventory.find((i) => i.productId === productId);
    return inventory ? inventory.currentStock : 0;
  };

  // Handle sales submission
  const handleSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipe || quantitySold <= 0) return;
    const recipe = state.recipes.find((r) => r.id === selectedRecipe);
    if (!recipe) return;

    // Update inventory for each ingredient
    recipe.ingredients.forEach((ingredient) => {
      const usedQty = ingredient.quantity * quantitySold;
      const inventory = state.inventory.find((i) => i.productId === ingredient.productId);
      if (inventory) {
        dispatch({
          type: 'UPDATE_INVENTORY',
          payload: {
            ...inventory,
            currentStock: Math.max(0, inventory.currentStock - usedQty),
            lastUpdated: new Date(),
          },
        });
      } else {
        // If not tracked yet, add to inventory
        dispatch({
          type: 'UPDATE_INVENTORY',
          payload: {
            productId: ingredient.productId,
            currentStock: 0,
            unit: ingredient.unit,
            reorderPoint: 0,
            lastUpdated: new Date(),
          },
        });
      }
    });

    // Add sales record
    dispatch({
      type: 'ADD_SALE',
      payload: {
        id: uuidv4(),
        recipeId: selectedRecipe,
        quantity: quantitySold,
        date: new Date(),
        price: salePrice,
      },
    });

    setSelectedRecipe('');
    setQuantitySold(0);
    setSalePrice(0);
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Inventory & Sales Tracker</h2>
      <form onSubmit={handleSale} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Recipe/Menu Item</label>
            <select
              value={selectedRecipe}
              onChange={(e) => setSelectedRecipe(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select a recipe</option>
              {state.recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity Sold</label>
            <input
              type="number"
              value={quantitySold}
              onChange={(e) => setQuantitySold(parseInt(e.target.value))}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sale Price (per unit)</label>
            <input
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(parseFloat(e.target.value))}
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Record Sale & Update Inventory
          </button>
        </div>
      </form>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Current Inventory</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.inventory.map((item) => {
                const product = state.products.find((p) => p.id === item.productId);
                return (
                  <tr key={item.productId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product?.name || item.productId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.currentStock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.lastUpdated).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 