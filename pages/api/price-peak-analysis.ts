import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { USDAPriceAPI } from '@/lib/usda-price-api';

// Load restaurant data helper
const loadRestaurantData = async (restaurantId: string) => {
  const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');
  
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      const allData = JSON.parse(fileContent);
      return allData[restaurantId] || { products: [], recipes: [], sales: [] };
    }
  } catch (error) {
    console.error('Error loading restaurant data:', error);
  }
  return { products: [], recipes: [], sales: [] };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { restaurantId = 'default', productId, includeUSDA = 'true' } = req.query;

  try {
    // Load real restaurant data
    const restaurantData = await loadRestaurantData(restaurantId as string);
    const analysisData = await analyzePricePeaks(restaurantData, productId as string, includeUSDA === 'true');
    
    res.status(200).json({
      success: true,
      data: analysisData
    });
  } catch (error) {
    console.error('Error analyzing price peaks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze price peaks'
    });
  }
}

async function analyzePricePeaks(restaurantData: any, productId?: string, includeUSDA: boolean = true) {
  const { products, recipes } = restaurantData;
  
  const analysis = {
    overallSummary: {
      totalProducts: products.length,
      productsWithPriceHistory: 0,
      averagePriceVolatility: 0,
      peakSeason: '',
      lowSeason: '',
      usdaDataAvailable: false
    },
    productAnalysis: [] as any[],
    seasonalPatterns: {} as any,
    recommendations: [] as string[],
    usdaInsights: {} as any
  };
  
  // Analyze each product
  let totalVolatility = 0;
  let productsWithHistory = 0;
  const monthlyPrices: { [key: number]: number[] } = {};
  const usdaData: any[] = [];
  
  for (const product of products) {
    if (productId && product.id !== productId) continue;
    
    const productAnalysis = await analyzeProductPricePeaks(product, includeUSDA);
    analysis.productAnalysis.push(productAnalysis);
    
    if (productAnalysis.hasPriceHistory) {
      productsWithHistory++;
      totalVolatility += productAnalysis.volatility;
      
      // Aggregate monthly prices for overall seasonal analysis
      for (const [month, price] of Object.entries(productAnalysis.monthlyAverages)) {
        if (!monthlyPrices[parseInt(month)]) {
          monthlyPrices[parseInt(month)] = [];
        }
        monthlyPrices[parseInt(month)].push(price as number);
      }
    }
    
    // Collect USDA data if available
    if (productAnalysis.usdaData) {
      usdaData.push(productAnalysis.usdaData);
      analysis.overallSummary.usdaDataAvailable = true;
    }
  }
  
  // Calculate overall statistics
  analysis.overallSummary.productsWithPriceHistory = productsWithHistory;
  analysis.overallSummary.averagePriceVolatility = productsWithHistory > 0 ? totalVolatility / productsWithHistory : 0;
  
  // Determine peak and low seasons
  const monthlyAverages: { [key: number]: number } = {};
  for (const [month, prices] of Object.entries(monthlyPrices)) {
    monthlyAverages[parseInt(month)] = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }
  
  let peakMonth = 1;
  let lowMonth = 1;
  let peakPrice = 0;
  let lowPrice = Infinity;
  
  for (const [month, avgPrice] of Object.entries(monthlyAverages)) {
    if (avgPrice > peakPrice) {
      peakPrice = avgPrice;
      peakMonth = parseInt(month);
    }
    if (avgPrice < lowPrice) {
      lowPrice = avgPrice;
      lowMonth = parseInt(month);
    }
  }
  
  analysis.overallSummary.peakSeason = getMonthName(peakMonth);
  analysis.overallSummary.lowSeason = getMonthName(lowMonth);
  analysis.seasonalPatterns = monthlyAverages;
  
  // Add USDA insights if available
  if (usdaData.length > 0) {
    // Create commodity analysis from USDA data
    const commodityAnalysis: any = {};
    usdaData.forEach((data: any) => {
      commodityAnalysis[data.commodity] = {
        currentPrice: data.currentPrice,
        volatility: data.volatilityMetrics.overallVolatility,
        peakMonth: data.volatilityMetrics.peakMonth,
        lowMonth: data.volatilityMetrics.lowMonth,
        recommendations: data.marketInsights.recommendations
      };
    });
    
    analysis.usdaInsights = USDAPriceAPI.generateUSDAMarketInsights(commodityAnalysis);
  }
  
  // Generate recommendations
  analysis.recommendations = generatePricePeakRecommendations(analysis);
  
  return analysis;
}

async function analyzeProductPricePeaks(product: any, includeUSDA: boolean = true) {
  const analysis = {
    productId: product.id,
    productName: product.name,
    category: product.categoryType,
    hasPriceHistory: false,
    volatility: 0,
    peakMonth: 0,
    lowMonth: 0,
    peakPrice: 0,
    lowPrice: 0,
    averagePrice: 0,
    monthlyAverages: {} as any,
    priceTrend: 'stable',
    supplyChainIssues: false,
    recommendations: [] as string[],
    usdaData: null as any,
    usdaComparison: null as any
  };
  
  // Get USDA data if requested
  if (includeUSDA) {
    try {
      const usdaData = await USDAPriceAPI.getCommodityPriceData(product.name);
      if (usdaData) {
        analysis.usdaData = usdaData;
        analysis.usdaComparison = compareWithUSDA(product, usdaData);
      } else {
        // No USDA data available - don't use mock data
        analysis.recommendations.push('No USDA price data available for this product');
      }
    } catch (error) {
      console.error(`Error fetching USDA data for ${product.name}:`, error);
      analysis.recommendations.push('Error fetching USDA data');
    }
  }
  
  if (!product.priceHistory || product.priceHistory.length < 3) {
    analysis.recommendations.push('Insufficient price history for analysis');
    return analysis;
  }
  
  analysis.hasPriceHistory = true;
  
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
  
  // Calculate monthly averages
  for (const [month, prices] of Object.entries(pricesByMonth)) {
    const avgPrice = (prices as number[]).reduce((sum, price) => sum + price, 0) / prices.length;
    analysis.monthlyAverages[parseInt(month)] = avgPrice;
  }
  
  // Find peak and low months
  let peakPrice = 0;
  let lowPrice = Infinity;
  
  for (const [month, avgPrice] of Object.entries(analysis.monthlyAverages)) {
    const price = avgPrice as number;
    if (price > peakPrice) {
      peakPrice = price;
      analysis.peakMonth = parseInt(month);
    }
    if (price < lowPrice) {
      lowPrice = price;
      analysis.lowMonth = parseInt(month);
    }
  }
  
  analysis.peakPrice = peakPrice;
  analysis.lowPrice = lowPrice;
  
  // Calculate overall average and volatility
  const allPrices = Object.values(analysis.monthlyAverages) as number[];
  analysis.averagePrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
  
  // Calculate volatility (coefficient of variation)
  const variance = allPrices.reduce((sum, price) => sum + Math.pow(price - analysis.averagePrice, 2), 0) / allPrices.length;
  analysis.volatility = Math.sqrt(variance) / analysis.averagePrice;
  
  // Determine price trend
  const recentPrices = product.priceHistory.slice(-3);
  const priceChanges = [];
  for (let i = 1; i < recentPrices.length; i++) {
    const change = (recentPrices[i].price - recentPrices[i-1].price) / recentPrices[i-1].price;
    priceChanges.push(change);
  }
  
  const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
  
  if (avgChange > 0.05) analysis.priceTrend = 'increasing';
  else if (avgChange < -0.05) analysis.priceTrend = 'decreasing';
  else analysis.priceTrend = 'stable';
  
  // Check for supply chain issues
  analysis.supplyChainIssues = avgChange > 0.1; // 10%+ increase indicates supply issues
  
  // Generate product-specific recommendations
  analysis.recommendations = generateProductRecommendations(analysis);
  
  return analysis;
}

function compareWithUSDA(product: any, usdaData: any) {
  const comparison = {
    priceAccuracy: 0,
    volatilityComparison: 0,
    seasonalAlignment: 0,
    recommendations: [] as string[]
  };
  
  // Compare current price with USDA
  const priceDifference = Math.abs(product.cost - usdaData.currentPrice) / usdaData.currentPrice;
  comparison.priceAccuracy = 1 - priceDifference;
  
  // Compare volatility
  const volatilityDifference = Math.abs(product.volatility - usdaData.volatilityMetrics.overallVolatility);
  comparison.volatilityComparison = 1 - volatilityDifference;
  
  // Check seasonal alignment
  const productPeakMonth = getProductPeakMonth(product);
  const usdaPeakMonth = usdaData.volatilityMetrics.peakMonth;
  const monthDifference = Math.abs(productPeakMonth - usdaPeakMonth);
  comparison.seasonalAlignment = 1 - (monthDifference / 6); // 6 months max difference
  
  // Generate comparison recommendations
  if (priceDifference > 0.2) {
    comparison.recommendations.push(`Price differs significantly from USDA market data (${(priceDifference * 100).toFixed(1)}% difference)`);
  }
  
  if (volatilityDifference > 0.1) {
    comparison.recommendations.push(`Volatility differs from USDA market data - consider market factors`);
  }
  
  if (monthDifference > 2) {
    comparison.recommendations.push(`Seasonal patterns differ from USDA market data - check local factors`);
  }
  
  return comparison;
}

function getProductPeakMonth(product: any): number {
  // Extract peak month from product price history
  if (!product.priceHistory || product.priceHistory.length === 0) return 1;
  
  const pricesByMonth: { [key: number]: number[] } = {};
  
  product.priceHistory.forEach((priceEntry: any) => {
    const date = new Date(priceEntry.date);
    const month = date.getMonth() + 1;
    
    if (!pricesByMonth[month]) {
      pricesByMonth[month] = [];
    }
    pricesByMonth[month].push(priceEntry.price);
  });
  
  let peakMonth = 1;
  let peakPrice = 0;
  
  for (const [month, prices] of Object.entries(pricesByMonth)) {
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    if (avgPrice > peakPrice) {
      peakPrice = avgPrice;
      peakMonth = parseInt(month);
    }
  }
  
  return peakMonth;
}

function generateUSDAInsights(usdaData: any[]) {
  const insights = {
    marketTrends: {
      overallSupplyTrend: 'stable',
      overallDemandTrend: 'stable',
      highVolatilityCommodities: [] as string[],
      seasonalCommodities: [] as string[]
    },
    recommendations: [] as string[],
    commodityAnalysis: {} as any
  };
  
  // Analyze overall market trends
  let supplyTrends = { increasing: 0, decreasing: 0, stable: 0 };
  let demandTrends = { increasing: 0, decreasing: 0, stable: 0 };
  
  usdaData.forEach(data => {
    supplyTrends[data.marketInsights.supplyTrend as keyof typeof supplyTrends]++;
    demandTrends[data.marketInsights.demandTrend as keyof typeof demandTrends]++;
    
    if (data.volatilityMetrics.overallVolatility > 0.3) {
      insights.marketTrends.highVolatilityCommodities.push(data.commodity);
    }
    
    if (data.volatilityMetrics.seasonalPattern === 'high') {
      insights.marketTrends.seasonalCommodities.push(data.commodity);
    }
    
    insights.commodityAnalysis[data.commodity] = {
      currentPrice: data.currentPrice,
      volatility: data.volatilityMetrics.overallVolatility,
      peakMonth: data.volatilityMetrics.peakMonth,
      lowMonth: data.volatilityMetrics.lowMonth,
      recommendations: data.marketInsights.recommendations
    };
  });
  
  // Determine overall trends
  const totalCommodities = usdaData.length;
  insights.marketTrends.overallSupplyTrend = 
    supplyTrends.increasing > supplyTrends.decreasing ? 'increasing' :
    supplyTrends.decreasing > supplyTrends.increasing ? 'decreasing' : 'stable';
    
  insights.marketTrends.overallDemandTrend = 
    demandTrends.increasing > demandTrends.decreasing ? 'increasing' :
    demandTrends.decreasing > demandTrends.increasing ? 'decreasing' : 'stable';
  
  // Generate market-level recommendations
  if (insights.marketTrends.highVolatilityCommodities.length > 0) {
    insights.recommendations.push(`High volatility commodities: ${insights.marketTrends.highVolatilityCommodities.join(', ')} - consider hedging strategies`);
  }
  
  if (insights.marketTrends.seasonalCommodities.length > 0) {
    insights.recommendations.push(`Seasonal commodities: ${insights.marketTrends.seasonalCommodities.join(', ')} - plan purchases around seasonal patterns`);
  }
  
  if (insights.marketTrends.overallSupplyTrend === 'decreasing') {
    insights.recommendations.push('Overall supply trend is decreasing - consider pre-ordering and building inventory');
  }
  
  if (insights.marketTrends.overallDemandTrend === 'increasing') {
    insights.recommendations.push('Overall demand trend is increasing - prepare for potential price increases');
  }
  
  return insights;
}

function generateProductRecommendations(analysis: any): string[] {
  const recommendations = [];
  
  if (analysis.volatility > 0.3) {
    recommendations.push('High price volatility - consider bulk purchasing during low-price months');
  }
  
  if (analysis.supplyChainIssues) {
    recommendations.push('Recent price increases suggest supply chain issues - increase safety stock');
  }
  
  if (analysis.priceTrend === 'increasing') {
    recommendations.push('Prices trending upward - consider pre-ordering larger quantities');
  }
  
  const peakMonthName = getMonthName(analysis.peakMonth);
  const lowMonthName = getMonthName(analysis.lowMonth);
  
  recommendations.push(`Peak pricing typically occurs in ${peakMonthName} (${analysis.peakPrice.toFixed(2)})`);
  recommendations.push(`Best pricing typically occurs in ${lowMonthName} (${analysis.lowPrice.toFixed(2)})`);
  
  const priceDifference = ((analysis.peakPrice - analysis.lowPrice) / analysis.lowPrice) * 100;
  if (priceDifference > 20) {
    recommendations.push(`Significant price variation: ${priceDifference.toFixed(1)}% difference between peak and low seasons`);
  }
  
  return recommendations;
}

function generatePricePeakRecommendations(analysis: any): string[] {
  const recommendations = [];
  
  if (analysis.overallSummary.averagePriceVolatility > 0.25) {
    recommendations.push('Overall high price volatility - implement seasonal purchasing strategies');
  }
  
  recommendations.push(`Peak season for most products: ${analysis.overallSummary.peakSeason}`);
  recommendations.push(`Best purchasing season: ${analysis.overallSummary.lowSeason}`);
  
  const productsWithIssues = analysis.productAnalysis.filter((p: any) => p.supplyChainIssues).length;
  if (productsWithIssues > 0) {
    recommendations.push(`${productsWithIssues} products showing supply chain issues - review supplier relationships`);
  }
  
  const highVolatilityProducts = analysis.productAnalysis.filter((p: any) => p.volatility > 0.4).length;
  if (highVolatilityProducts > 0) {
    recommendations.push(`${highVolatilityProducts} products with high price volatility - prioritize for seasonal purchasing`);
  }
  
  return recommendations;
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
}
