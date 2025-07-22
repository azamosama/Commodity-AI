import React, { useState, useEffect } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function ProfitabilityDashboard() {
  const { state } = useCostManagement();
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [profitPeriod, setProfitPeriod] = useState<'year' | 'month' | 'week' | 'day'>('month');
  const [revenueMode, setRevenueMode] = useState<'total' | 'perPeriod'>('total');
  useEffect(() => { setHasMounted(true); }, []);
  if (!hasMounted) return null;

  const toggleExpanded = (recipeId: string) => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

  // Calculate total expenses
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate total revenue
  const totalRevenue = state.sales.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);

  // Calculate profit margin for each recipe
  const recipeMargins = state.recipes.map((recipe) => {
    // Find all sales for this recipe
    const sales = state.sales.filter((s) => s.recipeId === recipe.id);
    const revenue = sales.reduce((sum, s) => sum + (s.price * s.quantity), 0);
    // Calculate cost per serving for each sale using historical prices
    let totalCost = 0;
    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      const costPerServing = recipe.ingredients.reduce((sum, ingredient) => {
        const product = state.products.find((p) => p.id === ingredient.productId);
        if (!product) return sum;
        const productCost = getProductCostOnDate(product, saleDate);
        const totalUnits = product.quantity * (product.packageSize || 1);
        const unitCost = totalUnits > 0 ? productCost / totalUnits : 0;
        return sum + unitCost * ingredient.quantity;
      }, 0);
      totalCost += costPerServing * sale.quantity;
    });
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
    const saleDate = sale.date;
    // Calculate cost per serving for this recipe using historical prices
    const costPerServing = recipe.ingredients.reduce((sum, ingredient) => {
      const product = state.products.find(p => p.id === ingredient.productId);
      if (!product) return sum;
      const productCost = getProductCostOnDate(product, saleDate);
      const totalUnits = product.quantity * (product.packageSize || 1);
      const unitCost = totalUnits > 0 ? productCost / totalUnits : 0;
      return sum + unitCost * ingredient.quantity;
    }, 0);
    // Total COGS for this sale
    const totalIngredientCost = costPerServing * sale.quantity;
    // Group by day (YYYY-MM-DD)
    const dayKey = sale.date.toISOString().split('T')[0];
    cogsByDay[dayKey] = (cogsByDay[dayKey] || 0) + totalIngredientCost;
    // For year, month, week sums
    const daysAgo = Math.floor((Number(now) - Number(sale.date)) / msInDay);
    if (daysAgo < 7) cogsWeek += totalIngredientCost;
    if (daysAgo < 30) cogsMonth += totalIngredientCost;
    if (daysAgo < 365) cogsYear += totalIngredientCost;
  });
  console.log('cogsByDay:', cogsByDay);
  const dayKeys = Object.keys(cogsByDay);
  console.log('dayKeys:', dayKeys);
  let cogsDay = 0;
  if (dayKeys.length > 0) {
    const totalCogs = Object.values(cogsByDay).reduce((a, b) => a + b, 0);
    cogsDay = totalCogs / dayKeys.length;
    console.log('totalCogs:', totalCogs, 'dayKeys.length:', dayKeys.length, 'cogsDay:', cogsDay);
  }

  // Move avgWeek calculation here so it is defined before use
  const getWeekKey = (date: Date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = Math.floor((d.getTime() - firstDayOfYear.getTime()) / msInDay);
    return `${d.getFullYear()}-W${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
  };
  const cogsByWeek: Record<string, number> = {};
  salesWithDates.forEach(sale => {
    const recipe = state.recipes.find(r => r.id === sale.recipeId);
    if (!recipe) return;
    let totalIngredientCost = 0;
    recipe.ingredients.forEach(ingredient => {
      const product = state.products.find(p => p.id === ingredient.productId);
      if (!product) return;
      let costPerUnit = getCostPerBaseUnit(product);
      totalIngredientCost += ingredient.quantity * costPerUnit * sale.quantity;
    });
    const weekKey = getWeekKey(sale.date);
    cogsByWeek[weekKey] = (cogsByWeek[weekKey] || 0) + totalIngredientCost;
  });
  const avgWeek = Object.keys(cogsByWeek).length > 0 ? Object.values(cogsByWeek).reduce((a, b) => a + b, 0) / Object.keys(cogsByWeek).length : 0;

  expenseBreakdown['Food (COGS)'] = {
    year: cogsYear,
    month: cogsMonth,
    week: avgWeek, // Use average per week with sales
    day: cogsDay,
  };

  // Calculate total breakeven for each period
  const totalYear = Object.values(expenseBreakdown).reduce((sum, v) => sum + (v as { year: number }).year, 0);
  const totalMonth = Object.values(expenseBreakdown).reduce((sum, v) => sum + (v as { month: number }).month, 0);
  const totalWeek = Object.values(expenseBreakdown).reduce((sum, v) => sum + (v as { week: number }).week, 0);
  const totalDay = Object.values(expenseBreakdown).reduce((sum, v) => sum + (v as { day: number }).day, 0);

  // Calculate breakeven point (revenue needed to cover all costs: expenses + COGS)
  const breakeven = totalExpenses + expenseBreakdown['Food (COGS)']?.year || 0;
  const breakevenMonth = totalExpenses + expenseBreakdown['Food (COGS)']?.month || 0;
  const breakevenWeek = totalExpenses + expenseBreakdown['Food (COGS)']?.week || 0;
  const breakevenDay = totalExpenses + expenseBreakdown['Food (COGS)']?.day || 0;

  // Add state for period selection
  // const [profitPeriod, setProfitPeriod] = useState<'year' | 'month' | 'week' | 'day'>('month');

  // Map period to breakeven value
  const breakevenByPeriod = {
    year: totalYear,
    month: totalMonth,
    week: totalWeek,
    day: totalDay,
  };

  // Calculate revenue per period
  // Helper functions to get period keys
  const getDayKey = (date: Date) => date.toISOString().split('T')[0];
  const getMonthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}`;
  const getYearKey = (date: Date) => `${date.getFullYear()}`;

  // Group revenue by period
  const revenueByDay: Record<string, number> = {};
  const revenueByWeek: Record<string, number> = {};
  const revenueByMonth: Record<string, number> = {};
  const revenueByYear: Record<string, number> = {};

  salesWithDates.forEach(sale => {
    const saleRevenue = sale.price * sale.quantity;
    const dayKey = getDayKey(sale.date);
    const weekKey = getWeekKey(sale.date);
    const monthKey = getMonthKey(sale.date);
    const yearKey = getYearKey(sale.date);
    
    revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + saleRevenue;
    revenueByWeek[weekKey] = (revenueByWeek[weekKey] || 0) + saleRevenue;
    revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + saleRevenue;
    revenueByYear[yearKey] = (revenueByYear[yearKey] || 0) + saleRevenue;
  });

  // Calculate average revenue per period
  const revenuePerDay = totalRevenue / 365; // Total revenue divided by total days in year
  const revenuePerWeek = totalRevenue / 52; // Total revenue divided by total weeks in year
  const revenuePerMonth = totalRevenue / 12; // Total revenue divided by total months in year
  const revenuePerYear = totalRevenue; // Total revenue for the year

  // Calculate profit per period
  const profitPerDay = revenuePerDay - totalDay;
  const profitPerWeek = revenuePerWeek - totalWeek;
  const profitPerMonth = revenuePerMonth - totalMonth;
  const profitPerYear = revenuePerYear - totalYear;

  // Map period to profit value
  const profitByPeriod = {
    day: profitPerDay,
    week: profitPerWeek,
    month: profitPerMonth,
    year: profitPerYear,
  };

  // Map period to revenue value
  const revenueByPeriod = {
    day: revenuePerDay,
    week: revenuePerWeek,
    month: revenuePerMonth,
    year: revenuePerYear,
  };

  const profit = profitByPeriod[profitPeriod];

  // Calculate averages
  // Helper to get week, month, year keys

  const cogsByMonth: Record<string, number> = {};
  const cogsByYear: Record<string, number> = {};
  salesWithDates.forEach(sale => {
    const recipe = state.recipes.find(r => r.id === sale.recipeId);
    if (!recipe) return;
    let totalIngredientCost = 0;
    recipe.ingredients.forEach(ingredient => {
      const product = state.products.find(p => p.id === ingredient.productId);
      if (!product) return;
      let costPerUnit = getCostPerBaseUnit(product);
      totalIngredientCost += ingredient.quantity * costPerUnit * sale.quantity;
    });
    // Group by week, month, year
    const weekKey = getWeekKey(sale.date);
    const monthKey = getMonthKey(sale.date);
    const yearKey = getYearKey(sale.date);
    cogsByMonth[monthKey] = (cogsByMonth[monthKey] || 0) + totalIngredientCost;
    cogsByYear[yearKey] = (cogsByYear[yearKey] || 0) + totalIngredientCost;
  });
  const avgDay = Object.keys(cogsByDay).length > 0 ? Object.values(cogsByDay).reduce((a, b) => a + b, 0) / Object.keys(cogsByDay).length : 0;
  const avgMonth = Object.keys(cogsByMonth).length > 0 ? Object.values(cogsByMonth).reduce((a, b) => a + b, 0) / Object.keys(cogsByMonth).length : 0;
  const avgYear = Object.keys(cogsByYear).length > 0 ? Object.values(cogsByYear).reduce((a, b) => a + b, 0) / Object.keys(cogsByYear).length : 0;

  // Helper function for cost per base unit
  function getCostPerBaseUnit(product: import('@/lib/types').Product) {
    if ((product.unit === 'count' || product.unit === 'pieces' || product.unit === 'units') && product.unitsPerPackage) {
      const totalUnits = product.quantity * product.unitsPerPackage;
      return totalUnits > 0 ? product.cost / totalUnits : 0;
    } else {
      const totalUnits = product.quantity * (product.packageSize || 1);
      return totalUnits > 0 ? product.cost / totalUnits : 0;
    }
  }

  // Helper to get product cost as of a given date (copied from RecipeAnalytics)
  function getProductCostOnDate(product: any, date: Date) {
    if (!product.priceHistory || product.priceHistory.length === 0) return product.cost;
    const sorted = [...product.priceHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cost = product.cost;
    for (let i = 0; i < sorted.length; i++) {
      if (new Date(sorted[i].date) <= date) {
        cost = sorted[i].price;
      } else {
        break;
      }
    }
    return cost;
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Breakeven & Profitability Dashboard</h2>
      {/* Period Selector */}
      <div className="mb-4 flex items-center gap-4">
        <label className="font-medium mr-2">Profit Period:</label>
        <select
          value={profitPeriod}
          onChange={e => setProfitPeriod(e.target.value as 'year' | 'month' | 'week' | 'day')}
          className="p-2 border rounded"
        >
          <option value="year">Year</option>
          <option value="month">Month</option>
          <option value="week">Week</option>
          <option value="day">Day</option>
        </select>
        <div className="ml-6 flex items-center gap-2">
          <label className="font-medium">Revenue Mode:</label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="revenueMode"
              value="total"
              checked={revenueMode === 'total'}
              onChange={() => setRevenueMode('total')}
            />
            <span className="ml-1">Total Revenue</span>
          </label>
          <label className="inline-flex items-center ml-4">
            <input
              type="radio"
              className="form-radio"
              name="revenueMode"
              value="perPeriod"
              checked={revenueMode === 'perPeriod'}
              onChange={() => setRevenueMode('perPeriod')}
            />
            <span className="ml-1">Revenue Per {profitPeriod.charAt(0).toUpperCase() + profitPeriod.slice(1)}</span>
          </label>
        </div>
      </div>
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
              {Object.entries(expenseBreakdown)
                .sort(([a], [b]) => {
                  if (a === 'Food (COGS)') return -1;
                  if (b === 'Food (COGS)') return 1;
                  return a.localeCompare(b);
                })
                .map(([category, v]) => {
                  const val = v as { year: number; month: number; week: number; day: number };
                  const isCOGS = category === 'Food (COGS)';
                  return (
                    <tr key={category}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${val.year.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${val.month.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${val.week.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${val.day.toFixed(2)}
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
          <p className="text-sm font-medium text-gray-500">{revenueMode === 'total' ? 'Total Revenue' : `Revenue Per ${profitPeriod.charAt(0).toUpperCase() + profitPeriod.slice(1)}`}</p>
          <p className="text-2xl font-bold text-gray-900">
            {revenueMode === 'total'
              ? `$${totalRevenue.toFixed(2)}`
              : `$${revenueByPeriod[profitPeriod].toFixed(2)}`}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Breakeven ({profitPeriod.charAt(0).toUpperCase() + profitPeriod.slice(1)})</p>
          <p className="text-2xl font-bold text-gray-900">${breakevenByPeriod[profitPeriod].toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Profit</p>
          <p className="text-2xl font-bold text-green-600">{profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}</p>
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
                              // Use current price for per-serving and per-batch breakdowns (not historical)
                              let costPerUnit = getCostPerBaseUnit(product);
                              const ingredientCost = ingredient.quantity * costPerUnit;
                              return (
                                <li key={ingredient.productId}>
                                  {product.name}: {ingredient.quantity} {product.unit} @ ${costPerUnit.toFixed(3)}/{product.unit} = ${ingredientCost.toFixed(2)}
                                </li>
                              );
                            })}
                          </ul>
                          <div className="font-bold mt-2">
                            Total Per Serving Cost: ${recipe.ingredients.reduce((sum, ingredient) => {
                              const product = state.products.find(p => p.id === ingredient.productId);
                              if (!product) return sum;
                              let costPerUnit = getCostPerBaseUnit(product);
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
                              let costPerUnit = getCostPerBaseUnit(product);
                              const ingredientCost = ingredient.quantity * costPerUnit * recipe.servings;
                              return (
                                <li key={ingredient.productId}>
                                  {product.name}: {ingredient.quantity * recipe.servings} {product.unit} @ ${costPerUnit.toFixed(3)}/{product.unit} = ${ingredientCost.toFixed(2)}
                                </li>
                              );
                            })}
                          </ul>
                          <div className="font-bold mt-2">
                            Total Batch Cost: ${recipe.ingredients.reduce((sum, ingredient) => {
                              const product = state.products.find(p => p.id === ingredient.productId);
                              if (!product) return sum;
                              let costPerUnit = getCostPerBaseUnit(product);
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
                              // For number sold, use historical price for each sale
                              const numSold = state.sales.filter(s => s.recipeId === recipe.id).reduce((sum, s) => sum + s.quantity, 0);
                              // Use average historical cost per unit for all sales
                              let totalIngredientCost = 0;
                              state.sales.filter(s => s.recipeId === recipe.id).forEach(sale => {
                                const saleDate = new Date(sale.date);
                                const productCost = getProductCostOnDate(product, saleDate);
                                const totalUnits = product.quantity * (product.packageSize || 1);
                                const unitCost = totalUnits > 0 ? productCost / totalUnits : 0;
                                totalIngredientCost += unitCost * ingredient.quantity * sale.quantity;
                              });
                              return (
                                <li key={ingredient.productId}>
                                  {product.name}: {ingredient.quantity * numSold} {product.unit} (historical avg) = ${totalIngredientCost.toFixed(2)}
                                </li>
                              );
                            })}
                          </ul>
                          <div className="font-bold mt-2">
                            Total Cost for Number Sold: ${recipe.ingredients.reduce((sum, ingredient) => {
                              const product = state.products.find(p => p.id === ingredient.productId);
                              if (!product) return sum;
                              let totalIngredientCost = 0;
                              state.sales.filter(s => s.recipeId === recipe.id).forEach(sale => {
                                const saleDate = new Date(sale.date);
                                const productCost = getProductCostOnDate(product, saleDate);
                                const totalUnits = product.quantity * (product.packageSize || 1);
                                const unitCost = totalUnits > 0 ? productCost / totalUnits : 0;
                                totalIngredientCost += unitCost * ingredient.quantity * sale.quantity;
                              });
                              return sum + totalIngredientCost;
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