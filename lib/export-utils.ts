import { SalesRecord, Product, Recipe, PurchaseOrder } from './types';

// CSV Export Functions
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that need quotes (contain commas, quotes, or newlines)
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Excel Export Functions (using SheetJS library)
export const exportToExcel = async (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  try {
    // Dynamic import to avoid bundling issues
    const XLSX = await import('xlsx');
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate and download file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    // Fallback to CSV if Excel export fails
    exportToCSV(data, filename);
  }
};

// Sales Records Export
export const exportSalesRecords = (salesRecords: any[], recipes: any[] = [], format: 'csv' | 'excel' = 'csv') => {
  if (!salesRecords || salesRecords.length === 0) {
    console.warn('No sales records to export');
    return;
  }
  
  const exportData = salesRecords.map(record => {
    return {
      'Recipe/Menu Item': record.recipeName || 'N/A',
      'Units Sold': record.quantity || 0,
      'Sale Price (Per Unit)': `$${(record.salePrice || 0).toFixed(2)}`,
      'Date': record.date ? new Date(record.date).toISOString().split('T')[0] : 'N/A'
    };
  });

  const filename = `sales-records-${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'excel') {
    exportToExcel(exportData, filename, 'Sales Records');
  } else {
    exportToCSV(exportData, filename);
  }
};

// Inventory Export
export const exportInventory = (products: any[], inventory: any[] = [], recipes: any[] = [], sales: any[] = [], format: 'csv' | 'excel' = 'csv') => {
  if (!products || products.length === 0) {
    console.warn('No inventory items to export');
    return;
  }
  
  const exportData = products.map(product => {
    const item = inventory.find((i) => i.productId === product.id);
    const currentStock = item ? item.currentStock : product.quantity || 0;
    const totalStock = product.quantity || 0;
    const usedInRecipes = recipes
      .filter((recipe) => recipe.ingredients.some((ing: any) => ing.productId === product.id))
      .map((recipe) => recipe.name)
      .join(', ');
    
    // Calculate variance and shrinkage (same logic as in the table)
    let used = 0;
    recipes.forEach(recipe => {
      const ingredient = recipe.ingredients.find((ing: any) => ing.productId === product.id);
      if (ingredient) {
        const numSold = sales.filter((s: any) => s.recipeId === recipe.id).reduce((sum: number, s: any) => sum + s.quantity, 0);
        used += ingredient.quantity * numSold;
      }
    });
    const variance = totalStock - used;
    const shrinkage = totalStock > 0 ? ((variance) / totalStock) * 100 : 0;
    
    return {
      'Product': product.name || 'N/A',
      'Current Stock': `${currentStock} / ${totalStock}`,
      'Reorder Point': item ? item.reorderPoint : 0,
      'Unit': product.unit || 'N/A',
      'Last Updated': item && item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'Invalid Date',
      'Used In Recipes': usedInRecipes || '-',
      'Variance': variance.toFixed(1),
      'Shrinkage %': `${shrinkage.toFixed(1)}%`,
      'Restock Recommendation': currentStock <= (item ? item.reorderPoint : 0) ? '✔' : ''
    };
  });

  const filename = `inventory-${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'excel') {
    exportToExcel(exportData, filename, 'Current Inventory');
  } else {
    exportToCSV(exportData, filename);
  }
};

// Recipe Cost Analysis Export
export const exportRecipeCosts = (recipes: any[], format: 'csv' | 'excel' = 'csv') => {
  if (!recipes || recipes.length === 0) {
    console.warn('No recipes to export');
    return;
  }
  
  const exportData = recipes.map(recipe => {
    const totalCost = (recipe.ingredients || []).reduce((sum: number, ingredient: any) => {
      // Calculate ingredient cost (simplified calculation)
      return sum + ((ingredient.quantity || 0) * 2); // Placeholder calculation
    }, 0);
    
    return {
      'Recipe Name': recipe.name || 'N/A',
      'Servings': recipe.servings || 1,
      'Serving Size': `${recipe.servingSize || 1} ${recipe.servingUnit || 'serving'}`,
      'Total Cost': `$${totalCost.toFixed(2)}`,
      'Cost Per Serving': `$${(totalCost / Math.max(recipe.servings || 1, 1)).toFixed(2)}`,
      'Suggested Price (3x markup)': `$${((totalCost / Math.max(recipe.servings || 1, 1)) * 3).toFixed(2)}`,
      'Profit Margin': `${((2/3) * 100).toFixed(1)}%`,
      'Difficulty': recipe.difficulty || 'N/A',
      'Prep Time (min)': recipe.prepTime || 0,
      'Cook Time (min)': recipe.cookTime || 0,
      'Ingredients Count': (recipe.ingredients || []).length,
      'Tags': recipe.tags?.join(', ') || 'N/A'
    };
  });

  const filename = `recipe-cost-analysis-${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'excel') {
    exportToExcel(exportData, filename, 'Recipe Costs');
  } else {
    exportToCSV(exportData, filename);
  }
};

// Purchase Orders Export
export const exportPurchaseOrders = (purchaseOrders: any[], format: 'csv' | 'excel' = 'csv') => {
  const exportData = purchaseOrders.map(order => ({
    'Order ID': order.id || 'N/A',
    'Supplier': order.supplier || 'N/A',
    'Order Date': order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A',
    'Expected Delivery': order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : 'N/A',
    'Status': order.status || 'N/A',
    'Total Items': order.items?.length || 0,
    'Total Cost': order.items ? `$${order.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitCost), 0).toFixed(2)}` : '$0.00',
    'Priority': order.priority || 'N/A',
    'Notes': order.notes || 'N/A'
  }));

  const filename = `purchase-orders-${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'excel') {
    exportToExcel(exportData, filename, 'Purchase Orders');
  } else {
    exportToCSV(exportData, filename);
  }
};

// Comprehensive Restaurant Report
export const exportRestaurantReport = async (
  salesRecords: any[], 
  products: any[], 
  recipes: any[], 
  purchaseOrders: any[],
  format: 'csv' | 'excel' = 'excel'
) => {
  if (format === 'excel') {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      // Sales Summary
      const salesSummary = [
        {
          'Total Sales': salesRecords.length,
          'Total Revenue': `$${salesRecords.reduce((sum: number, record: any) => sum + (record.quantity * record.salePrice), 0).toFixed(2)}`,
          'Average Order Value': salesRecords.length > 0 ? `$${(salesRecords.reduce((sum: number, record: any) => sum + (record.quantity * record.salePrice), 0) / salesRecords.length).toFixed(2)}` : '$0.00',
          'Date Range': salesRecords.length > 0 ? `${new Date(Math.min(...salesRecords.map((r: any) => new Date(r.date).getTime()))).toLocaleDateString()} - ${new Date(Math.max(...salesRecords.map((r: any) => new Date(r.date).getTime()))).toLocaleDateString()}` : 'N/A'
        }
      ];
      const salesSheet = XLSX.utils.json_to_sheet(salesSummary);
      XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales Summary');

      // Inventory Summary
      const inventorySummary = [
        {
          'Total Products': products.length,
          'Low Stock Items': products.filter((p: any) => p.quantity <= (p.reorderPoint || 0)).length,
          'Total Inventory Value': `$${products.reduce((sum: number, product: any) => sum + (product.quantity * product.cost), 0).toFixed(2)}`,
          'Average Stock Level': products.length > 0 ? (products.reduce((sum: number, product: any) => sum + product.quantity, 0) / products.length).toFixed(1) : '0'
        }
      ];
      const inventorySheet = XLSX.utils.json_to_sheet(inventorySummary);
      XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Inventory Summary');

      // Detailed sheets
      const salesData = salesRecords.map((record: any) => ({
        'Recipe/Menu Item': record.recipeName || 'N/A',
        'Units Sold': record.quantity || 0,
        'Sale Price': `$${(record.salePrice || 0).toFixed(2)}`,
        'Total Revenue': `$${((record.quantity || 0) * (record.salePrice || 0)).toFixed(2)}`,
        'Date': record.date ? new Date(record.date).toLocaleDateString() : 'N/A'
      }));
      const salesDetailSheet = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(workbook, salesDetailSheet, 'Sales Details');

      const inventoryData = products.map((product: any) => ({
        'Product': product.name || 'N/A',
        'Current Stock': product.quantity || 0,
        'Unit': product.unit || 'N/A',
        'Reorder Point': product.reorderPoint || 0,
        'Cost': `$${(product.cost || 0).toFixed(2)}`,
        'Last Updated': product.lastUpdated ? new Date(product.lastUpdated).toLocaleDateString() : 'N/A'
      }));
      const inventoryDetailSheet = XLSX.utils.json_to_sheet(inventoryData);
      XLSX.utils.book_append_sheet(workbook, inventoryDetailSheet, 'Inventory Details');

      const filename = `restaurant-report-${new Date().toISOString().split('T')[0]}`;
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error creating comprehensive report:', error);
    }
  } else {
    // For CSV, export each section separately
    exportSalesRecords(salesRecords, 'csv');
    exportInventory(products, 'csv');
    exportRecipeCosts(recipes, 'csv');
    exportPurchaseOrders(purchaseOrders, 'csv');
  }
};
