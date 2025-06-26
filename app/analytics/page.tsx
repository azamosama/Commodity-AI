"use client"
import { useCostManagement } from '@/contexts/CostManagementContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import React, { useState } from 'react';

export default function AnalyticsPage() {
  const { state } = useCostManagement();
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  // Helper: format date for chart
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Inventory Analytics Data
  const inventoryCharts = state.products.map(product => {
    const inventoryItem = state.inventory.find(i => i.productId === product.id);
    const stockHistory = inventoryItem?.stockHistory || [];
    const data = stockHistory.map(h => ({ date: formatDate(h.date), stock: h.stock }));
    return (
      <div key={product.id} className="mb-8 bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-2">{product.name} Inventory Level</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="stock" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  });

  // Product Price History Charts
  const priceCharts = state.products.map(product => {
    const priceHistory = product.priceHistory || [];
    const data = priceHistory.map(h => ({ date: formatDate(h.date), price: h.price }));
    return (
      <div key={product.id + '-price'} className="mb-8 bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-2">{product.name} Price History</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="price" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  });

  // Recipe/Menu Item Analytics
  const recipeCharts = state.recipes.map(recipe => {
    // Sales history for this recipe
    const sales = state.sales.filter(s => s.recipeId === recipe.id);
    // Group sales by date
    const salesByDate: Record<string, number> = {};
    sales.forEach(sale => {
      const date = formatDate(sale.date);
      salesByDate[date] = (salesByDate[date] || 0) + sale.quantity;
    });
    const salesData = Object.entries(salesByDate).map(([date, sales]) => ({ date, sales }));
    // Price history for this recipe (use sales price over time)
    const priceByDate: Record<string, number> = {};
    sales.forEach(sale => {
      const date = formatDate(sale.date);
      priceByDate[date] = sale.price;
    });
    const priceData = Object.entries(priceByDate).map(([date, price]) => ({ date, price }));
    return (
      <div key={recipe.id} className="mb-8 bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-2">{recipe.name} Sales & Price History</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="price" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  });

  // Ingredient Drill-Down
  const ingredientDrillDown = state.recipes.map(recipe => {
    const expanded = expandedRecipeId === recipe.id;
    return (
      <div key={recipe.id} className="mb-4 bg-white rounded shadow p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{recipe.name}</p>
          <button className="text-indigo-600 underline" onClick={() => setExpandedRecipeId(expanded ? null : recipe.id)}>
            {expanded ? 'Hide Ingredients' : 'Expand Ingredients'}
          </button>
        </div>
        {expanded && (
          <div className="mt-4 space-y-6">
            {recipe.ingredients.map(ingredient => {
              const product = state.products.find(p => p.id === ingredient.productId);
              if (!product) return null;
              const inventoryItem = state.inventory.find(i => i.productId === product.id);
              const stockHistory = inventoryItem?.stockHistory || [];
              const priceHistory = product.priceHistory || [];
              const stockData = stockHistory.map(h => ({ date: formatDate(h.date), stock: h.stock }));
              const priceData = priceHistory.map(h => ({ date: formatDate(h.date), price: h.price }));
              return (
                <div key={ingredient.productId} className="bg-gray-50 rounded p-4">
                  <h4 className="font-semibold mb-2">{product.name} ({ingredient.quantity} {ingredient.unit} per {recipe.name})</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={stockData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="stock" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={priceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="price" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6">
            {/* Inventory Analytics Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Inventory Analytics</h2>
              {inventoryCharts}
              {priceCharts}
            </section>
            {/* Recipe/Menu Item Analytics Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Recipe/Menu Item Analytics</h2>
              {recipeCharts}
            </section>
            {/* Ingredient Drill-Down Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Ingredient Drill-Down</h2>
              {ingredientDrillDown}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 