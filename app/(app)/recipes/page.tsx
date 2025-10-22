"use client"
import { RecipeCostCalculator } from '@/components/RecipeCostCalculator';
import { ProfitabilityDashboard } from '@/components/ProfitabilityDashboard';
import { CostSavingRecommendations } from '@/components/CostSavingRecommendations';

export default function RecipesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-3 sm:py-4 md:py-6 px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Recipe Cost Calculator</h2>
            <RecipeCostCalculator />
          </section>
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Breakeven & Profitability</h2>
            <ProfitabilityDashboard />
          </section>
          <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Cost-Saving Recommendations</h2>
            <CostSavingRecommendations />
          </section>
        </div>
      </div>
    </div>
  );
} 