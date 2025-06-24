export interface Product {
  id: string;
  name: string;
  quantity: number;
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
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  servings: number;
  servingSize: number;
  servingUnit: string;
  instructions?: string;
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
  lastUpdated: Date;
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
  date: Date;
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