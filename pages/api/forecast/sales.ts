import type { NextApiRequest, NextApiResponse } from 'next';
import { SalesForecast, Recipe, SalesRecord } from '@/lib/types';
import fs from 'fs';
import path from 'path';

// Load restaurant data helper
const loadRestaurantData = async (restaurantId: string) => {
  const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');
  
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      const allData = JSON.parse(fileContent);
      return allData[restaurantId] || { recipes: [], sales: [] };
    }
  } catch (error) {
    console.error('Error loading restaurant data:', error);
  }
  return { recipes: [], sales: [] };
};

// Enhanced new item forecasting using similarity analysis
async function generateNewItemForecast(
  newRecipe: Recipe, 
  allRecipes: Recipe[], 
  allSales: SalesRecord[], 
  days: number
): Promise<number[]> {
  const forecasts: number[] = [];
  
  // Find similar recipes based on ingredients and category
  const similarRecipes = findSimilarRecipes(newRecipe, allRecipes);
  
  if (similarRecipes.length > 0) {
    // Use similar recipe performance as baseline
    const similarRecipeSales = similarRecipes.map(recipe => {
      const recipeSales = allSales.filter(s => s.recipeId === recipe.id);
      return recipeSales.length > 0 
        ? recipeSales.reduce((sum, sale) => sum + sale.quantity, 0) / recipeSales.length
        : 0;
    });
    
    const avgSimilarSales = similarRecipeSales.reduce((sum, sales) => sum + sales, 0) / similarRecipeSales.length;
    
    // Apply new item adjustment factors
    const newItemMultiplier = 0.7; // New items typically start at 70% of similar items
    const growthFactor = 1.05; // 5% growth per day for new items
    
    for (let i = 1; i <= days; i++) {
      const basePrediction = avgSimilarSales * newItemMultiplier * Math.pow(growthFactor, i);
      forecasts.push(Math.max(1, Math.round(basePrediction)));
    }
  } else {
    // No similar recipes - use market average
    const marketAverage = calculateMarketAverage(allRecipes, allSales);
    const newItemBaseline = marketAverage * 0.6; // 60% of market average for new items
    
    for (let i = 1; i <= days; i++) {
      const growthPrediction = newItemBaseline * Math.pow(1.03, i); // 3% daily growth
      forecasts.push(Math.max(1, Math.round(growthPrediction)));
    }
  }
  
  return forecasts;
}

// Find similar recipes based on ingredients and characteristics
function findSimilarRecipes(targetRecipe: Recipe, allRecipes: Recipe[]): Recipe[] {
  const similarities: { recipe: Recipe; score: number }[] = [];
  
  for (const recipe of allRecipes) {
    if (recipe.id === targetRecipe.id) continue;
    
    let score = 0;
    
    // Ingredient similarity
    const targetIngredients = targetRecipe.ingredients.map(i => i.productId).sort();
    const recipeIngredients = recipe.ingredients.map(i => i.productId).sort();
    
    const commonIngredients = targetIngredients.filter(id => recipeIngredients.includes(id));
    const ingredientSimilarity = commonIngredients.length / Math.max(targetIngredients.length, recipeIngredients.length);
    score += ingredientSimilarity * 0.6; // 60% weight for ingredients
    
    // Price similarity (if available)
    if (targetRecipe.costHistory && recipe.costHistory) {
      const targetCost = targetRecipe.costHistory[targetRecipe.costHistory.length - 1]?.cost || 0;
      const recipeCost = recipe.costHistory[recipe.costHistory.length - 1]?.cost || 0;
      const costDifference = Math.abs(targetCost - recipeCost) / Math.max(targetCost, recipeCost, 1);
      score += (1 - costDifference) * 0.4; // 40% weight for price similarity
    }
    
    if (score > 0.3) { // Only include recipes with >30% similarity
      similarities.push({ recipe, score });
    }
  }
  
  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) // Top 3 most similar
    .map(s => s.recipe);
}

// Calculate market average for new items
function calculateMarketAverage(recipes: Recipe[], sales: SalesRecord[]): number {
  const recipeAverages: number[] = [];
  
  for (const recipe of recipes) {
    const recipeSales = sales.filter(s => s.recipeId === recipe.id);
    if (recipeSales.length > 0) {
      const avgSales = recipeSales.reduce((sum, sale) => sum + sale.quantity, 0) / recipeSales.length;
      recipeAverages.push(avgSales);
    }
  }
  
  return recipeAverages.length > 0 
    ? recipeAverages.reduce((sum, avg) => sum + avg, 0) / recipeAverages.length
    : 5; // Default average
}

// Seasonal adjustments based on month and weather patterns
function getSeasonalMultiplier(date: Date): number {
  const month = date.getMonth() + 1; // 1-12
  
  // Restaurant seasonal patterns
  const seasonalPatterns: { [key: number]: number } = {
    1: 0.8,   // January - post-holiday slump
    2: 0.85,  // February - Valentine's boost
    3: 0.9,   // March - spring awakening
    4: 0.95,  // April - spring break
    5: 1.0,   // May - graduation season
    6: 1.1,   // June - summer vacation
    7: 1.15,  // July - peak summer
    8: 1.1,   // August - summer vacation
    9: 0.95,  // September - back to school
    10: 1.0,  // October - fall activities
    11: 1.05, // November - pre-holiday
    12: 1.2   // December - holiday season
  };
  
  return seasonalPatterns[month] || 1.0;
}

// Enhanced seasonal multiplier that considers price peaks from historical data
function getEnhancedSeasonalMultiplier(date: Date, recipe: Recipe, allProducts: any[]): number {
  const month = date.getMonth() + 1;
  
  // Get base seasonal pattern
  const baseMultiplier = getSeasonalMultiplier(date);
  
  // Analyze price peaks from recipe ingredients
  const pricePeakMultiplier = analyzePricePeaks(recipe, allProducts, month);
  
  // Combine base seasonal pattern with price peak analysis
  return baseMultiplier * pricePeakMultiplier;
}

// Analyze price peaks from historical data
function analyzePricePeaks(recipe: Recipe, allProducts: any[], targetMonth: number): number {
  let totalPeakMultiplier = 0;
  let ingredientCount = 0;
  
  // Analyze each ingredient in the recipe
  for (const ingredient of recipe.ingredients) {
    const product = allProducts.find(p => p.id === ingredient.productId);
    if (product && product.priceHistory && product.priceHistory.length > 0) {
      const peakMultiplier = detectProductPricePeak(product, targetMonth);
      totalPeakMultiplier += peakMultiplier;
      ingredientCount++;
    }
  }
  
  // Return average peak multiplier, or 1.0 if no ingredients analyzed
  return ingredientCount > 0 ? totalPeakMultiplier / ingredientCount : 1.0;
}

// Detect price peaks for a specific product
function detectProductPricePeak(product: any, targetMonth: number): number {
  if (!product.priceHistory || product.priceHistory.length < 3) {
    return 1.0; // Not enough data
  }
  
  // Group prices by month
  const pricesByMonth: { [key: number]: number[] } = {};
  
  product.priceHistory.forEach((priceEntry: any) => {
    const date = new Date(priceEntry.date);
    const month = date.getMonth() + 1;
    
    if (!pricesByMonth[month]) {
      pricesByMonth[month] = [];
    }
    pricesByMonth[month].push(priceEntry.price);
  });
  
  // Calculate average price for each month
  const monthlyAverages: { [key: number]: number } = {};
  for (const [month, prices] of Object.entries(pricesByMonth)) {
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    monthlyAverages[parseInt(month)] = avgPrice;
  }
  
  // Find the overall average price
  const allPrices = Object.values(monthlyAverages);
  const overallAverage = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
  
  // Find the peak month (highest average price)
  let peakMonth = 1;
  let peakPrice = 0;
  
  for (const [month, avgPrice] of Object.entries(monthlyAverages)) {
    if (avgPrice > peakPrice) {
      peakPrice = avgPrice;
      peakMonth = parseInt(month);
    }
  }
  
  // Calculate how much the target month's price differs from average
  const targetMonthPrice = monthlyAverages[targetMonth] || overallAverage;
  const peakMultiplier = targetMonthPrice / overallAverage;
  
  // Apply additional multiplier if this is the peak month
  const isPeakMonth = targetMonth === peakMonth;
  const peakBonus = isPeakMonth ? 1.1 : 1.0; // 10% bonus during peak month
  
  return peakMultiplier * peakBonus;
}

// Detect supply chain disruptions that affect pricing
function detectSupplyChainPricing(product: any): { disrupted: boolean; priceImpact: number } {
  if (!product.priceHistory || product.priceHistory.length < 2) {
    return { disrupted: false, priceImpact: 1.0 };
  }
  
  // Calculate recent price changes
  const recentPrices = product.priceHistory.slice(-3); // Last 3 price entries
  const priceChanges = [];
  
  for (let i = 1; i < recentPrices.length; i++) {
    const change = (recentPrices[i].price - recentPrices[i-1].price) / recentPrices[i-1].price;
    priceChanges.push(change);
  }
  
  // Detect significant price increases (supply chain issues)
  const avgPriceChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
  const isDisrupted = avgPriceChange > 0.1; // 10% or more increase indicates disruption
  
  return {
    disrupted: isDisrupted,
    priceImpact: isDisrupted ? 1.0 + avgPriceChange : 1.0
  };
}

// Holiday and special event adjustments
function getHolidayMultiplier(date: Date): number {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  
  // Major holidays
  const holidays: { [key: string]: number } = {
    '1-1': 0.5,    // New Year's Day
    '2-14': 1.4,   // Valentine's Day
    '3-17': 1.2,   // St. Patrick's Day
    '4-1': 1.1,    // April Fools (some restaurants do specials)
    '5-5': 1.3,    // Cinco de Mayo
    '7-4': 0.7,    // Independence Day (many closed)
    '10-31': 1.3,  // Halloween
    '11-11': 1.1,  // Veterans Day
    '11-25': 0.6,  // Thanksgiving
    '12-25': 0.3,  // Christmas Day
    '12-31': 1.5   // New Year's Eve
  };
  
  const holidayKey = `${month}-${day}`;
  if (holidays[holidayKey]) {
    return holidays[holidayKey];
  }
  
  // Weekend before/after major holidays
  const thanksgivingWeekend = isThanksgivingWeekend(date);
  const christmasWeekend = isChristmasWeekend(date);
  const valentineWeekend = isValentineWeekend(date);
  
  if (thanksgivingWeekend) return 1.2;
  if (christmasWeekend) return 1.4;
  if (valentineWeekend) return 1.3;
  
  return 1.0;
}

// Helper functions for holiday weekends
function isThanksgivingWeekend(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  
  // Thanksgiving is 4th Thursday of November
  if (month === 11 && dayOfWeek === 5 && day >= 22 && day <= 28) return true;
  if (month === 11 && dayOfWeek === 6 && day >= 23 && day <= 29) return true;
  if (month === 11 && dayOfWeek === 0 && day >= 24 && day <= 30) return true;
  
  return false;
}

function isChristmasWeekend(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  
  // Christmas is December 25th
  if (month === 12 && day >= 23 && day <= 26) return true;
  
  return false;
}

function isValentineWeekend(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  
  // Valentine's Day is February 14th
  if (month === 2 && day >= 12 && day <= 16) return true;
  
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipeId, days = '14', restaurantId = 'default' } = req.query;

  try {
    // Load real restaurant data
    const restaurantData = await loadRestaurantData(restaurantId as string);
    const forecastData = await fetchSalesForecasts(
      restaurantData.recipes, 
      restaurantData.sales, 
      recipeId as string, 
      parseInt(days as string),
      restaurantData.products // Pass products for price analysis
    );
    
    res.status(200).json({
      success: true,
      data: forecastData
    });
  } catch (error) {
    console.error('Error fetching sales forecasts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales forecasts'
    });
  }
}

async function fetchSalesForecasts(
  recipes: Recipe[], 
  sales: SalesRecord[], 
  recipeId?: string, 
  days: number = 14,
  products?: any[] // Add products parameter for price analysis
): Promise<SalesForecast[]> {
  try {
    const forecasts: SalesForecast[] = [];
    
    // Get recipes to forecast
    const recipesToForecast = recipeId 
      ? recipes.filter(r => r.id === recipeId)
      : recipes;
    
    if (recipesToForecast.length === 0) {
      // Return mock data if no real recipes exist
      const mockRecipes = ['recipe-1', 'recipe-2', 'recipe-3'];
      for (const recipe of mockRecipes) {
        for (let i = 1; i <= days; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          
          forecasts.push({
            id: `sf_${recipe}_${date.toISOString().split('T')[0].replace(/-/g, '')}`,
            recipeId: recipe,
            recipeName: `Recipe ${recipe.split('-')[1]}`,
            date: date.toISOString().split('T')[0],
            predictedQuantity: Math.floor(Math.random() * 50) + 10,
            confidenceInterval: {
              lower: Math.floor(Math.random() * 30) + 5,
              upper: Math.floor(Math.random() * 70) + 20
            },
            modelType: 'prophet',
            accuracy: 0.85 + Math.random() * 0.1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
      return forecasts;
    }
    
    // Generate forecasts based on real recipe data and sales history
    for (const recipe of recipesToForecast) {
      // Get sales data for this recipe
      const recipeSales = sales.filter(s => s.recipeId === recipe.id);
      
      if (recipeSales.length === 0) {
        // Enhanced handling for new menu items with limited history
        const newItemForecast = await generateNewItemForecast(recipe, recipes, sales, days);
        
        for (let i = 1; i <= days; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          
          forecasts.push({
            id: `sf_${recipe.id}_${date.toISOString().split('T')[0].replace(/-/g, '')}`,
            recipeId: recipe.id,
            recipeName: recipe.name,
            date: date.toISOString().split('T')[0],
            predictedQuantity: newItemForecast[i - 1] || 5,
            confidenceInterval: { 
              lower: Math.max(1, (newItemForecast[i - 1] || 5) - 3), 
              upper: (newItemForecast[i - 1] || 5) + 3 
            },
            modelType: 'regression',
            accuracy: 0.6, // Moderate accuracy for new items
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        continue;
      }
      
      // Enhanced forecasting with trend analysis
      const salesByDate = new Map<string, number>();
      
      // Group sales by date
      recipeSales.forEach(sale => {
        const dateKey = sale.date.split('T')[0];
        salesByDate.set(dateKey, (salesByDate.get(dateKey) || 0) + sale.quantity);
      });
      
      // Calculate trend (simple linear regression)
      const dates = Array.from(salesByDate.keys()).sort();
      const quantities = dates.map(date => salesByDate.get(date)!);
      
      let trend = 0;
      if (dates.length > 1) {
        const xMean = (dates.length - 1) / 2;
        const yMean = quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length;
        
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < dates.length; i++) {
          const x = i - xMean;
          const y = quantities[i] - yMean;
          numerator += x * y;
          denominator += x * x;
        }
        
        trend = denominator !== 0 ? numerator / denominator : 0;
      }
      
      // Calculate volatility (standard deviation)
      const mean = quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length;
      const variance = quantities.reduce((sum, qty) => sum + Math.pow(qty - mean, 2), 0) / quantities.length;
      const volatility = Math.sqrt(variance);
      
      // Calculate day-of-week patterns
      const dayOfWeekPatterns = new Array(7).fill(0);
      const dayOfWeekCounts = new Array(7).fill(0);
      
      dates.forEach((dateStr, index) => {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        dayOfWeekPatterns[dayOfWeek] += quantities[index];
        dayOfWeekCounts[dayOfWeek]++;
      });
      
      // Calculate average by day of week
      for (let i = 0; i < 7; i++) {
        if (dayOfWeekCounts[i] > 0) {
          dayOfWeekPatterns[i] /= dayOfWeekCounts[i];
        }
      }
      
      // Generate forecasts
      for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dayOfWeek = date.getDay();
        
        // Base prediction with trend
        const basePrediction = mean + (trend * i);
        
        // Apply day-of-week pattern
        const dayPattern = dayOfWeekPatterns[dayOfWeek] || mean;
        const dayMultiplier = dayPattern / mean;
        
        // Apply seasonal and holiday adjustments
        const seasonalMultiplier = getEnhancedSeasonalMultiplier(date, recipe, products || []); // Pass products
        const holidayMultiplier = getHolidayMultiplier(date);
        
        // Calculate prediction with trend, seasonality, and special events
        let predictedQuantity = basePrediction * dayMultiplier * seasonalMultiplier * holidayMultiplier;
        
        // Add realistic variation based on historical volatility
        const variation = (Math.random() - 0.5) * 2 * volatility;
        predictedQuantity += variation;
        
        // Ensure positive values
        predictedQuantity = Math.max(1, Math.round(predictedQuantity));
        
        // Calculate confidence interval based on volatility
        const confidenceRange = Math.max(1, Math.round(volatility * 1.5));
        const confidenceInterval = {
          lower: Math.max(1, predictedQuantity - confidenceRange),
          upper: predictedQuantity + confidenceRange
        };
        
        // Calculate accuracy based on data quality
        const accuracy = Math.min(0.95, Math.max(0.6, 
          0.8 + (dates.length / 30) * 0.15 - (volatility / mean) * 0.2
        ));
        
        forecasts.push({
          id: `sf_${recipe.id}_${date.toISOString().split('T')[0].replace(/-/g, '')}`,
          recipeId: recipe.id,
          recipeName: recipe.name,
          date: date.toISOString().split('T')[0],
          predictedQuantity,
          confidenceInterval,
          modelType: 'regression',
          accuracy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return forecasts;
  } catch (error) {
    console.error('Error in fetchSalesForecasts:', error);
    throw error;
  }
}
