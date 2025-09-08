import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { commodity = 'strawberries' } = req.query;
  const FOODDATA_API_KEY = process.env.USDA_FOODDATA_API_KEY;
  const QUICKSTATS_API_KEY = process.env.USDA_QUICKSTATS_API_KEY;

  try {
    const results = {
      commodity: commodity,
      apiKeys: {
        foodData: FOODDATA_API_KEY ? FOODDATA_API_KEY.substring(0, 10) + '...' : 'Not configured',
        quickStats: QUICKSTATS_API_KEY ? QUICKSTATS_API_KEY.substring(0, 10) + '...' : 'Not configured'
      },
      tests: {} as any
    };

    // Test 1: USDA FoodData Central API
    try {
      const fdcUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${FOODDATA_API_KEY}&query=${encodeURIComponent(commodity as string)}&pageSize=5&dataType=Foundation,SR Legacy`;
      console.log('Testing USDA FoodData Central API...');
      
      const fdcResponse = await fetch(fdcUrl, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (fdcResponse.ok) {
        const fdcData = await fdcResponse.json();
        results.tests.foodDataCentral = {
          status: 'success',
          statusCode: fdcResponse.status,
          data: fdcData,
          message: 'USDA FoodData Central API working'
        };
      } else {
        results.tests.foodDataCentral = {
          status: 'error',
          statusCode: fdcResponse.status,
          error: `HTTP ${fdcResponse.status}`,
          message: 'USDA FoodData Central API not accessible'
        };
      }
    } catch (error) {
      results.tests.foodDataCentral = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'USDA FoodData Central API test failed'
      };
    }

    // Test 2: USDA Quick Stats API
    try {
      const quickStatsUrl = `https://quickstats.nass.usda.gov/api/api_GET/?key=${QUICKSTATS_API_KEY}&commodity_desc=${encodeURIComponent(commodity as string)}&statisticcat_desc=PRICE RECEIVED&format=JSON`;
      console.log('Testing USDA Quick Stats API...');
      
      const quickStatsResponse = await fetch(quickStatsUrl, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (quickStatsResponse.ok) {
        const quickStatsData = await quickStatsResponse.json();
        results.tests.quickStats = {
          status: 'success',
          statusCode: quickStatsResponse.status,
          data: quickStatsData,
          message: 'USDA Quick Stats API working'
        };
      } else {
        results.tests.quickStats = {
          status: 'error',
          statusCode: quickStatsResponse.status,
          error: `HTTP ${quickStatsResponse.status}`,
          message: 'USDA Quick Stats API not accessible'
        };
      }
    } catch (error) {
      results.tests.quickStats = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'USDA Quick Stats API test failed'
      };
    }

    // Test 3: USDA Market News API
    try {
      const marketNewsUrl = `https://marketnews.usda.gov/mnp/price-search?commodityName=${encodeURIComponent(commodity as string)}&api_key=${FOODDATA_API_KEY}`;
      console.log('Testing USDA Market News API...');
      
      const marketNewsResponse = await fetch(marketNewsUrl, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (marketNewsResponse.ok) {
        const marketNewsData = await marketNewsResponse.json();
        results.tests.marketNews = {
          status: 'success',
          statusCode: marketNewsResponse.status,
          data: marketNewsData,
          message: 'USDA Market News API working'
        };
      } else {
        results.tests.marketNews = {
          status: 'error',
          statusCode: marketNewsResponse.status,
          error: `HTTP ${marketNewsResponse.status}`,
          message: 'USDA Market News API not accessible'
        };
      }
    } catch (error) {
      results.tests.marketNews = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'USDA Market News API test failed'
      };
    }

    // Test 4: USDA ERS API (legacy)
    try {
      const ersUrl = `https://api.ers.usda.gov/data/retail-food-prices/${commodity}?api_key=${FOODDATA_API_KEY}`;
      console.log('Testing USDA ERS API...');
      
      const ersResponse = await fetch(ersUrl, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (ersResponse.ok) {
        const ersData = await ersResponse.json();
        results.tests.ers = {
          status: 'success',
          statusCode: ersResponse.status,
          data: ersData,
          message: 'USDA ERS API working'
        };
      } else {
        results.tests.ers = {
          status: 'error',
          statusCode: ersResponse.status,
          error: `HTTP ${ersResponse.status}`,
          message: 'USDA ERS API not accessible'
        };
      }
    } catch (error) {
      results.tests.ers = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'USDA ERS API test failed'
      };
    }

    res.status(200).json({
      success: true,
      message: 'USDA API tests completed',
      results
    });

  } catch (error) {
    console.error('Error testing USDA APIs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test USDA APIs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
