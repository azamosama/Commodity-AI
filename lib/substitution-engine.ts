import { Product, Recipe, RecipeIngredient } from './types';
import { USDAPriceAPI } from './usda-price-api';

export interface SubstitutionSuggestion {
  originalIngredient: {
    productId: string;
    name: string;
    currentPrice: number;
    costPerServing: number;
  };
  suggestedSubstitute: {
    productId: string;
    name: string;
    currentPrice: number;
    costPerServing: number;
    substitutionRatio: number; // How much substitute to use vs original
  };
  savings: {
    costReduction: number;
    percentageReduction: number;
    annualSavings?: number; // If we have sales data
  };
  compatibility: {
    score: number; // 0-100 compatibility score
    factors: {
      flavorMatch: number;
      textureMatch: number;
      nutritionalMatch: number;
      allergenCompatibility: number;
    };
  };
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    timeToImplement: string;
    testingRequired: boolean;
    staffTrainingNeeded: boolean;
  };
  risks: {
    customerAcceptance: 'low' | 'medium' | 'high';
    supplyReliability: 'low' | 'medium' | 'high';
    qualityConsistency: 'low' | 'medium' | 'high';
  };
}

export interface RecipeOptimization {
  recipeId: string;
  recipeName: string;
  currentCostPerServing: number;
  optimizedCostPerServing: number;
  totalSavings: number;
  substitutions: SubstitutionSuggestion[];
  implementation: {
    totalTimeToImplement: string;
    riskLevel: 'low' | 'medium' | 'high';
    testingPhases: number;
  };
}

export interface GeneratedMenuItem {
  id: string;
  name: string;
  description: string;
  category: 'appetizer' | 'main' | 'dessert' | 'beverage' | 'side';
  ingredients: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
    totalCost: number;
  }[];
  estimatedCostPerServing: number;
  suggestedPrice: number;
  estimatedProfitMargin: number;
  flavorProfile: string[];
  nutritionalHighlights: string[];
  preparationTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  seasonalAvailability: string[];
  inspiration: string; // What inspired this menu item
  tags: string[];
}

export interface MenuGenerationContext {
  targetCostRange: { min: number; max: number };
  targetProfitMargin: number;
  availableIngredients: Product[];
  excludedIngredients: string[]; // Product IDs to avoid
  preferredCategories: string[];
  maxPreparationTime: number; // minutes
  dietaryRestrictions: string[]; // e.g., 'vegetarian', 'gluten-free', 'dairy-free'
  flavorPreferences: string[]; // e.g., 'spicy', 'sweet', 'savory'
}

export class SubstitutionEngine {
  private static readonly COMPATIBILITY_WEIGHTS = {
    flavorMatch: 0.4,
    textureMatch: 0.3,
    nutritionalMatch: 0.2,
    allergenCompatibility: 0.1
  };

  private static readonly SUBSTITUTION_DATABASE = {
    // Dairy substitutions
    'milk': [
      { name: 'almond milk', ratio: 1.0, flavorScore: 85, textureScore: 90 },
      { name: 'oat milk', ratio: 1.0, flavorScore: 90, textureScore: 95 },
      { name: 'soy milk', ratio: 1.0, flavorScore: 80, textureScore: 85 },
      { name: 'coconut milk', ratio: 0.8, flavorScore: 70, textureScore: 75 }
    ],
    'butter': [
      { name: 'coconut oil', ratio: 0.8, flavorScore: 75, textureScore: 85 },
      { name: 'olive oil', ratio: 0.7, flavorScore: 70, textureScore: 80 },
      { name: 'vegetable oil', ratio: 0.8, flavorScore: 65, textureScore: 85 },
      { name: 'applesauce', ratio: 0.5, flavorScore: 60, textureScore: 70 }
    ],
    'cheese': [
      { name: 'nutritional yeast', ratio: 0.3, flavorScore: 80, textureScore: 40 },
      { name: 'cashew cheese', ratio: 0.8, flavorScore: 85, textureScore: 90 },
      { name: 'soy cheese', ratio: 1.0, flavorScore: 75, textureScore: 85 }
    ],

    // Protein substitutions
    'beef': [
      { name: 'ground turkey', ratio: 1.0, flavorScore: 85, textureScore: 90 },
      { name: 'ground chicken', ratio: 1.0, flavorScore: 80, textureScore: 85 },
      { name: 'lentils', ratio: 0.7, flavorScore: 70, textureScore: 75 },
      { name: 'mushrooms', ratio: 1.2, flavorScore: 75, textureScore: 80 }
    ],
    'chicken': [
      { name: 'tofu', ratio: 1.0, flavorScore: 70, textureScore: 75 },
      { name: 'tempeh', ratio: 0.8, flavorScore: 75, textureScore: 80 },
      { name: 'seitan', ratio: 0.9, flavorScore: 80, textureScore: 85 },
      { name: 'jackfruit', ratio: 1.1, flavorScore: 70, textureScore: 85 }
    ],

    // Sweetener substitutions
    'sugar': [
      { name: 'honey', ratio: 0.7, flavorScore: 90, textureScore: 85 },
      { name: 'maple syrup', ratio: 0.7, flavorScore: 85, textureScore: 80 },
      { name: 'agave', ratio: 0.6, flavorScore: 80, textureScore: 85 },
      { name: 'stevia', ratio: 0.1, flavorScore: 70, textureScore: 90 }
    ],

    // Flour substitutions
    'flour': [
      { name: 'almond flour', ratio: 0.8, flavorScore: 85, textureScore: 80 },
      { name: 'coconut flour', ratio: 0.3, flavorScore: 80, textureScore: 75 },
      { name: 'oat flour', ratio: 1.0, flavorScore: 85, textureScore: 85 },
      { name: 'rice flour', ratio: 1.0, flavorScore: 80, textureScore: 85 }
    ],

    // Oil substitutions
    'olive oil': [
      { name: 'avocado oil', ratio: 1.0, flavorScore: 90, textureScore: 95 },
      { name: 'coconut oil', ratio: 1.0, flavorScore: 75, textureScore: 85 },
      { name: 'vegetable oil', ratio: 1.0, flavorScore: 70, textureScore: 90 }
    ]
  };

  /**
   * Find optimal substitutions for a recipe
   */
  static async findOptimalSubstitutions(
    recipe: Recipe,
    products: Product[],
    salesData?: any[]
  ): Promise<SubstitutionSuggestion[]> {
    const suggestions: SubstitutionSuggestion[] = [];

    for (const ingredient of recipe.ingredients) {
      const product = products.find(p => p.id === ingredient.productId);
      if (!product) continue;

      // Find potential substitutes
      const substitutes = await this.findSubstitutes(product, products);
      
      for (const substitute of substitutes) {
        const suggestion = await this.evaluateSubstitution(
          ingredient,
          product,
          substitute,
          recipe,
          salesData
        );
        
        if (suggestion && suggestion.savings.costReduction > 0) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions.sort((a, b) => b.savings.costReduction - a.savings.costReduction);
  }

  /**
   * Find potential substitute products
   */
  private static async findSubstitutes(
    originalProduct: Product,
    allProducts: Product[]
  ): Promise<Product[]> {
    const substitutes: Product[] = [];

    // Check predefined substitution database
    const productName = originalProduct.name.toLowerCase();
    const substitutionRules = this.findSubstitutionRules(productName);

    for (const rule of substitutionRules) {
      const substitute = allProducts.find(p => 
        p.name.toLowerCase().includes(rule.name.toLowerCase()) &&
        p.id !== originalProduct.id
      );

      if (substitute) {
        substitutes.push(substitute);
      }
    }

    // Check product's defined substitutes
    if (originalProduct.substitutes) {
      for (const substituteId of originalProduct.substitutes) {
        const substitute = allProducts.find(p => p.id === substituteId);
        if (substitute) {
          substitutes.push(substitute);
        }
      }
    }

    // Find products in same category with similar nutritional profile
    const categorySubstitutes = allProducts.filter(p => 
      p.categoryType === originalProduct.categoryType &&
      p.id !== originalProduct.id &&
      this.hasSimilarNutritionalProfile(originalProduct, p)
    );

    substitutes.push(...categorySubstitutes);

    return [...new Set(substitutes)]; // Remove duplicates
  }

  /**
   * Find substitution rules for a product
   */
  private static findSubstitutionRules(productName: string): any[] {
    const rules: any[] = [];

    for (const [category, substitutions] of Object.entries(this.SUBSTITUTION_DATABASE)) {
      if (productName.includes(category)) {
        rules.push(...substitutions);
      }
    }

    return rules;
  }

  /**
   * Check if two products have similar nutritional profiles
   */
  private static hasSimilarNutritionalProfile(product1: Product, product2: Product): boolean {
    if (!product1.nutritionalInfo || !product2.nutritionalInfo) return false;

    const info1 = product1.nutritionalInfo;
    const info2 = product2.nutritionalInfo;

    // Compare key nutritional values
    const caloriesDiff = Math.abs((info1.calories || 0) - (info2.calories || 0));
    const proteinDiff = Math.abs((info1.protein || 0) - (info2.protein || 0));
    const carbsDiff = Math.abs((info1.carbs || 0) - (info2.carbs || 0));

    // Consider similar if differences are within 20%
    return caloriesDiff < 50 && proteinDiff < 5 && carbsDiff < 10;
  }

  /**
   * Evaluate a specific substitution
   */
  private static async evaluateSubstitution(
    ingredient: RecipeIngredient,
    originalProduct: Product,
    substituteProduct: Product,
    recipe: Recipe,
    salesData?: any[]
  ): Promise<SubstitutionSuggestion | null> {
    try {
      // Get current prices
      const originalPrice = await this.getCurrentPrice(originalProduct);
      const substitutePrice = await this.getCurrentPrice(substituteProduct);

      // Calculate quantities per serving
      const originalQuantityPerServing = this.calculateQuantityPerServing(ingredient, recipe);
      const substitutionRule = this.findSubstitutionRules(originalProduct.name.toLowerCase())
        .find(rule => substituteProduct.name.toLowerCase().includes(rule.name.toLowerCase()));

      const substitutionRatio = substitutionRule?.ratio || 1.0;
      const substituteQuantityPerServing = originalQuantityPerServing * substitutionRatio;

      // Calculate costs
      const originalCostPerServing = originalQuantityPerServing * originalPrice;
      const substituteCostPerServing = substituteQuantityPerServing * substitutePrice;
      const costReduction = originalCostPerServing - substituteCostPerServing;

      // Skip if no savings
      if (costReduction <= 0) return null;

      // Calculate compatibility score
      const compatibility = this.calculateCompatibility(
        originalProduct,
        substituteProduct,
        substitutionRule
      );

      // Calculate annual savings if sales data available
      let annualSavings;
      if (salesData) {
        const recipeSales = salesData.filter(sale => sale.recipeName === recipe.name);
        const totalServings = recipeSales.reduce((sum, sale) => sum + sale.quantity, 0);
        annualSavings = costReduction * totalServings;
      }

      // Assess implementation difficulty and risks
      const implementation = this.assessImplementation(substituteProduct, originalProduct);
      const risks = this.assessRisks(substituteProduct, originalProduct, compatibility.score);

      return {
        originalIngredient: {
          productId: originalProduct.id,
          name: originalProduct.name,
          currentPrice: originalPrice,
          costPerServing: originalCostPerServing
        },
        suggestedSubstitute: {
          productId: substituteProduct.id,
          name: substituteProduct.name,
          currentPrice: substitutePrice,
          costPerServing: substituteCostPerServing,
          substitutionRatio
        },
        savings: {
          costReduction,
          percentageReduction: (costReduction / originalCostPerServing) * 100,
          annualSavings
        },
        compatibility,
        implementation,
        risks
      };

    } catch (error) {
      console.error(`Error evaluating substitution for ${originalProduct.name}:`, error);
      return null;
    }
  }

  /**
   * Get current price for a product
   */
  private static async getCurrentPrice(product: Product): Promise<number> {
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
   * Calculate quantity per serving
   */
  private static calculateQuantityPerServing(
    ingredient: RecipeIngredient,
    recipe: Recipe
  ): number {
    const baseQuantity = typeof ingredient.quantity === 'string' 
      ? parseFloat(ingredient.quantity) 
      : ingredient.quantity;

    const yieldPercentage = typeof ingredient.yieldPercentage === 'string'
      ? parseFloat(ingredient.yieldPercentage) / 100
      : (ingredient.yieldPercentage || 100) / 100;

    const lossPercentage = typeof ingredient.lossPercentage === 'string'
      ? parseFloat(ingredient.lossPercentage) / 100
      : (ingredient.lossPercentage || 0) / 100;

    const effectiveQuantity = baseQuantity * yieldPercentage * (1 - lossPercentage);
    return effectiveQuantity / recipe.servings;
  }

  /**
   * Calculate compatibility score between products
   */
  private static calculateCompatibility(
    originalProduct: Product,
    substituteProduct: Product,
    substitutionRule?: any
  ): SubstitutionSuggestion['compatibility'] {
    let flavorMatch = 70; // Default score
    let textureMatch = 70;
    let nutritionalMatch = 70;
    let allergenCompatibility = 100;

    // Use substitution rule scores if available
    if (substitutionRule) {
      flavorMatch = substitutionRule.flavorScore || 70;
      textureMatch = substitutionRule.textureScore || 70;
    }

    // Adjust based on nutritional similarity
    if (originalProduct.nutritionalInfo && substituteProduct.nutritionalInfo) {
      const original = originalProduct.nutritionalInfo;
      const substitute = substituteProduct.nutritionalInfo;

      const caloriesDiff = Math.abs((original.calories || 0) - (substitute.calories || 0));
      const proteinDiff = Math.abs((original.protein || 0) - (substitute.protein || 0));

      if (caloriesDiff < 20 && proteinDiff < 2) {
        nutritionalMatch = 90;
      } else if (caloriesDiff < 50 && proteinDiff < 5) {
        nutritionalMatch = 75;
      } else {
        nutritionalMatch = 60;
      }
    }

    // Check allergen compatibility
    if (originalProduct.allergens && substituteProduct.allergens) {
      const commonAllergens = originalProduct.allergens.filter(allergen =>
        substituteProduct.allergens?.includes(allergen)
      );
      allergenCompatibility = 100 - (commonAllergens.length * 20);
    }

    const factors = {
      flavorMatch,
      textureMatch,
      nutritionalMatch,
      allergenCompatibility
    };

    const score = Object.entries(factors).reduce((total, [key, value]) => {
      return total + (value * (this.COMPATIBILITY_WEIGHTS as any)[key]);
    }, 0);

    return { score, factors };
  }

  /**
   * Assess implementation difficulty
   */
  private static assessImplementation(
    substituteProduct: Product,
    originalProduct: Product
  ): SubstitutionSuggestion['implementation'] {
    let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
    let timeToImplement = '1-2 days';
    let testingRequired = false;
    let staffTrainingNeeded = false;

    // Assess based on product categories
    if (originalProduct.categoryType !== substituteProduct.categoryType) {
      difficulty = 'medium';
      timeToImplement = '3-5 days';
      testingRequired = true;
    }

    // Assess based on allergen differences
    if (originalProduct.allergens && substituteProduct.allergens) {
      const allergenDifferences = originalProduct.allergens.filter(allergen =>
        !substituteProduct.allergens?.includes(allergen)
      );
      if (allergenDifferences.length > 0) {
        difficulty = 'hard';
        timeToImplement = '1-2 weeks';
        testingRequired = true;
        staffTrainingNeeded = true;
      }
    }

    return {
      difficulty,
      timeToImplement,
      testingRequired,
      staffTrainingNeeded
    };
  }

  /**
   * Assess risks of substitution
   */
  private static assessRisks(
    substituteProduct: Product,
    originalProduct: Product,
    compatibilityScore: number
  ): SubstitutionSuggestion['risks'] {
    let customerAcceptance: 'low' | 'medium' | 'high' = 'low';
    let supplyReliability: 'low' | 'medium' | 'high' = 'medium';
    let qualityConsistency: 'low' | 'medium' | 'high' = 'medium';

    // Customer acceptance based on compatibility
    if (compatibilityScore >= 85) {
      customerAcceptance = 'low';
    } else if (compatibilityScore >= 70) {
      customerAcceptance = 'medium';
    } else {
      customerAcceptance = 'high';
    }

    // Supply reliability based on product availability
    if (substituteProduct.isAvailable === false) {
      supplyReliability = 'high';
    } else if (substituteProduct.supplier && substituteProduct.supplier.includes('Local')) {
      supplyReliability = 'medium';
    } else {
      supplyReliability = 'low';
    }

    // Quality consistency based on product type
    if (substituteProduct.categoryType === 'Dry Goods' || substituteProduct.categoryType === 'Supplies') {
      qualityConsistency = 'low';
    } else if (substituteProduct.categoryType === 'Fresh Food' || substituteProduct.categoryType === 'Produce') {
      qualityConsistency = 'high';
    }

    return {
      customerAcceptance,
      supplyReliability,
      qualityConsistency
    };
  }

  /**
   * Optimize entire recipe with best substitutions
   */
  static async optimizeRecipe(
    recipe: Recipe,
    products: Product[],
    salesData?: any[]
  ): Promise<RecipeOptimization> {
    const substitutions = await this.findOptimalSubstitutions(recipe, products, salesData);
    
    const currentCostPerServing = substitutions.reduce((total, sub) => 
      total + sub.originalIngredient.costPerServing, 0
    );
    
    const optimizedCostPerServing = substitutions.reduce((total, sub) => 
      total + sub.suggestedSubstitute.costPerServing, 0
    );
    
    const totalSavings = currentCostPerServing - optimizedCostPerServing;

    // Assess overall implementation
    const maxDifficulty = substitutions.reduce((max, sub) => {
      const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
      return Math.max(max, difficultyOrder[sub.implementation.difficulty]);
    }, 1);

    const riskLevel = substitutions.reduce((maxRisk, sub) => {
      const riskOrder = { low: 1, medium: 2, high: 3 };
      const maxSubRisk = Math.max(
        riskOrder[sub.risks.customerAcceptance],
        riskOrder[sub.risks.supplyReliability],
        riskOrder[sub.risks.qualityConsistency]
      );
      return Math.max(maxRisk, maxSubRisk);
    }, 1);

    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      currentCostPerServing,
      optimizedCostPerServing,
      totalSavings,
      substitutions,
      implementation: {
        totalTimeToImplement: maxDifficulty === 3 ? '2-3 weeks' : maxDifficulty === 2 ? '1 week' : '3-5 days',
        riskLevel: riskLevel === 3 ? 'high' : riskLevel === 2 ? 'medium' : 'low',
        testingPhases: substitutions.filter(sub => sub.implementation.testingRequired).length
      }
    };
  }

  /**
   * Generate new menu items based on available ingredients and cost optimization
   */
  static async generateMenuItems(
    context: MenuGenerationContext,
    count: number = 5
  ): Promise<GeneratedMenuItem[]> {
    const menuItems: GeneratedMenuItem[] = [];
    
    // Define menu templates based on categories
    const menuTemplates = this.getMenuTemplates();
    
    for (let i = 0; i < count; i++) {
      const template = menuTemplates[Math.floor(Math.random() * menuTemplates.length)];
      const menuItem = await this.createMenuItemFromTemplate(template, context);
      if (menuItem) {
        menuItems.push(menuItem);
      }
    }
    
    // Sort by profit margin and cost efficiency
    return menuItems.sort((a, b) => {
      const scoreA = a.estimatedProfitMargin * 0.7 + (a.estimatedCostPerServing <= context.targetCostRange.max ? 30 : 0);
      const scoreB = b.estimatedProfitMargin * 0.7 + (b.estimatedCostPerServing <= context.targetCostRange.max ? 30 : 0);
      return scoreB - scoreA;
    });
  }

  /**
   * Create a menu item from a template
   */
  private static async createMenuItemFromTemplate(
    template: any,
    context: MenuGenerationContext
  ): Promise<GeneratedMenuItem | null> {
    const availableIngredients = context.availableIngredients.filter(
      p => !context.excludedIngredients.includes(p.id)
    );

    // Find ingredients that match the template requirements
    const selectedIngredients = [];
    let totalCost = 0;

    for (const requirement of template.ingredients) {
      const matchingIngredients = availableIngredients.filter(ingredient => {
        // Check category match
        if (requirement.category && ingredient.categoryType !== requirement.category) {
          return false;
        }
        
        // Check dietary restrictions
        if (context.dietaryRestrictions.includes('vegetarian') && 
            ['Meat', 'Dairy'].includes(ingredient.categoryType)) {
          return false;
        }
        
        if (context.dietaryRestrictions.includes('dairy-free') && 
            ingredient.categoryType === 'Dairy') {
          return false;
        }
        
        return true;
      });

      if (matchingIngredients.length === 0) {
        return null; // Can't create this menu item
      }

      // Select the most cost-effective ingredient
      const selectedIngredient = matchingIngredients.reduce((best, current) => {
        const bestCostPerUnit = best.cost / best.packageSize;
        const currentCostPerUnit = current.cost / current.packageSize;
        return currentCostPerUnit < bestCostPerUnit ? current : best;
      });

      const quantity = requirement.quantity || 1;
      const costPerUnit = selectedIngredient.cost / selectedIngredient.packageSize;
      const ingredientCost = quantity * costPerUnit;

      selectedIngredients.push({
        productId: selectedIngredient.id,
        productName: selectedIngredient.name,
        quantity,
        unit: requirement.unit || selectedIngredient.unit,
        costPerUnit,
        totalCost: ingredientCost
      });

      totalCost += ingredientCost;
    }

    // Check if cost is within target range
    if (totalCost < context.targetCostRange.min || totalCost > context.targetCostRange.max) {
      return null;
    }

    // Calculate pricing
    const suggestedPrice = totalCost * (1 + context.targetProfitMargin / 100);
    const profitMargin = ((suggestedPrice - totalCost) / suggestedPrice) * 100;

    // Generate flavor profile
    const flavorProfile = this.generateFlavorProfile(selectedIngredients, context.flavorPreferences);
    
    // Generate nutritional highlights
    const nutritionalHighlights = this.generateNutritionalHighlights(selectedIngredients);
    
    // Determine difficulty and prep time
    const difficulty = this.determineDifficulty(selectedIngredients, template);
    const preparationTime = this.estimatePreparationTime(template, difficulty);

    return {
      id: `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: this.generateMenuItemName(template, selectedIngredients),
      description: this.generateDescription(template, selectedIngredients, flavorProfile),
      category: template.category,
      ingredients: selectedIngredients,
      estimatedCostPerServing: totalCost,
      suggestedPrice,
      estimatedProfitMargin: profitMargin,
      flavorProfile,
      nutritionalHighlights,
      preparationTime,
      difficulty,
      seasonalAvailability: this.getSeasonalAvailability(selectedIngredients),
      inspiration: template.inspiration || 'Cost-optimized ingredient combination',
      tags: this.generateTags(template, selectedIngredients, context)
    };
  }

  /**
   * Get predefined menu templates
   */
  private static getMenuTemplates() {
    return [
      {
        category: 'main',
        name: 'Protein Bowl',
        ingredients: [
          { category: 'Meat', quantity: 0.5, unit: 'lb' },
          { category: 'Produce', quantity: 1, unit: 'cup' },
          { category: 'Dry Goods', quantity: 0.5, unit: 'cup' }
        ],
        inspiration: 'Trending protein bowl concept'
      },
      {
        category: 'dessert',
        name: 'Fruit Parfait',
        ingredients: [
          { category: 'Produce', quantity: 1, unit: 'cup' },
          { category: 'Dairy', quantity: 0.5, unit: 'cup' },
          { category: 'Dry Goods', quantity: 0.25, unit: 'cup' }
        ],
        inspiration: 'Healthy dessert alternative'
      },
      {
        category: 'appetizer',
        name: 'Seasonal Bruschetta',
        ingredients: [
          { category: 'Dry Goods', quantity: 4, unit: 'slices' },
          { category: 'Produce', quantity: 0.5, unit: 'cup' },
          { category: 'Dairy', quantity: 0.25, unit: 'cup' }
        ],
        inspiration: 'Classic Italian with seasonal twist'
      },
      {
        category: 'beverage',
        name: 'Smoothie Bowl',
        ingredients: [
          { category: 'Produce', quantity: 1, unit: 'cup' },
          { category: 'Dairy', quantity: 0.5, unit: 'cup' },
          { category: 'Dry Goods', quantity: 0.25, unit: 'cup' }
        ],
        inspiration: 'Instagram-worthy healthy beverage'
      },
      {
        category: 'side',
        name: 'Roasted Vegetables',
        ingredients: [
          { category: 'Produce', quantity: 1, unit: 'cup' },
          { category: 'Dry Goods', quantity: 0.25, unit: 'cup' }
        ],
        inspiration: 'Simple, healthy side dish'
      }
    ];
  }

  /**
   * Generate flavor profile based on ingredients
   */
  private static generateFlavorProfile(
    ingredients: any[],
    preferences: string[]
  ): string[] {
    const flavors = new Set<string>();
    
    // Add preferences
    preferences.forEach(pref => flavors.add(pref));
    
    // Add flavors based on ingredients
    ingredients.forEach(ingredient => {
      if (ingredient.productName.toLowerCase().includes('chocolate')) {
        flavors.add('rich');
        flavors.add('sweet');
      }
      if (ingredient.productName.toLowerCase().includes('strawberry')) {
        flavors.add('sweet');
        flavors.add('fruity');
      }
      if (ingredient.productName.toLowerCase().includes('spice')) {
        flavors.add('spicy');
      }
      if (ingredient.productName.toLowerCase().includes('lemon')) {
        flavors.add('tangy');
        flavors.add('citrus');
      }
    });
    
    return Array.from(flavors);
  }

  /**
   * Generate nutritional highlights
   */
  private static generateNutritionalHighlights(ingredients: any[]): string[] {
    const highlights = [];
    
    const hasProtein = ingredients.some(ing => 
      ing.productName.toLowerCase().includes('chicken') ||
      ing.productName.toLowerCase().includes('beef') ||
      ing.productName.toLowerCase().includes('eggs')
    );
    
    const hasFiber = ingredients.some(ing => 
      ing.productName.toLowerCase().includes('vegetable') ||
      ing.productName.toLowerCase().includes('fruit')
    );
    
    const hasHealthyFats = ingredients.some(ing => 
      ing.productName.toLowerCase().includes('olive') ||
      ing.productName.toLowerCase().includes('avocado')
    );
    
    if (hasProtein) highlights.push('High Protein');
    if (hasFiber) highlights.push('High Fiber');
    if (hasHealthyFats) highlights.push('Healthy Fats');
    if (highlights.length === 0) highlights.push('Nutritious');
    
    return highlights;
  }

  /**
   * Determine difficulty level
   */
  private static determineDifficulty(ingredients: any[], template: any): 'easy' | 'medium' | 'hard' {
    const ingredientCount = ingredients.length;
    const hasComplexIngredients = ingredients.some(ing => 
      ing.productName.toLowerCase().includes('dough') ||
      ing.productName.toLowerCase().includes('sauce')
    );
    
    if (ingredientCount <= 3 && !hasComplexIngredients) return 'easy';
    if (ingredientCount <= 5) return 'medium';
    return 'hard';
  }

  /**
   * Estimate preparation time
   */
  private static estimatePreparationTime(template: any, difficulty: 'easy' | 'medium' | 'hard'): number {
    const baseTime = { easy: 10, medium: 20, hard: 35 };
    return baseTime[difficulty];
  }

  /**
   * Generate menu item name
   */
  private static generateMenuItemName(template: any, ingredients: any[]): string {
    const mainIngredient = ingredients[0]?.productName || 'Special';
    const category = template.category;
    
    const prefixes = {
      main: ['Signature', 'Chef\'s', 'Gourmet'],
      dessert: ['Decadent', 'Artisan', 'Premium'],
      appetizer: ['Crispy', 'Fresh', 'Seasonal'],
      beverage: ['Refreshing', 'Creamy', 'Vibrant'],
      side: ['Roasted', 'Garden', 'Herb']
    };
    
    const prefix = prefixes[category]?.[Math.floor(Math.random() * prefixes[category].length)] || 'Special';
    return `${prefix} ${mainIngredient} ${category.charAt(0).toUpperCase() + category.slice(1)}`;
  }

  /**
   * Generate description
   */
  private static generateDescription(
    template: any,
    ingredients: any[],
    flavorProfile: string[]
  ): string {
    const mainIngredients = ingredients.slice(0, 2).map(ing => ing.productName).join(' and ');
    const flavors = flavorProfile.slice(0, 2).join(', ');
    
    return `A delicious ${template.category} featuring ${mainIngredients}. ${flavors} flavors create a memorable dining experience.`;
  }

  /**
   * Get seasonal availability
   */
  private static getSeasonalAvailability(ingredients: any[]): string[] {
    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    return seasons; // Simplified - in reality would check ingredient seasonality
  }

  /**
   * Generate tags
   */
  private static generateTags(
    template: any,
    ingredients: any[],
    context: MenuGenerationContext
  ): string[] {
    const tags = [template.category];
    
    // Add dietary tags
    context.dietaryRestrictions.forEach(restriction => {
      tags.push(restriction);
    });
    
    // Add ingredient-based tags
    if (ingredients.some(ing => ing.productName.toLowerCase().includes('organic'))) {
      tags.push('organic');
    }
    
    if (ingredients.some(ing => ing.productName.toLowerCase().includes('local'))) {
      tags.push('local');
    }
    
    return tags;
  }
}