"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingDown, TrendingUp, AlertTriangle, DollarSign, Package, Users, Clock, Calendar } from "lucide-react"
import { useRestaurant } from "@/contexts/restaurant-context"
import { CostManagementProvider } from '@/contexts/CostManagementContext';
import { ProductEntryForm } from '@/components/ProductEntryForm';
import { RecipeCostCalculator } from '@/components/RecipeCostCalculator';
import { ExpenseTracker } from '@/components/ExpenseTracker';
import { InventoryTracker } from '@/components/InventoryTracker';
import { ProfitabilityDashboard } from '@/components/ProfitabilityDashboard';
import { CostSavingRecommendations } from '@/components/CostSavingRecommendations';

function RestaurantLinks() {
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3">Restaurant Links</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Restaurant A</h4>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={`${currentUrl}?restaurant=restaurant-a`}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white"
            />
            <button
              onClick={() => navigator.clipboard.writeText(`${currentUrl}?restaurant=restaurant-a`)}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Restaurant B</h4>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={`${currentUrl}?restaurant=restaurant-b`}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white"
            />
            <button
              onClick={() => navigator.clipboard.writeText(`${currentUrl}?restaurant=restaurant-b`)}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-3">
        Each restaurant gets their own unique link with isolated data. Share these links with different restaurants.
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { restaurant, commodities, suppliers, alerts } = useRestaurant()

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
    <CostManagementProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Cost Management Dashboard</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <RestaurantLinks />
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
          </div>
        </main>
                </div>
    </CostManagementProvider>
  )
}
