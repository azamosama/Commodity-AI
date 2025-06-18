import React, { createContext, useContext, useReducer, ReactNode } from 'react';
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
  | { type: 'ADD_SALE'; payload: SalesRecord };

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

function costManagementReducer(state: CostManagementState, action: CostManagementAction): CostManagementState {
  switch (action.type) {
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case 'ADD_RECIPE':
      return { ...state, recipes: [...state.recipes, action.payload] };
    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map((r) => (r.id === action.payload.id ? action.payload : r)),
      };
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
        return {
          ...state,
          inventory: state.inventory.map(i =>
            i.productId === action.payload.productId ? action.payload : i
          ),
        };
      } else {
        return {
          ...state,
          inventory: [...state.inventory, action.payload],
        };
      }
    }
    case 'ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };
    default:
      return state;
  }
}

export function CostManagementProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(costManagementReducer, initialState);

  return (
    <CostManagementContext.Provider value={{ state, dispatch }}>
      {children}
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