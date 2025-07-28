"use client"

import { useCostManagement } from '@/contexts/CostManagementContext';

export function DataDebugger() {
  const { state } = useCostManagement();
  
  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
      <h3 className="font-bold">Debug Info:</h3>
      <p>Products: {state.products.length}</p>
      <p>Recipes: {state.recipes.length}</p>
      <p>Expenses: {state.expenses.length}</p>
      <p>Inventory Items: {state.inventory.length}</p>
      <p>Sales Records: {state.sales.length}</p>
      <p>State loaded: {state.products.length > 0 ? 'Yes' : 'No'}</p>
    </div>
  );
} 