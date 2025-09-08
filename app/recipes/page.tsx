"use client"
import { RecipeCostCalculator } from '@/components/RecipeCostCalculator';
import { ProfitabilityDashboard } from '@/components/ProfitabilityDashboard';
import { CostSavingRecommendations } from '@/components/CostSavingRecommendations';

export default function RecipesPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="grid grid-cols-1 gap-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">Recipe Cost Calculator</h2>
              <RecipeCostCalculator />
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
  );
} 