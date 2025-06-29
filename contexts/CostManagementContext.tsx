"use client"

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef, useState } from 'react';
import { Product, Recipe, Expense, InventoryItem, SalesRecord } from '@/lib/types';

interface CostManagementState {
  products: Product[];
  recipes: Recipe[];
  expenses: Expense[];
  inventory: InventoryItem[];
  sales: SalesRecord[];
}

type CostManagementAction =
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_RECIPE'; payload: Recipe }
  | { type: 'UPDATE_RECIPE'; payload: Recipe }
  | { type: 'DELETE_RECIPE'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'UPDATE_INVENTORY'; payload: InventoryItem }
  | { type: 'DELETE_INVENTORY'; payload: string }
  | { type: 'ADD_SALE'; payload: SalesRecord }
  | { type: 'UPDATE_SALE'; payload: SalesRecord }
  | { type: 'DELETE_SALE'; payload: string }
  | { type: 'SYNC_STATE'; payload: CostManagementState };

const initialState: CostManagementState = {
  products: [],
  recipes: [],
  expenses: [],
  inventory: [],
  sales: [],
};

const CostManagementContext = createContext<{
  state: CostManagementState;
  dispatch: React.Dispatch<CostManagementAction>;
} | undefined>(undefined);

const EditingContext = createContext<{ isEditing: boolean; setIsEditing: (v: boolean) => void }>({ isEditing: false, setIsEditing: () => {} });

function costManagementReducer(state: CostManagementState, action: CostManagementAction): CostManagementState {
  switch (action.type) {
    case 'ADD_PRODUCT': {
      // Add product and initialize inventory for it
      const newProduct = action.payload;
      const initialStock = newProduct.quantity * (newProduct.unitsPerPackage || 1);
      const newInventoryItem = {
        productId: newProduct.id,
        currentStock: initialStock,
        unit: newProduct.unit,
        reorderPoint: 0,
        lastUpdated: new Date(),
        stockHistory: [{ date: new Date().toISOString(), stock: initialStock }],
      };
      return {
        ...state,
        products: [...state.products, newProduct],
        inventory: [...state.inventory, newInventoryItem],
      };
    }
    case 'UPDATE_PRODUCT': {
      // Update product as before
      const updatedProducts = state.products.map((p) => {
        if (p.id === action.payload.id) {
          let priceHistory = p.priceHistory || [];
          if (p.cost !== action.payload.cost) {
            priceHistory = [...priceHistory, { date: new Date().toISOString(), price: action.payload.cost }];
          }
          return { ...action.payload, priceHistory };
        }
        return p;
      });
      // Check for sales/usage for this product
      const hasSales = state.sales.some(sale => {
        // Find all recipes that use this product as an ingredient
        const recipe = state.recipes.find(r => r.id === sale.recipeId);
        return recipe && recipe.ingredients.some(ing => ing.productId === action.payload.id);
      });
      // If no sales/usage, update inventory to match new product quantity
      let updatedInventory = state.inventory;
      if (!hasSales) {
        const inventoryExists = state.inventory.some(inv => inv.productId === action.payload.id);
        const newStock = action.payload.quantity * (action.payload.unitsPerPackage || 1);
        if (inventoryExists) {
          updatedInventory = state.inventory.map((inv) => {
            if (inv.productId === action.payload.id) {
              return {
                ...inv,
                currentStock: newStock,
                unit: action.payload.unit,
                stockHistory: [...(inv.stockHistory || []), { date: new Date().toISOString(), stock: newStock }],
                lastUpdated: new Date(),
              };
            }
            return inv;
          });
        } else {
          updatedInventory = [
            ...state.inventory,
            {
              productId: action.payload.id,
              currentStock: newStock,
              unit: action.payload.unit,
              reorderPoint: 0,
              lastUpdated: new Date(),
              stockHistory: [{ date: new Date().toISOString(), stock: newStock }],
            },
          ];
        }
      }
      return {
        ...state,
        products: updatedProducts,
        inventory: updatedInventory,
      };
    }
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case 'ADD_RECIPE': {
      // Calculate initial cost for costHistory
      const getRecipeCost = (recipe: Recipe, products: Product[]) => {
        return recipe.ingredients.reduce((sum, ingredient) => {
          const product = products.find((p) => p.id === ingredient.productId);
          if (!product) return sum;
          let ingredientCost = 0;
          if (ingredient.unit === 'count' && product.unitsPerPackage) {
            const costPerUnit = product.cost / product.unitsPerPackage;
            ingredientCost = costPerUnit * ingredient.quantity;
          } else {
            const costPerBaseUnit = product.cost / product.packageSize;
            ingredientCost = costPerBaseUnit * ingredient.quantity;
          }
          return sum + ingredientCost;
        }, 0);
      };
      const initialCost = getRecipeCost(action.payload, state.products);
      return {
        ...state,
        recipes: [
          ...state.recipes,
          {
            ...action.payload,
            costHistory: [{ date: new Date().toISOString(), cost: initialCost }],
            salesHistory: [],
          },
        ],
      };
    }
    case 'UPDATE_RECIPE': {
      const getRecipeCost = (recipe: Recipe, products: Product[]) => {
        return recipe.ingredients.reduce((sum, ingredient) => {
          const product = products.find((p) => p.id === ingredient.productId);
          if (!product) return sum;
          let ingredientCost = 0;
          if (ingredient.unit === 'count' && product.unitsPerPackage) {
            const costPerUnit = product.cost / product.unitsPerPackage;
            ingredientCost = costPerUnit * ingredient.quantity;
          } else {
            const costPerBaseUnit = product.cost / product.packageSize;
            ingredientCost = costPerBaseUnit * ingredient.quantity;
          }
          return sum + ingredientCost;
        }, 0);
      };
      return {
        ...state,
        recipes: state.recipes.map((r) => {
          if (r.id === action.payload.id) {
            const prevCostHistory = r.costHistory || [];
            const prevCost = prevCostHistory.length > 0 ? prevCostHistory[prevCostHistory.length - 1].cost : undefined;
            const newCost = getRecipeCost(action.payload, state.products);
            let costHistory = prevCostHistory;
            if (prevCost === undefined || newCost !== prevCost) {
              costHistory = [...prevCostHistory, { date: new Date().toISOString(), cost: newCost }];
            }
            return {
              ...action.payload,
              costHistory,
              salesHistory: r.salesHistory ? r.salesHistory.map(s => ({ ...s, date: typeof s.date === 'string' ? s.date : s.date.toISOString() })) : [],
            };
          }
          return r;
        }),
      };
    }
    case 'DELETE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.filter((r) => r.id !== action.payload),
      };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) => (e.id === action.payload.id ? action.payload : e)),
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.payload),
      };
    case 'UPDATE_INVENTORY': {
      const existing = state.inventory.find(i => i.productId === action.payload.productId);
      if (existing) {
        let stockHistory = existing.stockHistory || [];
        if (existing.currentStock !== action.payload.currentStock) {
          stockHistory = [...stockHistory, { date: new Date().toISOString(), stock: action.payload.currentStock }];
        }
        return {
          ...state,
          inventory: state.inventory.map(i =>
            i.productId === action.payload.productId ? { ...action.payload, stockHistory } : i
          ),
        };
      } else {
        return {
          ...state,
          inventory: [...state.inventory, { ...action.payload, stockHistory: [{ date: new Date().toISOString(), stock: action.payload.currentStock }] }],
        };
      }
    }
    case 'DELETE_INVENTORY':
      return {
        ...state,
        inventory: state.inventory.filter((i) => i.productId !== action.payload),
      };
    case 'ADD_SALE': {
      const newSales = [...state.sales, action.payload];
      return {
        ...state,
        sales: newSales,
        recipes: state.recipes.map((r) => {
          if (r.id === action.payload.recipeId) {
            const salesHistory = r.salesHistory || [];
            return {
              ...r,
              salesHistory: [
                ...salesHistory.map(s => ({ ...s, date: typeof s.date === 'string' ? s.date : s.date.toISOString() })),
                { date: typeof action.payload.date === 'string' ? action.payload.date : new Date(action.payload.date).toISOString(), quantity: action.payload.quantity },
              ],
            };
          }
          return r;
        }),
      };
    }
    case 'UPDATE_SALE':
      return {
        ...state,
        sales: state.sales.map((s) => (s.id === action.payload.id ? action.payload : s)),
      };
    case 'DELETE_SALE':
      return {
        ...state,
        sales: state.sales.filter((s) => s.id !== action.payload),
      };
    case 'SYNC_STATE':
      return { ...action.payload };
    default:
      return state;
  }
}

const LOCAL_STORAGE_KEY = 'costManagementState';

export function CostManagementProvider({ children }: { children: ReactNode }) {
  const getInitialState = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return initialState;
        }
      }
    }
    return initialState;
  };

  const [state, dispatch] = useReducer(costManagementReducer, initialState, getInitialState);
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = useRef(isEditing);
  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);

  // Persist to localStorage on every state change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Listen for storage events to sync across tabs (seamless, with warning if editing)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          if (JSON.stringify(newState) !== JSON.stringify(state)) {
            if (isEditingRef.current) {
              if (window.confirm('You have unsaved changes. Syncing data from another tab will overwrite your local changes. Continue?')) {
                dispatch({ type: 'SYNC_STATE', payload: newState });
                setIsEditing(false);
              }
            } else {
              dispatch({ type: 'SYNC_STATE', payload: newState });
            }
          }
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [state]);

  return (
    <CostManagementContext.Provider value={{ state, dispatch }}>
      <EditingContext.Provider value={{ isEditing, setIsEditing }}>
        {children}
      </EditingContext.Provider>
    </CostManagementContext.Provider>
  );
}

export function useCostManagement() {
  const context = useContext(CostManagementContext);
  if (context === undefined) {
    throw new Error('useCostManagement must be used within a CostManagementProvider');
  }
  return context;
}

export function useEditing() {
  return useContext(EditingContext);
} 