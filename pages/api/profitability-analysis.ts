import type { NextApiRequest, NextApiResponse } from 'next';
import { ProfitabilityAnalyzer } from '@/lib/profitability-analyzer';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { restaurantId = 'default', includeRecommendations = 'true' } = req.query;

  try {
    // Load restaurant data
    const restaurantData = await loadRestaurantData(restaurantId as string);
    
    if (!restaurantData) {
      return res.status(404).json({ error: 'Restaurant data not found' });
    }

    const { recipes, products, sales } = restaurantData;

    // Perform profitability analysis
    const analyses = await ProfitabilityAnalyzer.analyzeAllRecipes(recipes, products, sales);

    // Get alerts
    const alerts = ProfitabilityAnalyzer.getProfitabilityAlerts(analyses);

    // Generate menu optimization suggestions if requested
    let menuSuggestions = [];
    if (includeRecommendations === 'true') {
      menuSuggestions = await ProfitabilityAnalyzer.generateMenuOptimizationSuggestions(products, recipes);
    }

    // Calculate summary statistics
    const summary = {
      totalRecipes: analyses.length,
      profitableRecipes: analyses.filter(a => a.isProfitable).length,
      unprofitableRecipes: analyses.filter(a => !a.isProfitable).length,
      averageProfitMargin: analyses.reduce((sum, a) => sum + a.profitMarginPercentage, 0) / analyses.length,
      totalPotentialSavings: analyses.reduce((sum, a) => 
        sum + a.recommendations.reduce((recSum, rec) => recSum + rec.potentialSavings, 0), 0
      ),
      criticalAlerts: alerts.critical.length,
      warningAlerts: alerts.warning.length
    };

    const response = {
      restaurantId,
      timestamp: new Date().toISOString(),
      summary,
      analyses,
      alerts,
      menuSuggestions,
      recommendations: {
        topCostReductions: analyses
          .flatMap(a => a.recommendations)
          .filter(r => r.type === 'substitution')
          .sort((a, b) => b.potentialSavings - a.potentialSavings)
          .slice(0, 5),
        priceAdjustments: analyses
          .flatMap(a => a.recommendations)
          .filter(r => r.type === 'price_adjustment')
          .sort((a, b) => b.potentialSavings - a.potentialSavings)
          .slice(0, 3)
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in profitability analysis:', error);
    return res.status(500).json({ 
      error: 'Failed to perform profitability analysis',
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
