import type { NextApiRequest, NextApiResponse } from 'next';
import { USDAPriceAPI } from '@/lib/usda-price-api';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { restaurantId = 'default', forceUpdate = false } = req.body;

  try {
    // Load current restaurant data
    const restaurantData = await loadRestaurantData(restaurantId);
    
    if (!restaurantData) {
      return res.status(404).json({ error: 'Restaurant data not found' });
    }

    const { products } = restaurantData;
    const updatedProducts = [];
    const priceUpdates = [];
    const alerts = [];

    // Check each product for price updates
    for (const product of products) {
      try {
        // Get current price from USDA API
        const currentPriceData = await USDAPriceAPI.getCommodityPriceData(product.name);
        
        if (currentPriceData && currentPriceData.currentPrice) {
          const newPrice = currentPriceData.currentPrice;
          const oldPrice = product.cost || 0;
          const priceChange = newPrice - oldPrice;
          const priceChangePercentage = oldPrice > 0 ? (priceChange / oldPrice) * 100 : 0;

          // Update product with new price
          const updatedProduct = {
            ...product,
            cost: newPrice,
            priceHistory: [
              ...(product.priceHistory || []),
              {
                date: new Date().toISOString(),
                price: newPrice,
                packageSize: product.packageSize,
                quantity: product.quantity
              }
            ].slice(-30) // Keep only last 30 price entries
          };

          updatedProducts.push(updatedProduct);

          // Track significant price changes
          if (Math.abs(priceChangePercentage) > 10) { // 10% change threshold
            priceUpdates.push({
              productId: product.id,
              productName: product.name,
              oldPrice,
              newPrice,
              priceChange,
              priceChangePercentage,
              severity: Math.abs(priceChangePercentage) > 25 ? 'high' : 'medium'
            });

            // Generate alerts for significant increases
            if (priceChangePercentage > 25) {
              alerts.push({
                type: 'price_increase',
                severity: 'high',
                productId: product.id,
                productName: product.name,
                message: `${product.name} price increased by ${priceChangePercentage.toFixed(1)}% ($${oldPrice.toFixed(2)} → $${newPrice.toFixed(2)})`,
                impact: 'This may significantly affect recipe profitability',
                recommendedActions: [
                  'Review recipe costs immediately',
                  'Consider ingredient substitutions',
                  'Evaluate menu pricing adjustments'
                ]
              });
            } else if (priceChangePercentage < -25) {
              alerts.push({
                type: 'price_decrease',
                severity: 'low',
                productId: product.id,
                productName: product.name,
                message: `${product.name} price decreased by ${Math.abs(priceChangePercentage).toFixed(1)}% ($${oldPrice.toFixed(2)} → $${newPrice.toFixed(2)})`,
                impact: 'This may improve recipe profitability',
                recommendedActions: [
                  'Review recipe costs for potential savings',
                  'Consider increasing portion sizes',
                  'Evaluate competitive pricing opportunities'
                ]
              });
            }
          }
        } else {
          // No price update available, keep existing product
          updatedProducts.push(product);
        }

        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error updating price for ${product.name}:`, error);
        // Keep existing product if price update fails
        updatedProducts.push(product);
      }
    }

    // Update restaurant data with new prices
    const updatedRestaurantData = {
      ...restaurantData,
      products: updatedProducts
    };

    // Save updated data
    await saveRestaurantData(restaurantId, updatedRestaurantData);

    // Calculate summary statistics
    const summary = {
      totalProducts: products.length,
      updatedProducts: priceUpdates.length,
      highSeverityUpdates: priceUpdates.filter(u => u.severity === 'high').length,
      averagePriceChange: priceUpdates.length > 0 
        ? priceUpdates.reduce((sum, u) => sum + Math.abs(u.priceChangePercentage), 0) / priceUpdates.length 
        : 0,
      totalCostImpact: priceUpdates.reduce((sum, u) => sum + u.priceChange, 0)
    };

    const response = {
      restaurantId,
      timestamp: new Date().toISOString(),
      summary,
      priceUpdates,
      alerts,
      updatedProducts: updatedProducts.map(p => ({
        id: p.id,
        name: p.name,
        oldPrice: p.priceHistory && p.priceHistory.length > 1 
          ? p.priceHistory[p.priceHistory.length - 2].price 
          : p.cost,
        newPrice: p.cost,
        priceChange: p.priceHistory && p.priceHistory.length > 1 
          ? p.cost - p.priceHistory[p.priceHistory.length - 2].price 
          : 0
      }))
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in price monitoring:', error);
    return res.status(500).json({ 
      error: 'Failed to update prices',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function loadRestaurantData(restaurantId: string) {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      const allData = JSON.parse(fileContent);
      return allData[restaurantId] || null;
    }
  } catch (error) {
    console.error('Error loading restaurant data:', error);
  }
  return null;
}

async function saveRestaurantData(restaurantId: string, restaurantData: any) {
  try {
    // Load all data
    let allData = {};
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      allData = JSON.parse(fileContent);
    }

    // Update specific restaurant data
    allData[restaurantId] = restaurantData;

    // Save back to file
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(allData, null, 2));
  } catch (error) {
    console.error('Error saving restaurant data:', error);
    throw error;
  }
}
