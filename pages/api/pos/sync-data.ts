import { NextApiRequest, NextApiResponse } from 'next';
import { POSManager } from '../../../lib/pos-integration/pos-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dataType, days } = req.body;
    const posManager = new POSManager();

    let result;
    let message;

    switch (dataType) {
      case 'all':
        result = await posManager.syncAllData();
        message = 'All POS data synced successfully';
        break;
      case 'menu':
        const menuCount = await posManager.syncMenuItems();
        result = { success: true, itemsSynced: { menuItems: menuCount } };
        message = `${menuCount} menu items synced`;
        break;
      case 'sales':
        const salesCount = await posManager.syncSalesData(days || 30);
        result = { success: true, itemsSynced: { sales: salesCount } };
        message = `${salesCount} sales transactions synced`;
        break;
      case 'inventory':
        const inventoryCount = await posManager.syncInventory();
        result = { success: true, itemsSynced: { inventory: inventoryCount } };
        message = `${inventoryCount} inventory items synced`;
        break;
      case 'employees':
        const employeeCount = await posManager.syncEmployees();
        result = { success: true, itemsSynced: { employees: employeeCount } };
        message = `${employeeCount} employees synced`;
        break;
      case 'customers':
        const customerCount = await posManager.syncCustomers();
        result = { success: true, itemsSynced: { customers: customerCount } };
        message = `${customerCount} customers synced`;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid data type. Must be: all, menu, sales, inventory, employees, or customers',
        });
    }

    return res.status(200).json({
      success: true,
      result,
      message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('POS data sync failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync POS data',
      details: error.message,
    });
  }
}
