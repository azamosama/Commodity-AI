"use client"

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef, useState } from 'react';
import { Product, Recipe, Expense, InventoryItem, SalesRecord } from '@/lib/types';
import { calculateTotalUnits } from '@/lib/utils';

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

// Helper to recalculate inventory from scratch
function recalculateInventory(state: CostManagementState): InventoryItem[] {
  // Start with initial stock for each product
  const inventoryMap: Record<string, InventoryItem & { stockHistory: { date: string; stock: number }[] }> = {};
  state.products.forEach(product => {
    // Use initialQuantity as denominator, and sum of restocks for numerator
    const initialQty = typeof product.initialQuantity === 'number' ? product.initialQuantity : (typeof product.quantity === 'number' ? product.quantity : 0);
    const totalRestocked = Array.isArray(product.restockHistory)
      ? product.restockHistory.reduce((sum, r) => sum + (r.quantity || 0), 0)
      : 0;
    const startingStock = initialQty + totalRestocked;
    // Set initial stock at T00:00:00.000Z
    const initialDate = new Date(new Date().toISOString().slice(0,10) + 'T00:00:00.000Z').toISOString();
    inventoryMap[product.id] = {
      productId: product.id,
      currentStock: startingStock,
      unit: product.unit,
      reorderPoint: 0,
      lastUpdated: initialDate,
      stockHistory: [{ date: initialDate, stock: startingStock }] as { date: string; stock: number }[],
      // Optionally, you can add initialQuantity here for UI reference
      // initialQuantity: initialQty,
    };
  });
  // Subtract usage for all sales
  state.sales.forEach(sale => {
    const recipe = state.recipes.find(r => r.id === sale.recipeId);
    if (!recipe) return;
    recipe.ingredients.forEach(ingredient => {
      const product = state.products.find(p => p.id === ingredient.productId);
      if (!product) return;
      let usage = 0;
      if ((product.unit === 'count' || product.unit === 'pieces' || product.unit === 'units') && product.unitsPerPackage) {
        usage = ingredient.quantity * sale.quantity;
      } else if (product.packageSize) {
        usage = ingredient.quantity * sale.quantity;
      }
      if (inventoryMap[product.id]) {
        inventoryMap[product.id].currentStock -= usage;
        // Set sale at T12:00:00.000Z on sale date
        const saleDate = new Date(new Date(getDateString(sale.date)).toISOString().slice(0,10) + 'T12:00:00.000Z').toISOString();
        inventoryMap[product.id].lastUpdated = saleDate;
        if (Array.isArray(inventoryMap[product.id].stockHistory)) {
          (inventoryMap[product.id].stockHistory as { date: string; stock: number }[]).push({ date: saleDate, stock: inventoryMap[product.id].currentStock });
        }
      }
    });
  });
  return Object.values(inventoryMap);
}

function getDateString(date: unknown): string {
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return String(date);
}

function costManagementReducer(state: CostManagementState, action: CostManagementAction): CostManagementState {
  switch (action.type) {
    case 'ADD_PRODUCT': {
      const newProducts = [...state.products, action.payload];
      return {
        ...state,
        products: newProducts,
        inventory: recalculateInventory({ ...state, products: newProducts }),
      };
    }
    case 'UPDATE_PRODUCT': {
      const prevProduct = state.products.find((p) => p.id === action.payload.id);
      // Determine priceHistory logic
      let updatedPriceHistory = action.payload.priceHistory;
      let resetInventory = false;
      let resetQuantity = action.payload.quantity;
      let resetDate = new Date().toISOString();
      if (prevProduct) {
        const lastPrice = Array.isArray(prevProduct.priceHistory) && prevProduct.priceHistory.length > 0
          ? prevProduct.priceHistory[prevProduct.priceHistory.length - 1].price
          : prevProduct.cost;
        if (action.payload.cost !== lastPrice) {
          let effectiveDate = new Date().toISOString();
          if (Array.isArray(action.payload.priceHistory) && action.payload.priceHistory.length > 0) {
            effectiveDate = action.payload.priceHistory[action.payload.priceHistory.length - 1].date;
          }
          updatedPriceHistory = [
            ...(Array.isArray(prevProduct.priceHistory) ? prevProduct.priceHistory : []),
            {
              date: effectiveDate,
              price: action.payload.cost,
              packageSize: action.payload.packageSize,
              quantity: action.payload.quantity,
            },
          ];
        } else {
          updatedPriceHistory = prevProduct.priceHistory;
        }
        // If quantity changed, reset inventory for this product
        if (action.payload.quantity !== prevProduct.quantity) {
          resetInventory = true;
          resetQuantity = action.payload.quantity;
          // Use the effective date for the reset if available
          if (Array.isArray(updatedPriceHistory) && updatedPriceHistory.length > 0) {
            resetDate = updatedPriceHistory[updatedPriceHistory.length - 1].date;
          }
        }
      }
      // Merge all fields, preserving restockHistory and priceHistory
      let updatedProduct = {
        ...prevProduct,
        ...action.payload,
        restockHistory: action.payload.restockHistory ?? prevProduct?.restockHistory ?? [],
        priceHistory: updatedPriceHistory,
      };
      const updatedProducts = state.products.map((p) =>
        p.id === action.payload.id ? updatedProduct : p
      );
      // If quantity changed, reset inventory for this product
      let updatedInventory = recalculateInventory({ ...state, products: updatedProducts });
      if (resetInventory) {
        updatedInventory = updatedInventory.map(item =>
          item.productId === action.payload.id
            ? {
                ...item,
                currentStock: resetQuantity,
                lastUpdated: resetDate,
                stockHistory: [
                  ...(Array.isArray(item.stockHistory) ? item.stockHistory : []),
                  { date: resetDate, stock: resetQuantity, source: 'reset' },
                ],
              }
            : item
        );
      }
      return {
        ...state,
        products: updatedProducts,
        inventory: updatedInventory,
      };
    }
    case 'DELETE_PRODUCT': {
      const filteredProducts = state.products.filter((p) => p.id !== action.payload);
      return {
        ...state,
        products: filteredProducts,
        inventory: recalculateInventory({ ...state, products: filteredProducts }),
      };
    }
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
      const newCost = getRecipeCost(action.payload, state.products);
      let costHistory = action.payload.costHistory || [];
      if (costHistory.length === 0 || newCost !== costHistory[costHistory.length - 1].cost) {
        costHistory = [...costHistory, { date: new Date().toISOString(), cost: newCost }];
      }
      return {
        ...state,
        recipes: state.recipes.map((r) => {
          if (r.id === action.payload.id) {
            const prevCostHistory = r.costHistory || [];
            const prevCost = prevCostHistory.length > 0 ? prevCostHistory[prevCostHistory.length - 1].cost : undefined;
            let costHistory = prevCostHistory;
            if (prevCost === undefined || newCost !== prevCost) {
              costHistory = [...prevCostHistory, { date: new Date().toISOString(), cost: newCost }];
            }
            return {
              ...action.payload,
              costHistory,
              salesHistory: state.sales.filter(sale => sale.recipeId === action.payload.id).map(sale => ({ date: getDateString(sale.date), quantity: sale.quantity })),
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
      // Find the current and updated Product
      const product = state.products.find(p => p.id === action.payload.productId);
      // Find the latest price in priceHistory
      const latestPrice = product && Array.isArray(product.priceHistory) && product.priceHistory.length > 0
        ? product.priceHistory[product.priceHistory.length - 1].price
        : product?.cost;
      // Find the updated Product (after update)
      const updatedProduct = { ...product, ...action.payload };
      const updatedPrice = updatedProduct.cost;
      if (existing) {
        let stockHistory = Array.isArray(existing.stockHistory) ? existing.stockHistory : [];
        // Only add a new stockHistory entry if the cost (price) changes
        if (latestPrice !== updatedPrice) {
          // Use T00:00:00.000Z for restock/manual update
          const restockDate = new Date(new Date(action.payload.lastUpdated).toISOString().slice(0,10) + 'T00:00:00.000Z').toISOString();
          stockHistory = [...stockHistory, { date: restockDate, stock: action.payload.currentStock, source: 'manual' }];
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
          inventory: [...state.inventory, { ...action.payload, stockHistory: [{ date: action.payload.lastUpdated, stock: action.payload.currentStock, source: 'manual' }] }],
        };
      }
    }
    case 'DELETE_INVENTORY':
      return {
        ...state,
        inventory: state.inventory.filter((i) => i.productId !== action.payload),
      };
    case 'ADD_SALE': {
      // Add sale to global sales
      const newSales = [...state.sales, action.payload];
      // Update salesHistory for the relevant recipe
      const updatedRecipes = state.recipes.map(recipe => {
        if (recipe.id === action.payload.recipeId) {
          const prevSalesHistory = recipe.salesHistory || [];
          const saleDate = getDateString(action.payload.date);
          return {
            ...recipe,
            salesHistory: [...prevSalesHistory, { date: saleDate, quantity: action.payload.quantity }],
          };
        }
        return recipe;
      });
      return {
        ...state,
        sales: newSales,
        recipes: updatedRecipes,
        inventory: recalculateInventory({ ...state, sales: newSales }),
      };
    }
    case 'UPDATE_SALE':
    case 'DELETE_SALE': {
      // For any sales change, recalculate inventory
      let newSales = state.sales;
      if (action.type === 'UPDATE_SALE') newSales = state.sales.map(s => s.id === action.payload.id ? action.payload : s);
      if (action.type === 'DELETE_SALE') newSales = state.sales.filter(s => s.id !== action.payload);
      return {
        ...state,
        sales: newSales,
        inventory: recalculateInventory({ ...state, sales: newSales }),
      };
    }
    case 'SYNC_STATE':
      return { ...action.payload };
    default:
      return state;
  }
}

// Get restaurant ID from URL parameter
const getRestaurantId = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('restaurant') || 'default';
  }
  return 'default';
};

const getLocalStorageKey = (restaurantId: string) => `costManagementState_${restaurantId}`;

export function CostManagementProvider({ children }: { children: ReactNode }) {
  const getInitialState = () => {
    if (typeof window !== 'undefined') {
      const restaurantId = getRestaurantId();
      const storageKey = getLocalStorageKey(restaurantId);
      const stored = localStorage.getItem(storageKey);
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
      const restaurantId = getRestaurantId();
      const storageKey = getLocalStorageKey(restaurantId);
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state]);

  // Listen for storage events to sync across tabs (seamless, with warning if editing)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      const restaurantId = getRestaurantId();
      const storageKey = getLocalStorageKey(restaurantId);
      if (e.key === storageKey && e.newValue) {
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

  useEffect(() => {
    // MIGRATION: Initialize priceHistory for all products that are missing it
    if (state.products.some(p => !Array.isArray(p.priceHistory) || p.priceHistory.length === 0)) {
      const migratedProducts = state.products.map(p => {
        if (!Array.isArray(p.priceHistory) || p.priceHistory.length === 0) {
          return {
            ...p,
            priceHistory: [{
              date: new Date().toISOString(),
              price: p.cost,
              packageSize: p.packageSize,
              quantity: p.quantity
            }]
          };
        }
        return p;
      });
      dispatch({ type: 'SYNC_STATE', payload: { ...state, products: migratedProducts } });
    }
  }, []);

  useEffect(() => {
    // TEMP PATCH: Fix priceHistory for Strawberries
    const fixedProducts = state.products.map(p => {
      if (p.name === 'Strawberries') {
        return {
          ...p,
          priceHistory: [
            { date: '2025-06-28', price: 80, packageSize: p.packageSize, quantity: p.quantity },
            { date: '2025-07-02', price: 90, packageSize: p.packageSize, quantity: p.quantity },
          ]
        };
      }
      return p;
    });
    if (JSON.stringify(fixedProducts) !== JSON.stringify(state.products)) {
      dispatch({ type: 'SYNC_STATE', payload: { ...state, products: fixedProducts } });
    }
  }, []);

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