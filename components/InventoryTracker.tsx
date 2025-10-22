import React, { useState, useEffect } from 'react';
import { useCostManagement, useEditing } from '@/contexts/CostManagementContext';
import { InventoryItem, SalesRecord, Product, Recipe } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Trash } from 'lucide-react';
import { calculateTotalUnits } from '@/lib/utils';
import ExportButton from './ExportButton';
import { DataSyncStatus } from './DataSyncStatus';

export function InventoryTracker() {
  const { state, dispatch, isLoading } = useCostManagement();
  const { isEditing, setIsEditing } = useEditing();
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [quantitySold, setQuantitySold] = useState<string>('0');
  const [salePrice, setSalePrice] = useState<string>('0');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<number>(0);
  const [editingReorderPoint, setEditingReorderPoint] = useState<number>(0);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<Partial<SalesRecord> | null>(null);
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState<string>('none');
  const [rangeStart, setRangeStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rangeEnd, setRangeEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-3 sm:mb-4">Inventory & Sales Tracking</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading inventory data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
      <h3 className="text-lg font-semibold mb-3 sm:mb-4">Inventory & Sales Tracking</h3>
      
      <div className="mb-6">
        <h4 className="text-sm sm:text-base font-medium mb-3 text-gray-700">Current Inventory ({state.products.length} items)</h4>
        {state.products.length > 0 ? (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.products.map((product, idx) => (
                  <tr key={`${product.id}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-gray-500 sm:hidden mt-1">{product.category}</div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 text-sm text-gray-500 hidden sm:table-cell">{product.category}</td>
                    <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 text-sm text-gray-500">{product.packageSize || 0}</td>
                    <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 text-sm text-gray-500 font-medium">${(product.cost || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No products in inventory</p>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-sm sm:text-base font-medium mb-3 text-gray-700">Sales Records ({state.sales.length} records)</h4>
        {state.sales.length > 0 ? (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipe</th>
                  <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Quantity</th>
                  <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.sales.map((sale, idx) => (
                  <tr key={`${sale.id}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 text-sm text-gray-900">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 text-sm text-gray-500">
                      <div>
                        <div className="font-medium">{sale.recipeName}</div>
                        <div className="text-xs text-gray-500 sm:hidden mt-1">Qty: {sale.quantity}</div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 text-sm text-gray-500 hidden sm:table-cell">{sale.quantity}</td>
                    <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 text-sm text-gray-500 font-medium">${(sale.salePrice || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No sales records</p>
        )}
      </div>

      <div>
        <h4 className="text-md font-medium mb-3">Expense Tracking ({state.expenses.length} expenses)</h4>
        {state.expenses.length > 0 ? (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.expenses.map((expense, idx) => (
                  <tr key={`${expense.id}-${idx}`}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(expense.amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No expenses recorded</p>
        )}
      </div>
    </div>
  );

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

  // Helper to ensure date is always a string in 'YYYY-MM-DD' format
  function toDateInputString(date: string | Date | undefined): string {
    if (!date) return '';
    if (typeof date === 'string') {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
      // Otherwise, try to parse as date string
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    }
    // If a Date object
    return date.toISOString().split('T')[0];
  }

  // Handle sales submission (single or recurring)
  const handleSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipe || quantitySold === '0' || salePrice === '0') return;

    const recipe = state.recipes.find((r) => r.id === selectedRecipe);
    if (!recipe) return;

    // Determine sale dates
    let saleDates: Date[] = [];
    if (recurrence === 'none') {
      saleDates = [new Date(saleDate)];
    } else {
      saleDates = getRecurrenceDates(new Date(rangeStart), new Date(rangeEnd), recurrence);
    }

    // Calculate inventory changes for all ingredients
    const localInventory: { [key: string]: number } = {};
    state.products.forEach((product) => {
      const item = state.inventory.find((i) => i.productId === product.id);
      localInventory[product.id] = item ? item.currentStock : calculateTotalUnits(product);
    });

    saleDates.forEach(date => {
      // Calculate usage for this sale
      recipe.ingredients.forEach((ingredient) => {
        const product = state.products.find((p) => p.id === ingredient.productId);
        if (product) {
          const ingredientQty = typeof ingredient.quantity === 'string' ? parseFloat(ingredient.quantity) || 0 : ingredient.quantity || 0;
          let usage = ingredientQty * parseInt(quantitySold);
          
          // Convert to base units if needed
          if (ingredient.unit === 'count' && product.unitsPerPackage) {
            usage = ingredientQty * parseInt(quantitySold);
          } else if (ingredient.unit === product.unit) {
            usage = ingredientQty * parseInt(quantitySold);
          }
          
          localInventory[product.id] = (localInventory[product.id] || 0) - usage;
        }
      });

      // Update inventory for all affected products
      Object.entries(localInventory).forEach(([productId, newStock]) => {
        const existingItem = state.inventory.find((i) => i.productId === productId);
        const product = state.products.find((p) => p.id === productId);
        if (product) {
          if (existingItem) {
            dispatch({
              type: 'UPDATE_INVENTORY',
              payload: {
                ...existingItem,
                currentStock: newStock,
                lastUpdated: date.toISOString(),
              },
            });
          } else {
            dispatch({
              type: 'UPDATE_INVENTORY',
              payload: {
                productId,
                currentStock: newStock,
                unit: product.unit,
                reorderPoint: 0,
                lastUpdated: date.toISOString(),
                stockHistory: [{ date: date.toISOString(), stock: newStock }],
              },
            });
          }
        }
      });

      // Add sales record
      dispatch({
        type: 'ADD_SALE',
        payload: {
          id: uuidv4(),
          recipeName: selectedRecipe,
          quantity: parseInt(quantitySold),
          date: date.toISOString(),
          salePrice: parseFloat(salePrice),
        },
      });
    });

    setSelectedRecipe('');
    setQuantitySold('0');
    setSalePrice('0');
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
          lastUpdated: new Date().toISOString(),
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
      dispatch({ type: 'UPDATE_SALE', payload: { ...editingSale, id: editingSaleId, date: editingSale.date } as SalesRecord });
      setEditingSaleId(null);
      setEditingSale(null);
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Inventory & Sales Tracker</h2>
        <DataSyncStatus />
      </div>
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
              onChange={(e) => setQuantitySold(e.target.value)}
              onBlur={(e) => {
                if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                  setQuantitySold('0');
                }
              }}
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
              onChange={(e) => setSalePrice(e.target.value)}
              onBlur={(e) => {
                if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
                  setSalePrice('0');
                }
              }}
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
          <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Sales Records</h3>
          <ExportButton 
            data={state.sales} 
            dataType="sales" 
            variant="outline"
            size="sm"
            additionalData={{ recipes: state.recipes }}
          />
        </div>
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
                {state.sales
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((sale) => {
                  if (editingSaleId === sale.id && editingSale) {
                    return (
                      <tr key={sale.id} className="bg-yellow-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <select
                            value={editingSale.recipeName || ''}
                            onChange={e => setEditingSale({ ...editingSale, recipeName: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm"
                            onFocus={() => setIsEditing(true)}
                          >
                            <option value="">Select a recipe</option>
                            {state.recipes.map((r) => (
                              <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <input
                            type="number"
                            value={editingSale.quantity || 0}
                            min="0"
                            onChange={e => {
                              const value = e.target.value;
                              setEditingSale({ ...editingSale, quantity: value === '' ? 0 : parseInt(value) || 0 });
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm"
                            onFocus={() => setIsEditing(true)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <input
                            type="number"
                            value={editingSale.salePrice || 0}
                            min="0"
                            step="0.01"
                            onChange={e => {
                              const value = e.target.value;
                              setEditingSale({ ...editingSale, salePrice: value === '' ? 0 : parseFloat(value) || 0 });
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm"
                            onFocus={() => setIsEditing(true)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="date"
                            value={toDateInputString(editingSale.date)}
                            onChange={e => setEditingSale({ ...editingSale, date: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm"
                            onFocus={() => setIsEditing(true)}
                          />
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.recipeName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${sale.salePrice ? sale.salePrice.toFixed(2) : '0.00'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {toDateInputString(sale.date)}
                      </td>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Current Inventory</h3>
          <ExportButton 
            data={state.products} 
            dataType="inventory" 
            variant="outline"
            size="sm"
            additionalData={{ inventory: state.inventory, recipes: state.recipes, sales: state.sales }}
          />
        </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restock Recommendation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.products.map((product, idx) => {
                const item = state.inventory.find((i) => i.productId === product.id);
                // Show true currentStock, even if negative or positive
                const currentStock = item ? item.currentStock : calculateTotalUnits(product);
                const totalStock = calculateTotalUnits(product);
                const usedInRecipes = state.recipes
                  .filter((recipe) => recipe.ingredients.some((ing) => ing.productId === product.id))
                  .map((recipe) => recipe.name)
                  .join(', ');
                const purchased = calculateTotalUnits(product);
                return (
                  <tr key={`${product.id}-${idx}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 font-medium">Edit:</span>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={currentStock}
                            onChange={(e) => {
                              const newStockValue = Number(e.target.value) || 0;
                              if (item) {
                                const updatedStockHistory = [
                                  ...(item.stockHistory || []),
                                  { date: new Date().toISOString(), stock: newStockValue, source: 'manual-edit' }
                                ];
                                dispatch({
                                  type: 'UPDATE_INVENTORY',
                                  payload: {
                                    ...item,
                                    currentStock: newStockValue,
                                    lastUpdated: new Date().toISOString(),
                                    stockHistory: updatedStockHistory,
                                  },
                                });
                              } else {
                                // Create new inventory item if it doesn't exist
                                const newItem: InventoryItem = {
                                  productId: product.id,
                                  currentStock: newStockValue,
                                  unit: product.unit,
                                  reorderPoint: 0,
                                  lastUpdated: new Date().toISOString(),
                                  stockHistory: [{ date: new Date().toISOString(), stock: newStockValue, source: 'manual-edit' }],
                                };
                                dispatch({
                                  type: 'UPDATE_INVENTORY',
                                  payload: newItem,
                                });
                              }
                            }}
                            className={`w-16 px-2 py-1 border rounded text-center text-sm ${
                              currentStock < (item ? item.reorderPoint : 0) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            onFocus={() => setIsEditing(true)}
                          />
                          <span className="text-gray-500 text-xs">/</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={totalStock}
                            onChange={(e) => {
                              const newTotalStock = Number(e.target.value) || 0;
                              // Update the product's package size to reflect the new total
                              dispatch({
                                type: 'UPDATE_PRODUCT',
                                payload: {
                                  ...product,
                                  packageSize: newTotalStock,
                                },
                              });
                            }}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            onFocus={() => setIsEditing(true)}
                          />
                        </div>
                        <span className="text-gray-500 text-xs">{product.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="number"
                        min={0}
                        value={item ? item.reorderPoint : 0}
                        onChange={e => {
                          const newReorderPoint = parseInt(e.target.value, 10) || 0;
                          if (item) {
                            dispatch({
                              type: 'UPDATE_INVENTORY',
                              payload: {
                                ...item,
                                reorderPoint: newReorderPoint,
                                lastUpdated: item.lastUpdated,
                              },
                            });
                          }
                        }}
                        onBlur={e => {
                          // Optionally, you can persist the change here if needed
                        }}
                        className="w-16 px-2 py-1 border rounded text-center"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item ? item.lastUpdated : '').toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usedInRecipes || '-'}</td>
                    {/* Variance column */}
                    {(() => {
                      let used = 0;
                      state.recipes.forEach(recipe => {
                        const ingredient = recipe.ingredients.find(ing => ing.productId === product.id);
                        if (ingredient) {
                          const numSold = state.sales.filter(s => s.recipeName === recipe.name).reduce((sum, s) => sum + s.quantity, 0);
                          const ingredientQty = typeof ingredient.quantity === 'string' ? parseFloat(ingredient.quantity) || 0 : ingredient.quantity || 0;
                          used += ingredientQty * numSold;
                        }
                      });
                      const variance = purchased - used;
                      const shrinkage = purchased > 0 ? ((variance) / purchased) * 100 : 0;
                      return [
                        <td key="variance" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{variance}</td>,
                        <td key="shrinkage" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shrinkage.toFixed(1)}%</td>
                      ];
                    })()}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {currentStock <= (item ? item.reorderPoint : 0) ? (
                        <span
                          className="text-green-600 font-semibold cursor-help"
                          title={`You have ${currentStock} ${product.unit} left, which is at or below your reorder point (${item ? item.reorderPoint : 0} ${product.unit}). Consider restocking soon.`}
                        >
                          ✔
                        </span>
                      ) : null}
                    </td>
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