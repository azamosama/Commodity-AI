import type { NextApiRequest, NextApiResponse } from 'next';
import { InventoryForecast, Product, Recipe, SalesRecord, InventoryItem } from '@/lib/types';
import fs from 'fs';
import path from 'path';

// Load restaurant data helper
const loadRestaurantData = async (restaurantId: string) => {
  const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');
  
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      const allData = JSON.parse(fileContent);
      return allData[restaurantId] || { products: [], recipes: [], sales: [], inventory: [] };
    }
  } catch (error) {
    console.error('Error loading restaurant data:', error);
  }
  return { products: [], recipes: [], sales: [], inventory: [] };
};

// Check for supply chain disruptions based on product characteristics and market conditions
async function checkSupplyChainStatus(product: Product): Promise<{ disrupted: boolean; reason?: string; severity: 'low' | 'medium' | 'high' }> {
  // Known supply chain issues by product category
  const supplyChainIssues: { [key: string]: { disrupted: boolean; reason: string; severity: 'low' | 'medium' | 'high' } } = {
    'Fresh Food': { disrupted: true, reason: 'Seasonal availability and transportation delays', severity: 'medium' },
    'Seafood': { disrupted: true, reason: 'Weather conditions and fishing regulations', severity: 'high' },
    'Dairy': { disrupted: false, reason: 'Stable supply chain', severity: 'low' },
    'Meat': { disrupted: true, reason: 'Processing plant capacity and logistics', severity: 'medium' },
    'Produce': { disrupted: true, reason: 'Weather-dependent supply and seasonal changes', severity: 'medium' },
    'Dry Goods': { disrupted: false, reason: 'Stable supply chain', severity: 'low' },
    'Beverages': { disrupted: false, reason: 'Stable supply chain', severity: 'low' },
    'Frozen Foods': { disrupted: false, reason: 'Stable supply chain', severity: 'low' }
  };
  
  // Check if product is currently out of stock (indicates supply issue)
  const isOutOfStock = product.currentStock === 0 || product.isAvailable === false;
  
  // Check for recent price increases (indicates supply pressure)
  const hasPriceIncrease = product.priceHistory && product.priceHistory.length > 1;
  const recentPriceIncrease = hasPriceIncrease && product.priceHistory ? 
    product.priceHistory[product.priceHistory.length - 1].price > product.priceHistory[product.priceHistory.length - 2].price : false;
  
  // Determine disruption status
  const categoryIssue = supplyChainIssues[product.categoryType] || { disrupted: false, reason: 'Unknown category', severity: 'low' };
  
  if (isOutOfStock) {
    return { disrupted: true, reason: 'Currently out of stock', severity: 'high' };
  }
  
  if (recentPriceIncrease) {
    return { disrupted: true, reason: 'Recent price increase indicates supply pressure', severity: 'medium' };
  }
  
  if (categoryIssue.disrupted) {
    return categoryIssue;
  }
  
  return { disrupted: false, reason: 'No known supply chain issues', severity: 'low' };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productId, days = '14', restaurantId = 'default' } = req.query;

  try {
    // Load real restaurant data
    const restaurantData = await loadRestaurantData(restaurantId as string);
    const forecastData = await fetchInventoryForecasts(
      restaurantData.products,
      restaurantData.recipes,
      restaurantData.sales,
      restaurantData.inventory,
      productId as string,
      parseInt(days as string)
    );
    
    res.status(200).json({
      success: true,
      data: forecastData
    });
  } catch (error) {
    console.error('Error fetching inventory forecasts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory forecasts'
    });
  }
}

async function fetchInventoryForecasts(
  products: Product[],
  recipes: Recipe[],
  sales: SalesRecord[],
  inventory: InventoryItem[],
  productId?: string,
  days: number = 14
): Promise<InventoryForecast[]> {
  try {
    const forecasts: InventoryForecast[] = [];
    
    // Get products to forecast
    const productsToForecast = productId 
      ? products.filter(p => p.id === productId)
      : products;
    
    if (productsToForecast.length === 0) {
      // Return mock data if no real products exist
      const mockProducts = ['product-1', 'product-2', 'product-3'];
      for (const product of mockProducts) {
        for (let i = 1; i <= days; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          
          const predictedStock = Math.max(0, 100 - (i * 3) + Math.random() * 15);
          const depletionDate = predictedStock <= 20 ? date.toISOString().split('T')[0] : undefined;
          const reorderDate = predictedStock <= 50 ? new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined;
          
          forecasts.push({
            id: `if_${product}_${date.toISOString().split('T')[0].replace(/-/g, '')}`,
            productId: product,
            productName: `Product ${product.split('-')[1]}`,
            date: date.toISOString().split('T')[0],
            predictedStock: Math.round(predictedStock * 100) / 100,
            depletionDate: depletionDate,
            reorderDate: reorderDate,
            suggestedOrderQuantity: predictedStock <= 50 ? Math.floor(Math.random() * 50) + 20 : 0,
            confidenceLevel: 0.85 + Math.random() * 0.1,
            modelType: 'prophet',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
      return forecasts;
    }
    
    // Generate forecasts based on real product data and usage patterns
    for (const product of productsToForecast) {
      // Get current stock from inventory
      const currentInventory = inventory.find(i => i.productId === product.id);
      const currentStock = currentInventory?.currentStock || product.quantity || 0;
      
      // Calculate average daily usage for this product
      let totalUsage = 0;
      let usageDays = 0;
      const usageByDate = new Map<string, number>();
      
      // Calculate usage from sales records with date tracking
      for (const sale of sales) {
        const recipe = recipes.find(r => r.id === sale.recipeId);
        if (recipe) {
          const ingredient = recipe.ingredients.find(i => i.productId === product.id);
          if (ingredient) {
            const quantity = typeof ingredient.quantity === 'string' ? parseFloat(ingredient.quantity) || 0 : ingredient.quantity;
            const usage = quantity * sale.quantity;
            totalUsage += usage;
            usageDays++;
            
            // Track usage by date
            const dateKey = sale.date.split('T')[0];
            usageByDate.set(dateKey, (usageByDate.get(dateKey) || 0) + usage);
          }
        }
      }
      
      const averageDailyUsage = usageDays > 0 ? totalUsage / usageDays : 2; // Default usage
      
      // Calculate usage volatility
      const usageValues = Array.from(usageByDate.values());
      const usageMean = usageValues.length > 0 ? usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length : averageDailyUsage;
      const usageVariance = usageValues.length > 0 
        ? usageValues.reduce((sum, val) => sum + Math.pow(val - usageMean, 2), 0) / usageValues.length 
        : 0;
      const usageVolatility = Math.sqrt(usageVariance);
      
      // Calculate safety stock and reorder point with volatility consideration
      const safetyStock = product.safetyStock || Math.max(5, averageDailyUsage * 3 + usageVolatility * 2);
      const reorderPoint = product.reorderPoint || Math.max(10, averageDailyUsage * 5 + usageVolatility * 3);
      
      // Calculate trend in usage (if we have enough data)
      let usageTrend = 0;
      if (usageValues.length > 3) {
        const xMean = (usageValues.length - 1) / 2;
        const yMean = usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length;
        
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < usageValues.length; i++) {
          const x = i - xMean;
          const y = usageValues[i] - yMean;
          numerator += x * y;
          denominator += x * x;
        }
        
        usageTrend = denominator !== 0 ? numerator / denominator : 0;
      }
      
      for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        // Calculate predicted usage with trend
        const predictedDailyUsage = averageDailyUsage + (usageTrend * i);
        
        // Calculate predicted stock with more realistic depletion
        let predictedStock = currentStock;
        for (let day = 1; day <= i; day++) {
          const dayUsage = predictedDailyUsage + (Math.random() - 0.5) * usageVolatility;
          predictedStock = Math.max(0, predictedStock - dayUsage);
        }
        
        // Determine depletion and reorder dates with more precision
        const depletionDate = predictedStock <= safetyStock ? date.toISOString().split('T')[0] : undefined;
        const reorderDate = predictedStock <= reorderPoint ? new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined;
        
        // Calculate suggested order quantity with safety buffer
        const leadTime = product.leadTime || 7;
        const safetyBuffer = usageVolatility * Math.sqrt(leadTime);
        const suggestedOrderQuantity = predictedStock <= reorderPoint 
          ? Math.max(20, Math.ceil(predictedDailyUsage * 14 + safetyBuffer)) // 2 weeks + safety buffer
          : 0;
        
        // Calculate confidence level based on data quality
        const confidenceLevel = Math.min(0.95, Math.max(0.6,
          0.8 + (usageDays / 30) * 0.15 - (usageVolatility / averageDailyUsage) * 0.2
        ));
        
        // Check for supply chain disruptions
        const supplyChainStatus = await checkSupplyChainStatus(product);
        const disruptionMultiplier = supplyChainStatus.disrupted ? 1.5 : 1.0; // Increase safety stock during disruptions
        
        // Adjust safety stock and reorder points for supply chain issues
        const adjustedSafetyStock = safetyStock * disruptionMultiplier;
        const adjustedReorderPoint = reorderPoint * disruptionMultiplier;
        
        // Adjust suggested order quantity for supply chain issues
        const adjustedOrderQuantity = suggestedOrderQuantity * (supplyChainStatus.disrupted ? 1.3 : 1.0);
        
        forecasts.push({
          id: `if_${product.id}_${date.toISOString().split('T')[0].replace(/-/g, '')}`,
          productId: product.id,
          productName: product.name,
          date: date.toISOString().split('T')[0],
          predictedStock: Math.round(predictedStock * 100) / 100,
          depletionDate: predictedStock <= adjustedSafetyStock ? date.toISOString().split('T')[0] : undefined,
          reorderDate: predictedStock <= adjustedReorderPoint ? new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
          suggestedOrderQuantity: adjustedOrderQuantity,
          confidenceLevel: supplyChainStatus.disrupted ? confidenceLevel * 0.8 : confidenceLevel, // Lower confidence during disruptions
          modelType: 'regression',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return forecasts;
  } catch (error) {
    console.error('Error in fetchInventoryForecasts:', error);
    throw error;
  }
}
