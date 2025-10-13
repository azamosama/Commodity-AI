import { Recipe, RecipeIngredient, Product, SalesRecord } from './types';
import { USDAPriceAPI } from './usda-price-api';

export interface ProfitabilityAnalysis {
  recipeId: string;
  recipeName: string;
  currentCostPerServing: number;
  salePrice: number;
  profitMargin: number;
  profitMarginPercentage: number;
  isProfitable: boolean;
  profitabilityStatus: 'high' | 'medium' | 'low' | 'unprofitable';
  costBreakdown: IngredientCostBreakdown[];
  recommendations: ProfitabilityRecommendation[];
  lastUpdated: string;
}

export interface IngredientCostBreakdown {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  currentPrice: number;
  costPerServing: number;
  priceChangeFromLastUpdate?: number;
  priceChangePercentage?: number;
  isPriceVolatile: boolean;
}

export interface ProfitabilityRecommendation {
  type: 'substitution' | 'new_menu_item' | 'price_adjustment' | 'portion_optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings: number;
  potentialProfitImprovement: number;
  implementation: {
    steps: string[];
    estimatedTime: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  alternatives?: AlternativeOption[];
}

export interface AlternativeOption {
  name: string;
  description: string;
  costPerServing: number;
  profitMargin: number;
  pros: string[];
  cons: string[];
}

export interface MenuOptimizationSuggestion {
  type: 'new_recipe' | 'seasonal_adjustment' | 'cost_reduction';
  name: string;
  description: string;
  estimatedCostPerServing: number;
  suggestedPrice: number;
  estimatedProfitMargin: number;
  ingredients: {
    productId: string;
    name: string;
    quantity: number;
    unit: string;
    currentPrice: number;
  }[];
  seasonalFactors?: {
    ingredient: string;
    priceTrend: 'increasing' | 'decreasing' | 'stable';
    seasonalAvailability: string[];
  }[];
}

export class ProfitabilityAnalyzer {
  private static readonly PROFITABILITY_THRESHOLDS = {
    high: 0.4,      // 40%+ profit margin
    medium: 0.25,   // 25-40% profit margin
    low: 0.15,      // 15-25% profit margin
    unprofitable: 0 // Below 15% profit margin
  };

  private static readonly PRICE_VOLATILITY_THRESHOLD = 0.15; // 15% price change

  /**
   * Analyze profitability for all recipes with current ingredient prices
   */
  static async analyzeAllRecipes(
    recipes: Recipe[],
    products: Product[],
    salesRecords: SalesRecord[]
  ): Promise<ProfitabilityAnalysis[]> {
    const analyses: ProfitabilityAnalysis[] = [];

    for (const recipe of recipes) {
      try {
        const analysis = await this.analyzeRecipe(recipe, products, salesRecords);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Error analyzing recipe ${recipe.name}:`, error);
      }
    }

    return analyses.sort((a, b) => a.profitMarginPercentage - b.profitMarginPercentage);
  }

  /**
   * Analyze profitability for a single recipe
   */
  static async analyzeRecipe(
    recipe: Recipe,
    products: Product[],
    salesRecords: SalesRecord[]
  ): Promise<ProfitabilityAnalysis> {
    // Get current sale price from sales records
    const recentSales = salesRecords
      .filter(sale => sale.recipeName === recipe.name)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const currentSalePrice = recentSales.length > 0 ? recentSales[0].salePrice : 0;

    // Calculate current cost per serving
    const costBreakdown = await this.calculateRecipeCost(recipe, products);
    const currentCostPerServing = costBreakdown.reduce((total, item) => total + item.costPerServing, 0);

    // Calculate profit metrics
    const profitMargin = currentSalePrice - currentCostPerServing;
    const profitMarginPercentage = currentSalePrice > 0 ? profitMargin / currentSalePrice : 0;

    // Determine profitability status
    const profitabilityStatus = this.determineProfitabilityStatus(profitMarginPercentage);
    const isProfitable = profitMarginPercentage >= this.PROFITABILITY_THRESHOLDS.low;

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      recipe,
      costBreakdown,
      currentCostPerServing,
      currentSalePrice,
      profitMarginPercentage,
      products
    );

    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      currentCostPerServing,
      salePrice: currentSalePrice,
      profitMargin,
      profitMarginPercentage,
      isProfitable,
      profitabilityStatus,
      costBreakdown,
      recommendations,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculate current recipe cost using real-time ingredient prices
   */
  private static async calculateRecipeCost(
    recipe: Recipe,
    products: Product[]
  ): Promise<IngredientCostBreakdown[]> {
    const breakdown: IngredientCostBreakdown[] = [];

    for (const ingredient of recipe.ingredients) {
      const product = products.find(p => p.id === ingredient.productId);
      if (!product) continue;

      // Get current price (USDA API or fallback to stored price)
      const currentPrice = await this.getCurrentIngredientPrice(product);
      
      // Calculate quantity per serving
      const quantityPerServing = this.calculateQuantityPerServing(ingredient, recipe);
      
      // Calculate cost per serving
      const costPerServing = quantityPerServing * currentPrice;

      // Check for price volatility
      const priceHistory = product.priceHistory || [];
      const lastPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : currentPrice;
      const priceChange = currentPrice - lastPrice;
      const priceChangePercentage = lastPrice > 0 ? priceChange / lastPrice : 0;
      const isPriceVolatile = Math.abs(priceChangePercentage) > this.PRICE_VOLATILITY_THRESHOLD;

      breakdown.push({
        productId: product.id,
        productName: product.name,
        quantity: quantityPerServing,
        unit: ingredient.unit,
        currentPrice,
        costPerServing,
        priceChangeFromLastUpdate: priceChange,
        priceChangePercentage,
        isPriceVolatile
      });
    }

    return breakdown;
  }

  /**
   * Get current ingredient price from USDA API or fallback to stored price
   */
  private static async getCurrentIngredientPrice(product: Product): Promise<number> {
    try {
      // Try to get real-time price from USDA API
      const usdaData = await USDAPriceAPI.getCommodityPriceData(product.name);
      if (usdaData && usdaData.currentPrice) {
        return usdaData.currentPrice;
      }
    } catch (error) {
      console.log(`Could not fetch USDA price for ${product.name}, using stored price`);
    }

    // Fallback to stored price
    return product.cost || 0;
  }

  /**
   * Calculate quantity per serving accounting for yield and loss percentages
   */
  private static calculateQuantityPerServing(
    ingredient: RecipeIngredient,
    recipe: Recipe
  ): number {
    const baseQuantity = typeof ingredient.quantity === 'string' 
      ? parseFloat(ingredient.quantity) 
      : ingredient.quantity;

    // Apply yield percentage (how much is usable after prep)
    const yieldPercentage = typeof ingredient.yieldPercentage === 'string'
      ? parseFloat(ingredient.yieldPercentage) / 100
      : (ingredient.yieldPercentage || 100) / 100;

    // Apply loss percentage (how much is lost during prep)
    const lossPercentage = typeof ingredient.lossPercentage === 'string'
      ? parseFloat(ingredient.lossPercentage) / 100
      : (ingredient.lossPercentage || 0) / 100;

    // Calculate effective quantity per serving
    const effectiveQuantity = baseQuantity * yieldPercentage * (1 - lossPercentage);
    const quantityPerServing = effectiveQuantity / recipe.servings;

    return quantityPerServing;
  }

  /**
   * Determine profitability status based on profit margin
   */
  private static determineProfitabilityStatus(profitMarginPercentage: number): 'high' | 'medium' | 'low' | 'unprofitable' {
    if (profitMarginPercentage >= this.PROFITABILITY_THRESHOLDS.high) return 'high';
    if (profitMarginPercentage >= this.PROFITABILITY_THRESHOLDS.medium) return 'medium';
    if (profitMarginPercentage >= this.PROFITABILITY_THRESHOLDS.low) return 'low';
    return 'unprofitable';
  }

  /**
   * Generate recommendations for improving profitability
   */
  private static async generateRecommendations(
    recipe: Recipe,
    costBreakdown: IngredientCostBreakdown[],
    currentCostPerServing: number,
    currentSalePrice: number,
    profitMarginPercentage: number,
    products: Product[]
  ): Promise<ProfitabilityRecommendation[]> {
    const recommendations: ProfitabilityRecommendation[] = [];

    // Find high-cost ingredients
    const highCostIngredients = costBreakdown
      .filter(item => item.costPerServing > currentCostPerServing * 0.2) // More than 20% of total cost
      .sort((a, b) => b.costPerServing - a.costPerServing);

    // Generate substitution recommendations
    for (const ingredient of highCostIngredients) {
      const substitutionRec = await this.generateSubstitutionRecommendation(
        ingredient,
        recipe,
        products,
        currentCostPerServing
      );
      if (substitutionRec) {
        recommendations.push(substitutionRec);
      }
    }

    // Generate price adjustment recommendations
    if (profitMarginPercentage < this.PROFITABILITY_THRESHOLDS.medium) {
      const priceAdjustmentRec = this.generatePriceAdjustmentRecommendation(
        currentCostPerServing,
        currentSalePrice,
        profitMarginPercentage
      );
      recommendations.push(priceAdjustmentRec);
    }

    // Generate portion optimization recommendations
    if (profitMarginPercentage < this.PROFITABILITY_THRESHOLDS.low) {
      const portionRec = this.generatePortionOptimizationRecommendation(
        recipe,
        costBreakdown,
        currentCostPerServing
      );
      recommendations.push(portionRec);
    }

    return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Generate ingredient substitution recommendations
   */
  private static async generateSubstitutionRecommendation(
    ingredient: IngredientCostBreakdown,
    recipe: Recipe,
    products: Product[],
    currentCostPerServing: number
  ): Promise<ProfitabilityRecommendation | null> {
    const product = products.find(p => p.id === ingredient.productId);
    if (!product || !product.substitutes || product.substitutes.length === 0) {
      return null;
    }

    const alternatives: AlternativeOption[] = [];

    for (const substituteId of product.substitutes) {
      const substitute = products.find(p => p.id === substituteId);
      if (!substitute) continue;

      const substitutePrice = await this.getCurrentIngredientPrice(substitute);
      const substituteCostPerServing = ingredient.quantity * substitutePrice;
      const potentialSavings = ingredient.costPerServing - substituteCostPerServing;

      if (potentialSavings > 0) {
        alternatives.push({
          name: substitute.name,
          description: `Substitute ${ingredient.productName} with ${substitute.name}`,
          costPerServing: substituteCostPerServing,
          profitMargin: substituteCostPerServing / (currentCostPerServing - potentialSavings),
          pros: [
            `Saves $${potentialSavings.toFixed(2)} per serving`,
            `Reduces recipe cost by ${((potentialSavings / currentCostPerServing) * 100).toFixed(1)}%`
          ],
          cons: [
            'May affect taste or texture',
            'Requires recipe testing'
          ]
        });
      }
    }

    if (alternatives.length === 0) return null;

    const bestAlternative = alternatives.sort((a, b) => b.profitMargin - a.profitMargin)[0];
    const potentialSavings = ingredient.costPerServing - bestAlternative.costPerServing;

    return {
      type: 'substitution',
      priority: potentialSavings > currentCostPerServing * 0.1 ? 'high' : 'medium',
      title: `Substitute ${ingredient.productName}`,
      description: `Replace ${ingredient.productName} with ${bestAlternative.name} to reduce costs`,
      potentialSavings,
      potentialProfitImprovement: (potentialSavings / currentCostPerServing) * 100,
      implementation: {
        steps: [
          'Research substitute ingredient availability',
          'Test recipe with substitute ingredient',
          'Adjust quantities if needed',
          'Update recipe documentation',
          'Train kitchen staff on changes'
        ],
        estimatedTime: '2-3 days',
        riskLevel: 'medium'
      },
      alternatives
    };
  }

  /**
   * Generate price adjustment recommendations
   */
  private static generatePriceAdjustmentRecommendation(
    currentCostPerServing: number,
    currentSalePrice: number,
    profitMarginPercentage: number
  ): ProfitabilityRecommendation {
    const targetProfitMargin = this.PROFITABILITY_THRESHOLDS.medium;
    const suggestedPrice = currentCostPerServing / (1 - targetProfitMargin);
    const priceIncrease = suggestedPrice - currentSalePrice;
    const potentialProfitImprovement = (priceIncrease / currentSalePrice) * 100;

    return {
      type: 'price_adjustment',
      priority: profitMarginPercentage < this.PROFITABILITY_THRESHOLDS.low ? 'high' : 'medium',
      title: 'Adjust Menu Price',
      description: `Increase price to $${suggestedPrice.toFixed(2)} to achieve target profit margin`,
      potentialSavings: priceIncrease,
      potentialProfitImprovement,
      implementation: {
        steps: [
          'Analyze competitor pricing',
          'Test price sensitivity with customers',
          'Update POS system pricing',
          'Update menu boards and materials',
          'Communicate changes to staff'
        ],
        estimatedTime: '1-2 weeks',
        riskLevel: 'high'
      }
    };
  }

  /**
   * Generate portion optimization recommendations
   */
  private static generatePortionOptimizationRecommendation(
    recipe: Recipe,
    costBreakdown: IngredientCostBreakdown[],
    currentCostPerServing: number
  ): ProfitabilityRecommendation {
    const totalCost = costBreakdown.reduce((sum, item) => sum + item.costPerServing, 0);
    const potentialReduction = totalCost * 0.1; // 10% reduction through portion optimization

    return {
      type: 'portion_optimization',
      priority: 'medium',
      title: 'Optimize Portion Sizes',
      description: 'Reduce portion sizes by 5-10% to improve profitability while maintaining customer satisfaction',
      potentialSavings: potentialReduction,
      potentialProfitImprovement: (potentialReduction / currentCostPerServing) * 100,
      implementation: {
        steps: [
          'Analyze current portion sizes vs. industry standards',
          'Test reduced portions with focus groups',
          'Update serving utensils and training',
          'Monitor customer feedback',
          'Adjust based on sales data'
        ],
        estimatedTime: '2-4 weeks',
        riskLevel: 'medium'
      }
    };
  }

  /**
   * Generate new menu item suggestions based on current ingredient prices
   */
  static async generateMenuOptimizationSuggestions(
    products: Product[],
    currentRecipes: Recipe[]
  ): Promise<MenuOptimizationSuggestion[]> {
    const suggestions: MenuOptimizationSuggestion[] = [];

    // Find low-cost, high-availability ingredients
    const lowCostIngredients = products
      .filter(p => p.cost && p.cost < 5) // Under $5
      .sort((a, b) => (a.cost || 0) - (b.cost || 0));

    // Generate seasonal suggestions
    const seasonalSuggestions = await this.generateSeasonalSuggestions(lowCostIngredients);
    suggestions.push(...seasonalSuggestions);

    // Generate cost-reduction suggestions
    const costReductionSuggestions = this.generateCostReductionSuggestions(lowCostIngredients, currentRecipes);
    suggestions.push(...costReductionSuggestions);

    return suggestions.sort((a, b) => b.estimatedProfitMargin - a.estimatedProfitMargin);
  }

  /**
   * Generate seasonal menu suggestions
   */
  private static async generateSeasonalSuggestions(
    lowCostIngredients: Product[]
  ): Promise<MenuOptimizationSuggestion[]> {
    const suggestions: MenuOptimizationSuggestion[] = [];
    const currentMonth = new Date().getMonth();

    // Seasonal ingredient mapping
    const seasonalIngredients = {
      spring: ['strawberries', 'asparagus', 'peas', 'lettuce'],
      summer: ['tomatoes', 'corn', 'peaches', 'berries'],
      fall: ['apples', 'pumpkin', 'squash', 'cranberries'],
      winter: ['citrus', 'root vegetables', 'cabbage', 'winter squash']
    };

    const currentSeason = this.getCurrentSeason(currentMonth);
    const seasonalItems = seasonalIngredients[currentSeason];

    for (const ingredientName of seasonalItems) {
      const ingredient = lowCostIngredients.find(p => 
        p.name.toLowerCase().includes(ingredientName.toLowerCase())
      );

      if (ingredient) {
        const currentPrice = await this.getCurrentIngredientPrice(ingredient);
        const estimatedCostPerServing = currentPrice * 0.5; // Assume 0.5 units per serving
        const suggestedPrice = estimatedCostPerServing * 2.5; // 60% profit margin
        const estimatedProfitMargin = (suggestedPrice - estimatedCostPerServing) / suggestedPrice;

        suggestions.push({
          type: 'seasonal_adjustment',
          name: `Seasonal ${ingredient.name} Special`,
          description: `Feature ${ingredient.name} in a seasonal menu item`,
          estimatedCostPerServing,
          suggestedPrice,
          estimatedProfitMargin,
          ingredients: [{
            productId: ingredient.id,
            name: ingredient.name,
            quantity: 0.5,
            unit: 'lb',
            currentPrice
          }],
          seasonalFactors: [{
            ingredient: ingredient.name,
            priceTrend: 'decreasing',
            seasonalAvailability: [currentSeason]
          }]
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate cost reduction suggestions
   */
  private static generateCostReductionSuggestions(
    lowCostIngredients: Product[],
    currentRecipes: Recipe[]
  ): MenuOptimizationSuggestion[] {
    const suggestions: MenuOptimizationSuggestion[] = [];

    // Find ingredients that appear in multiple recipes
    const ingredientUsage = new Map<string, number>();
    currentRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        const count = ingredientUsage.get(ingredient.productId) || 0;
        ingredientUsage.set(ingredient.productId, count + 1);
      });
    });

    // Suggest recipes using frequently used, low-cost ingredients
    const popularLowCostIngredients = lowCostIngredients
      .filter(ingredient => (ingredientUsage.get(ingredient.id) || 0) > 1)
      .slice(0, 3);

    for (const ingredient of popularLowCostIngredients) {
      const estimatedCostPerServing = (ingredient.cost || 0) * 0.3;
      const suggestedPrice = estimatedCostPerServing * 3; // 67% profit margin
      const estimatedProfitMargin = (suggestedPrice - estimatedCostPerServing) / suggestedPrice;

      suggestions.push({
        type: 'new_recipe',
        name: `Budget ${ingredient.name} Bowl`,
        description: `Create a new menu item featuring ${ingredient.name} as the main ingredient`,
        estimatedCostPerServing,
        suggestedPrice,
        estimatedProfitMargin,
        ingredients: [{
          productId: ingredient.id,
          name: ingredient.name,
          quantity: 0.3,
          unit: 'lb',
          currentPrice: ingredient.cost || 0
        }]
      });
    }

    return suggestions;
  }

  /**
   * Get current season based on month
   */
  private static getCurrentSeason(month: number): 'spring' | 'summer' | 'fall' | 'winter' {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  /**
   * Get profitability alerts for items that need immediate attention
   */
  static getProfitabilityAlerts(analyses: ProfitabilityAnalysis[]): {
    critical: ProfitabilityAnalysis[];
    warning: ProfitabilityAnalysis[];
    info: ProfitabilityAnalysis[];
  } {
    const critical = analyses.filter(a => a.profitabilityStatus === 'unprofitable');
    const warning = analyses.filter(a => a.profitabilityStatus === 'low');
    const info = analyses.filter(a => a.profitabilityStatus === 'medium');

    return { critical, warning, info };
  }
}
