import React, { useState, useEffect } from 'react';
import { useCostManagement, useEditing } from '@/contexts/CostManagementContext';
import { Recipe, RecipeIngredient, Product, CostAnalysis } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Trash } from 'lucide-react';

export function RecipeCostCalculator() {
  const { state, dispatch } = useCostManagement();
  const { isEditing, setIsEditing } = useEditing();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState(1);
  const [servingSize, setServingSize] = useState(1);
  const [servingUnit, setServingUnit] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setRecipeName(recipe.name);
    setServings(recipe.servings);
    setServingSize(recipe.servingSize);
    setServingUnit(recipe.servingUnit);
    setIngredients(recipe.ingredients);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditingRecipe(null);
    setRecipeName('');
    setServings(1);
    setServingSize(1);
    setServingUnit('');
    setIngredients([]);
    setIsEditing(false);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { productId: '', quantity: 0, unit: '' }]);
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: string) => {
    const newIngredients = ingredients.map((ing, i) => {
      if (i === index) {
        const updated = { ...ing };
        if (field === 'quantity') {
          updated.quantity = parseFloat(value) || 0;
        } else if (field === 'productId') {
          updated.productId = value;
          const product = state.products.find(p => p.id === value);
          if (product) {
            updated.unit = product.unit;
          }
        } else if (field === 'unit') {
          updated.unit = value;
        }
        return updated;
      }
      return ing;
    });
    setIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipeData = {
      name: recipeName,
      servings,
      servingSize,
      servingUnit,
      ingredients,
    };

    if (editingRecipe) {
      dispatch({ type: 'UPDATE_RECIPE', payload: { ...recipeData, id: editingRecipe.id } });
    } else {
      dispatch({ type: 'ADD_RECIPE', payload: { ...recipeData, id: uuidv4() } });
    }
    handleCancel();
    setIsEditing(false);
  };

  useEffect(() => {
    const totalCost = ingredients.reduce((sum, ingredient) => {
      const product = state.products.find((p) => p.id === ingredient.productId);
      if (!product) return sum;

      let ingredientCost = 0;
      if (ingredient.unit === 'count' && product.unitsPerPackage) {
        const costPerUnit = product.cost / product.unitsPerPackage;
        ingredientCost = costPerUnit * ingredient.quantity;
      } else {
        // Assumes the ingredient quantity is in the product's base unit (e.g., lb, kg)
        const costPerBaseUnit = product.cost / product.packageSize;
        ingredientCost = costPerBaseUnit * ingredient.quantity;
      }
      
      return sum + ingredientCost;
    }, 0);

    const costPerServing = servings > 0 ? totalCost / servings : 0;
    
    setCostAnalysis({
        totalCost,
        costPerServing,
        suggestedPrice: costPerServing * 3, // 300% markup
        profitMargin: costPerServing > 0 ? ((costPerServing * 3) - costPerServing) / (costPerServing * 3) : 0,
        breakevenPoint: 0, // Placeholder
    });
  }, [ingredients, servings, state.products]);


  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">{editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Recipe Name</label>
          <input
            type="text"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            onFocus={() => setIsEditing(true)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Servings</label>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            required
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            onFocus={() => setIsEditing(true)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Serving Size</label>
          <input
            type="number"
            value={servingSize}
            onChange={(e) => setServingSize(Number(e.target.value))}
            required
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            onFocus={() => setIsEditing(true)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Serving Unit</label>
          <input
            type="text"
            value={servingUnit}
            onChange={(e) => setServingUnit(e.target.value)}
            placeholder="e.g., item, bowl"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            onFocus={() => setIsEditing(true)}
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium">Ingredients</h3>
        <div className="space-y-4 mt-2">
          {ingredients.map((ing, index) => {
            const selectedProduct = state.products.find(p => p.id === ing.productId);
            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <select
                  value={ing.productId}
                  onChange={(e) => handleIngredientChange(index, 'productId', e.target.value)}
                  className="col-span-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  onFocus={() => setIsEditing(true)}
                >
                  <option value="">Select Product</option>
                  {state.products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={ing.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  onFocus={() => setIsEditing(true)}
                />
                <div className="flex items-center space-x-2">
                  <select
                    value={ing.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={!selectedProduct}
                    onFocus={() => setIsEditing(true)}
                  >
                    {selectedProduct && <option value={selectedProduct.unit}>{selectedProduct.unit}</option>}
                    {selectedProduct && selectedProduct.unitsPerPackage && <option value="count">count</option>}
                  </select>
                </div>
                <button type="button" onClick={() => handleRemoveIngredient(index)} className="text-red-500 hover:text-red-700" onFocus={() => setIsEditing(true)}>
                  Remove
                </button>
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={handleAddIngredient}
          className="mt-4 text-indigo-600 hover:text-indigo-900"
          onFocus={() => setIsEditing(true)}
        >
          + Add Ingredient
        </button>
      </div>

      {costAnalysis && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium">Cost Analysis</h3>
          <p>Total Recipe Cost: ${costAnalysis.totalCost.toFixed(2)}</p>
          <p>Cost Per Serving: ${costAnalysis.costPerServing.toFixed(2)}</p>
          <p>Suggested Price (3x Markup): ${costAnalysis.suggestedPrice.toFixed(2)}</p>
        </div>
      )}

      <div className="mt-6 flex items-center space-x-4">
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {editingRecipe ? 'Update Recipe' : 'Create Recipe'}
        </button>
        {editingRecipe && (
          <button
            type="button"
            onClick={handleCancel}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
      </div>

      {state.recipes.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">Current Recipes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingredients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.recipes.map((recipe) => (
                  <tr key={recipe.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{recipe.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{recipe.servings}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {recipe.ingredients
                        .map((ing) => state.products.find((p) => p.id === ing.productId)?.name || 'Unknown')
                        .join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 mr-2"
                        onClick={() => dispatch({ type: 'DELETE_RECIPE', payload: recipe.id })}
                        title="Delete Recipe"
                        onFocus={() => setIsEditing(true)}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleEdit(recipe)} className="text-indigo-600 hover:text-indigo-900" onFocus={() => setIsEditing(true)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </form>
  );
} 