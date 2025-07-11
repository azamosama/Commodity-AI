import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Product } from './types'

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
