import React, { useState } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function ProfitabilityDashboard() {
  const { state } = useCostManagement();
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const toggleExpanded = (recipeId: string) => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

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
      let costPerUnit = 0;
      let displayUnit = ingredient.unit;
      if (ingredient.unit === 'count' && product.unitsPerPackage) {
        costPerUnit = product.cost / product.unitsPerPackage;
        displayUnit = 'count';
      } else if (ingredient.unit === product.unit && product.packageSize) {
        costPerUnit = product.cost / product.packageSize;
        displayUnit = product.unit;
      }
      const ingredientCost = ingredient.quantity * costPerUnit;
      return sum + ingredientCost;
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

  // --- Breakeven Breakdown Logic ---
  // Helper to normalize recurring expenses to annual, monthly, weekly, daily
  const getPeriodAmount = (amount: number, frequency?: string) => {
    switch (frequency) {
      case 'daily':
        return {
          year: amount * 365,
          month: amount * 30,
          week: amount * 7,
          day: amount,
        };
      case 'weekly':
        return {
          year: amount * 52,
          month: (amount * 52) / 12,
          week: amount,
          day: amount / 7,
        };
      case 'monthly':
        return {
          year: amount * 12,
          month: amount,
          week: (amount * 12) / 52,
          day: (amount * 12) / 365,
        };
      default:
        return {
          year: amount,
          month: amount / 12,
          week: amount / 52,
          day: amount / 365,
        };
    }
  };

  // Aggregate expenses by category and frequency
  const categories = Array.from(new Set(state.expenses.map(e => e.category)));
  const expenseBreakdown: Record<string, { year: number; month: number; week: number; day: number }> = {};
  categories.forEach(category => {
    const catExpenses = state.expenses.filter(e => e.category === category);
    let year = 0, month = 0, week = 0, day = 0;
    catExpenses.forEach(e => {
      const freq = e.recurring ? e.frequency : undefined;
      const period = getPeriodAmount(e.amount, freq);
      year += period.year;
      month += period.month;
      week += period.week;
      day += period.day;
    });
    expenseBreakdown[category] = { year, month, week, day };
  });

  // Calculate actual COGS (food cost) from sales/recipes
  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;
  const salesWithDates = state.sales.map(sale => ({ ...sale, date: new Date(sale.date) }));
  // Group sales by period
  let cogsYear = 0, cogsMonth = 0, cogsWeek = 0;
  const cogsByDay: Record<string, number> = {};
  salesWithDates.forEach(sale => {
    const recipe = state.recipes.find(r => r.id === sale.recipeId);
    if (!recipe) return;
    let totalIngredientCost = 0;
    recipe.ingredients.forEach(ingredient => {
      const product = state.products.find(p => p.id === ingredient.productId);
      if (!product) return;
      let costPerUnit = 0;
      if (ingredient.unit === 'count' && product.unitsPerPackage) {
        costPerUnit = product.cost / product.unitsPerPackage;
      } else if (ingredient.unit === product.unit && product.packageSize) {
        costPerUnit = product.cost / product.packageSize;
      }
      totalIngredientCost += ingredient.quantity * costPerUnit * sale.quantity;
    });
    // Group by day (YYYY-MM-DD)
    const dayKey = sale.date.toISOString().split('T')[0];
    cogsByDay[dayKey] = (cogsByDay[dayKey] || 0) + totalIngredientCost;
    // For year, month, week sums
    const daysAgo = Math.floor((Number(now) - Number(sale.date)) / msInDay);
    if (daysAgo < 7) cogsWeek += totalIngredientCost;
    if (daysAgo < 30) cogsMonth += totalIngredientCost;
    if (daysAgo < 365) cogsYear += totalIngredientCost;
  });
  // Per day: show the most recent day's COGS (or 0 if none)
  let cogsDay = 0;
  const sortedDays = Object.keys(cogsByDay).sort().reverse();
  if (sortedDays.length > 0) {
    cogsDay = cogsByDay[sortedDays[0]];
  }
  expenseBreakdown['Food (COGS)'] = {
    year: cogsYear,
    month: cogsMonth,
    week: cogsWeek,
    day: cogsDay,
  };

  // Calculate total breakeven for each period
  const totalYear = Object.values(expenseBreakdown).reduce((sum, v) => sum + (v as { year: number }).year, 0);
  const totalMonth = Object.values(expenseBreakdown).reduce((sum, v) => sum + (v as { month: number }).month, 0);
  const totalWeek = Object.values(expenseBreakdown).reduce((sum, v) => sum + (v as { week: number }).week, 0);
  const totalDay = Object.values(expenseBreakdown).reduce((sum, v) => sum + (v as { day: number }).day, 0);

  // Calculate averages
  // Helper to get week, month, year keys
  const getWeekKey = (date: Date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = Math.floor((d.getTime() - firstDayOfYear.getTime()) / msInDay);
    return `${d.getFullYear()}-W${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
  };
  const getMonthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}`;
  const getYearKey = (date: Date) => `${date.getFullYear()}`;

  const cogsByWeek: Record<string, number> = {};
  const cogsByMonth: Record<string, number> = {};
  const cogsByYear: Record<string, number> = {};
  salesWithDates.forEach(sale => {
    const recipe = state.recipes.find(r => r.id === sale.recipeId);
    if (!recipe) return;
    let totalIngredientCost = 0;
    recipe.ingredients.forEach(ingredient => {
      const product = state.products.find(p => p.id === ingredient.productId);
      if (!product) return;
      let costPerUnit = 0;
      if (ingredient.unit === 'count' && product.unitsPerPackage) {
        costPerUnit = product.cost / product.unitsPerPackage;
      } else if (ingredient.unit === product.unit && product.packageSize) {
        costPerUnit = product.cost / product.packageSize;
      }
      totalIngredientCost += ingredient.quantity * costPerUnit * sale.quantity;
    });
    // Group by week, month, year
    const weekKey = getWeekKey(sale.date);
    const monthKey = getMonthKey(sale.date);
    const yearKey = getYearKey(sale.date);
    cogsByWeek[weekKey] = (cogsByWeek[weekKey] || 0) + totalIngredientCost;
    cogsByMonth[monthKey] = (cogsByMonth[monthKey] || 0) + totalIngredientCost;
    cogsByYear[yearKey] = (cogsByYear[yearKey] || 0) + totalIngredientCost;
  });
  const avgDay = Object.keys(cogsByDay).length > 0 ? Object.values(cogsByDay).reduce((a, b) => a + b, 0) / Object.keys(cogsByDay).length : 0;
  const avgWeek = Object.keys(cogsByWeek).length > 0 ? Object.values(cogsByWeek).reduce((a, b) => a + b, 0) / Object.keys(cogsByWeek).length : 0;
  const avgMonth = Object.keys(cogsByMonth).length > 0 ? Object.values(cogsByMonth).reduce((a, b) => a + b, 0) / Object.keys(cogsByMonth).length : 0;
  const avgYear = Object.keys(cogsByYear).length > 0 ? Object.values(cogsByYear).reduce((a, b) => a + b, 0) / Object.keys(cogsByYear).length : 0;

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Breakeven & Profitability Dashboard</h2>
      {/* Breakeven Breakdown Section */}
      <div className="border-t pt-6 mb-8">
        <h3 className="text-lg font-medium mb-4">Breakeven Breakdown</h3>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Per Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Per Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Per Week</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Per Day</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(expenseBreakdown).map(([category, v]) => {
                const val = v as { year: number; month: number; week: number; day: number };
                const isCOGS = category === 'Food (COGS)';
                return (
                  <tr key={category}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${val.year.toFixed(2)}{isCOGS && ` (avg $${avgYear.toFixed(2)})`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${val.month.toFixed(2)}{isCOGS && ` (avg $${avgMonth.toFixed(2)})`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${val.week.toFixed(2)}{isCOGS && ` (avg $${avgWeek.toFixed(2)})`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${val.day.toFixed(2)}{isCOGS && ` (avg $${avgDay.toFixed(2)})`}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-bold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total Breakeven</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${totalYear.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${totalMonth.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${totalWeek.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${totalDay.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="text-sm text-gray-600">This is the minimum revenue you need to break even, including all fixed and variable (food/COGS) expenses, based on your actual sales and expense records.</div>
      </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recipeMargins.map(({ recipe, revenue, totalCost, margin, marginPercent }) => (
                <React.Fragment key={recipe.id}>
                  <tr key={recipe.id} className={margin < 0 ? 'bg-red-50' : marginPercent < 20 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{recipe.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${revenue.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${totalCost.toFixed(2)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${margin < 0 ? 'text-red-600' : 'text-gray-900'}`}>{margin >= 0 ? '+' : ''}${margin.toFixed(2)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${marginPercent < 20 ? 'text-yellow-700' : 'text-gray-900'}`}>{marginPercent.toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toggleExpanded(recipe.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {expandedRecipeId === recipe.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </td>
                  </tr>
                  {expandedRecipeId === recipe.id && (
                    <tr>
                      <td colSpan={6} className="p-4 bg-gray-50">
                        <h4 className="font-semibold mb-2">Ingredient Breakdown for {recipe.name}</h4>
                        {/* Per Serving Breakdown */}
                        <div className="mb-2">
                          <div className="font-semibold">Per Serving:</div>
                          <ul className="list-disc list-inside">
                            {recipe.ingredients.map(ingredient => {
                              const product = state.products.find(p => p.id === ingredient.productId);
                              if (!product) return null;
                              let costPerUnit = 0;
                              let displayUnit = ingredient.unit;
                              if (ingredient.unit === 'count' && product.unitsPerPackage) {
                                costPerUnit = product.cost / product.unitsPerPackage;
                                displayUnit = 'count';
                              } else if (ingredient.unit === product.unit && product.packageSize) {
                                costPerUnit = product.cost / product.packageSize;
                                displayUnit = product.unit;
                              }
                              const ingredientCost = ingredient.quantity * costPerUnit;
                              return (
                                <li key={ingredient.productId}>
                                  {product.name}: {ingredient.quantity} {displayUnit} @ ${costPerUnit.toFixed(3)}/{displayUnit} = ${ingredientCost.toFixed(2)}
                                </li>
                              );
                            })}
                          </ul>
                          <div className="font-bold mt-2">
                            Total Per Serving Cost: ${recipe.ingredients.reduce((sum, ingredient) => {
                              const product = state.products.find(p => p.id === ingredient.productId);
                              if (!product) return sum;
                              let costPerUnit = 0;
                              if (ingredient.unit === 'count' && product.unitsPerPackage) {
                                costPerUnit = product.cost / product.unitsPerPackage;
                              } else if (ingredient.unit === product.unit && product.packageSize) {
                                costPerUnit = product.cost / product.packageSize;
                              }
                              return sum + ingredient.quantity * costPerUnit;
                            }, 0).toFixed(2)}
                          </div>
                        </div>
                        {/* Per Batch Breakdown */}
                        <div className="mb-2">
                          <div className="font-semibold">Per Batch (All {recipe.servings} servings):</div>
                          <ul className="list-disc list-inside">
                            {recipe.ingredients.map(ingredient => {
                              const product = state.products.find(p => p.id === ingredient.productId);
                              if (!product) return null;
                              let costPerUnit = 0;
                              let displayUnit = ingredient.unit;
                              if (ingredient.unit === 'count' && product.unitsPerPackage) {
                                costPerUnit = product.cost / product.unitsPerPackage;
                                displayUnit = 'count';
                              } else if (ingredient.unit === product.unit && product.packageSize) {
                                costPerUnit = product.cost / product.packageSize;
                                displayUnit = product.unit;
                              }
                              const ingredientCost = ingredient.quantity * costPerUnit * recipe.servings;
                              return (
                                <li key={ingredient.productId}>
                                  {product.name}: {ingredient.quantity * recipe.servings} {displayUnit} @ ${costPerUnit.toFixed(3)}/{displayUnit} = ${ingredientCost.toFixed(2)}
                                </li>
                              );
                            })}
                          </ul>
                          <div className="font-bold mt-2">
                            Total Batch Cost: ${recipe.ingredients.reduce((sum, ingredient) => {
                              const product = state.products.find(p => p.id === ingredient.productId);
                              if (!product) return sum;
                              let costPerUnit = 0;
                              if (ingredient.unit === 'count' && product.unitsPerPackage) {
                                costPerUnit = product.cost / product.unitsPerPackage;
                              } else if (ingredient.unit === product.unit && product.packageSize) {
                                costPerUnit = product.cost / product.packageSize;
                              }
                              return sum + ingredient.quantity * costPerUnit * recipe.servings;
                            }, 0).toFixed(2)}
                          </div>
                        </div>
                        {/* For Number Sold Breakdown */}
                        <div>
                          <div className="font-semibold">For Number Sold ({state.sales.filter(s => s.recipeId === recipe.id).reduce((sum, s) => sum + s.quantity, 0)} sold):</div>
                          <ul className="list-disc list-inside">
                            {recipe.ingredients.map(ingredient => {
                              const product = state.products.find(p => p.id === ingredient.productId);
                              if (!product) return null;
                              let costPerUnit = 0;
                              let displayUnit = ingredient.unit;
                              if (ingredient.unit === 'count' && product.unitsPerPackage) {
                                costPerUnit = product.cost / product.unitsPerPackage;
                                displayUnit = 'count';
                              } else if (ingredient.unit === product.unit && product.packageSize) {
                                costPerUnit = product.cost / product.packageSize;
                                displayUnit = product.unit;
                              }
                              const numSold = state.sales.filter(s => s.recipeId === recipe.id).reduce((sum, s) => sum + s.quantity, 0);
                              const ingredientCost = ingredient.quantity * costPerUnit * numSold;
                              return (
                                <li key={ingredient.productId}>
                                  {product.name}: {ingredient.quantity * numSold} {displayUnit} @ ${costPerUnit.toFixed(3)}/{displayUnit} = ${ingredientCost.toFixed(2)}
                                </li>
                              );
                            })}
                          </ul>
                          <div className="font-bold mt-2">
                            Total Cost for Number Sold: ${recipe.ingredients.reduce((sum, ingredient) => {
                              const product = state.products.find(p => p.id === ingredient.productId);
                              if (!product) return sum;
                              let costPerUnit = 0;
                              if (ingredient.unit === 'count' && product.unitsPerPackage) {
                                costPerUnit = product.cost / product.unitsPerPackage;
                              } else if (ingredient.unit === product.unit && product.packageSize) {
                                costPerUnit = product.cost / product.packageSize;
                              }
                              const numSold = state.sales.filter(s => s.recipeId === recipe.id).reduce((sum, s) => sum + s.quantity, 0);
                              return sum + ingredient.quantity * costPerUnit * numSold;
                            }, 0).toFixed(2)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 