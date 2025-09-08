import type { NextApiRequest, NextApiResponse } from 'next';
import { USDAPriceAPI } from '@/lib/usda-price-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, type = 'all' } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const results = {
      query: query as string,
      type: type as string,
      timestamp: new Date().toISOString(),
      data: null as any,
      error: null as string | null
    };

    // Search USDA FoodData Central for nutritional data
    if (type === 'all' || type === 'nutritional') {
      try {
        const foodDataUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${process.env.USDA_FOODDATA_API_KEY}&query=${encodeURIComponent(query as string)}&pageSize=10&dataType=Foundation,SR Legacy`;
        const foodDataResponse = await fetch(foodDataUrl, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (foodDataResponse.ok) {
          const foodData = await foodDataResponse.json();
          results.data = {
            nutritional: foodData.foods?.slice(0, 5) || [],
            price: null
          };
        }
      } catch (error) {
        console.error('Error fetching USDA FoodData:', error);
      }
    }

    // Get USDA price data
    if (type === 'all' || type === 'price') {
      try {
        const priceData = await USDAPriceAPI.getCommodityPriceData(query as string);
        if (priceData) {
          if (!results.data) results.data = {};
          results.data.price = priceData;
        }
      } catch (error) {
        console.error('Error fetching USDA price data:', error);
      }
    }

    // If no data found, provide mock data for demonstration
    if (!results.data || (!results.data.nutritional && !results.data.price)) {
      results.data = {
        nutritional: [{
          fdcId: 'mock-1',
          description: `${query} (mock data)`,
          dataType: 'Foundation',
          foodCategory: 'Mock Category',
          foodNutrients: [
            { nutrientName: 'Protein', value: 5.2, unitName: 'G' },
            { nutrientName: 'Total lipid (fat)', value: 2.1, unitName: 'G' },
            { nutrientName: 'Carbohydrate, by difference', value: 15.3, unitName: 'G' },
            { nutrientName: 'Energy', value: 95, unitName: 'KCAL' }
          ]
        }],
        price: {
          commodity: query as string,
          currentPrice: 3.50,
          unit: 'lb',
          volatilityMetrics: {
            overallVolatility: 0.15,
            peakMonth: 6,
            lowMonth: 12,
            peakPrice: 4.20,
            lowPrice: 2.80,
            seasonalPattern: 'moderate'
          },
          marketInsights: {
            supplyTrend: 'stable',
            demandTrend: 'stable',
            seasonalFactors: ['Seasonal availability', 'Market demand'],
            recommendations: ['Monitor prices for seasonal opportunities']
          }
        }
      };
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('USDA search error:', error);
    res.status(500).json({ 
      error: 'Failed to search USDA database',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
