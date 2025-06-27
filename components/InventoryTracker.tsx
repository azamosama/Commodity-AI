import React, { useState } from 'react';
import { useCostManagement, useEditing } from '@/contexts/CostManagementContext';
import { InventoryItem, SalesRecord, Product, Recipe } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Trash } from 'lucide-react';

export function InventoryTracker() {
  const { state, dispatch } = useCostManagement();
  const { isEditing, setIsEditing } = useEditing();
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [quantitySold, setQuantitySold] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<number>(0);
  const [editingReorderPoint, setEditingReorderPoint] = useState<number>(0);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<Partial<SalesRecord> | null>(null);
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState<string>('none');
  const [rangeStart, setRangeStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rangeEnd, setRangeEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  // Helper to get remaining stock for a product
  const getRemainingStock = (productId: string) => {
    const inventory = state.inventory.find((i) => i.productId === productId);
    return inventory ? inventory.currentStock : 0;
  };

  // Helper to generate dates for recurrence
  const getRecurrenceDates = (start: Date, end: Date, type: string) => {
    const dates: Date[] = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      if (type === 'daily') current.setDate(current.getDate() + 1);
      else if (type === 'weekly') current.setDate(current.getDate() + 7);
      else if (type === 'monthly') current.setMonth(current.getMonth() + 1);
      else if (type === 'yearly') current.setFullYear(current.getFullYear() + 1);
      else break;
    }
    return dates;
  };

  // Handle sales submission (single or recurring)
  const handleSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipe || quantitySold <= 0) return;
    const recipe = state.recipes.find((r) => r.id === selectedRecipe);
    if (!recipe) return;

    // Determine sale dates
    let saleDates: Date[] = [];
    if (recurrence === 'none') {
      saleDates = [new Date(saleDate)];
    } else {
      saleDates = getRecurrenceDates(new Date(rangeStart), new Date(rangeEnd), recurrence);
    }

    // Initialize local inventory map
    const localInventory: Record<string, number> = {};
    state.products.forEach(product => {
      const item = state.inventory.find(i => i.productId === product.id);
      localInventory[product.id] = item ? item.currentStock : product.quantity * (product.unitsPerPackage || 0);
    });

    saleDates.forEach(date => {
      // Update inventory for each ingredient
      recipe.ingredients.forEach((ingredient) => {
        const usedQty = ingredient.quantity * quantitySold;
        const prevStock = localInventory[ingredient.productId] ?? 0;
        const newStock = Math.max(0, prevStock - usedQty);
        localInventory[ingredient.productId] = newStock;
        const inventory = state.inventory.find((i) => i.productId === ingredient.productId);
        const product = state.products.find((p) => p.id === ingredient.productId);
        const unit = product ? product.unit : ingredient.unit;
        if (inventory) {
          dispatch({
            type: 'UPDATE_INVENTORY',
            payload: {
              ...inventory,
              currentStock: newStock,
              lastUpdated: date,
              unit,
            },
          });
        } else {
          const initialStock = product ? product.quantity * (product.unitsPerPackage || 0) : 0;
          dispatch({
            type: 'UPDATE_INVENTORY',
            payload: {
              productId: ingredient.productId,
              currentStock: newStock,
              unit,
              reorderPoint: 0,
              lastUpdated: date,
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
          date: date,
          price: salePrice,
        },
      });
    });

    setSelectedRecipe('');
    setQuantitySold(0);
    setSalePrice(0);
    setSaleDate(new Date().toISOString().split('T')[0]);
    setRecurrence('none');
    setRangeStart(new Date().toISOString().split('T')[0]);
    setRangeEnd(new Date().toISOString().split('T')[0]);
    setIsEditing(false);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItemId(item.productId);
    setEditingStock(item.currentStock);
    setEditingReorderPoint(item.reorderPoint);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditingItemId(null);
    setEditingStock(0);
    setEditingReorderPoint(0);
    setIsEditing(false);
  };

  const handleSave = (productId: string) => {
    const inventory = state.inventory.find((i) => i.productId === productId);
    if (inventory) {
      dispatch({
        type: 'UPDATE_INVENTORY',
        payload: {
          ...inventory,
          currentStock: editingStock,
          reorderPoint: editingReorderPoint,
          lastUpdated: new Date(),
        },
      });
      handleCancel();
    }
    setIsEditing(false);
  };

  // Sales record edit handlers
  const handleEditSale = (sale: SalesRecord) => {
    setEditingSaleId(sale.id);
    setEditingSale({ ...sale });
    setIsEditing(true);
  };

  const handleCancelEditSale = () => {
    setEditingSaleId(null);
    setEditingSale(null);
    setIsEditing(false);
  };

  const handleSaveEditSale = () => {
    if (editingSale && editingSaleId) {
      dispatch({ type: 'UPDATE_SALE', payload: { ...editingSale, id: editingSaleId } as SalesRecord });
      setEditingSaleId(null);
      setEditingSale(null);
    }
    setIsEditing(false);
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
              onFocus={() => setIsEditing(true)}
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
              onFocus={() => setIsEditing(true)}
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
              onFocus={() => setIsEditing(true)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Sale Date</label>
            <input
              type="date"
              value={saleDate}
              onChange={e => setSaleDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={recurrence !== 'none'}
              onFocus={() => setIsEditing(true)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Recurrence</label>
            <select
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              onFocus={() => setIsEditing(true)}
            >
              <option value="none">None (single sale)</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          {recurrence !== 'none' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Range Start</label>
                <input
                  type="date"
                  value={rangeStart}
                  onChange={e => setRangeStart(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  onFocus={() => setIsEditing(true)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Range End</label>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={e => setRangeEnd(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  onFocus={() => setIsEditing(true)}
                />
              </div>
            </>
          )}
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

      {/* Sales Records Table */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Sales Records</h3>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipe/Menu Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Price (per unit)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.sales.map((sale) => {
                const recipe = state.recipes.find((r) => r.id === sale.recipeId);
                if (editingSaleId === sale.id && editingSale) {
                  return (
                    <tr key={sale.id} className="bg-yellow-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <select
                          value={editingSale.recipeId}
                          onChange={e => setEditingSale({ ...editingSale, recipeId: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm"
                          onFocus={() => setIsEditing(true)}
                        >
                          <option value="">Select a recipe</option>
                          {state.recipes.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <input
                          type="number"
                          value={editingSale.quantity}
                          min="0"
                          onChange={e => setEditingSale({ ...editingSale, quantity: parseInt(e.target.value) })}
                          className="block w-full rounded-md border-gray-300 shadow-sm"
                          onFocus={() => setIsEditing(true)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <input
                          type="number"
                          value={editingSale.price}
                          min="0"
                          step="0.01"
                          onChange={e => setEditingSale({ ...editingSale, price: parseFloat(e.target.value) })}
                          className="block w-full rounded-md border-gray-300 shadow-sm"
                          onFocus={() => setIsEditing(true)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.date instanceof Date ? sale.date.toLocaleDateString() : new Date(sale.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button onClick={handleSaveEditSale} className="text-green-600 hover:text-green-900 mr-2">Save</button>
                        <button onClick={handleCancelEditSale} className="text-gray-600 hover:text-gray-900">Cancel</button>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{recipe ? recipe.name : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${sale.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.date instanceof Date ? sale.date.toLocaleDateString() : new Date(sale.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 mr-2"
                        onClick={() => dispatch({ type: 'DELETE_SALE', payload: sale.id })}
                        title="Delete Sale Record"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleEditSale(sale)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Current Inventory</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Point</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used In Recipes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shrinkage %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.products.map((product) => {
                const item = state.inventory.find((i) => i.productId === product.id);
                const currentStock = item ? item.currentStock : (product.quantity * (product.unitsPerPackage || 1));
                const totalStock = product.quantity * (product.unitsPerPackage || 1);
                const usedInRecipes = state.recipes
                  .filter((recipe) => recipe.ingredients.some((ing) => ing.productId === product.id))
                  .map((recipe) => recipe.name)
                  .join(', ');
                return (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currentStock} / {totalStock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item ? item.reorderPoint : 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item ? new Date(item.lastUpdated).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usedInRecipes || '-'}</td>
                    {/* Variance column */}
                    {(() => {
                      const purchased = product.quantity * (product.unitsPerPackage || 0);
                      let used = 0;
                      state.recipes.forEach(recipe => {
                        const ingredient = recipe.ingredients.find(ing => ing.productId === product.id);
                        if (ingredient) {
                          const numSold = state.sales.filter(s => s.recipeId === recipe.id).reduce((sum, s) => sum + s.quantity, 0);
                          used += ingredient.quantity * numSold;
                        }
                      });
                      const variance = purchased - used;
                      const shrinkage = purchased > 0 ? ((variance) / purchased) * 100 : 0;
                      return [
                        <td key="variance" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{variance}</td>,
                        <td key="shrinkage" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shrinkage.toFixed(1)}%</td>
                      ];
                    })()}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 mr-2"
                        onClick={() => dispatch({ type: 'DELETE_INVENTORY', payload: product.id })}
                        title="Delete Inventory Record"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                      {item ? (
                        <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                      ) : null}
                    </td>
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