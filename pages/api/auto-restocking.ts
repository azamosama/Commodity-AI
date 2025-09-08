import type { NextApiRequest, NextApiResponse } from 'next';
import { PurchaseOrder, RestockingDecision, Product, Recipe, SalesRecord, InventoryItem } from '@/lib/types';
import fs from 'fs';
import path from 'path';

// Load restaurant data helper
const loadRestaurantData = async (restaurantId: string) => {
  const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');
  
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      const allData = JSON.parse(fileContent);
      return allData[restaurantId] || { products: [], recipes: [], sales: [], inventory: [] };
    }
  } catch (error) {
    console.error('Error loading restaurant data:', error);
  }
  return { products: [], recipes: [], sales: [], inventory: [] };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { restaurantId = 'default' } = req.query;

  try {
    // Load real restaurant data
    const restaurantData = await loadRestaurantData(restaurantId as string);
    const restockingData = await generateRestockingDecisions(restaurantData);
    
    res.status(200).json({
      success: true,
      data: restockingData
    });
  } catch (error) {
    console.error('Error generating restocking decisions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate restocking decisions'
    });
  }
}

async function generateRestockingDecisions(restaurantData: {
  products: Product[];
  recipes: Recipe[];
  sales: SalesRecord[];
  inventory: InventoryItem[];
}): Promise<{ decisions: RestockingDecision[]; purchaseOrders: PurchaseOrder[] }> {
  const { products, recipes, sales, inventory } = restaurantData;
  
  const decisions: RestockingDecision[] = [];
  const purchaseOrders: PurchaseOrder[] = [];
  
  // Generate restocking decisions for each product
  for (const product of products) {
    // Get current inventory
    const currentInventory = inventory.find(i => i.productId === product.id);
    const currentStock = currentInventory?.currentStock || product.quantity || 0;
    
    // Calculate average daily usage
    let totalUsage = 0;
    let usageDays = 0;
    
    for (const sale of sales) {
      const recipe = recipes.find(r => r.id === sale.recipeId);
      if (recipe) {
        const ingredient = recipe.ingredients.find(i => i.productId === product.id);
        if (ingredient) {
          const quantity = typeof ingredient.quantity === 'string' ? parseFloat(ingredient.quantity) || 0 : ingredient.quantity;
          totalUsage += quantity * sale.quantity;
          usageDays++;
        }
      }
    }
    
    const averageDailyUsage = usageDays > 0 ? totalUsage / usageDays : 2;
    const safetyStock = product.safetyStock || Math.max(5, averageDailyUsage * 3);
    const reorderPoint = product.reorderPoint || Math.max(10, averageDailyUsage * 5);
    const leadTime = product.leadTime || 7; // Default 7 days
    
    // Check if restocking is needed
    const needsRestocking = currentStock <= reorderPoint;
    const isLowStock = currentStock <= safetyStock;
    
    if (needsRestocking) {
      // Calculate order quantity
      const daysUntilDepletion = currentStock / averageDailyUsage;
      const orderQuantity = Math.max(
        Math.ceil(averageDailyUsage * 14), // 2 weeks worth
        Math.ceil(averageDailyUsage * (leadTime + 7)) // Lead time + 1 week buffer
      );
      
      // Create restocking decision
      const decision: RestockingDecision = {
        id: `rd_${product.id}_${Date.now()}`,
        productId: product.id,
        productName: product.name,
        currentStock,
        reorderPoint,
        safetyStock,
        averageDailyUsage,
        daysUntilDepletion: Math.floor(daysUntilDepletion),
        suggestedOrderQuantity: orderQuantity,
        urgency: isLowStock ? 'high' : 'medium',
        reason: isLowStock ? 'Low stock - immediate action required' : 'Below reorder point',
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      decisions.push(decision);
      
      // Create purchase order if auto-restock is enabled
      if (product.autoRestockEnabled !== false) { // Default to true
        const purchaseOrder: PurchaseOrder = {
          id: `po_${product.id}_${Date.now()}`,
          supplierId: product.supplier || 'default-supplier',
          supplierName: product.supplier || 'Default Supplier',
          status: 'pending',
          totalAmount: orderQuantity * product.cost,
          items: [{
            productId: product.id,
            productName: product.name,
            quantity: orderQuantity,
            unitCost: product.cost,
            totalCost: orderQuantity * product.cost,
            unit: product.unit
          }],
          createdAt: new Date().toISOString(),
          expectedDelivery: new Date(Date.now() + leadTime * 24 * 60 * 60 * 1000).toISOString(),
          notes: `Auto-generated order for ${product.name}. Current stock: ${currentStock} ${product.unit}`
        };
        
        purchaseOrders.push(purchaseOrder);
      }
    }
  }
  
  return { decisions, purchaseOrders };
}
