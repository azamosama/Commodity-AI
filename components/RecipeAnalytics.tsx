import React, { useState, useEffect } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

export default function RecipeAnalytics() {
  const { state, isLoading } = useCostManagement();
  const [hasMounted, setHasMounted] = useState(false);
  
  // Hooks must be declared before any conditional returns
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  // Compute derived data used by effects regardless of loading state
  const recipesWithSales = state.recipes.filter(recipe => 
    state.sales.some(sale => sale.recipeName === recipe.name)
  );

  // Mount flag
  useEffect(() => { setHasMounted(true); }, []);

  // Initialize selected recipe when data becomes available
  useEffect(() => {
    if (recipesWithSales.length > 0 && !selectedRecipeId) {
      setSelectedRecipeId(recipesWithSales[0].id);
    }
  }, [recipesWithSales, selectedRecipeId]);

  if (!hasMounted) return null;

  // Wait for data to be loaded
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recipe/Menu Item Analytics</h3>
        <div className="text-gray-500">Loading data...</div>
      </div>
    );
  }

  const selectedRecipe = state.recipes.find(r => r.id === selectedRecipeId);

  // Helper to get product cost as of a given date
  function getProductCostOnDate(product: any, date: Date) {
    const targetTime = date.getTime();

    // Find latest priceHistory entry up to the date
    const latestPrice = Array.isArray(product.priceHistory) && product.priceHistory.length > 0
      ? [...product.priceHistory]
          .filter((e: any) => new Date(e.date).getTime() <= targetTime)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .pop()
      : undefined;

    // Find latest restock entry up to the date
    const latestRestock = Array.isArray(product.restockHistory) && product.restockHistory.length > 0
      ? [...product.restockHistory]
          .filter((e: any) => new Date(e.date).getTime() <= targetTime)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .pop()
      : undefined;

    // Decide which source is more recent
    const priceTime = latestPrice ? new Date(latestPrice.date).getTime() : -Infinity;
    const restockTime = latestRestock ? new Date(latestRestock.date).getTime() : -Infinity;

    let chosenCost = product.cost as number;
    let chosenPackageSize = product.packageSize as number | undefined;
    let chosenQuantity = product.quantity as number | undefined;

    if (priceTime === -Infinity && restockTime === -Infinity) {
      // No historical info, fall back to product
      return { cost: chosenCost, packageSize: chosenPackageSize, quantity: chosenQuantity };
    }

    if (priceTime >= restockTime && latestPrice) {
      chosenCost = latestPrice.price ?? chosenCost;
      chosenPackageSize = (latestPrice.packageSize && latestPrice.packageSize > 0) ? latestPrice.packageSize : chosenPackageSize;
      chosenQuantity = (latestPrice.quantity && latestPrice.quantity > 0) ? latestPrice.quantity : chosenQuantity;
      return { cost: chosenCost, packageSize: chosenPackageSize, quantity: chosenQuantity };
    }

    if (latestRestock) {
      // Use restock cost; restock entries typically lack package metadata so fall back to product values
      chosenCost = latestRestock.cost ?? chosenCost;
      return { cost: chosenCost, packageSize: chosenPackageSize, quantity: chosenQuantity };
    }

    return { cost: chosenCost, packageSize: chosenPackageSize, quantity: chosenQuantity };
  }

  // Build cost/sale price history for each sale
  let costAndSaleData: { date: string; cost: number; salePrice: number }[] = [];
  if (selectedRecipe) {
    const sales = state.sales.filter(sale => sale.recipeName === selectedRecipe.name);
    costAndSaleData = sales.map(sale => {
      const saleDate = new Date(sale.date);
      // Calculate cost per serving as of sale date (do NOT multiply by sale.quantity)
      let debugLines: string[] = [];
      const costPerServing = selectedRecipe.ingredients.reduce((sum, ingredient) => {
        const product = state.products.find((p) => p.id === ingredient.productId);
        if (!product) return sum;
        let ingredientCost = 0;
        const { cost: productCost, packageSize: histPackageSize, quantity: histQuantity } = getProductCostOnDate(product, saleDate);
        // Fallback logic: if missing or zero, use product's current value
        const packageSize = (histPackageSize && histPackageSize > 0) ? histPackageSize : product.packageSize;
        const quantity = (histQuantity && histQuantity > 0) ? histQuantity : product.quantity;
        let totalUnits = quantity * (packageSize || 1);
        if (!totalUnits || isNaN(totalUnits) || totalUnits <= 0) totalUnits = 1; // avoid division by zero/NaN
        const unitCost = productCost / totalUnits;
        ingredientCost = unitCost * (typeof ingredient.quantity === 'number' ? ingredient.quantity : parseFloat(ingredient.quantity) || 0);
        // Debug log
        console.log(`[RecipeAnalytics] Sale ${saleDate.toISOString().slice(0,10)} | Ingredient: ${product.name} | price: ${productCost} | packageSize: ${packageSize} | quantity: ${quantity} | totalUnits: ${totalUnits} | unitCost: ${unitCost} | ingredientCost: ${ingredientCost}`);
        return sum + ingredientCost;
      }, 0);
      debugLines.push(`  Total Cost Per Serving: ${costPerServing}`);
      console.log(`[RecipeAnalytics] Sale on ${saleDate.toISOString().slice(0,10)}:\n` + debugLines.join('\n'));
      return {
        date: saleDate.toISOString().slice(0, 10),
        cost: isNaN(costPerServing) ? 0 : costPerServing, // ensure cost is always a number
        salePrice: sale.salePrice,
      };
    });
    // Sort by date ascending
    costAndSaleData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Compute sales history from global sales
  let salesData: { date: string; quantity: number }[] = [];
  if (selectedRecipe) {
    salesData = state.sales
      .filter(sale => sale.recipeName === selectedRecipe.name)
      .map(sale => ({
        date: new Date(sale.date).toISOString().slice(0, 10),
        quantity: sale.quantity,
      }));
    // Sort by date ascending
    salesData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // DEBUG: Print product priceHistory and all sale dates for verification
  if (selectedRecipe) {
    selectedRecipe.ingredients.forEach(ingredient => {
      const product = state.products.find(p => p.id === ingredient.productId);
      if (product) {
        console.log(`[DEBUG] Product: ${product.name}`);
        console.log('[DEBUG] priceHistory:', product.priceHistory);
      }
    });
    const sales = state.sales.filter(sale => sale.recipeName === selectedRecipe.name);
    console.log('[DEBUG] Sale Dates:', sales.map(sale => sale.date));
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Recipe/Menu Item Analytics</h3>
      {state.recipes.length === 0 ? (
        <div className="text-gray-500">No recipe analytics available yet.</div>
      ) : (
        <>
          <label className="block mb-2 font-medium">Select Recipe/Menu Item:</label>
          <select
            className="mb-4 p-2 border rounded"
            value={selectedRecipeId || ''}
            onChange={e => setSelectedRecipeId(e.target.value)}
          >
            {state.recipes.map(recipe => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
          </select>

          <div className="mb-8">
            <h4 className="font-medium mb-2">Cost & Sale Price History</h4>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={costAndSaleData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" domain={['dataMin', 'dataMax']} type="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cost" stroke="#82ca9d" strokeWidth={2} dot={true} name="Cost" />
                  <Line type="monotone" dataKey="salePrice" stroke="#8884d8" strokeWidth={2} dot={true} name="Sale Price" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Sales History</h4>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={salesData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" domain={['dataMin', 'dataMax']} type="category" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#8884d8" name="Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 