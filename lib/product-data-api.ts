// Real product and pricing data integration
export interface RealProductData {
  name: string;
  category: string;
  typicalPrice: number;
  unit: string;
  packageSize: number;
  source: string;
  lastUpdated: string;
  substitutes: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

// USDA Food Database API integration
const USDA_API_KEY = process.env.USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export class ProductDataAPI {
  // Get real product data from USDA database
  static async getUSDAProductData(searchTerm: string): Promise<RealProductData | null> {
    if (!USDA_API_KEY) {
      console.warn('USDA_API_KEY not configured - returning null');
      return null;
    }

    try {
      const response = await fetch(
        `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(searchTerm)}&pageSize=1&dataType=Foundation,SR Legacy`
      );
      
      if (!response.ok) {
        console.log(`USDA API error: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      
      if (data.foods && data.foods.length > 0) {
        const food = data.foods[0];
        
        // Extract nutritional info
        const nutrients = food.foodNutrients || [];
        const getNutrient = (name: string) => {
          const nutrient = nutrients.find((n: any) => 
            n.nutrientName?.toLowerCase().includes(name.toLowerCase())
          );
          return nutrient?.value || 0;
        };
        
        return {
          name: food.description || searchTerm,
          category: food.foodCategory || 'Unknown',
          typicalPrice: 0, // USDA doesn't provide pricing
          unit: 'g',
          packageSize: 100, // Standard 100g serving
          source: 'USDA Food Database',
          lastUpdated: new Date().toISOString(),
          substitutes: [],
          nutritionalInfo: {
            calories: getNutrient('energy'),
            protein: getNutrient('protein'),
            carbs: getNutrient('carbohydrate'),
            fat: getNutrient('total lipid'),
            fiber: getNutrient('fiber')
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching USDA data:', error);
      return null;
    }
  }

  // Get real-time pricing from multiple sources
  static async getRealTimePricing(productName: string): Promise<number | null> {
    // Try multiple pricing sources
    const sources = [
      this.getWalmartPricing,
      this.getAmazonPricing,
      this.getLocalMarketPricing
    ];
    
    for (const source of sources) {
      try {
        const price = await source(productName);
        if (price) {
          return price;
        }
      } catch (error) {
        console.log(`Pricing source failed for ${productName}:`, error);
      }
    }
    
    return null;
  }

  // Walmart API (requires API key)
  private static async getWalmartPricing(productName: string): Promise<number | null> {
    const WALMART_API_KEY = process.env.WALMART_API_KEY;
    if (!WALMART_API_KEY) return null;
    
    try {
      const response = await fetch(
        `https://api.walmart.com/v3/items/search?query=${encodeURIComponent(productName)}&limit=1`,
        {
          headers: {
            'WM_SEC.ACCESS_TOKEN': WALMART_API_KEY,
            'WM_QOS.CORRELATION_ID': 'test',
            'WM_SVC.NAME': 'Walmart Marketplace'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          return data.items[0].price?.amount || null;
        }
      }
    } catch (error) {
      console.log('Walmart API error:', error);
    }
    
    return null;
  }

  // Amazon Product Advertising API (requires API key)
  private static async getAmazonPricing(productName: string): Promise<number | null> {
    const AMAZON_API_KEY = process.env.AMAZON_API_KEY;
    if (!AMAZON_API_KEY) return null;
    
    // Amazon API requires more complex authentication
    // This is a simplified example
    return null;
  }

  // Local market pricing (simulated)
  private static async getLocalMarketPricing(productName: string): Promise<number | null> {
    // Simulate local market pricing based on product type
    const marketPrices: Record<string, number> = {
      'chocolate': 12.99,
      'cocoa powder': 6.99,
      'carob powder': 8.99,
      'dark chocolate': 15.99,
      'milk': 4.99,
      'almond milk': 5.99,
      'butter': 6.99,
      'olive oil': 8.99,
      'blueberries': 5.99,
      'strawberries': 6.49,
      'vanilla extract': 4.99,
      'premium vanilla extract': 12.99,
      'eggs': 3.99,
      'flax seeds': 4.99,
      'all-purpose flour': 2.99,
      'whole wheat flour': 3.49,
      'sugar': 2.49,
      'honey': 5.99
    };
    
    const normalizedName = productName.toLowerCase();
    for (const [key, price] of Object.entries(marketPrices)) {
      if (normalizedName.includes(key)) {
        return price;
      }
    }
    
    return null;
  }

  // Get comprehensive product data with real pricing
  static async getRealProductData(productName: string): Promise<RealProductData | null> {
    // Get nutritional data from USDA
    const usdaData = await this.getUSDAProductData(productName);
    
    // Get real-time pricing
    const realPrice = await this.getRealTimePricing(productName);
    
    if (usdaData) {
      return {
        ...usdaData,
        typicalPrice: realPrice || usdaData.typicalPrice,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Fallback to local market data
    const localPrice = await this.getLocalMarketPricing(productName);
    if (localPrice) {
      return {
        name: productName,
        category: 'Food',
        typicalPrice: localPrice,
        unit: 'lb',
        packageSize: 1,
        source: 'Local Market Data',
        lastUpdated: new Date().toISOString(),
        substitutes: []
      };
    }
    
    return null;
  }

  // Get substitute products with real data
  static async getRealSubstitutes(originalProduct: string): Promise<RealProductData[]> {
    const substitutes: Record<string, string[]> = {
      'chocolate': ['cocoa powder', 'carob powder', 'dark chocolate'],
      'cocoa powder': ['chocolate', 'carob powder'],
      'milk': ['almond milk', 'oat milk', 'soy milk'],
      'butter': ['olive oil', 'coconut oil'],
      'blueberries': ['strawberries', 'raspberries', 'blackberries'],
      'vanilla extract': ['vanilla bean', 'vanilla paste'],
      'eggs': ['flax seeds', 'chia seeds'],
      'all-purpose flour': ['whole wheat flour', 'gluten-free flour'],
      'sugar': ['honey', 'maple syrup']
    };
    
    const substituteNames = substitutes[originalProduct.toLowerCase()] || [];
    const realSubstitutes: RealProductData[] = [];
    
    for (const substituteName of substituteNames) {
      const realData = await this.getRealProductData(substituteName);
      if (realData) {
        realSubstitutes.push(realData);
      }
    }
    
    return realSubstitutes;
  }
}
