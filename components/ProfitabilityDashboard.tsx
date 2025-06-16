import React from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';

export function ProfitabilityDashboard() {
  const { state } = useCostManagement();

  // Calculate total expenses
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate total revenue
  const totalRevenue = state.sales.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);

  // Calculate breakeven point (revenue needed to cover all costs)
  const breakeven = totalExpenses;
  const profit = totalRevenue - totalExpenses;

  // Calculate profit margin for each recipe
  const recipeMargins = state.recipes.map((recipe) => {
    // Find all sales for this recipe
    const sales = state.sales.filter((s) => s.recipeId === recipe.id);
    const revenue = sales.reduce((sum, s) => sum + (s.price * s.quantity), 0);
    // Calculate cost per serving
    const totalIngredientCost = recipe.ingredients.reduce((sum, ingredient) => {
      const product = state.products.find((p) => p.id === ingredient.productId);
      if (!product) return sum;
      const unitCost = product.cost / (product.quantity * product.packageSize);
      return sum + (unitCost * ingredient.quantity);
    }, 0);
    const costPerServing = totalIngredientCost;
    const totalCost = costPerServing * sales.reduce((sum, s) => sum + s.quantity, 0);
    const margin = revenue - totalCost;
    return {
      recipe,
      revenue,
      totalCost,
      margin,
      marginPercent: revenue > 0 ? (margin / revenue) * 100 : 0,
    };
  });

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Breakeven & Profitability Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Breakeven Point</p>
          <p className="text-2xl font-bold text-gray-900">${breakeven.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Profit</p>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profit >= 0 ? '+' : ''}${profit.toFixed(2)}</p>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Menu Item Profitability</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menu Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recipeMargins.map(({ recipe, revenue, totalCost, margin, marginPercent }) => (
                <tr key={recipe.id} className={margin < 0 ? 'bg-red-50' : marginPercent < 20 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{recipe.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${revenue.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${totalCost.toFixed(2)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${margin < 0 ? 'text-red-600' : 'text-gray-900'}`}>{margin >= 0 ? '+' : ''}${margin.toFixed(2)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${marginPercent < 20 ? 'text-yellow-700' : 'text-gray-900'}`}>{marginPercent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 