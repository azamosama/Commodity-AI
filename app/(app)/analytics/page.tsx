"use client"
import { InventoryAnalytics } from '@/components/InventoryAnalytics';
import RecipeAnalytics from '@/components/RecipeAnalytics';
import IngredientDrilldown from '@/components/IngredientDrilldown';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-3 sm:py-4 md:py-6 px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Inventory Analytics</h2>
            <InventoryAnalytics />
          </section>
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Recipe/Menu Item Analytics</h2>
            <RecipeAnalytics />
          </section>
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Ingredient Drill-Down</h2>
            <IngredientDrilldown />
          </section>
        </div>
      </div>
    </div>
  );
} 