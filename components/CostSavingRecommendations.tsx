import React from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';

export function CostSavingRecommendations() {
  const { state } = useCostManagement();

  // Example logic: Suggest buying larger packages if usage is high
  // (In a real app, supplier/package options would come from a database or API)
  const recommendations = state.products.map((product) => {
    // If product is used in recipes and has high usage, suggest a larger package
    const totalUsed = state.recipes.reduce((sum, recipe) => {
      const ingredient = recipe.ingredients.find((i) => i.productId === product.id);
      if (!ingredient) return sum;
      // Estimate usage by multiplying by sales of the recipe
      const sales = state.sales.filter((s) => s.recipeId === recipe.id);
      const used = sales.reduce((s, sale) => s + (ingredient.quantity * sale.quantity), 0);
      return sum + used;
    }, 0);

    // Example: If used more than 100 units/month, suggest larger package
    if (totalUsed > 100) {
      // Simulate a supplier option for a larger package
      const largerPackageSize = product.packageSize * 5;
      const largerPackageCost = product.cost * 4.5; // 10% discount for bulk
      const currentUnitCost = product.cost / (product.quantity * product.packageSize);
      const newUnitCost = largerPackageCost / (product.quantity * largerPackageSize);
      const potentialSavings = (currentUnitCost - newUnitCost) * totalUsed;
      return {
        product,
        suggestion: `Consider buying in bulk: ${largerPackageSize} ${product.packageUnit}s for $${largerPackageCost.toFixed(2)} (save ~$${potentialSavings.toFixed(2)} this month)`
      };
    }
    return null;
  }).filter(Boolean);

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Cost-Saving Recommendations</h2>
      {recommendations.length === 0 ? (
        <p className="text-gray-600">No cost-saving opportunities detected based on current usage patterns.</p>
      ) : (
        <ul className="space-y-4">
          {recommendations.map((rec: any) => (
            <li key={rec.product.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
              <strong>{rec.product.name}:</strong> <span className="text-green-800">{rec.suggestion}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 