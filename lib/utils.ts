import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Product, InventoryItem, Recipe, SalesRecord } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate total units for a product based on its type and packaging
 * This standardizes inventory calculations across the application
 */
export function calculateTotalUnits(product: Product): number {
  if (product.unit === 'count' || product.unit === 'pieces' || product.unit === 'units') {
    // For countable items, use unitsPerPackage
    return product.quantity * (product.unitsPerPackage || 1);
  } else {
    // For weight/volume items, use packageSize
    return product.quantity * (product.packageSize || 1);
  }
}

/**
 * Calculate cost per base unit for a product
 */
export function calculateCostPerBaseUnit(product: Product): number {
  const totalUnits = calculateTotalUnits(product);
  return totalUnits > 0 ? product.cost / totalUnits : 0;
}

// Timeline event type for inventory analytics
export type TimelineEvent = {
  date: string;
  type: 'sale' | 'restock' | 'initial';
  amount: number;
  stock: number | null;
  info?: any;
  source?: string;
};

// Utility to build inventory timeline for a product
export function getInventoryTimeline(productId: string, state: {
  products: Product[];
  recipes: Recipe[];
  expenses: any[];
  inventory: InventoryItem[];
  sales: SalesRecord[];
}): TimelineEvent[] {
  const selectedInventory = state.inventory.find((item: InventoryItem) => item.productId === productId);
  if (!selectedInventory) return [];
  const product = state.products.find((p: Product) => p.id === productId);
  let timeline: TimelineEvent[] = [];
  // 1. Gather all restock events (manual updates from restockHistory)
  let restockEvents: { date: Date; type: 'restock'; amount: number; source?: string }[] = [];
  if (product && Array.isArray(product.restockHistory)) {
    restockEvents = product.restockHistory.map((restock: any) => ({
      date: new Date(restock.date),
      type: 'restock',
      amount: restock.quantity,
      source: 'manual',
    }));
  }
  // 2. Gather all resets/quantity changes from stockHistory with source 'reset'
  let resetEvents: { date: Date; type: 'restock'; amount: number; source: string }[] = [];
  if (selectedInventory.stockHistory) {
    resetEvents = selectedInventory.stockHistory
      .filter((entry: any) => entry.source === 'reset')
      .map((entry: any) => ({
        date: new Date(entry.date),
        type: 'restock',
        amount: entry.stock, // this is a reset, not an increment
        source: 'reset',
      }));
  }
  // 3. Gather all sales that use this product
  const salesForProduct = state.sales
    .map((sale: SalesRecord) => {
      const recipe = state.recipes.find((r: Recipe) => r.id === sale.recipeId);
      if (!recipe) return null;
      const ingredient = recipe.ingredients.find((ing: any) => ing.productId === productId);
      if (!ingredient) return null;
      // Calculate usage for this sale
      let usage = ingredient.quantity * sale.quantity;
      return {
        date: new Date(sale.date),
        type: 'sale' as const,
        amount: -usage,
        sale,
        recipeName: recipe.name,
      };
    })
    .filter(Boolean) as { date: Date; type: 'sale'; amount: number; sale: SalesRecord; recipeName: string }[];
  // 4. Find the earliest date among all events
  let allDates: Date[] = [];
  if (resetEvents.length > 0) allDates.push(resetEvents[0].date);
  if (restockEvents.length > 0) allDates.push(restockEvents[0].date);
  if (salesForProduct.length > 0) allDates.push(salesForProduct[0].date);
  const earliestDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
  // 5. Add explicit initial stock event just before the earliest event
  let initialStock = (product?.initialQuantity != null)
    ? product.initialQuantity
    : (product?.quantity || 0);
  const initialStockDate = new Date(earliestDate.getTime() - 1000);
  timeline.push({ date: initialStockDate.toISOString(), type: 'initial', amount: initialStock, stock: initialStock });
  // 6. Add resets as absolute stock changes (reset the running total)
  resetEvents.forEach(entry => {
    timeline.push({ date: entry.date.toISOString(), type: 'restock', amount: entry.amount, stock: entry.amount, source: entry.source });
  });
  // 7. Add manual restocks as increments
  restockEvents.forEach(entry => {
    timeline.push({ date: entry.date.toISOString(), type: 'restock', amount: entry.amount, stock: null, source: entry.source });
  });
  // 8. Add sales events
  salesForProduct.forEach(saleEvent => {
    timeline.push({
      date: saleEvent.date.toISOString(),
      type: 'sale',
      amount: saleEvent.amount,
      stock: null,
      info: { sale: saleEvent.sale, recipeName: saleEvent.recipeName },
    });
  });
  // 9. Sort all events by full ISO timestamp
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // 10. Replay events to compute stock after each event
  let runningStock = initialStock;
  timeline = timeline.map((event, idx) => {
    if (event.type === 'initial') {
      runningStock = event.stock !== null ? event.stock : runningStock;
    } else if (event.type === 'restock') {
      if (event.source === 'reset') {
        runningStock = event.amount; // reset to this value
      } else {
        runningStock += event.amount; // increment by restock amount
      }
    } else if (event.type === 'sale') {
      runningStock += event.amount; // amount is negative
    }
    return { ...event, stock: runningStock };
  });
  return timeline;
}
