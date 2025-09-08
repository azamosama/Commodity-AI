export interface Product {
  id: string;
  name: string;
  quantity: number;
  initialQuantity?: number;
  unit: string;
  packageSize: number;
  packageUnit: string;
  cost: number;
  category: ProductCategory;
  categoryType: CategoryType;
  supplier?: string;
  unitsPerPackage?: number;
  packsPerCase?: number;
  unitsPerPack?: number;
  priceHistory?: { date: string; price: number; packageSize?: number; quantity?: number }[];
  restockHistory?: { date: string; quantity: number; cost: number }[];
  // New fields for AI substitution
  substitutes?: string[]; // Array of product IDs that can substitute this product
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  allergens?: string[]; // Array of allergens (e.g., ["dairy", "nuts", "gluten"])
  flavorProfile?: string[]; // Array of flavor characteristics (e.g., ["sweet", "savory", "spicy"])
  // Availability fields for testing scenarios
  isAvailable?: boolean;
  currentStock?: number;
  reorderPoint?: number;
  // Predictive analytics fields
  safetyStock?: number;
  leadTime?: number; // in days
  autoRestockEnabled?: boolean;
  forecastAccuracy?: number; // percentage
  lastForecastDate?: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  servings: number;
  servingSize: number;
  servingUnit: string;
  instructions?: string;
  costHistory?: { date: string; cost: number }[];
  salesHistory?: { date: string; quantity: number }[];
  // New fields for advanced features
  preparationSteps?: PreparationStep[];
  totalYieldPercentage?: number; // Overall recipe yield percentage
  totalLossPercentage?: number; // Overall recipe loss percentage
  difficulty?: 'easy' | 'medium' | 'hard';
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  tags?: string[]; // e.g., ["vegetarian", "gluten-free", "quick-prep"]
}

export interface RecipeIngredient {
  productId: string;
  quantity: number | string;
  unit: string;
  // New fields for advanced features
  yieldPercentage?: number | string; // How much of the ingredient is usable after prep (0-100)
  lossPercentage?: number | string; // How much is lost during prep (0-100)
  preparationNotes?: string; // Specific prep instructions for this ingredient
  isOptional?: boolean; // Whether this ingredient can be omitted
  substitutionGroup?: string; // Group for substitution logic (e.g., "dairy", "sweetener")
}

export interface PreparationStep {
  id: string;
  stepNumber: number;
  description: string;
  duration?: number; // in minutes
  temperature?: number; // in degrees
  equipment?: string[]; // Required equipment
  ingredients?: string[]; // Ingredients used in this step
  notes?: string; // Additional notes
}

// New interface for AI substitution suggestions
export interface SubstitutionSuggestion {
  originalProductId: string;
  originalProductName: string;
  suggestedProductId: string;
  suggestedProductName: string;
  reason: 'availability' | 'cost' | 'nutritional' | 'allergen' | 'flavor' | 'quantity';
  confidence: number; // 0-1 confidence score
  costDifference: number; // Positive = more expensive, negative = cheaper
  quantityAdjustment: number; // How much to adjust the quantity
  notes: string; // Explanation of the substitution
  impact: {
    taste: 'better' | 'similar' | 'worse' | 'different';
    texture: 'better' | 'similar' | 'worse' | 'different';
    nutrition: 'better' | 'similar' | 'worse' | 'different';
    cost: 'better' | 'similar' | 'worse' | 'different';
  };
}

// New interface for ingredient availability
export interface IngredientAvailability {
  productId: string;
  productName: string;
  isAvailable: boolean;
  currentStock: number;
  reorderPoint: number;
  daysUntilRestock?: number;
  alternativeSuppliers?: {
    supplierId: string;
    supplierName: string;
    price: number;
    deliveryTime: number; // in days
  }[];
}

export interface InventoryItem {
  productId: string;
  currentStock: number;
  unit: string;
  reorderPoint: number;
  lastUpdated: string;
  stockHistory: { date: string; stock: number; source?: string }[];
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  date: Date;
  recurring: boolean;
  frequency?: 'monthly' | 'weekly' | 'daily';
}

export interface SalesRecord {
  id: string;
  recipeName: string;
  quantity: number;
  date: string;
  salePrice: number;
}

export type ProductCategory = 'Food' | 'Non-Food';
export type CategoryType = 'Fresh Food' | 'Produce' | 'Dry Goods' | 'Dairy' | 'Meat' | 'Beverages' | 'Supplies' | 'Equipment';
export type ExpenseCategory = 'Utilities' | 'Rent' | 'Labor' | 'Marketing' | 'Other';

export interface CostAnalysis {
  totalCost: number;
  costPerServing: number;
  suggestedPrice: number;
  profitMargin: number;
  breakevenPoint: number;
  markupStrategies?: {
    conservative: number;
    standard: number;
    premium: number;
    luxury: number;
  };
  suggestedPrices?: {
    conservative: number;
    standard: number;
    premium: number;
    luxury: number;
  };
  profitMargins?: {
    conservative: number;
    standard: number;
    premium: number;
    luxury: number;
  };
  marketAnalysis?: {
    competitivePosition: string;
    seasonalPricing: string;
    trendAlignment: string;
    costEfficiency: string;
  };
}

export interface CostSavingRecommendation {
  productId: string;
  currentCost: number;
  suggestedOption: {
    supplier: string;
    packageSize: number;
    unitCost: number;
    potentialSavings: number;
  };
} 

// New types for Predictive Analytics

export interface SalesForecast {
  id: string;
  recipeId: string;
  recipeName: string;
  date: string;
  predictedQuantity: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  modelType: 'prophet' | 'arima' | 'regression';
  accuracy: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryForecast {
  id: string;
  productId: string;
  productName: string;
  date: string;
  predictedStock: number;
  depletionDate?: string;
  reorderDate?: string;
  suggestedOrderQuantity: number;
  confidenceLevel: number;
  modelType: 'prophet' | 'arima' | 'regression';
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  createdAt: string;
  expectedDelivery: string;
  actualDeliveryDate?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity?: number;
  receivedAt?: string;
}

export interface RestockingDecision {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  safetyStock: number;
  averageDailyUsage: number;
  daysUntilDepletion: number;
  suggestedOrderQuantity: number;
  urgency: 'low' | 'medium' | 'high';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Anomaly {
  id: string;
  type: 'waste' | 'theft' | 'over_portioning' | 'sales_anomaly' | 'inventory_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  title: string;
  description: string;
  impact: 'cost' | 'efficiency' | 'quality' | 'safety';
  affectedItems: string[]; // Product/recipe IDs
  metrics: {
    expected: number;
    actual: number;
    deviation: number;
    zScore: number;
  };
  costImpact?: number;
  suggestedActions: string[];
  detectedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WasteLog {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: 'spoilage' | 'over_portioning' | 'expired' | 'damaged' | 'other';
  cost: number;
  date: string;
  reportedBy: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  apiEndpoint?: string;
  apiKey?: string;
  leadTime: number; // in days
  minimumOrder: number;
  paymentTerms: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastingModel {
  id: string;
  name: string;
  type: 'sales' | 'inventory' | 'waste';
  algorithm: 'prophet' | 'arima' | 'regression' | 'lstm';
  parameters: Record<string, any>;
  accuracy: number;
  lastTrained: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  type: 'email' | 'sms' | 'push' | 'webhook';
  recipient: string;
  title: string;
  message: string;
  anomalyId?: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  totalSales: number;
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  profitMargin: number;
  anomaliesDetected: number;
  restockingDecisions: number;
  autoOrdersGenerated: number;
  forecastAccuracy: number;
  topPerformingItems: Array<{
    recipeId: string;
    recipeName: string;
    sales: number;
    revenue: number;
    profit: number;
  }>;
  lowStockItems: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    daysUntilDepletion: number;
  }>;
  wasteSummary: {
    totalWaste: number;
    totalCost: number;
    topWasteItems: Array<{
      productId: string;
      productName: string;
      wasteQuantity: number;
      wasteCost: number;
    }>;
  };
  createdAt: string;
}

// Configuration types
export interface RestockingConfig {
  productId: string;
  autoRestockEnabled: boolean;
  safetyStockLevel: number;
  reorderPoint: number;
  leadTime: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity?: number;
  supplierId: string;
  costThreshold?: number; // Maximum cost for auto-orders
  updatedAt: string;
}

export interface AnomalyConfig {
  type: string;
  enabled: boolean;
  thresholds: {
    zScoreThreshold: number;
    percentageThreshold: number;
    minimumDeviation: number;
  };
  alertChannels: ('email' | 'sms' | 'push')[];
  recipients: string[];
  updatedAt: string;
}

export interface ForecastingConfig {
  modelType: 'prophet' | 'arima' | 'regression';
  forecastHorizon: number; // days
  confidenceLevel: number;
  updateFrequency: 'daily' | 'weekly' | 'monthly';
  retrainFrequency: 'weekly' | 'monthly' | 'quarterly';
  parameters: Record<string, any>;
  updatedAt: string;
} 