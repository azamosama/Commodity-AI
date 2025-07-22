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
}

export interface RecipeIngredient {
  productId: string;
  quantity: number;
  unit: string;
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
  recipeId: string;
  quantity: number;
  date: string;
  price: number;
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