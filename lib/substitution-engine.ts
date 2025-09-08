import { Product, Recipe, RecipeIngredient, SubstitutionSuggestion, IngredientAvailability, InventoryItem } from './types';
import { ProductDataAPI, RealProductData } from './product-data-api';

// Cache for real product data to avoid repeated API calls
const productDataCache = new Map<string, { data: RealProductData; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Universal substitution database with realistic prices and comprehensive rules
const UNIVERSAL_SUBSTITUTIONS: Record<string, Array<{
  substituteName: string;
  reason: 'availability' | 'cost' | 'nutritional' | 'allergen' | 'flavor' | 'quantity';
  confidence: number;
  costDifference: number; // Cost difference per unit (positive = more expensive, negative = cheaper)
  quantityAdjustment: number; // How much to use (1.0 = same amount, 0.8 = 80% of original)
  notes: string;
  impact: {
    taste: 'better' | 'similar' | 'worse' | 'different';
    texture: 'better' | 'similar' | 'worse' | 'different';
    nutrition: 'better' | 'similar' | 'worse' | 'different';
    cost: 'better' | 'similar' | 'worse' | 'different';
  };
  category: string; // For grouping similar ingredients
}>> = {
  // Chocolate and cocoa products
  'chocolate': [
    {
      substituteName: 'Cocoa Powder',
      reason: 'availability',
      confidence: 0.90,
      costDifference: -7.00, // Cocoa powder is much cheaper per lb
      quantityAdjustment: 0.4, // Use 40% of original amount (cocoa is more concentrated)
      notes: 'Cocoa powder provides chocolate flavor at a fraction of the cost. Use 40% of original amount.',
      impact: { taste: 'similar', texture: 'different', nutrition: 'better', cost: 'better' },
      category: 'chocolate'
    },
    {
      substituteName: 'Carob Powder',
      reason: 'availability',
      confidence: 0.85,
      costDifference: -6.00, // Carob is cheaper than chocolate
      quantityAdjustment: 1.0, // Use same amount
      notes: 'Carob powder is naturally sweet and caffeine-free. Good for those with chocolate allergies.',
      impact: { taste: 'similar', texture: 'similar', nutrition: 'better', cost: 'better' },
      category: 'chocolate'
    },
    {
      substituteName: 'Dark Chocolate',
      reason: 'cost',
      confidence: 0.95,
      costDifference: 3.00, // Dark chocolate is more expensive
      quantityAdjustment: 0.8, // Use 80% (more intense flavor)
      notes: 'Dark chocolate provides richer flavor with less sugar.',
      impact: { taste: 'better', texture: 'similar', nutrition: 'better', cost: 'worse' },
      category: 'chocolate'
    }
  ],
  'dark chocolate': [
    {
      substituteName: 'Chocolate',
      reason: 'cost',
      confidence: 0.90,
      costDifference: -3.00, // Regular chocolate is cheaper
      quantityAdjustment: 1.2, // Use 20% more for similar intensity
      notes: 'Regular chocolate is more affordable while maintaining good flavor.',
      impact: { taste: 'similar', texture: 'similar', nutrition: 'similar', cost: 'better' },
      category: 'chocolate'
    },
    {
      substituteName: 'Cocoa Powder',
      reason: 'cost',
      confidence: 0.85,
      costDifference: -10.00, // Much cheaper
      quantityAdjustment: 0.5, // Use 50% (more concentrated)
      notes: 'Cocoa powder provides intense chocolate flavor at much lower cost.',
      impact: { taste: 'similar', texture: 'different', nutrition: 'better', cost: 'better' },
      category: 'chocolate'
    }
  ],
  'cocoa powder': [
    {
      substituteName: 'Chocolate',
      reason: 'availability',
      confidence: 0.85,
      costDifference: 7.00, // Chocolate is more expensive
      quantityAdjustment: 2.5, // Use 2.5x more (chocolate is less concentrated)
      notes: 'Chocolate provides similar flavor but requires more quantity.',
      impact: { taste: 'similar', texture: 'better', nutrition: 'similar', cost: 'worse' },
      category: 'chocolate'
    }
  ],

  // Dairy products
  'milk': [
    {
      substituteName: 'Almond Milk',
      reason: 'allergen',
      confidence: 0.95,
      costDifference: 1.00, // Slightly more expensive
      quantityAdjustment: 1.0, // Same amount
      notes: 'Almond milk is dairy-free and suitable for lactose intolerance.',
      impact: { taste: 'similar', texture: 'similar', nutrition: 'better', cost: 'worse' },
      category: 'dairy'
    },
    {
      substituteName: 'Oat Milk',
      reason: 'allergen',
      confidence: 0.90,
      costDifference: 0.50, // Slightly more expensive
      quantityAdjustment: 1.0, // Same amount
      notes: 'Oat milk is creamy and works well in most recipes.',
      impact: { taste: 'similar', texture: 'similar', nutrition: 'similar', cost: 'worse' },
      category: 'dairy'
    },
    {
      substituteName: 'Soy Milk',
      reason: 'allergen',
      confidence: 0.85,
      costDifference: 0.25, // Slightly more expensive
      quantityAdjustment: 1.0, // Same amount
      notes: 'Soy milk is high in protein and dairy-free.',
      impact: { taste: 'similar', texture: 'similar', nutrition: 'better', cost: 'worse' },
      category: 'dairy'
    }
  ],
  'butter': [
    {
      substituteName: 'Olive Oil',
      reason: 'nutritional',
      confidence: 0.80,
      costDifference: -2.00, // Olive oil is cheaper
      quantityAdjustment: 0.75, // Use 75% (oil is more concentrated)
      notes: 'Olive oil provides healthy fats and works well in many recipes.',
      impact: { taste: 'different', texture: 'different', nutrition: 'better', cost: 'better' },
      category: 'fats'
    },
    {
      substituteName: 'Coconut Oil',
      reason: 'nutritional',
      confidence: 0.75,
      costDifference: 1.00, // Slightly more expensive
      quantityAdjustment: 0.8, // Use 80%
      notes: 'Coconut oil adds a subtle tropical flavor.',
      impact: { taste: 'different', texture: 'similar', nutrition: 'better', cost: 'worse' },
      category: 'fats'
    }
  ],

  // Berries and fruits
  'blueberries': [
    {
      substituteName: 'Strawberries',
      reason: 'availability',
      confidence: 0.95,
      costDifference: 0.50, // Strawberries are slightly more expensive
      quantityAdjustment: 1.0, // Same amount
      notes: 'Strawberries provide similar sweetness and texture.',
      impact: { taste: 'similar', texture: 'similar', nutrition: 'similar', cost: 'worse' },
      category: 'berries'
    },
    {
      substituteName: 'Raspberries',
      reason: 'availability',
      confidence: 0.90,
      costDifference: -0.20, // Raspberries are slightly cheaper
      quantityAdjustment: 1.0, // Same amount
      notes: 'Raspberries offer similar tartness and color.',
      impact: { taste: 'similar', texture: 'similar', nutrition: 'similar', cost: 'better' },
      category: 'berries'
    },
    {
      substituteName: 'Blackberries',
      reason: 'availability',
      confidence: 0.85,
      costDifference: 0.30, // Blackberries are slightly more expensive
      quantityAdjustment: 1.0, // Same amount
      notes: 'Blackberries provide similar flavor profile.',
      impact: { taste: 'similar', texture: 'similar', nutrition: 'similar', cost: 'worse' },
      category: 'berries'
    }
  ],
  'strawberries': [
    {
      substituteName: 'Raspberries',
      reason: 'availability',
      confidence: 0.90,
      costDifference: -0.70, // Raspberries are cheaper
      quantityAdjustment: 1.0, // Same amount
      notes: 'Raspberries provide similar sweetness and texture.',
      impact: { taste: 'similar', texture: 'similar', nutrition: 'similar', cost: 'better' },
      category: 'berries'
    }
  ],

  // Vanilla and flavorings
  'vanilla extract': [
    {
      substituteName: 'Vanilla Bean',
      reason: 'cost',
      confidence: 0.85,
      costDifference: 8.00, // Vanilla beans are much more expensive
      quantityAdjustment: 0.1, // Use 10% (much more concentrated)
      notes: 'Vanilla beans provide superior flavor but are expensive.',
      impact: { taste: 'better', texture: 'similar', nutrition: 'similar', cost: 'worse' },
      category: 'flavorings'
    },
    {
      substituteName: 'Vanilla Paste',
      reason: 'availability',
      confidence: 0.90,
      costDifference: 2.00, // Slightly more expensive
      quantityAdjustment: 0.8, // Use 80%
      notes: 'Vanilla paste includes vanilla bean specks for visual appeal.',
      impact: { taste: 'similar', texture: 'similar', nutrition: 'similar', cost: 'worse' },
      category: 'flavorings'
    }
  ],
  'premium vanilla extract': [
    {
      substituteName: 'Vanilla Extract',
      reason: 'cost',
      confidence: 0.95,
      costDifference: -8.00, // Regular vanilla is much cheaper
      quantityAdjustment: 1.0, // Same amount
      notes: 'Regular vanilla extract provides similar flavor at a fraction of the cost.',
      impact: { taste: 'similar', texture: 'similar', nutrition: 'similar', cost: 'better' },
      category: 'flavorings'
    }
  ],

  // Eggs
  'eggs': [
    {
      substituteName: 'Flax Seeds',
      reason: 'allergen',
      confidence: 0.80,
      costDifference: -1.00, // Flax seeds are cheaper
      quantityAdjustment: 0.25, // Use 25% (1 tbsp ground flax + 3 tbsp water per egg)
      notes: 'Mix 1 tbsp ground flax seeds with 3 tbsp water per egg. Let sit 5 minutes.',
      impact: { taste: 'similar', texture: 'different', nutrition: 'better', cost: 'better' },
      category: 'binders'
    },
    {
      substituteName: 'Chia Seeds',
      reason: 'allergen',
      confidence: 0.75,
      costDifference: 0.50, // Slightly more expensive
      quantityAdjustment: 0.25, // Use 25% (1 tbsp chia + 3 tbsp water per egg)
      notes: 'Mix 1 tbsp chia seeds with 3 tbsp water per egg. Let sit 10 minutes.',
      impact: { taste: 'similar', texture: 'different', nutrition: 'better', cost: 'worse' },
      category: 'binders'
    }
  ],

  // Flour
  'all-purpose flour': [
    {
      substituteName: 'Whole Wheat Flour',
      reason: 'nutritional',
      confidence: 0.85,
      costDifference: 0.50, // Slightly more expensive
      quantityAdjustment: 1.0, // Same amount
      notes: 'Whole wheat flour adds fiber and nutrients.',
      impact: { taste: 'different', texture: 'different', nutrition: 'better', cost: 'worse' },
      category: 'flour'
    },
    {
      substituteName: 'Gluten-Free Flour',
      reason: 'allergen',
      confidence: 0.90,
      costDifference: 2.00, // More expensive
      quantityAdjustment: 1.0, // Same amount
      notes: 'Gluten-free flour blend for those with celiac disease.',
      impact: { taste: 'similar', texture: 'different', nutrition: 'similar', cost: 'worse' },
      category: 'flour'
    }
  ],

  // Sugar
  'sugar': [
    {
      substituteName: 'Honey',
      reason: 'nutritional',
      confidence: 0.80,
      costDifference: 3.00, // Honey is more expensive
      quantityAdjustment: 0.75, // Use 75% (honey is sweeter)
      notes: 'Honey adds natural sweetness and flavor.',
      impact: { taste: 'better', texture: 'different', nutrition: 'better', cost: 'worse' },
      category: 'sweeteners'
    },
    {
      substituteName: 'Maple Syrup',
      reason: 'nutritional',
      confidence: 0.75,
      costDifference: 4.00, // Maple syrup is more expensive
      quantityAdjustment: 0.75, // Use 75%
      notes: 'Maple syrup provides rich, natural sweetness.',
      impact: { taste: 'better', texture: 'different', nutrition: 'better', cost: 'worse' },
      category: 'sweeteners'
    }
  ]
};

// Mock inventory data for availability scenarios
const MOCK_INVENTORY_STATUS: Record<string, { isAvailable: boolean; currentStock: number; reorderPoint: number }> = {
  'blueberries-1': { isAvailable: false, currentStock: 0, reorderPoint: 2 },
  'dark-chocolate-1': { isAvailable: true, currentStock: 0.1, reorderPoint: 1 },
  'strawberries-1': { isAvailable: true, currentStock: 5, reorderPoint: 2 },
  'raspberries-1': { isAvailable: true, currentStock: 3, reorderPoint: 1 },
  'milk-1': { isAvailable: true, currentStock: 10, reorderPoint: 2 },
  'almond-milk-1': { isAvailable: true, currentStock: 8, reorderPoint: 2 },
  // Add availability scenarios for common ingredients
  'chocolate-1': { isAvailable: false, currentStock: 0, reorderPoint: 1 }, // Out of stock
  'bananas-1': { isAvailable: true, currentStock: 2, reorderPoint: 1 },
  'crepe-batter-1': { isAvailable: true, currentStock: 5, reorderPoint: 2 }
};

// Legacy substitution rules (kept for backward compatibility)
const SUBSTITUTION_RULES: Record<string, Array<{
  substituteId: string;
  substituteName: string;
  reason: 'availability' | 'cost' | 'nutritional' | 'allergen' | 'flavor' | 'quantity';
  confidence: number;
  costDifference: number;
  quantityAdjustment: number;
  notes: string;
  impact: {
    taste: 'better' | 'similar' | 'worse' | 'different';
    texture: 'better' | 'similar' | 'worse' | 'different';
    nutrition: 'better' | 'similar' | 'worse' | 'different';
    cost: 'better' | 'similar' | 'worse' | 'different';
  };
}>> = {
  // This is now deprecated in favor of UNIVERSAL_SUBSTITUTIONS
};

// Flavor profile matching
const FLAVOR_PROFILES = {
  'sweet': ['honey', 'maple syrup', 'agave nectar', 'stevia', 'sugar'],
  'savory': ['salt', 'garlic', 'onion', 'herbs', 'spices'],
  'spicy': ['chili peppers', 'cayenne', 'paprika', 'black pepper'],
  'creamy': ['milk', 'cream', 'yogurt', 'coconut milk', 'cashew cream'],
  'nutty': ['almonds', 'walnuts', 'pecans', 'cashews', 'peanuts'],
  'citrusy': ['lemon', 'lime', 'orange', 'grapefruit'],
  'herbal': ['basil', 'oregano', 'thyme', 'rosemary', 'sage']
};

export function getSubstitutionSuggestions(recipe: Recipe, products: Product[]): SubstitutionSuggestion[] {
  const suggestions: SubstitutionSuggestion[] = [];

  recipe.ingredients.forEach(ingredient => {
    const product = products.find(p => p.id === ingredient.productId);
    if (!product) return;

    // Convert string quantity to number for calculations
    const quantity = typeof ingredient.quantity === 'string' ? parseFloat(ingredient.quantity) || 0 : ingredient.quantity;
    
    // Check availability
    const inventoryStatus = MOCK_INVENTORY_STATUS[ingredient.productId];
    if (inventoryStatus && !inventoryStatus.isAvailable) {
      // Add availability-based suggestions
      const availabilityRules = SUBSTITUTION_RULES[ingredient.productId]?.filter(rule => rule.reason === 'availability') || [];
      availabilityRules.forEach(rule => {
        const substituteProduct = products.find(p => p.id === rule.substituteId);
        if (substituteProduct) {
          suggestions.push({
            originalProductId: ingredient.productId,
            originalProductName: product.name,
            suggestedProductId: rule.substituteId,
            suggestedProductName: rule.substituteName,
            reason: 'availability',
            confidence: rule.confidence,
            costDifference: rule.costDifference,
            quantityAdjustment: rule.quantityAdjustment,
            notes: rule.notes,
            impact: rule.impact
          });
        }
      });
    }

    // Check cost optimization opportunities
    const costRules = SUBSTITUTION_RULES[ingredient.productId]?.filter(rule => rule.reason === 'cost') || [];
    costRules.forEach(rule => {
      const substituteProduct = products.find(p => p.id === rule.substituteId);
      if (substituteProduct && rule.costDifference < 0) { // Only suggest if it saves money
        suggestions.push({
          originalProductId: ingredient.productId,
          originalProductName: product.name,
          suggestedProductId: rule.substituteId,
          suggestedProductName: rule.substituteName,
          reason: 'cost',
          confidence: rule.confidence,
          costDifference: rule.costDifference,
          quantityAdjustment: rule.quantityAdjustment,
          notes: rule.notes,
          impact: rule.impact
        });
      }
    });

    // Check for quantity optimization
    if (quantity > 1) {
      suggestions.push({
        originalProductId: ingredient.productId,
        originalProductName: product.name,
        suggestedProductId: ingredient.productId,
        suggestedProductName: product.name,
        reason: 'quantity',
        confidence: 0.9,
        costDifference: -(quantity * product.cost * 0.9), // 10% reduction
        quantityAdjustment: 0.1,
        notes: `Reduce ${product.name} from ${quantity} ${ingredient.unit} to ${(quantity * 0.1).toFixed(2)} ${ingredient.unit} (${product.name} is typically used sparingly as a topping or filling)`,
        impact: { taste: 'similar', texture: 'similar', nutrition: 'better', cost: 'better' }
      });
    }
  });

  return suggestions;
}

export class SubstitutionEngine {
  private products: Product[];
  private recipes: Recipe[];

  constructor(products: Product[], recipes: Recipe[]) {
    this.products = products;
    this.recipes = recipes;
  }

  /**
   * Get substitution suggestions for a recipe based on availability and cost
   */
  getSubstitutionSuggestions(recipeId: string): SubstitutionSuggestion[] {
    let recipe = this.recipes.find(r => r.id === recipeId);
    
    // Handle temporary recipes (new recipes being created)
    if (!recipe && recipeId === 'temp-recipe') {
      // For temporary recipes, we'll return empty suggestions
      // The actual recipe data will be passed through the ingredients parameter
      return [];
    }
    
    if (!recipe) return [];
    
    const suggestions: SubstitutionSuggestion[] = [];
    
    recipe.ingredients.forEach(ingredient => {
      const product = this.products.find(p => p.id === ingredient.productId);
      if (!product) return;
      
      const productSuggestions = this.getSubstitutionSuggestionsForProduct(ingredient.productId, this.products);
      suggestions.push(...productSuggestions);
    });
    
    return suggestions;
  }

  getSubstitutionSuggestionsForProduct(productId: string, products: Product[], inventory?: InventoryItem[]): SubstitutionSuggestion[] {
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    const suggestions: SubstitutionSuggestion[] = [];
    
    // Get inventory data for this product
    const inventoryItem = inventory?.find(i => i.productId === productId);
    const actualStock = inventoryItem?.currentStock ?? product.currentStock;
    
    // Get product name for universal substitution lookup
    const productNameLower = product.name.toLowerCase();
    
    // Debug: Log product availability status
    console.log(`Checking availability for ${product.name}:`, {
      isAvailable: product.isAvailable,
      productCurrentStock: product.currentStock,
      inventoryCurrentStock: inventoryItem?.currentStock,
      actualStock: actualStock,
      productId: productId
    });
    
    // Check availability - handle negative stock values as out of stock
    const isOutOfStock = product.isAvailable === false || 
                        actualStock === 0 || 
                        (actualStock && actualStock < 0);
    
    console.log(`Availability check for ${product.name}:`, {
      isAvailable: product.isAvailable,
      actualStock: actualStock,
      isOutOfStock: isOutOfStock,
      hasInventoryData: !!inventoryItem
    });
    
    if (isOutOfStock) {
      console.log(`Product ${product.name} is out of stock, checking for availability substitutions...`);
      
      // Get availability rules based on product name (case-insensitive)
      const productNameLower = product.name.toLowerCase();
      let availabilityRules: any[] = [];
      
      // Use universal substitution database
      console.log(`Looking up substitutions for: ${product.name} (${productNameLower})`);
      
      // Find matching substitutions in the universal database
      const universalSubstitutions = UNIVERSAL_SUBSTITUTIONS[productNameLower] || [];
      console.log(`Found ${universalSubstitutions.length} universal substitutions for ${product.name}`);
      
      // Filter substitutions based on reason (availability, cost, etc.)
      const availabilitySubstitutions = universalSubstitutions.filter(sub => sub.reason === 'availability');
      const costSubstitutions = universalSubstitutions.filter(sub => sub.reason === 'cost');
      
      // Add availability substitutions
      availabilitySubstitutions.forEach(sub => {
        console.log(`Adding availability substitution: ${product.name} → ${sub.substituteName}`);
        availabilityRules.push({
          substituteId: `universal-${sub.substituteName.toLowerCase().replace(/\s+/g, '-')}`,
          substituteName: sub.substituteName,
          reason: 'availability',
          confidence: sub.confidence,
          costDifference: sub.costDifference,
          quantityAdjustment: sub.quantityAdjustment,
          notes: sub.notes,
          impact: sub.impact
        });
      });
      
      // Add cost optimization substitutions (only if product is expensive)
      if (product.cost > 10) { // Consider products over $10 as expensive
        costSubstitutions.forEach(sub => {
          console.log(`Adding cost optimization substitution: ${product.name} → ${sub.substituteName}`);
          availabilityRules.push({
            substituteId: `universal-${sub.substituteName.toLowerCase().replace(/\s+/g, '-')}`,
            substituteName: sub.substituteName,
            reason: 'cost',
            confidence: sub.confidence,
            costDifference: sub.costDifference,
            quantityAdjustment: sub.quantityAdjustment,
            notes: sub.notes,
            impact: sub.impact
          });
        });
      }
      
      console.log(`Found ${availabilityRules.length} availability rules for ${product.name}:`, availabilityRules);
      availabilityRules.forEach(rule => {
        const substituteProduct = products.find(p => p.id === rule.substituteId);
        if (substituteProduct) {
          console.log(`Found availability substitution: ${product.name} → ${substituteProduct.name}`);
          suggestions.push({
            originalProductId: productId,
            originalProductName: product.name,
            suggestedProductId: rule.substituteId,
            suggestedProductName: rule.substituteName,
            reason: 'availability',
            confidence: rule.confidence,
            costDifference: rule.costDifference,
            quantityAdjustment: rule.quantityAdjustment,
            notes: rule.notes,
            impact: rule.impact
          });
        } else {
          console.log(`Substitute product not found: ${rule.substituteId}`);
        }
      });
    } else {
      console.log(`Product ${product.name} is in stock (isAvailable: ${product.isAvailable}, actualStock: ${actualStock})`);
    }

    // Check cost optimization using universal database
    const costSubstitutions = UNIVERSAL_SUBSTITUTIONS[productNameLower]?.filter(sub => sub.reason === 'cost') || [];
    costSubstitutions.forEach(sub => {
      if (sub.costDifference < 0) { // Only suggest cheaper alternatives
        suggestions.push({
          originalProductId: productId,
          originalProductName: product.name,
          suggestedProductId: `universal-${sub.substituteName.toLowerCase().replace(/\s+/g, '-')}`,
          suggestedProductName: sub.substituteName,
          reason: 'cost',
          confidence: sub.confidence,
          costDifference: sub.costDifference,
          quantityAdjustment: sub.quantityAdjustment,
          notes: sub.notes,
          impact: sub.impact
        });
      }
    });

    return suggestions;
  }

  // Get real product data with caching
  private async getCachedProductData(productName: string): Promise<RealProductData | null> {
    const cacheKey = productName.toLowerCase();
    const cached = productDataCache.get(cacheKey);
    
    // Check if cache is still valid
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`Using cached data for ${productName}`);
      return cached.data;
    }
    
    // Fetch fresh data
    console.log(`Fetching fresh data for ${productName}`);
    const realData = await ProductDataAPI.getRealProductData(productName);
    
    if (realData) {
      productDataCache.set(cacheKey, { data: realData, timestamp: Date.now() });
      console.log(`Cached real data for ${productName}:`, realData);
    }
    
    return realData;
  }

  // Calculate cost difference using real product data
  private async calculateRealCostDifference(originalProduct: Product, substituteProductName: string, quantityAdjustment: number): Promise<number> {
    // Get real data for substitute product
    const realSubstituteData = await this.getCachedProductData(substituteProductName);
    
    if (!realSubstituteData) {
      console.log(`No real data found for substitute: ${substituteProductName}`);
      return 0;
    }
    
    // Calculate cost per unit for original product
    const originalCostPerUnit = originalProduct.cost / (originalProduct.packageSize || 1);
    
    // Use real pricing for substitute product
    const substituteCostPerUnit = realSubstituteData.typicalPrice / (realSubstituteData.packageSize || 1);
    
    // Calculate adjusted cost considering quantity adjustment
    const adjustedSubstituteCost = substituteCostPerUnit * quantityAdjustment;
    
    // Cost difference (negative = cheaper, positive = more expensive)
    const costDifference = adjustedSubstituteCost - originalCostPerUnit;
    
    console.log(`Real cost calculation for ${originalProduct.name} → ${substituteProductName}:`);
    console.log(`  Original: $${originalCostPerUnit.toFixed(2)}/unit (from your inventory)`);
    console.log(`  Substitute: $${substituteCostPerUnit.toFixed(2)}/unit (from ${realSubstituteData.source}) × ${quantityAdjustment} = $${adjustedSubstituteCost.toFixed(2)}/unit`);
    console.log(`  Cost difference: $${costDifference.toFixed(2)}`);
    console.log(`  Data source: ${realSubstituteData.source} (updated: ${new Date(realSubstituteData.lastUpdated).toLocaleDateString()})`);
    
    return costDifference;
  }

  // Get realistic substitution suggestions with real pricing data
  async getRealisticSubstitutionSuggestions(productId: string, products: Product[], inventory?: InventoryItem[]): Promise<SubstitutionSuggestion[]> {
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    const suggestions: SubstitutionSuggestion[] = [];
    const productNameLower = product.name.toLowerCase();
    
    // Get inventory data for this product
    const inventoryItem = inventory?.find(i => i.productId === productId);
    const actualStock = inventoryItem?.currentStock ?? product.currentStock;
    
    // Check if product is out of stock
    const isOutOfStock = product.isAvailable === false || 
                        actualStock === 0 || 
                        (actualStock && actualStock < 0);
    
    console.log(`Getting realistic substitutions for ${product.name} (out of stock: ${isOutOfStock})`);
    
    // Get universal substitution rules
    const universalSubstitutions = UNIVERSAL_SUBSTITUTIONS[productNameLower] || [];
    
    // Process each substitution rule with real data
    for (const sub of universalSubstitutions) {
      // Calculate dynamic cost difference using real data
      const realCostDifference = await this.calculateRealCostDifference(product, sub.substituteName, sub.quantityAdjustment);
      
      // Get real product data for additional info
      const realData = await this.getCachedProductData(sub.substituteName);
      
      // Categorize suggestions more intelligently
      let shouldAdd = false;
      let actualReason = sub.reason;
      
      if (sub.reason === 'availability' && isOutOfStock) {
        // Only show as availability if it's truly about availability, not cost
        if (realCostDifference >= 0) {
          // If substitute is more expensive, it's purely for availability
          shouldAdd = true;
          actualReason = 'availability';
          console.log(`Adding availability substitution: ${product.name} → ${sub.substituteName} (purely for availability)`);
        } else {
          // If substitute is cheaper, it's both availability AND cost optimization
          shouldAdd = true;
          actualReason = 'availability';
          console.log(`Adding availability substitution: ${product.name} → ${sub.substituteName} (availability + cost savings)`);
        }
      } else if (sub.reason === 'cost' && !isOutOfStock) {
        // Only show cost optimization if original is in stock and substitute is actually cheaper
        if (realCostDifference < 0) {
          shouldAdd = true;
          actualReason = 'cost';
          console.log(`Adding cost optimization substitution: ${product.name} → ${sub.substituteName} (saves $${Math.abs(realCostDifference).toFixed(2)})`);
        }
      }
      
      if (shouldAdd) {
                  // Dynamically calculate impact based on real cost difference
          const dynamicImpact = {
            ...sub.impact,
            cost: realCostDifference < 0 ? 'better' as const : realCostDifference > 0 ? 'worse' as const : 'similar' as const
          };
        
        suggestions.push({
          originalProductId: productId,
          originalProductName: product.name,
          suggestedProductId: `real-${sub.substituteName.toLowerCase().replace(/\s+/g, '-')}`,
          suggestedProductName: sub.substituteName,
          reason: actualReason,
          confidence: sub.confidence,
          costDifference: realCostDifference, // Use real calculated cost difference
          quantityAdjustment: sub.quantityAdjustment,
          notes: `${sub.notes} (Real cost difference: $${realCostDifference.toFixed(2)}. Data source: ${realData?.source || 'Market data'})`,
          impact: dynamicImpact
        });
      }
    }
    
    return suggestions;
  }

  getQuantityOptimizationSuggestions(ingredients: RecipeIngredient[], servings: number): SubstitutionSuggestion[] {
    const suggestions: SubstitutionSuggestion[] = [];

    ingredients.forEach(ingredient => {
      // Convert string quantity to number for calculations
      const quantity = typeof ingredient.quantity === 'string' ? parseFloat(ingredient.quantity) || 0 : ingredient.quantity;
      
      // Find the actual product to get its name and cost
      const product = this.products.find(p => p.id === ingredient.productId);
      if (!product) return;
      
      // Check for excessive quantities based on ingredient type
      let isExcessive = false;
      let suggestedQuantity = quantity;
      let reason = '';
      
      // Chocolate is typically used sparingly (0.1-0.2 lb per serving)
      if (product.name.toLowerCase().includes('chocolate')) {
        if (quantity > 0.2) {
          isExcessive = true;
          suggestedQuantity = 0.1;
          reason = 'Chocolate is typically used sparingly as a topping or filling';
        }
      }
      // Sugar is typically used moderately (0.1-0.3 lb per serving)
      else if (product.name.toLowerCase().includes('sugar')) {
        if (quantity > 0.3) {
          isExcessive = true;
          suggestedQuantity = 0.2;
          reason = 'Sugar should be used moderately for balanced sweetness';
        }
      }
      // Butter is typically used moderately (0.1-0.2 lb per serving)
      else if (product.name.toLowerCase().includes('butter')) {
        if (quantity > 0.2) {
          isExcessive = true;
          suggestedQuantity = 0.15;
          reason = 'Butter adds richness but should be used in moderation';
        }
      }
      // General rule: if quantity > 0.5 lb per serving, it's likely excessive
      else if (quantity > 0.5) {
        isExcessive = true;
        suggestedQuantity = quantity * 0.3; // Reduce by 70%
        reason = 'This quantity seems excessive for a single serving';
      }
      
      if (isExcessive) {
        const costPerUnit = product.cost / (product.packageSize || 1);
        const costSavings = (quantity - suggestedQuantity) * costPerUnit;
        
        suggestions.push({
          originalProductId: ingredient.productId,
          originalProductName: product.name,
          suggestedProductId: ingredient.productId,
          suggestedProductName: product.name,
          reason: 'quantity',
          confidence: 0.9,
          costDifference: -costSavings,
          quantityAdjustment: suggestedQuantity / quantity,
          notes: `Reduce ${product.name} from ${quantity} ${ingredient.unit} to ${suggestedQuantity.toFixed(2)} ${ingredient.unit} (${reason})`,
          impact: { taste: 'similar', texture: 'similar', nutrition: 'better', cost: 'better' }
        });
      }
    });

    return suggestions;
  }

  private processSubstitutionRules(product: Product, rules: any[]): SubstitutionSuggestion[] {
    // This function is no longer needed with the new structure
    return [];
  }

  private getFlavorProfile(product: Product): string[] {
    return product.flavorProfile || [];
  }

  private getNutritionalInfo(product: Product) {
    return product.nutritionalInfo || {};
  }

  private getAllergens(product: Product): string[] {
    return product.allergens || [];
  }
}
