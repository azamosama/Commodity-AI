// USDA Price API Integration for Real Market Data
export interface USDAPriceData {
  commodity: string;
  category: string;
  currentPrice: number;
  unit: string;
  priceHistory: {
    date: string;
    price: number;
    source: string;
  }[];
  seasonalData: {
    month: number;
    averagePrice: number;
    availability: 'high' | 'medium' | 'low';
    volatility: number;
  }[];
  volatilityMetrics: {
    overallVolatility: number;
    peakMonth: number;
    lowMonth: number;
    peakPrice: number;
    lowPrice: number;
    priceRange: number;
    seasonalPattern: 'stable' | 'moderate' | 'high';
  };
  marketInsights: {
    supplyTrend: 'increasing' | 'decreasing' | 'stable';
    demandTrend: 'increasing' | 'decreasing' | 'stable';
    seasonalFactors: string[];
    recommendations: string[];
    dataSource?: string;
    updateFrequency?: string;
    lastUpdated?: string;
  };
}

export class USDAPriceAPI {
  private static readonly FOODDATA_API_KEY = process.env.USDA_FOODDATA_API_KEY;
  private static readonly QUICKSTATS_API_KEY = process.env.USDA_QUICKSTATS_API_KEY;
  
  // Cache for USDA data to avoid repeated API calls
  private static priceCache = new Map<string, { data: USDAPriceData; timestamp: number }>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get current market data from USDA Market News (more recent than Quick Stats)
   */
  static async getCurrentMarketData(commodityName: string): Promise<any> {
    if (!this.QUICKSTATS_API_KEY) {
      console.warn('USDA API key not configured for Market News');
      return null;
    }

    try {
      // Try multiple USDA Market News endpoints for current data
      const endpoints = [
        // Fresh Fruit and Vegetable Reports
        `https://marketnews.usda.gov/mnp/fv-report-config?commodityName=${encodeURIComponent(commodityName)}&api_key=${this.QUICKSTATS_API_KEY}`,
        // Price Search API
        `https://marketnews.usda.gov/mnp/price-search?commodityName=${encodeURIComponent(commodityName)}&api_key=${this.QUICKSTATS_API_KEY}`,
        // Daily Reports
        `https://marketnews.usda.gov/mnp/daily-reports?commodityName=${encodeURIComponent(commodityName)}&api_key=${this.QUICKSTATS_API_KEY}`,
        // Weekly Reports
        `https://marketnews.usda.gov/mnp/weekly-reports?commodityName=${encodeURIComponent(commodityName)}&api_key=${this.QUICKSTATS_API_KEY}`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Restaurant-Cost-Management/1.0'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`USDA Market News data for ${commodityName} from ${endpoint}:`, data);
            return data;
          } else {
            console.warn(`USDA Market News API error for ${endpoint}: ${response.status}`);
          }
        } catch (error) {
          console.warn(`Error fetching from ${endpoint}:`, error);
          continue; // Try next endpoint
        }
      }

      // If all endpoints fail, try alternative Market News sources
      return await this.fetchAlternativeMarketNews(commodityName);

    } catch (error) {
      console.error('Error fetching USDA Market News data:', error);
      return null;
    }
  }

  /**
   * Fetch alternative Market News sources when primary endpoints fail
   */
  private static async fetchAlternativeMarketNews(commodityName: string): Promise<any> {
    try {
      // Try USDA Market News RSS feeds and public data
      const alternativeEndpoints = [
        // Market News RSS Feed
        `https://marketnews.usda.gov/mnp/rss?commodityName=${encodeURIComponent(commodityName)}`,
        // Public Market Data
        `https://marketnews.usda.gov/mnp/public-data?commodityName=${encodeURIComponent(commodityName)}`,
        // Historical Price Data
        `https://marketnews.usda.gov/mnp/historical-prices?commodityName=${encodeURIComponent(commodityName)}`
      ];

      for (const endpoint of alternativeEndpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Accept': 'application/json, text/xml, */*',
              'User-Agent': 'Restaurant-Cost-Management/1.0'
            }
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType?.includes('application/json')) {
              data = await response.json();
            } else if (contentType?.includes('text/xml')) {
              // Handle RSS/XML data
              const text = await response.text();
              data = this.parseXMLMarketData(text, commodityName);
            } else {
              data = await response.text();
            }

            console.log(`Alternative Market News data for ${commodityName}:`, data);
            return data;
          }
        } catch (error) {
          console.warn(`Alternative Market News endpoint failed: ${endpoint}`, error);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching alternative Market News data:', error);
      return null;
    }
  }

  /**
   * Parse XML/RSS Market News data
   */
  private static parseXMLMarketData(xmlText: string, commodityName: string): any {
    try {
      // Simple XML parsing for Market News RSS feeds
      const priceMatches = xmlText.match(/<price>([^<]+)<\/price>/gi);
      const dateMatches = xmlText.match(/<pubDate>([^<]+)<\/pubDate>/gi);
      const titleMatches = xmlText.match(/<title>([^<]+)<\/title>/gi);

      if (priceMatches && priceMatches.length > 0) {
        const prices = priceMatches.map(match => {
          const price = match.replace(/<\/?price>/gi, '');
          return parseFloat(price) || 0;
        }).filter(price => price > 0);

        const dates = dateMatches?.map(match => {
          const date = match.replace(/<\/?pubDate>/gi, '');
          return new Date(date).toISOString().split('T')[0];
        }) || [];

        return {
          commodity: commodityName,
          prices,
          dates,
          source: 'USDA Market News RSS',
          lastUpdated: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing XML Market News data:', error);
      return null;
    }
  }

  /**
   * Get commodity price data from USDA APIs with current market data
   */
  static async getCommodityPriceData(commodityName: string): Promise<any> {
    const cacheKey = `usda_price_${commodityName.toLowerCase()}`;
    
    // Check cache first
    if (this.priceCache.has(cacheKey)) {
      const cached = this.priceCache.get(cacheKey);
      // Cache for shorter duration for more current data
      if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) { // 6 hours
        return cached.data;
      }
    }

    try {
      // Try USDA Market News API for current data first
      const marketNewsData = await this.getCurrentMarketData(commodityName);
      
      // Try USDA Quick Stats API for historical data
      const quickStatsData = await this.fetchNASSData(commodityName);
      
      // Combine current and historical data
      const combinedData = this.combineCurrentAndHistoricalData(
        commodityName, 
        marketNewsData, 
        quickStatsData
      );
      
      if (combinedData) {
        this.priceCache.set(cacheKey, { data: combinedData, timestamp: Date.now() });
        return combinedData;
      }

      // Fallback to historical data only
      if (quickStatsData && Array.isArray(quickStatsData) && quickStatsData.length > 0) {
        const processedData = this.processQuickStatsData(quickStatsData, commodityName);
        if (processedData) {
          this.priceCache.set(cacheKey, { data: processedData, timestamp: Date.now() });
          return processedData;
        }
      }

      console.log(`No USDA price data available for ${commodityName}`);
      return null;

    } catch (error) {
      console.error(`Error fetching USDA price data for ${commodityName}:`, error);
      return null;
    }
  }

  /**
   * Process Quick Stats data into our standard format
   */
  private static processQuickStatsData(quickStatsData: any[], commodityName: string): any {
    // Extract price history from Quick Stats data
    const priceHistory = quickStatsData
      .filter(item => item.Value && item.Value !== '                 (D)' && !isNaN(parseFloat(item.Value)))
      .map(item => {
        const rawPrice = parseFloat(item.Value);
        const originalUnit = item.unit_desc || 'lb';
        const convertedPrice = this.convertToPerPound(rawPrice, originalUnit);
        
        return {
          date: item.year ? `${item.year}-${item.reference_period_desc || '01'}-01` : item.load_time,
          price: convertedPrice,
          originalPrice: rawPrice,
          originalUnit: originalUnit,
          source: 'USDA Quick Stats',
          state: item.state_name || item.location_desc || 'National Average',
          unit: 'lb' // Always convert to pounds for user-friendly display
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (priceHistory.length === 0) {
      return null;
    }

    // Calculate current price (most recent)
    const currentPrice = priceHistory[priceHistory.length - 1].price;

    // Calculate volatility metrics
    const prices = priceHistory.map(p => p.price);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const volatility = Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length) / avgPrice;

    // Find peak and low months
    const monthlyData = this.groupByMonth(priceHistory);
    let peakMonth = 1;
    let lowMonth = 1;
    let peakPrice = 0;
    let lowPrice = Infinity;

          Object.entries(monthlyData).forEach(([month, prices]) => {
        const avgMonthlyPrice = prices.reduce((sum: number, p: any) => sum + p.price, 0) / prices.length;
        if (avgMonthlyPrice > peakPrice) {
          peakPrice = avgMonthlyPrice;
          peakMonth = parseInt(month);
        }
        if (avgMonthlyPrice < lowPrice) {
          lowPrice = avgMonthlyPrice;
          lowMonth = parseInt(month);
        }
      });

    return {
      commodity: commodityName,
      category: 'USDA Data',
      currentPrice,
      unit: 'lb',
      originalUnit: priceHistory.length > 0 ? priceHistory[0].originalUnit : 'lb',
      priceHistory,
      volatilityMetrics: {
        overallVolatility: volatility,
        peakMonth,
        lowMonth,
        peakPrice,
        lowPrice,
        averagePrice: avgPrice,
        seasonalPattern: peakMonth !== lowMonth ? 'moderate' : 'stable'
      },
      marketInsights: {
        supplyTrend: 'stable',
        demandTrend: 'stable',
        seasonalFactors: [
          peakMonth !== lowMonth ? `Peak season: ${this.getMonthName(peakMonth)}` : 'No significant seasonal pattern',
          peakMonth !== lowMonth ? `Low season: ${this.getMonthName(lowMonth)}` : ''
        ].filter(Boolean),
        recommendations: [
          volatility > 0.2 ? 'High price volatility detected - monitor prices closely' : 'Stable pricing conditions',
          peakMonth !== lowMonth ? 'Plan purchases around seasonal patterns' : 'No significant seasonal patterns'
        ]
      }
    };
  }

  /**
   * Group price history by month
   */
  private static groupByMonth(priceHistory: any[]): { [key: string]: any[] } {
    const monthlyData: { [key: string]: any[] } = {};
    
    priceHistory.forEach(item => {
      const date = new Date(item.date);
      const month = date.getMonth() + 1; // 1-12
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(item);
    });
    
    return monthlyData;
  }

  /**
   * Get month name from number
   */
  private static getMonthName(monthNumber: number): string {
    const date = new Date(2024, monthNumber - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long' });
  }

  /**
   * Fetch data from USDA ERS (Economic Research Service)
   */
  private static async fetchERSData(commodityName: string): Promise<any> {
    if (!this.FOODDATA_API_KEY) {
      console.warn('USDA ERS API key not configured');
      return null;
    }

    try {
      // Try USDA FoodData Central API first (more commonly available)
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${this.FOODDATA_API_KEY}&query=${encodeURIComponent(commodityName)}&pageSize=10&dataType=Foundation,SR Legacy`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`USDA FoodData Central API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`USDA FoodData Central data for ${commodityName}:`, data);
      return data;
    } catch (error) {
      console.error('Error fetching USDA FoodData Central data:', error);
      return null;
    }
  }

  /**
   * Fetch data from USDA AMS (Agricultural Marketing Service)
   */
  private static async fetchAMSData(commodityName: string): Promise<any> {
    if (!this.QUICKSTATS_API_KEY) {
      console.warn('USDA AMS API key not configured');
      return null;
    }

    try {
      // Try USDA Market News API
      const url = `https://marketnews.usda.gov/mnp/price-search?commodityName=${encodeURIComponent(commodityName)}&api_key=${this.QUICKSTATS_API_KEY}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`USDA Market News API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`USDA Market News data for ${commodityName}:`, data);
      return data;
    } catch (error) {
      console.error('Error fetching USDA Market News data:', error);
      return null;
    }
  }

  /**
   * Fetch data from USDA NASS (National Agricultural Statistics Service)
   */
  private static async fetchNASSData(commodityName: string): Promise<any> {
    if (!this.QUICKSTATS_API_KEY) {
      console.warn('USDA NASS API key not configured');
      return null;
    }

    try {
      // Try USDA Quick Stats API
      const url = `https://quickstats.nass.usda.gov/api/api_GET/?key=${this.QUICKSTATS_API_KEY}&commodity_desc=${encodeURIComponent(commodityName)}&statisticcat_desc=PRICE RECEIVED&format=JSON`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`USDA Quick Stats API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`USDA Quick Stats data for ${commodityName}:`, data);
      return data.data || data; // Handle both response formats
    } catch (error) {
      console.error('Error fetching USDA Quick Stats data:', error);
      return null;
    }
  }

  /**
   * Combine data from multiple USDA sources
   */
  private static combineUSDAData(commodityName: string, ersData: any, amsData: any, nassData: any): USDAPriceData {
    // Extract price history from the working Quick Stats API
    const priceHistory = this.extractPriceHistory(commodityName, nassData);
    const seasonalData = this.calculateSeasonalData(priceHistory);
    // Calculate volatility metrics
    const prices = seasonalData.map(d => d.averagePrice);
    const volatilityMetrics = this.calculateVolatilityMetrics([], seasonalData);
    const marketInsights = this.generateMarketInsights(priceHistory, seasonalData, volatilityMetrics);
    
    // Calculate current price from most recent data
    const currentPrice = priceHistory.length > 0 ? 
      priceHistory[priceHistory.length - 1].price : 
      this.getBasePrice(commodityName);
    
    return {
      commodity: commodityName,
      category: this.categorizeCommodity(commodityName),
      currentPrice,
      unit: 'lb',
      priceHistory,
      seasonalData,
      volatilityMetrics,
      marketInsights
    };
  }

  /**
   * Generate realistic mock data for testing when USDA APIs are unavailable
   */
  private static generateMockUSDAData(commodityName: string): USDAPriceData {
    const commodity = commodityName.toLowerCase();
    
    // Define seasonal patterns for different commodity types
    const seasonalPatterns: { [key: string]: { peak: number; low: number; volatility: number } } = {
      'strawberries': { peak: 7, low: 1, volatility: 0.4 }, // Summer peak, winter low
      'tomatoes': { peak: 8, low: 2, volatility: 0.35 }, // Summer peak, winter low
      'apples': { peak: 10, low: 6, volatility: 0.25 }, // Fall harvest, summer low
      'chicken': { peak: 12, low: 3, volatility: 0.15 }, // Holiday demand, spring low
      'beef': { peak: 12, low: 2, volatility: 0.2 }, // Holiday demand, post-holiday low
      'milk': { peak: 12, low: 6, volatility: 0.1 }, // Holiday demand, summer low
      'eggs': { peak: 12, low: 6, volatility: 0.15 }, // Holiday demand, summer low
      'flour': { peak: 11, low: 5, volatility: 0.05 }, // Holiday baking, spring low
      'sugar': { peak: 12, low: 5, volatility: 0.08 }, // Holiday baking, spring low
      'chocolate': { peak: 12, low: 1, volatility: 0.12 }, // Holiday demand, post-holiday low
    };

    const pattern = seasonalPatterns[commodity] || { peak: 7, low: 1, volatility: 0.2 };
    const basePrice = this.getBasePrice(commodity);
    
    // Generate 12 months of seasonal data
    const seasonalData = [];
    for (let month = 1; month <= 12; month++) {
      const seasonalMultiplier = this.calculateSeasonalMultiplier(month, pattern);
      const volatility = pattern.volatility * (0.8 + Math.random() * 0.4); // Add some randomness
      
      seasonalData.push({
        month,
        averagePrice: basePrice * seasonalMultiplier,
        availability: this.getAvailability(month, pattern),
        volatility
      });
    }

    // Calculate volatility metrics
    const prices = seasonalData.map(d => d.averagePrice);
    const volatilityMetrics = this.calculateVolatilityMetrics([], seasonalData);

    // Generate price history (last 12 months)
    const priceHistory = [];
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth() + 1;
      const seasonalPrice = seasonalData.find(d => d.month === month)?.averagePrice || basePrice;
      
      priceHistory.push({
        date: date.toISOString().split('T')[0],
        price: seasonalPrice * (0.95 + Math.random() * 0.1), // Add some daily variation
        source: 'USDA-ERS'
      });
    }

    return {
      commodity: commodityName,
      category: this.categorizeCommodity(commodityName),
      currentPrice: priceHistory[priceHistory.length - 1].price,
      unit: this.getUnit(commodityName),
      priceHistory,
      seasonalData,
      volatilityMetrics,
      marketInsights: {
        supplyTrend: 'stable',
        demandTrend: 'stable',
        seasonalFactors: this.getSeasonalFactors(priceHistory, seasonalData),
        recommendations: this.generateRecommendations(volatilityMetrics, {
          supplyTrend: 'stable',
          demandTrend: 'stable',
          seasonalFactors: this.getSeasonalFactors(priceHistory, seasonalData),
          trendPercentage: 0
        })
      }
    };
  }

  /**
   * Calculate seasonal multiplier based on month and pattern
   */
  private static calculateSeasonalMultiplier(month: number, pattern?: { peak: number; low: number; volatility: number }): number {
    // Default pattern if none provided
    const defaultPattern = { peak: 6, low: 12, volatility: 0.2 };
    const safePattern = pattern || defaultPattern;
    
    const distanceFromPeak = Math.abs(month - safePattern.peak);
    const distanceFromLow = Math.abs(month - safePattern.low);
    
    // Calculate how close we are to peak vs low
    const peakInfluence = Math.max(0, 1 - distanceFromPeak / 6); // 6 months range
    const lowInfluence = Math.max(0, 1 - distanceFromLow / 6);
    
    // Peak price is 1.3x, low price is 0.7x of average
    const peakMultiplier = 1.3;
    const lowMultiplier = 0.7;
    
    return 1.0 + (peakInfluence * (peakMultiplier - 1.0)) - (lowInfluence * (1.0 - lowMultiplier));
  }

  /**
   * Get availability level for a month
   */
  private static getAvailability(month: number, pattern: { peak: number; low: number }): 'high' | 'medium' | 'low' {
    const distanceFromPeak = Math.abs(month - pattern.peak);
    if (distanceFromPeak <= 1) return 'high';
    if (distanceFromPeak <= 3) return 'medium';
    return 'low';
  }

  /**
   * Get base price for commodity
   */
  private static getBasePrice(commodity: string): number {
    const basePrices: { [key: string]: number } = {
      'strawberries': 4.50, // per lb
      'tomatoes': 2.50, // per lb
      'apples': 1.80, // per lb
      'chicken': 3.20, // per lb
      'beef': 8.50, // per lb
      'milk': 3.80, // per gallon
      'eggs': 2.80, // per dozen
      'flour': 0.80, // per lb
      'sugar': 0.90, // per lb
      'chocolate': 6.50, // per lb
    };
    
    return basePrices[commodity] || 2.00;
  }

  /**
   * Get unit for commodity
   */
  private static getUnit(commodity: string): string {
    const units: { [key: string]: string } = {
      'strawberries': 'lb',
      'tomatoes': 'lb',
      'apples': 'lb',
      'chicken': 'lb',
      'beef': 'lb',
      'milk': 'gallon',
      'eggs': 'dozen',
      'flour': 'lb',
      'sugar': 'lb',
      'chocolate': 'lb',
    };
    
    return units[commodity] || 'lb';
  }

  /**
   * Categorize commodity
   */
  private static categorizeCommodity(commodity: string): string {
    const categories: { [key: string]: string } = {
      'strawberries': 'Fresh Produce',
      'tomatoes': 'Fresh Produce',
      'apples': 'Fresh Produce',
      'chicken': 'Meat & Poultry',
      'beef': 'Meat & Poultry',
      'milk': 'Dairy',
      'eggs': 'Dairy',
      'flour': 'Grains & Baking',
      'sugar': 'Grains & Baking',
      'chocolate': 'Sweets & Snacks',
    };
    
    return categories[commodity] || 'Other';
  }

  /**
   * Extract price history from USDA data
   */
  private static extractPriceHistory(commodityName: string, ersData: any): any[] {
    const priceHistory: any[] = [];
    
    // Parse Quick Stats data (which is working)
    if (ersData && ersData.data && Array.isArray(ersData.data)) {
      ersData.data.forEach((item: any) => {
        if (item.Value && item.Value !== '                 (D)' && item.Value !== '0') {
          // Convert different units to a standard format
          let price = parseFloat(item.Value);
          let unit = item.unit_desc || '';
          
          // Convert to price per pound for consistency
          if (unit.includes('CWT')) {
            price = price / 100; // Convert from $/cwt to $/lb
          } else if (unit.includes('TON')) {
            price = price / 2000; // Convert from $/ton to $/lb
          }
          
          // Only add if we have a valid price
          if (price > 0) {
            priceHistory.push({
              date: item.year || new Date().getFullYear(),
              price: price,
              source: 'USDA Quick Stats',
              state: item.state_name || 'Unknown',
              unit: unit
            });
          }
        }
      });
    }
    
    // If no real data, generate some realistic mock data
    if (priceHistory.length === 0) {
      const basePrice = this.getBasePrice(commodityName);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Default seasonal pattern for the commodity
      const defaultPattern = { peak: 6, low: 12, volatility: 0.2 };
      
      months.forEach((month, index) => {
        const seasonalMultiplier = this.calculateSeasonalMultiplier(index + 1, defaultPattern);
        const randomVariation = 0.8 + Math.random() * 0.4; // ±20% variation
        const price = basePrice * seasonalMultiplier * randomVariation;
        
        priceHistory.push({
          date: `2024-${String(index + 1).padStart(2, '0')}-01`,
          price: price,
          source: 'USDA Mock Data',
          state: 'National Average',
          unit: 'lb'
        });
      });
    }
    
    return priceHistory;
  }

  /**
   * Calculate seasonal data from price history
   */
  private static calculateSeasonalData(priceHistory: any[]): any[] {
    if (priceHistory.length === 0) return [];
    
    // Group prices by month
    const pricesByMonth: { [key: number]: number[] } = {};
    
    priceHistory.forEach(entry => {
      const date = new Date(entry.date);
      const month = date.getMonth() + 1;
      
      if (!pricesByMonth[month]) {
        pricesByMonth[month] = [];
      }
      pricesByMonth[month].push(entry.price);
    });
    
    // Calculate monthly averages
    const seasonalData = [];
    for (let month = 1; month <= 12; month++) {
      const prices = pricesByMonth[month] || [];
      const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
      
      seasonalData.push({
        month,
        averagePrice,
        availability: prices.length > 0 ? 'high' : 'low',
        volatility: prices.length > 1 ? this.calculateVolatility(prices) : 0
      });
    }
    
    return seasonalData;
  }

  /**
   * Calculate volatility for a set of prices
   */
  private static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  /**
   * Calculate volatility metrics
   */
  private static calculateVolatilityMetrics(priceHistory: any[], seasonalData: any[]): any {
    if (seasonalData.length === 0) {
      return {
        overallVolatility: 0,
        peakMonth: 1,
        lowMonth: 1,
        peakPrice: 0,
        lowPrice: 0,
        priceRange: 0,
        seasonalPattern: 'stable' as const
      };
    }

    const prices = seasonalData.map(d => d.averagePrice);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // Calculate volatility
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance) / avgPrice;
    
    // Find peak and low prices
    let peakPrice = prices[0];
    let lowPrice = prices[0];
    let peakMonth = 1;
    let lowMonth = 1;
    
    seasonalData.forEach((data) => {
      if (data.averagePrice > peakPrice) {
        peakPrice = data.averagePrice;
        peakMonth = data.month;
      }
      if (data.averagePrice < lowPrice) {
        lowPrice = data.averagePrice;
        lowMonth = data.month;
      }
    });
    
    // Determine seasonal pattern
    let seasonalPattern: 'stable' | 'moderate' | 'high' = 'stable';
    if (volatility > 0.3) seasonalPattern = 'high';
    else if (volatility > 0.15) seasonalPattern = 'moderate';
    
    return {
      overallVolatility: volatility,
      peakMonth,
      lowMonth,
      peakPrice,
      lowPrice,
      priceRange: peakPrice - lowPrice,
      seasonalPattern
    };
  }

  /**
   * Generate market insights from price history and seasonal data
   */
  private static generateMarketInsights(priceHistory: any[], seasonalData: any[], volatilityMetrics: any): any {
    if (priceHistory.length === 0) {
      return {
        supplyTrend: 'stable',
        demandTrend: 'stable',
        seasonalFactors: [],
        recommendations: []
      };
    }

    // Analyze recent price trends (last 3 months vs previous 3 months)
    const recentPrices = priceHistory.slice(-3).map(p => p.price);
    const previousPrices = priceHistory.slice(-6, -3).map(p => p.price);
    
    const recentAvg = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
    const previousAvg = previousPrices.reduce((sum, p) => sum + p, 0) / previousPrices.length;
    
    // Calculate trend percentage
    const trendPercentage = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    // Determine supply and demand trends based on price movement
    let supplyTrend: 'increasing' | 'decreasing' | 'stable';
    let demandTrend: 'increasing' | 'decreasing' | 'stable';
    
    if (trendPercentage > 10) {
      // Price increased significantly - likely high demand or low supply
      demandTrend = 'increasing';
      supplyTrend = 'decreasing';
    } else if (trendPercentage < -10) {
      // Price decreased significantly - likely low demand or high supply
      demandTrend = 'decreasing';
      supplyTrend = 'increasing';
    } else {
      // Price stable - balanced market
      demandTrend = 'stable';
      supplyTrend = 'stable';
    }

    // Analyze seasonal factors
    const seasonalFactors = this.getSeasonalFactors(priceHistory, seasonalData);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(volatilityMetrics, {
      supplyTrend,
      demandTrend,
      seasonalFactors,
      trendPercentage
    });

    return {
      supplyTrend,
      demandTrend,
      seasonalFactors,
      recommendations
    };
  }

  /**
   * Generate USDA insights for all commodities
   */
  static generateUSDAMarketInsights(commodityAnalysis: any): any {
    const commodities = Object.keys(commodityAnalysis);
    const highVolatilityCommodities: string[] = [];
    const seasonalCommodities: string[] = [];
    const detailedCommodityAnalysis: any = {};
    let totalSupplyTrend = 0;
    let totalDemandTrend = 0;
    let trendCount = 0;
    let totalVolatility = 0;
    let totalPriceChange = 0;

    // Analyze each commodity in detail
    commodities.forEach(commodity => {
      const data = commodityAnalysis[commodity];
      
      // Only process if we have real USDA data
      if (!data || !data.currentPrice || data.currentPrice === 0) {
        return; // Skip commodities without real USDA data
      }

      const detailedAnalysis: any = {
        commodity,
        currentPrice: data.currentPrice,
        volatility: data.volatility || 0,
        peakMonth: data.peakMonth || 1,
        lowMonth: data.lowMonth || 1,
        peakPrice: data.peakPrice || 0,
        lowPrice: data.lowPrice || 0,
        averagePrice: data.averagePrice || 0,
        priceChange: 0,
        trendStrength: 'stable',
        seasonalPattern: 'none',
        recommendations: data.recommendations || []
      };

      // Calculate price change percentage based on real data
      if (data.currentPrice && data.averagePrice) {
        detailedAnalysis.priceChange = ((data.currentPrice - data.averagePrice) / data.averagePrice) * 100;
      }

      // Determine trend strength based on price change
      if (Math.abs(detailedAnalysis.priceChange) > 20) {
        detailedAnalysis.trendStrength = 'strong';
      } else if (Math.abs(detailedAnalysis.priceChange) > 10) {
        detailedAnalysis.trendStrength = 'moderate';
      } else {
        detailedAnalysis.trendStrength = 'weak';
      }

      // Determine seasonal pattern
      if (data.peakMonth !== data.lowMonth) {
        const monthDiff = Math.abs(data.peakMonth - data.lowMonth);
        if (monthDiff >= 6) {
          detailedAnalysis.seasonalPattern = 'strong';
        } else if (monthDiff >= 3) {
          detailedAnalysis.seasonalPattern = 'moderate';
        } else {
          detailedAnalysis.seasonalPattern = 'weak';
        }
        seasonalCommodities.push(commodity);
      }

      // Check for high volatility
      if (data.volatility > 0.25) {
        highVolatilityCommodities.push(commodity);
      }

      // Aggregate trends based on real data
      trendCount++;
      totalVolatility += data.volatility || 0;
      totalPriceChange += detailedAnalysis.priceChange;
      
      // Enhanced trend calculation based on real price change
      if (detailedAnalysis.priceChange > 5) {
        totalSupplyTrend -= 1; // Decreasing supply (prices up)
        totalDemandTrend += 1; // Increasing demand (prices up)
      } else if (detailedAnalysis.priceChange < -5) {
        totalSupplyTrend += 1; // Increasing supply (prices down)
        totalDemandTrend -= 1; // Decreasing demand (prices down)
      }

      detailedCommodityAnalysis[commodity] = detailedAnalysis;
    });

    // Only generate insights if we have real data
    if (trendCount === 0) {
      return {
        marketTrends: {
          overallSupplyTrend: 'no_data',
          overallDemandTrend: 'no_data',
          supplyTrendPercentage: '0.0',
          demandTrendPercentage: '0.0',
          averageVolatility: '0.0',
          averagePriceChange: '0.0',
          highVolatilityCommodities: [],
          seasonalCommodities: [],
          trendAnalysis: {
            totalCommodities: 0,
            highVolatilityCount: 0,
            seasonalCount: 0,
            marketStability: 'no_data',
            trendStrength: 'no_data'
          }
        },
        detailedCommodityAnalysis: {},
        recommendations: ['No USDA price data available for analysis'],
        commodityAnalysis: {}
      };
    }

    // Calculate overall trends with percentages
    const averageVolatility = trendCount > 0 ? totalVolatility / trendCount : 0;
    const averagePriceChange = trendCount > 0 ? totalPriceChange / trendCount : 0;
    
    const overallSupplyTrend = trendCount > 0 
      ? totalSupplyTrend > 0 ? 'increasing' : totalSupplyTrend < 0 ? 'decreasing' : 'stable'
      : 'stable';
    
    const overallDemandTrend = trendCount > 0
      ? totalDemandTrend > 0 ? 'increasing' : totalDemandTrend < 0 ? 'decreasing' : 'stable'
      : 'stable';

    // Calculate trend percentages
    const supplyTrendPercentage = trendCount > 0 ? Math.abs(totalSupplyTrend / trendCount) * 100 : 0;
    const demandTrendPercentage = trendCount > 0 ? Math.abs(totalDemandTrend / trendCount) * 100 : 0;

    // Generate detailed market recommendations based on real data
    const recommendations = [];
    
    if (highVolatilityCommodities.length > 0) {
      recommendations.push(`Monitor prices closely for ${highVolatilityCommodities.join(', ')} - high volatility (${(averageVolatility * 100).toFixed(1)}%) detected`);
    }
    
    if (seasonalCommodities.length > 0) {
      recommendations.push(`Plan purchases around seasonal patterns for ${seasonalCommodities.join(', ')} - ${seasonalCommodities.length} commodities show seasonal trends`);
    }
    
    if (overallSupplyTrend === 'decreasing') {
      recommendations.push(`Overall supply is decreasing (${supplyTrendPercentage.toFixed(1)}% trend strength) - consider stockpiling key ingredients`);
    }
    
    if (overallDemandTrend === 'increasing') {
      recommendations.push(`Overall demand is increasing (${demandTrendPercentage.toFixed(1)}% trend strength) - prices may rise, consider purchasing soon`);
    }

    if (averagePriceChange > 10) {
      recommendations.push(`Average price increase of ${averagePriceChange.toFixed(1)}% detected - review pricing strategies`);
    } else if (averagePriceChange < -10) {
      recommendations.push(`Average price decrease of ${Math.abs(averagePriceChange).toFixed(1)}% detected - good time for bulk purchases`);
    }

    return {
      marketTrends: {
        overallSupplyTrend,
        overallDemandTrend,
        supplyTrendPercentage: supplyTrendPercentage.toFixed(1),
        demandTrendPercentage: demandTrendPercentage.toFixed(1),
        averageVolatility: (averageVolatility * 100).toFixed(1),
        averagePriceChange: averagePriceChange.toFixed(1),
        highVolatilityCommodities,
        seasonalCommodities,
        trendAnalysis: {
          totalCommodities: commodities.length,
          highVolatilityCount: highVolatilityCommodities.length,
          seasonalCount: seasonalCommodities.length,
          marketStability: highVolatilityCommodities.length === 0 ? 'stable' : 'volatile',
          trendStrength: averagePriceChange > 15 ? 'strong' : averagePriceChange > 5 ? 'moderate' : 'weak'
        }
      },
      detailedCommodityAnalysis,
      recommendations,
      commodityAnalysis
    };
  }

  /**
   * Get seasonal factors for a commodity
   */
  private static getSeasonalFactors(priceHistory: any[], seasonalData: any[]): string[] {
    const factors: string[] = [];
    
    if (priceHistory.length === 0) return factors;
    
    // Analyze price volatility
    const prices = priceHistory.map(p => p.price);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const volatility = Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length) / avgPrice;
    
    if (volatility > 0.3) {
      factors.push('High price volatility');
    } else if (volatility > 0.15) {
      factors.push('Moderate price volatility');
    }
    
    // Analyze seasonal patterns
    if (seasonalData.length > 0) {
      const peakMonth = seasonalData.reduce((max, data) => data.averagePrice > max.averagePrice ? data : max).month;
      const lowMonth = seasonalData.reduce((min, data) => data.averagePrice < min.averagePrice ? data : min).month;
      
      factors.push(`Peak season: ${new Date(2024, peakMonth - 1).toLocaleDateString('en-US', { month: 'long' })}`);
      factors.push(`Low season: ${new Date(2024, lowMonth - 1).toLocaleDateString('en-US', { month: 'long' })}`);
    }
    
    return factors;
  }

  /**
   * Generate recommendations based on market analysis
   */
  private static generateRecommendations(volatilityMetrics: any, marketData: {
    supplyTrend: string;
    demandTrend: string;
    seasonalFactors: string[];
    trendPercentage: number;
  }): string[] {
    const recommendations: string[] = [];
    
    // Price trend recommendations
    if (marketData.trendPercentage > 15) {
      recommendations.push('Consider stockpiling - prices trending upward');
    } else if (marketData.trendPercentage < -15) {
      recommendations.push('Good time to purchase - prices trending downward');
    }
    
    // Volatility recommendations
    if (volatilityMetrics.overallVolatility > 0.3) {
      recommendations.push('High volatility - monitor prices closely');
    }
    
    // Supply/demand recommendations
    if (marketData.supplyTrend === 'decreasing' && marketData.demandTrend === 'increasing') {
      recommendations.push('Supply decreasing, demand increasing - consider alternative suppliers');
    } else if (marketData.supplyTrend === 'increasing' && marketData.demandTrend === 'decreasing') {
      recommendations.push('Supply increasing, demand decreasing - negotiate better prices');
    }
    
    // Seasonal recommendations
    if (marketData.seasonalFactors.length > 0) {
      recommendations.push('Plan purchases around seasonal patterns');
    }
    
    return recommendations;
  }

  /**
   * Get current price from price history
   */
  private static getCurrentPrice(priceHistory: any[]): number {
    if (priceHistory.length === 0) return 0;
    return priceHistory[priceHistory.length - 1].price;
  }

  /**
   * Combine current market data with historical data
   */
  private static combineCurrentAndHistoricalData(
    commodityName: string, 
    marketNewsData: any, 
    quickStatsData: any[]
  ): any {
    // Process historical data
    const historicalData = quickStatsData && Array.isArray(quickStatsData) && quickStatsData.length > 0
      ? this.processQuickStatsData(quickStatsData, commodityName)
      : null;

    // Process current market data
    const currentData = marketNewsData ? this.processMarketNewsData(marketNewsData, commodityName) : null;

    if (!historicalData && !currentData) {
      return null;
    }

    // Combine the data
    return {
      commodity: commodityName,
      category: 'USDA Data',
      currentPrice: currentData?.currentPrice || historicalData?.currentPrice,
      unit: currentData?.unit || historicalData?.unit || 'lb',
      priceHistory: [
        ...(currentData?.recentPrices || []),
        ...(historicalData?.priceHistory || [])
      ],
      volatilityMetrics: historicalData?.volatilityMetrics || currentData?.volatilityMetrics,
      marketInsights: {
        ...historicalData?.marketInsights,
        ...currentData?.marketInsights,
        dataSource: currentData ? 'USDA Market News + Quick Stats' : 'USDA Quick Stats',
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Process Market News data into our standard format
   */
  private static processMarketNewsData(marketNewsData: any, commodityName: string): any {
    try {
      // Handle different Market News data formats
      let priceHistory = [];
      let currentPrice = 0;
      let dataSource = 'USDA Market News';

      if (marketNewsData.prices && Array.isArray(marketNewsData.prices)) {
        // RSS/XML parsed data
        priceHistory = marketNewsData.prices.map((price: number, index: number) => {
          const convertedPrice = this.convertToPerPound(price, 'lb'); // Assume pounds for RSS data
          return {
            date: marketNewsData.dates?.[index] || new Date().toISOString().split('T')[0],
            price: convertedPrice,
            originalPrice: price,
            originalUnit: 'lb',
            source: dataSource,
            unit: 'lb'
          };
        });
        currentPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : 0;
      } else if (marketNewsData.data && Array.isArray(marketNewsData.data)) {
        // Standard Market News API response
        priceHistory = marketNewsData.data
          .filter((item: any) => item.price && !isNaN(parseFloat(item.price)))
          .map((item: any) => {
            const rawPrice = parseFloat(item.price);
            const originalUnit = item.unit || 'lb';
            const convertedPrice = this.convertToPerPound(rawPrice, originalUnit);
            
            return {
              date: item.date || item.reportDate || new Date().toISOString().split('T')[0],
              price: convertedPrice,
              originalPrice: rawPrice,
              originalUnit: originalUnit,
              source: dataSource,
              unit: 'lb',
              location: item.location || item.market || 'National Average'
            };
          });
        currentPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : 0;
      } else if (marketNewsData.reports && Array.isArray(marketNewsData.reports)) {
        // Market News reports format
        priceHistory = marketNewsData.reports
          .filter((report: any) => report.prices && Array.isArray(report.prices))
          .flatMap((report: any) => 
            report.prices.map((price: any) => {
              const rawPrice = parseFloat(price.value) || 0;
              const originalUnit = price.unit || 'lb';
              const convertedPrice = this.convertToPerPound(rawPrice, originalUnit);
              
              return {
                date: report.reportDate || new Date().toISOString().split('T')[0],
                price: convertedPrice,
                originalPrice: rawPrice,
                originalUnit: originalUnit,
                source: dataSource,
                unit: 'lb',
                location: report.location || 'National Average'
              };
            })
          )
          .filter((item: any) => item.price > 0);
        currentPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : 0;
      }

      if (priceHistory.length === 0) {
        console.log('No valid price data found in Market News response');
        return null;
      }

      // Sort by date
      priceHistory.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate enhanced metrics
      const prices = priceHistory.map((p: any) => p.price);
      const avgPrice = prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length;
      const volatility = Math.sqrt(prices.reduce((sum: number, price: number) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length) / avgPrice;

      // Calculate seasonal patterns
      const monthlyData = this.groupByMonth(priceHistory);
      let peakMonth = 1;
      let lowMonth = 1;
      let peakPrice = 0;
      let lowPrice = Infinity;

      Object.entries(monthlyData).forEach(([month, prices]) => {
        const avgMonthlyPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
        if (avgMonthlyPrice > peakPrice) {
          peakPrice = avgMonthlyPrice;
          peakMonth = parseInt(month);
        }
        if (avgMonthlyPrice < lowPrice) {
          lowPrice = avgMonthlyPrice;
          lowMonth = parseInt(month);
        }
      });

      return {
        currentPrice,
        unit: 'lb',
        originalUnit: priceHistory.length > 0 ? priceHistory[0].originalUnit : 'lb',
        recentPrices: priceHistory,
        volatilityMetrics: {
          overallVolatility: volatility,
          peakMonth,
          lowMonth,
          peakPrice,
          lowPrice,
          averagePrice: avgPrice,
          seasonalPattern: peakMonth !== lowMonth ? 'moderate' : 'stable'
        },
        marketInsights: {
          supplyTrend: this.analyzeSupplyTrend(priceHistory),
          demandTrend: this.analyzeDemandTrend(priceHistory),
          seasonalFactors: [
            peakMonth !== lowMonth ? `Peak season: ${this.getMonthName(peakMonth)}` : 'No significant seasonal pattern',
            peakMonth !== lowMonth ? `Low season: ${this.getMonthName(lowMonth)}` : ''
          ].filter(Boolean),
          recommendations: this.generateMarketRecommendations(volatility, peakMonth, lowMonth),
          dataSource: dataSource,
          updateFrequency: 'Daily/Weekly',
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error processing Market News data:', error);
      return null;
    }
  }

  /**
   * Analyze supply trend from price history
   */
  private static analyzeSupplyTrend(priceHistory: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (priceHistory.length < 3) return 'stable';
    
    const recentPrices = priceHistory.slice(-3).map(p => p.price);
    const earlierPrices = priceHistory.slice(-6, -3).map(p => p.price);
    
    if (earlierPrices.length === 0) return 'stable';
    
    const recentAvg = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
    const earlierAvg = earlierPrices.reduce((sum, price) => sum + price, 0) / earlierPrices.length;
    
    const change = (recentAvg - earlierAvg) / earlierAvg;
    
    if (change > 0.05) return 'decreasing'; // Price up = supply down
    if (change < -0.05) return 'increasing'; // Price down = supply up
    return 'stable';
  }

  /**
   * Analyze demand trend from price history
   */
  private static analyzeDemandTrend(priceHistory: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (priceHistory.length < 3) return 'stable';
    
    const recentPrices = priceHistory.slice(-3).map(p => p.price);
    const earlierPrices = priceHistory.slice(-6, -3).map(p => p.price);
    
    if (earlierPrices.length === 0) return 'stable';
    
    const recentAvg = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
    const earlierAvg = earlierPrices.reduce((sum, price) => sum + price, 0) / earlierPrices.length;
    
    const change = (recentAvg - earlierAvg) / earlierAvg;
    
    if (change > 0.05) return 'increasing'; // Price up = demand up
    if (change < -0.05) return 'decreasing'; // Price down = demand down
    return 'stable';
  }

  /**
   * Convert USDA price units to per-pound prices
   */
  private static convertToPerPound(price: number, unit: string): number {
    const unitLower = unit.toLowerCase();
    
    // Common USDA unit conversions
    switch (unitLower) {
      case '$ / lb':
      case 'lb':
      case '$ / pound':
        return price; // Already in pounds
      
      case '$ / cwt':
      case 'cwt':
      case 'hundredweight':
        return price / 100; // CWT = 100 pounds
      
      case '$ / ton':
      case 'ton':
        return price / 2000; // Ton = 2000 pounds
      
      case '$ / bu':
      case 'bu':
      case 'bushel':
        // Bushel weights vary by commodity, use common defaults
        const bushelWeights: { [key: string]: number } = {
          'wheat': 60,
          'corn': 56,
          'soybeans': 60,
          'oats': 32,
          'barley': 48,
          'rye': 56
        };
        // Default to 60 lbs per bushel if commodity not specified
        return price / 60;
      
      case '$ / kg':
      case 'kg':
        return price * 2.20462; // Convert kg to pounds
      
      case '$ / g':
      case 'g':
        return price * 0.00220462; // Convert grams to pounds
      
      case '$ / oz':
      case 'oz':
        return price * 16; // Convert ounces to pounds
      
      default:
        // If unit is not recognized, assume it's already per pound
        console.warn(`Unknown USDA unit: ${unit}, assuming per pound`);
        return price;
    }
  }

  /**
   * Generate market recommendations based on data
   */
  private static generateMarketRecommendations(volatility: number, peakMonth: number, lowMonth: number): string[] {
    const recommendations = [];
    
    if (volatility > 0.2) {
      recommendations.push('High price volatility detected - monitor prices closely');
    } else if (volatility > 0.1) {
      recommendations.push('Moderate price volatility - consider timing purchases');
    } else {
      recommendations.push('Stable pricing conditions');
    }
    
    if (peakMonth !== lowMonth) {
      recommendations.push(`Plan purchases around seasonal patterns (peak: ${this.getMonthName(peakMonth)}, low: ${this.getMonthName(lowMonth)})`);
    }
    
    const currentMonth = new Date().getMonth() + 1;
    if (currentMonth === peakMonth) {
      recommendations.push('Currently in peak season - consider delaying non-urgent purchases');
    } else if (currentMonth === lowMonth) {
      recommendations.push('Currently in low season - good time for bulk purchases');
    }
    
    return recommendations;
  }
}
