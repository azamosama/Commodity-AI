import React, { useState, useEffect } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { Recipe, Product, CostAnalysis } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export function RecipeCostCalculator() {
  const { state, dispatch } = useCostManagement();
  const [recipe, setRecipe] = useState<Partial<Recipe>>({
    name: '',
    servings: 1,
    servingSize: 1,
    servingUnit: 'serving',
    ingredients: [],
  });
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [ingredientQuantity, setIngredientQuantity] = useState<number>(0);
  const [ingredientUnit, setIngredientUnit] = useState<string>('');

  const calculateCostAnalysis = (): CostAnalysis => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return {
        totalCost: 0,
        costPerServing: 0,
        suggestedPrice: 0,
        profitMargin: 0,
        breakevenPoint: 0,
      };
    }

    const totalCost = recipe.ingredients.reduce((sum, ingredient) => {
      const product = state.products.find((p) => p.id === ingredient.productId);
      if (!product) return sum;
      
      // Convert units and calculate cost
      const unitCost = product.cost / (product.quantity * product.packageSize);
      return sum + (unitCost * ingredient.quantity);
    }, 0);

    const costPerServing = totalCost / (recipe.servings || 1);
    const suggestedPrice = costPerServing * 1.5; // 50% markup
    const profitMargin = 0.5; // 50% profit margin
    const breakevenPoint = totalCost;

    return {
      totalCost,
      costPerServing,
      suggestedPrice,
      profitMargin,
      breakevenPoint,
    };
  };

  useEffect(() => {
    setCostAnalysis(calculateCostAnalysis());
  }, [recipe]);

  const handleAddIngredient = () => {
    if (!selectedProduct || ingredientQuantity <= 0) return;

    const newIngredient = {
      productId: selectedProduct,
      quantity: ingredientQuantity,
      unit: ingredientUnit,
    };

    setRecipe((prev) => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), newIngredient],
    }));

    setSelectedProduct('');
    setIngredientQuantity(0);
    setIngredientUnit('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecipe: Recipe = {
      id: uuidv4(),
      ...recipe,
    } as Recipe;
    dispatch({ type: 'ADD_RECIPE', payload: newRecipe });
    setRecipe({
      name: '',
      servings: 1,
      servingSize: 1,
      servingUnit: 'serving',
      ingredients: [],
    });
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Recipe Cost Calculator</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Recipe Name</label>
            <input
              type="text"
              value={recipe.name}
              onChange={(e) => setRecipe((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Number of Servings</label>
            <input
              type="number"
              value={recipe.servings}
              onChange={(e) => setRecipe((prev) => ({ ...prev, servings: parseInt(e.target.value) }))}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Serving Size</label>
            <input
              type="number"
              value={recipe.servingSize}
              onChange={(e) => setRecipe((prev) => ({ ...prev, servingSize: parseInt(e.target.value) }))}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Serving Unit</label>
            <input
              type="text"
              value={recipe.servingUnit}
              onChange={(e) => setRecipe((prev) => ({ ...prev, servingUnit: e.target.value }))}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Ingredients</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select a product</option>
                {state.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                value={ingredientQuantity}
                onChange={(e) => setIngredientQuantity(parseFloat(e.target.value))}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <input
                type="text"
                value={ingredientUnit}
                onChange={(e) => setIngredientUnit(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddIngredient}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Ingredient
          </button>

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700">Current Ingredients:</h4>
            <ul className="mt-2 space-y-2">
              {recipe.ingredients?.map((ingredient, index) => {
                const product = state.products.find((p) => p.id === ingredient.productId);
                return (
                  <li key={index} className="text-sm text-gray-600">
                    {product?.name}: {ingredient.quantity} {ingredient.unit}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {costAnalysis && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Cost Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Cost</p>
                <p className="text-lg font-semibold">${costAnalysis.totalCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cost per Serving</p>
                <p className="text-lg font-semibold">${costAnalysis.costPerServing.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Suggested Price</p>
                <p className="text-lg font-semibold">${costAnalysis.suggestedPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Profit Margin</p>
                <p className="text-lg font-semibold">{(costAnalysis.profitMargin * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Recipe
          </button>
        </div>
      </form>
    </div>
  );
} 