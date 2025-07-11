"use client"
import { InventoryAnalytics } from '@/components/InventoryAnalytics';
import RecipeAnalytics from '@/components/RecipeAnalytics';
import IngredientDrilldown from '@/components/IngredientDrilldown';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold mb-6">Analytics</h1>
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Inventory Analytics</h2>
            <InventoryAnalytics />
          </section>
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Recipe/Menu Item Analytics</h2>
            <RecipeAnalytics />
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-4">Ingredient Drill-Down</h2>
            <IngredientDrilldown />
          </section>
        </div>
      </main>
    </div>
  );
} 