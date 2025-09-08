"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingDown, TrendingUp, AlertTriangle, DollarSign, Package, Users, Clock, Calendar } from "lucide-react"
import { useRestaurant } from "@/contexts/restaurant-context"
import { useCostManagement } from '@/contexts/CostManagementContext';
import { ProductEntryForm } from '@/components/ProductEntryForm';
import { RecipeCostCalculator } from '@/components/RecipeCostCalculator';
import { ExpenseTracker } from '@/components/ExpenseTracker';
import { InventoryTracker } from '@/components/InventoryTracker';
import { ProfitabilityDashboard } from '@/components/ProfitabilityDashboard';
import { CostSavingRecommendations } from '@/components/CostSavingRecommendations';

interface Restaurant {
  id: string;
  name: string;
}

function RestaurantLinks() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    { id: 'restaurant-a', name: 'Restaurant A' },
    { id: 'restaurant-b', name: 'Restaurant B' }
  ]);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [currentRestaurant, setCurrentRestaurant] = useState<string | null>(null);

  // Handle client-side only operations
  useEffect(() => {
    setCurrentUrl(window.location.origin);
    const urlParams = new URLSearchParams(window.location.search);
    const restaurant = urlParams.get('restaurant');
    const isAdmin = urlParams.get('admin') === 'true';
    console.log('Dashboard: Current URL:', window.location.href);
    console.log('Dashboard: Restaurant parameter:', restaurant);
    console.log('Dashboard: Admin parameter:', isAdmin);
    setCurrentRestaurant(restaurant);
  }, []);

  // Only show this component for admin access (admin=true parameter)
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const isAdmin = urlParams.get('admin') === 'true';
  
  if (!isAdmin) {
    return null; // Hide unless admin parameter is present
  }

  // Don't render until we have the current URL
  if (!currentUrl) {
    return null;
  }

  const addRestaurant = () => {
    if (newRestaurantName.trim()) {
      const newId = `restaurant-${Date.now()}`;
      setRestaurants([...restaurants, { id: newId, name: newRestaurantName.trim() }]);
      setNewRestaurantName('');
    }
  };

  const updateRestaurantName = (id: string) => {
    if (editingName.trim()) {
      setRestaurants(restaurants.map((r: Restaurant) => 
        r.id === id ? { ...r, name: editingName.trim() } : r
      ));
      setEditingId(null);
      setEditingName('');
    }
  };

  const deleteRestaurant = (id: string) => {
    setRestaurants(restaurants.filter((r: Restaurant) => r.id !== id));
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3">Restaurant Link Generator</h3>
      
      {/* Add New Restaurant */}
      <div className="mb-4 p-3 bg-white rounded border">
        <h4 className="font-medium text-gray-700 mb-2">Add New Restaurant</h4>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newRestaurantName}
            onChange={(e) => setNewRestaurantName(e.target.value)}
            placeholder="Enter restaurant name (e.g., Joe's Pizza)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            onKeyPress={(e) => e.key === 'Enter' && addRestaurant()}
          />
          <button
            onClick={addRestaurant}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Restaurant Links */}
      <div className="space-y-3">
        {restaurants.map((restaurant: Restaurant) => (
          <div key={restaurant.id} className="p-3 bg-white rounded border">
            <div className="flex items-center justify-between mb-2">
              {editingId === restaurant.id ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && updateRestaurantName(restaurant.id)}
                  />
                  <button
                    onClick={() => updateRestaurantName(restaurant.id)}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditingName('');
                    }}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-700">{restaurant.name}</h4>
                  <button
                    onClick={() => {
                      setEditingId(restaurant.id);
                      setEditingName(restaurant.name);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit Name
                  </button>
                  <button
                    onClick={() => deleteRestaurant(restaurant.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`${currentUrl}?restaurant=${restaurant.id}`}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
              />
              <button
                onClick={() => navigator.clipboard.writeText(`${currentUrl}?restaurant=${restaurant.id}`)}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Copy Link
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-sm text-gray-600 mt-3">
        Each restaurant gets their own unique link with isolated data. Share these links with different restaurants.
      </p>
      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
        <strong>Admin Access:</strong> This section is only visible with admin privileges. 
        Access via: <code className="bg-yellow-100 px-1 rounded">{currentUrl}?admin=true</code>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { restaurant, commodities, suppliers, alerts } = useRestaurant()
  const { isLoading } = useCostManagement()

  const priceChangeData = commodities.map((commodity) => ({
    name: commodity.name,
    change: commodity.priceChangePercent,
    price: commodity.currentPrice,
  }))

  const weeklySpendingData = [
    { week: "Week 1", spending: 1250 },
    { week: "Week 2", spending: 1180 },
    { week: "Week 3", spending: 1320 },
    { week: "Week 4", spending: 1090 },
  ]

  const totalSpending = weeklySpendingData.reduce((sum, week) => sum + week.spending, 0)
  const avgWeeklySpending = totalSpending / weeklySpendingData.length

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Cost Management Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <RestaurantLinks />
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading restaurant data...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">Product Management</h2>
              <ProductEntryForm />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Recipe Cost Calculator</h2>
              <RecipeCostCalculator />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Inventory & Sales Tracking</h2>
              <InventoryTracker />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Expense Tracking</h2>
              <ExpenseTracker />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Breakeven & Profitability</h2>
              <ProfitabilityDashboard />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Cost-Saving Recommendations</h2>
              <CostSavingRecommendations />
            </section>
          </div>
          )}
        </div>
      </main>
    </div>
  )
}
