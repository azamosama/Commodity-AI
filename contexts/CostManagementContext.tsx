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
  products: [
    {
      id: 'milk-1',
      name: 'Whole Milk',
      quantity: 1,
      unit: 'gallon',
      packageSize: 1,
      packageUnit: 'gallon',
      cost: 4.99,
      category: 'Food',
      categoryType: 'Dairy',
      supplier: 'Local Dairy Co.',
      substitutes: ['almond-milk-1', 'oat-milk-1', 'soy-milk-1'],
      nutritionalInfo: {
        calories: 150,
        protein: 8,
        carbs: 12,
        fat: 8,
        fiber: 0
      },
      allergens: ['dairy'],
      flavorProfile: ['creamy', 'sweet']
    },
    {
      id: 'almond-milk-1',
      name: 'Almond Milk',
      quantity: 1,
      unit: 'gallon',
      packageSize: 1,
      packageUnit: 'gallon',
      cost: 5.99,
      category: 'Food',
      categoryType: 'Dairy',
      supplier: 'Plant-Based Foods',
      substitutes: ['milk-1', 'oat-milk-1', 'soy-milk-1'],
      nutritionalInfo: {
        calories: 30,
        protein: 1,
        carbs: 1,
        fat: 2.5,
        fiber: 1
      },
      allergens: ['nuts'],
      flavorProfile: ['nutty', 'sweet']
    },
    {
      id: 'butter-1',
      name: 'Butter',
      quantity: 1,
      unit: 'lb',
      packageSize: 1,
      packageUnit: 'lb',
      cost: 6.99,
      category: 'Food',
      categoryType: 'Dairy',
      supplier: 'Local Dairy Co.',
      substitutes: ['olive-oil-1', 'coconut-oil-1'],
      nutritionalInfo: {
        calories: 717,
        protein: 0.9,
        carbs: 0.1,
        fat: 81,
        fiber: 0
      },
      allergens: ['dairy'],
      flavorProfile: ['creamy', 'savory']
    },
    {
      id: 'olive-oil-1',
      name: 'Olive Oil',
      quantity: 1,
      unit: 'L',
      packageSize: 1,
      packageUnit: 'L',
      cost: 8.99,
      category: 'Food',
      categoryType: 'Dry Goods',
      supplier: 'Mediterranean Imports',
      substitutes: ['butter-1', 'coconut-oil-1'],
      nutritionalInfo: {
        calories: 884,
        protein: 0,
        carbs: 0,
        fat: 100,
        fiber: 0
      },
      allergens: [],
      flavorProfile: ['fruity', 'savory']
    },
    {
      id: 'sugar-1',
      name: 'Granulated Sugar',
      quantity: 5,
      unit: 'lb',
      packageSize: 5,
      packageUnit: 'lb',
      cost: 3.99,
      category: 'Food',
      categoryType: 'Dry Goods',
      supplier: 'Sweet Supplies',
      substitutes: ['honey-1', 'maple-syrup-1', 'stevia-1'],
      nutritionalInfo: {
        calories: 387,
        protein: 0,
        carbs: 100,
        fat: 0,
        fiber: 0
      },
      allergens: [],
      flavorProfile: ['sweet']
    },
    {
      id: 'honey-1',
      name: 'Honey',
      quantity: 1,
      unit: 'lb',
      packageSize: 1,
      packageUnit: 'lb',
      cost: 7.99,
      category: 'Food',
      categoryType: 'Dry Goods',
      supplier: 'Local Apiary',
      substitutes: ['sugar-1', 'maple-syrup-1'],
      nutritionalInfo: {
        calories: 304,
        protein: 0.3,
        carbs: 82,
        fat: 0,
        fiber: 0.2
      },
      allergens: [],
      flavorProfile: ['sweet', 'floral']
    },
    {
      id: 'flour-1',
      name: 'All-Purpose Flour',
      quantity: 5,
      unit: 'lb',
      packageSize: 5,
      packageUnit: 'lb',
      cost: 4.99,
      category: 'Food',
      categoryType: 'Dry Goods',
      supplier: 'Bakery Supplies',
      substitutes: ['whole-wheat-flour-1', 'almond-flour-1'],
      nutritionalInfo: {
        calories: 364,
        protein: 10,
        carbs: 76,
        fat: 1,
        fiber: 3
      },
      allergens: ['gluten'],
      flavorProfile: ['neutral']
    },
    {
      id: 'eggs-1',
      name: 'Large Eggs',
      quantity: 12,
      unit: 'count',
      packageSize: 12,
      packageUnit: 'count',
      cost: 3.99,
      category: 'Food',
      categoryType: 'Dairy',
      supplier: 'Farm Fresh Eggs',
      substitutes: ['flax-seeds-1', 'chia-seeds-1'],
      nutritionalInfo: {
        calories: 70,
        protein: 6,
        carbs: 0.6,
        fat: 5,
        fiber: 0
      },
      allergens: ['eggs'],
      flavorProfile: ['savory']
    },
    {
      id: 'strawberries-1',
      name: 'Strawberries',
      quantity: 1,
      unit: 'lb',
      packageSize: 1,
      packageUnit: 'lb',
      cost: 4.99,
      category: 'Food',
      categoryType: 'Produce',
      supplier: 'Fresh Farms',
      substitutes: ['raspberries-1', 'blueberries-1', 'blackberries-1'],
      nutritionalInfo: {
        calories: 32,
        protein: 0.7,
        carbs: 7.7,
        fat: 0.3,
        fiber: 2
      },
      allergens: [],
      flavorProfile: ['sweet', 'fruity']
    },
    {
      id: 'chocolate-1',
      name: 'Chocolate',
      quantity: 5,
      unit: 'lb',
      packageSize: 5,
      packageUnit: 'box',
      cost: 15.99,
      category: 'Food',
      categoryType: 'Dry Goods',
      supplier: 'Chocolate World',
      substitutes: ['cocoa-powder-1', 'carob-1', 'dark-chocolate-1'],
      nutritionalInfo: {
        calories: 545,
        protein: 4.9,
        carbs: 61,
        fat: 31,
        fiber: 7
      },
      allergens: ['dairy', 'soy'],
      flavorProfile: ['sweet', 'rich']
    },
    {
      id: 'cups-1',
      name: 'Cups',
      quantity: 1,
      unit: 'count',
      packageSize: 1,
      packageUnit: 'count',
      cost: 0.50,
      category: 'Non-Food',
      categoryType: 'Supplies',
      supplier: 'Restaurant Supply Co.',
      substitutes: ['bowls-1', 'plates-1'],
      nutritionalInfo: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      allergens: [],
      flavorProfile: []
    },
    {
      id: 'raspberries-1',
      name: 'Raspberries',
      quantity: 1,
      unit: 'lb',
      packageSize: 1,
      packageUnit: 'lb',
      cost: 6.99,
      category: 'Food',
      categoryType: 'Produce',
      supplier: 'Fresh Farms',
      substitutes: ['strawberries-1', 'blueberries-1'],
      nutritionalInfo: {
        calories: 52,
        protein: 1.2,
        carbs: 12,
        fat: 0.7,
        fiber: 6.5
      },
      allergens: [],
      flavorProfile: ['sweet', 'tart', 'fruity']
    },
    {
      id: 'cocoa-powder-1',
      name: 'Cocoa Powder',
      quantity: 1,
      unit: 'lb',
      packageSize: 1,
      packageUnit: 'lb',
      cost: 8.99,
      category: 'Food',
      categoryType: 'Dry Goods',
      supplier: 'Chocolate World',
      substitutes: ['chocolate-1', 'carob-1'],
      nutritionalInfo: {
        calories: 228,
        protein: 19.6,
        carbs: 57.9,
        fat: 13.7,
        fiber: 33.2
      },
      allergens: [],
      flavorProfile: ['bitter', 'rich']
    },
    {
      id: 'bowls-1',
      name: 'Bowls',
      quantity: 1,
      unit: 'count',
      packageSize: 1,
      packageUnit: 'count',
      cost: 0.75,
      category: 'Non-Food',
      categoryType: 'Supplies',
      supplier: 'Restaurant Supply Co.',
      substitutes: ['cups-1', 'plates-1'],
      nutritionalInfo: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      allergens: [],
      flavorProfile: []
    },
    {
      id: 'blueberries-1',
      name: 'Blueberries',
      quantity: 1,
      unit: 'lb',
      packageSize: 1,
      packageUnit: 'lb',
      cost: 5.99,
      category: 'Food',
      categoryType: 'Produce',
      supplier: 'Fresh Farms',
      substitutes: ['strawberries-1', 'raspberries-1'],
      nutritionalInfo: {
        calories: 57,
        protein: 0.7,
        carbs: 14.5,
        fat: 0.3,
        fiber: 2.4
      },
      allergens: [],
      flavorProfile: ['sweet', 'fruity']
    },
    {
      id: 'carob-1',
      name: 'Carob',
      quantity: 1,
      unit: 'lb',
      packageSize: 1,
      packageUnit: 'lb',
      cost: 9.99,
      category: 'Food',
      categoryType: 'Dry Goods',
      supplier: 'Health Foods Co.',
      substitutes: ['chocolate-1', 'cocoa-powder-1'],
      nutritionalInfo: {
        calories: 222,
        protein: 4.6,
        carbs: 49,
        fat: 0.7,
        fiber: 39.8
      },
      allergens: [],
      flavorProfile: ['sweet', 'nutty']
    },
    {
      id: 'dark-chocolate-1',
      name: 'Dark Chocolate',
      quantity: 1,
      unit: 'lb',
      packageSize: 1,
      packageUnit: 'lb',
      cost: 18.99,
      category: 'Food',
      categoryType: 'Dry Goods',
      supplier: 'Premium Chocolate Co.',
      substitutes: ['chocolate-1', 'carob-1'],
      nutritionalInfo: {
        calories: 545,
        protein: 4.9,
        carbs: 61,
        fat: 31,
        fiber: 7
      },
      allergens: ['dairy'],
      flavorProfile: ['bitter', 'rich', 'sweet']
    },
    {
      id: 'premium-vanilla-1',
      name: 'Premium Vanilla Extract',
      quantity: 1,
      unit: 'oz',
      packageSize: 1,
      packageUnit: 'oz',
      cost: 12.99,
      category: 'Food',
      categoryType: 'Dry Goods',
      supplier: 'Gourmet Spices Co.',
      substitutes: ['vanilla-extract-1'],
      nutritionalInfo: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      allergens: [],
      flavorProfile: ['sweet', 'aromatic']
    },
    {
      id: 'vanilla-extract-1',
      name: 'Vanilla Extract',
      quantity: 1,
      unit: 'oz',
      packageSize: 1,
      packageUnit: 'oz',
      cost: 4.99,
      category: 'Food',
      categoryType: 'Dry Goods',
      supplier: 'Baking Supply Co.',
      substitutes: ['premium-vanilla-1'],
      nutritionalInfo: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      allergens: [],
      flavorProfile: ['sweet', 'aromatic']
    },
    {
      id: 'carob-1',
      name: 'Carob Powder',
      quantity: 1,
      unit: 'lb',
      packageSize: 1,
      packageUnit: 'lb',
      cost: 8.99,
      category: 'Food',
      categoryType: 'Dry Goods',
      supplier: 'Health Foods Inc.',
      substitutes: ['chocolate-1', 'dark-chocolate-1'],
      nutritionalInfo: {
        calories: 222,
        protein: 4.6,
        carbs: 89,
        fat: 0.7,
        fiber: 40
      },
      allergens: [],
      flavorProfile: ['sweet', 'nutty', 'chocolate-like']
    },
    {
      id: 'blueberries-1',
      name: 'Fresh Blueberries',
      quantity: 1,
      unit: 'lb',
      packageSize: 1,
      packageUnit: 'lb',
      cost: 6.99,
      category: 'Food',
      categoryType: 'Produce',
      supplier: 'Local Farm Market',
      substitutes: ['strawberries-1', 'raspberries-1'],
      nutritionalInfo: {
        calories: 57,
        protein: 0.7,
        carbs: 14,
        fat: 0.3,
        fiber: 2.4
      },
      allergens: [],
      flavorProfile: ['sweet', 'tart', 'fruity']
    },
    {
      id: 'plates-1',
      name: 'Ceramic Plates',
      quantity: 12,
      unit: 'count',
      packageSize: 12,
      packageUnit: 'count',
      cost: 24.99,
      category: 'Non-Food',
      categoryType: 'Equipment',
      supplier: 'Restaurant Supply Co.',
      substitutes: ['bowls-1'],
      nutritionalInfo: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      allergens: [],
      flavorProfile: []
    },
    {
      id: 'bowls-1',
      name: 'Ceramic Bowls',
      quantity: 12,
      unit: 'count',
      packageSize: 12,
      packageUnit: 'count',
      cost: 19.99,
      category: 'Non-Food',
      categoryType: 'Equipment',
      supplier: 'Restaurant Supply Co.',
      substitutes: ['plates-1'],
      nutritionalInfo: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      allergens: [],
      flavorProfile: []
    },
    {
      id: 'bananas-1',
      name: 'Bananas',
      quantity: 15,
      unit: 'lb',
      packageSize: 15,
      packageUnit: 'pack',
      cost: 12.99,
      category: 'Food',
      categoryType: 'Fresh Food',
      supplier: 'Fresh Farms',
      substitutes: ['strawberries-1', 'blueberries-1'],
      nutritionalInfo: {
        calories: 89,
        protein: 1.1,
        carbs: 23,
        fat: 0.3,
        fiber: 2.6
      },
      allergens: [],
      flavorProfile: ['sweet', 'fruity']
    },
    {
      id: 'crepe-batter-1',
      name: 'Crepe Batter',
      quantity: 10,
      unit: 'lb',
      packageSize: 10,
      packageUnit: 'box',
      cost: 24.99,
      category: 'Food',
      categoryType: 'Dry Goods',
      supplier: 'Bakery Supply Co.',
      substitutes: [],
      nutritionalInfo: {
        calories: 200,
        protein: 8,
        carbs: 35,
        fat: 3,
        fiber: 1
      },
      allergens: ['gluten', 'eggs'],
      flavorProfile: ['neutral', 'savory']
    }
  ],
  recipes: [
    {
      id: 'chocolate-chip-cookies',
      name: 'Chocolate Chip Cookies',
      ingredients: [
        {
          productId: 'flour-1',
          quantity: 2.25,
          unit: 'cups',
          yieldPercentage: 100,
          lossPercentage: 0,
          preparationNotes: 'Sift before measuring',
          isOptional: false,
          substitutionGroup: 'flour'
        },
        {
          productId: 'butter-1',
          quantity: 1,
          unit: 'cup',
          yieldPercentage: 100,
          lossPercentage: 0,
          preparationNotes: 'Softened to room temperature',
          isOptional: false,
          substitutionGroup: 'fat'
        },
        {
          productId: 'sugar-1',
          quantity: 0.75,
          unit: 'cup',
          yieldPercentage: 100,
          lossPercentage: 0,
          preparationNotes: 'Granulated sugar',
          isOptional: false,
          substitutionGroup: 'sweetener'
        },
        {
          productId: 'eggs-1',
          quantity: 2,
          unit: 'count',
          yieldPercentage: 100,
          lossPercentage: 0,
          preparationNotes: 'Large eggs, room temperature',
          isOptional: false,
          substitutionGroup: 'binder'
        }
      ],
      servings: 24,
      servingSize: 1,
      servingUnit: 'cookie',
      totalYieldPercentage: 95,
      totalLossPercentage: 5,
      difficulty: 'easy',
      prepTime: 15,
      cookTime: 12,
      tags: ['dessert', 'baked', 'vegetarian'],
      instructions: 'Cream butter and sugar, add eggs, mix in flour, fold in chocolate chips, bake at 375°F for 10-12 minutes',
      preparationSteps: [
        {
          id: 'step-1',
          stepNumber: 1,
          description: 'Preheat oven to 375°F and line baking sheets with parchment paper',
          duration: 5,
          temperature: 375,
          equipment: ['oven'],
          ingredients: [],
          notes: 'Allow oven to fully preheat'
        },
        {
          id: 'step-2',
          stepNumber: 2,
          description: 'Cream butter and sugar until light and fluffy',
          duration: 3,
          equipment: ['mixer'],
          ingredients: ['butter-1', 'sugar-1'],
          notes: 'Use room temperature butter for best results'
        },
        {
          id: 'step-3',
          stepNumber: 3,
          description: 'Add eggs one at a time, mixing well after each addition',
          duration: 2,
          equipment: ['mixer'],
          ingredients: ['eggs-1'],
          notes: 'Use room temperature eggs to prevent curdling'
        }
      ]
    },
    {
      id: 'premium-chocolate-dessert',
      name: 'Premium Chocolate Dessert',
      ingredients: [
        {
          productId: 'dark-chocolate-1',
          quantity: 0.5,
          unit: 'lb',
          yieldPercentage: 100,
          lossPercentage: 0,
          preparationNotes: 'Melt slowly over low heat',
          isOptional: false,
          substitutionGroup: 'chocolate'
        },
        {
          productId: 'strawberries-1',
          quantity: 0.3,
          unit: 'lb',
          yieldPercentage: 90,
          lossPercentage: 10,
          preparationNotes: 'Wash and hull strawberries',
          isOptional: false,
          substitutionGroup: 'berries'
        }
      ],
      servings: 4,
      servingSize: 1,
      servingUnit: 'piece',
      instructions: 'Create a luxurious chocolate dessert with fresh strawberries',
      totalYieldPercentage: 95,
      totalLossPercentage: 5,
      difficulty: 'medium',
      prepTime: 30,
      cookTime: 15,
      tags: ['dessert', 'chocolate', 'premium'],
      preparationSteps: [
        {
          id: 'step-1',
          stepNumber: 1,
          description: 'Melt dark chocolate in double boiler',
          duration: 10,
          temperature: 120,
          equipment: ['double boiler'],
          ingredients: ['dark-chocolate-1'],
          notes: 'Stir constantly to prevent burning'
        }
      ]
    },
    {
      id: 'blueberry-pancakes',
      name: 'Blueberry Pancakes',
      ingredients: [
        {
          productId: 'blueberries-1',
          quantity: 0.2,
          unit: 'lb',
          yieldPercentage: 95,
          lossPercentage: 5,
          preparationNotes: 'Gently fold into batter',
          isOptional: false,
          substitutionGroup: 'berries'
        },
        {
          productId: 'milk-1',
          quantity: 0.5,
          unit: 'gallon',
          yieldPercentage: 100,
          lossPercentage: 0,
          preparationNotes: 'Use at room temperature',
          isOptional: false,
          substitutionGroup: 'dairy'
        }
      ],
      servings: 6,
      servingSize: 2,
      servingUnit: 'pancakes',
      instructions: 'Fluffy pancakes with fresh blueberries',
      totalYieldPercentage: 98,
      totalLossPercentage: 2,
      difficulty: 'easy',
      prepTime: 15,
      cookTime: 20,
      tags: ['breakfast', 'pancakes', 'berries'],
      preparationSteps: [
        {
          id: 'step-1',
          stepNumber: 1,
          description: 'Mix dry ingredients',
          duration: 5,
          equipment: ['mixing bowl'],
          ingredients: [],
          notes: 'Whisk thoroughly to combine'
        }
      ]
    }
  ],
  expenses: [],
  inventory: [],
  sales: []
};

const CostManagementContext = createContext<{
  state: CostManagementState;
  dispatch: React.Dispatch<CostManagementAction>;
  isLoading: boolean;
  forceRefresh: () => Promise<void>;
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
    const recipe = state.recipes.find(r => r.name === sale.recipeName);
    if (!recipe) return;
    recipe.ingredients.forEach(ingredient => {
      const product = state.products.find(p => p.id === ingredient.productId);
      if (!product) return;
      let usage = 0;
      // Convert string quantity to number for calculations
      const quantity = typeof ingredient.quantity === 'string' ? parseFloat(ingredient.quantity) || 0 : ingredient.quantity;
      if ((product.unit === 'count' || product.unit === 'pieces' || product.unit === 'units') && product.unitsPerPackage) {
        usage = quantity * sale.quantity;
      } else if (product.packageSize) {
        usage = quantity * sale.quantity;
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
      console.log('DELETE_PRODUCT: Deleting product ID:', action.payload);
      console.log('DELETE_PRODUCT: Current products before delete:', state.products.length);
      const filteredProducts = state.products.filter((p) => p.id !== action.payload);
      console.log('DELETE_PRODUCT: Products after delete:', filteredProducts.length);
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
          // Convert string quantity to number for calculations
          const quantity = typeof ingredient.quantity === 'string' ? parseFloat(ingredient.quantity) || 0 : ingredient.quantity;
          let ingredientCost = 0;
          if (ingredient.unit === 'count' && product.unitsPerPackage) {
            const costPerUnit = product.cost / product.unitsPerPackage;
            ingredientCost = costPerUnit * quantity;
          } else {
            const costPerBaseUnit = product.cost / product.packageSize;
            ingredientCost = costPerBaseUnit * quantity;
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
          // Convert string quantity to number for calculations
          const quantity = typeof ingredient.quantity === 'string' ? parseFloat(ingredient.quantity) || 0 : ingredient.quantity;
          let ingredientCost = 0;
          if (ingredient.unit === 'count' && product.unitsPerPackage) {
            const costPerUnit = product.cost / product.unitsPerPackage;
            ingredientCost = costPerUnit * quantity;
          } else {
            const costPerBaseUnit = product.cost / product.packageSize;
            ingredientCost = costPerBaseUnit * quantity;
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
              salesHistory: state.sales.filter(sale => sale.recipeName === action.payload.name).map(sale => ({ date: getDateString(sale.date), quantity: sale.quantity })),
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
        if (recipe.name === action.payload.recipeName) {
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
      console.log('SYNC_STATE: Setting state with', action.payload.products.length, 'products');
      console.log('SYNC_STATE: Product IDs:', action.payload.products.map((p: any) => p.id));
      return { ...action.payload };
    default:
      return state;
  }
}

// Get restaurant ID from URL parameter
const getRestaurantId = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const restaurant = urlParams.get('restaurant');
    console.log('CostManagementContext: Current URL params:', window.location.search);
    console.log('CostManagementContext: Restaurant ID from URL:', restaurant);
    
    if (restaurant) {
      return restaurant;
    }
    
    // For base URL (no restaurant parameter), generate a unique session-based ID
    // This prevents data sharing between different users on the base URL
    let sessionId = sessionStorage.getItem('temp-restaurant-id');
    if (!sessionId) {
      sessionId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('temp-restaurant-id', sessionId);
      console.log('CostManagementContext: Generated new session ID:', sessionId);
    } else {
      console.log('CostManagementContext: Using existing session ID:', sessionId);
    }
    
    return sessionId;
  }
  return 'default';
};

const getLocalStorageKey = (restaurantId: string) => `costManagementState_${restaurantId}`;

export function CostManagementProvider({ children }: { children: ReactNode }) {
  const getInitialState = () => {
    // For now, return initialState and load data asynchronously
    return initialState;
  };

  const [state, dispatch] = useReducer(costManagementReducer, initialState, getInitialState);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isEditingRef = useRef(isEditing);
  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);

  // Force refresh function
  const forceRefresh = async () => {
    if (typeof window !== 'undefined') {
      const restaurantId = getRestaurantId();
      const storageKey = getLocalStorageKey(restaurantId);
      
      // Clear ALL localStorage to prevent any cached data
      localStorage.clear();
      sessionStorage.clear();
      console.log('Force refresh: Cleared all storage');
      
      // Reset state to initial state first
      dispatch({ type: 'SYNC_STATE', payload: initialState });
      console.log('Force refresh: Reset state to initial state');
      
      // Reload from API with cache busting
      try {
        const response = await fetch(`/api/restaurant-data?restaurantId=${restaurantId}&_t=${Date.now()}&_force=1`);
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            // Validate that we don't have duplicate IDs
            const products = result.data.products || [];
            const ids = products.map((p: any) => p.id);
            const uniqueIds = new Set(ids);
            
            if (ids.length !== uniqueIds.size) {
              console.error('API returned duplicate product IDs:', ids);
              // Remove duplicates by keeping only the first occurrence
              const uniqueProducts = products.filter((product: any, index: number) => 
                ids.indexOf(product.id) === index
              );
              result.data.products = uniqueProducts;
              console.log('Removed duplicate products, keeping only unique IDs');
            }
            
            dispatch({ type: 'SYNC_STATE', payload: result.data });
            console.log('Force refresh: Data reloaded from API with', result.data.products.length, 'products');
          }
        }
      } catch (error) {
        console.error('Force refresh error:', error);
      }
    }
  };

  // Load data from API and localStorage on mount
  useEffect(() => {
    const loadData = async () => {
      if (typeof window !== 'undefined') {
        const restaurantId = getRestaurantId();
        
        // ALWAYS clear all storage first to prevent cached data issues
        localStorage.clear();
        sessionStorage.clear();
        console.log('Cleared all storage before loading data');
        
        try {
          // Force load from API with aggressive cache busting
          console.log('Loading data from API for restaurant:', restaurantId);
          const response = await fetch(`/api/restaurant-data?restaurantId=${restaurantId}&_t=${Date.now()}&_force=1&_nocache=1`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.data) {
              // Validate and clean the data
              const products = result.data.products || [];
              const ids = products.map((p: any) => p.id);
              const uniqueIds = new Set(ids);
              
              if (ids.length !== uniqueIds.size) {
                console.error('API returned duplicate product IDs:', ids);
                // Remove duplicates by keeping only the first occurrence
                const uniqueProducts = products.filter((product: any, index: number) => 
                  ids.indexOf(product.id) === index
                );
                result.data.products = uniqueProducts;
                console.log('Removed duplicate products, keeping only unique IDs');
              }
              
            dispatch({ type: 'SYNC_STATE', payload: result.data });
            console.log('Data loaded successfully from API for restaurant:', restaurantId, 'with', result.data.products.length, 'products');
            console.log('Product IDs from API:', result.data.products.map((p: any) => p.id));
            }
          } else {
            console.error('API request failed with status:', response.status);
          }
        } catch (error) {
          console.error('Error loading restaurant data from API:', error);
        }
        
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Persist to API and localStorage on every state change
  useEffect(() => {
    const saveData = async () => {
      if (typeof window !== 'undefined' && !isLoading) {
        const restaurantId = getRestaurantId();
        
        // Don't save if we have more than 3 products (indicates cached data)
        if (state.products.length > 3) {
          console.log('Skipping save - too many products detected (cached data):', state.products.length);
          return;
        }
        
        // Debug: Check for duplicate IDs
        const productIds = state.products.map(p => p.id);
        const uniqueIds = new Set(productIds);
        if (productIds.length !== uniqueIds.size) {
          console.log('Skipping save - duplicate product IDs detected:', productIds);
          console.log('Duplicate IDs:', productIds.filter((id, index) => productIds.indexOf(id) !== index));
          return;
        }
        
        // Debug: Log what we're about to save
        console.log('About to save products:', state.products.length, 'Product IDs:', productIds);
        
        try {
          console.log('Saving data for restaurant:', restaurantId, 'Data:', state);
          
          // Save to API
          const response = await fetch(`/api/restaurant-data?restaurantId=${restaurantId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: state }),
          });
          
          if (response.ok) {
            console.log('Data saved successfully to API for restaurant:', restaurantId);
          } else {
            console.error('Failed to save data to API for restaurant:', restaurantId);
          }
          
          // Also save to localStorage as backup
          const storageKey = getLocalStorageKey(restaurantId);
          localStorage.setItem(storageKey, JSON.stringify(state));
          console.log('Data also saved to localStorage for restaurant:', restaurantId);
          
        } catch (error) {
          console.error('Error saving restaurant data:', error);
          // Fallback to localStorage only
          const storageKey = getLocalStorageKey(restaurantId);
          localStorage.setItem(storageKey, JSON.stringify(state));
          console.log('Fallback: Data saved to localStorage only for restaurant:', restaurantId);
        }
      }
    };
    saveData();
  }, [state, isLoading]);

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

  useEffect(() => {
    // UPDATE PRODUCT COSTS: Fix unrealistic product costs to market prices
    const updatedProducts = state.products.map(p => {
      // Handle case variations and exact matches
      const productName = p.name.toLowerCase();
      
      if (productName === 'chocolate') {
        return {
          ...p,
          cost: 15.99,
          packageSize: 5,
          priceHistory: [
            { date: new Date().toISOString(), price: 15.99, packageSize: 5, quantity: p.quantity }
          ]
        };
      }
      if (productName === 'crepe batter') {
        return {
          ...p,
          cost: 24.99,
          packageSize: 10,
          priceHistory: [
            { date: new Date().toISOString(), price: 24.99, packageSize: 10, quantity: p.quantity }
          ]
        };
      }
      if (productName === 'bananas') {
        return {
          ...p,
          cost: 12.99,
          packageSize: 15,
          priceHistory: [
            { date: new Date().toISOString(), price: 12.99, packageSize: 15, quantity: p.quantity }
          ]
        };
      }
      return p;
    });
    
    if (JSON.stringify(updatedProducts) !== JSON.stringify(state.products)) {
      console.log('Updating product costs to realistic market prices...');
      console.log('Products being updated:', updatedProducts.filter(p => 
        p.name.toLowerCase() === 'chocolate' || 
        p.name.toLowerCase() === 'crepe batter' || 
        p.name.toLowerCase() === 'bananas'
      ));
      dispatch({ type: 'SYNC_STATE', payload: { ...state, products: updatedProducts } });
    }
  }, []);

  useEffect(() => {
    // CREATE AVAILABILITY SCENARIOS: Make some products out of stock for testing
    console.log('Setting up availability scenarios for AI substitution testing...');
    console.log('Chocolate is now out of stock - should trigger availability suggestions');
  }, []);

  useEffect(() => {
    // UPDATE PRODUCT AVAILABILITY: Set some products as out of stock for testing
    if (state.products.length > 0) {
      const updatedProducts = state.products.map(p => {
        const productName = p.name.toLowerCase();
        
        // Make chocolate out of stock for availability testing
        if (productName === 'chocolate') {
          return {
            ...p,
            // Add availability status to the product
            isAvailable: false,
            currentStock: 0,
            reorderPoint: 1
          };
        }
        
        // Make blueberries out of stock for availability testing
        if (productName === 'blueberries') {
          return {
            ...p,
            isAvailable: false,
            currentStock: 0,
            reorderPoint: 2
          };
        }
        
        return p;
      });
      
      // Check if any products were actually updated
      const hasChanges = updatedProducts.some((p, index) => {
        const original = state.products[index];
        return p.isAvailable !== original.isAvailable || 
               p.currentStock !== original.currentStock;
      });
      
      if (hasChanges) {
        console.log('Setting up availability scenarios - Chocolate and Blueberries are now out of stock');
        console.log('Updated products:', updatedProducts.filter(p => 
          p.name.toLowerCase() === 'chocolate' || 
          p.name.toLowerCase() === 'blueberries'
        ));
        dispatch({ type: 'SYNC_STATE', payload: { ...state, products: updatedProducts } });
      }
    }
  }, [state.products.length]); // Run when products are loaded

  return (
    <CostManagementContext.Provider value={{ state, dispatch, isLoading, forceRefresh }}>
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