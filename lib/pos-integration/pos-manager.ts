import { POSConfig, POSAPIConnector, POSSyncResult, POSMenuItem, POSSalesTransaction, POSInventoryItem, POSEmployee, POSCustomer } from './types';
import { ToastConnector } from './toast-connector';
import { SquareConnector } from './square-connector';

export class POSManager {
  private connectors: Map<string, POSAPIConnector> = new Map();
  private configs: POSConfig[] = [];

  constructor() {
    this.loadConfigs();
  }

  private loadConfigs() {
    // Load POS configurations from environment or database
    // For now, we'll use environment variables
    const toastConfig = this.getToastConfig();
    const squareConfig = this.getSquareConfig();

    if (toastConfig) {
      this.addConnector('toast', new ToastConnector(toastConfig));
      this.configs.push(toastConfig);
    }

    if (squareConfig) {
      this.addConnector('square', new SquareConnector(squareConfig));
      this.configs.push(squareConfig);
    }
  }

  private getToastConfig(): POSConfig | null {
    const apiKey = process.env.TOAST_API_KEY;
    const apiSecret = process.env.TOAST_API_SECRET;
    const restaurantId = process.env.TOAST_RESTAURANT_ID;

    if (!apiKey || !apiSecret || !restaurantId) {
      return null;
    }

    return {
      id: 'toast_primary',
      name: 'Toast POS',
      type: 'toast',
      apiKey,
      apiSecret,
      baseUrl: 'https://api.toasttab.com',
      restaurantId,
      isActive: true,
      syncFrequency: 'hourly',
    };
  }

  private getSquareConfig(): POSConfig | null {
    const apiKey = process.env.SQUARE_API_KEY;
    const restaurantId = process.env.SQUARE_LOCATION_ID;

    if (!apiKey || !restaurantId) {
      return null;
    }

    return {
      id: 'square_primary',
      name: 'Square POS',
      type: 'square',
      apiKey,
      baseUrl: 'https://connect.squareup.com',
      restaurantId,
      isActive: true,
      syncFrequency: 'hourly',
    };
  }

  addConnector(name: string, connector: POSAPIConnector) {
    this.connectors.set(name, connector);
  }

  getConnector(name: string): POSAPIConnector | undefined {
    return this.connectors.get(name);
  }

  getActiveConnectors(): POSAPIConnector[] {
    return Array.from(this.connectors.values()).filter(
      connector => connector.config.isActive
    );
  }

  async testAllConnections(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    for (const [name, connector] of this.connectors) {
      try {
        results[name] = await connector.testConnection();
      } catch (error) {
        console.error(`Connection test failed for ${name}:`, error);
        results[name] = false;
      }
    }

    return results;
  }

  async syncAllData(): Promise<POSSyncResult> {
    const result: POSSyncResult = {
      success: true,
      timestamp: new Date(),
      itemsSynced: {
        menuItems: 0,
        sales: 0,
        inventory: 0,
        employees: 0,
        customers: 0,
      },
      errors: [],
      warnings: [],
    };

    const activeConnectors = this.getActiveConnectors();

    for (const connector of activeConnectors) {
      try {
        console.log(`Syncing data from ${connector.name}...`);
        
        // Sync menu items
        const menuItems = await connector.getMenuItems();
        await this.saveMenuItems(menuItems);
        result.itemsSynced.menuItems += menuItems.length;

        // Sync sales data (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const salesData = await connector.getSalesData(startDate, endDate);
        await this.saveSalesData(salesData);
        result.itemsSynced.sales += salesData.length;

        // Sync inventory
        const inventory = await connector.getInventory();
        await this.saveInventory(inventory);
        result.itemsSynced.inventory += inventory.length;

        // Sync employees
        const employees = await connector.getEmployees();
        await this.saveEmployees(employees);
        result.itemsSynced.employees += employees.length;

        // Sync customers
        const customers = await connector.getCustomers();
        await this.saveCustomers(customers);
        result.itemsSynced.customers += customers.length;

        console.log(`Successfully synced ${connector.name} data`);
      } catch (error) {
        console.error(`Failed to sync ${connector.name} data:`, error);
        result.errors.push(`${connector.name}: ${error.message}`);
        result.success = false;
      }
    }

    return result;
  }

  async syncMenuItems(): Promise<number> {
    let totalItems = 0;
    const activeConnectors = this.getActiveConnectors();

    for (const connector of activeConnectors) {
      try {
        const menuItems = await connector.getMenuItems();
        await this.saveMenuItems(menuItems);
        totalItems += menuItems.length;
      } catch (error) {
        console.error(`Failed to sync menu items from ${connector.name}:`, error);
      }
    }

    return totalItems;
  }

  async syncSalesData(days: number = 30): Promise<number> {
    let totalTransactions = 0;
    const activeConnectors = this.getActiveConnectors();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (const connector of activeConnectors) {
      try {
        const salesData = await connector.getSalesData(startDate, endDate);
        await this.saveSalesData(salesData);
        totalTransactions += salesData.length;
      } catch (error) {
        console.error(`Failed to sync sales data from ${connector.name}:`, error);
      }
    }

    return totalTransactions;
  }

  async syncInventory(): Promise<number> {
    let totalItems = 0;
    const activeConnectors = this.getActiveConnectors();

    for (const connector of activeConnectors) {
      try {
        const inventory = await connector.getInventory();
        await this.saveInventory(inventory);
        totalItems += inventory.length;
      } catch (error) {
        console.error(`Failed to sync inventory from ${connector.name}:`, error);
      }
    }

    return totalItems;
  }

  async syncEmployees(): Promise<number> {
    let totalEmployees = 0;
    const activeConnectors = this.getActiveConnectors();

    for (const connector of activeConnectors) {
      try {
        const employees = await connector.getEmployees();
        await this.saveEmployees(employees);
        totalEmployees += employees.length;
      } catch (error) {
        console.error(`Failed to sync employees from ${connector.name}:`, error);
      }
    }

    return totalEmployees;
  }

  async syncCustomers(): Promise<number> {
    let totalCustomers = 0;
    const activeConnectors = this.getActiveConnectors();

    for (const connector of activeConnectors) {
      try {
        const customers = await connector.getCustomers();
        await this.saveCustomers(customers);
        totalCustomers += customers.length;
      } catch (error) {
        console.error(`Failed to sync customers from ${connector.name}:`, error);
      }
    }

    return totalCustomers;
  }

  // Data persistence methods
  private async saveMenuItems(menuItems: POSMenuItem[]): Promise<void> {
    // Save to database or local storage
    // For now, we'll save to a JSON file
    const fs = require('fs').promises;
    const path = require('path');
    
    const dataPath = path.join(process.cwd(), 'data', 'pos-menu-items.json');
    await fs.writeFile(dataPath, JSON.stringify(menuItems, null, 2));
  }

  private async saveSalesData(salesData: POSSalesTransaction[]): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const dataPath = path.join(process.cwd(), 'data', 'pos-sales.json');
    await fs.writeFile(dataPath, JSON.stringify(salesData, null, 2));
  }

  private async saveInventory(inventory: POSInventoryItem[]): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const dataPath = path.join(process.cwd(), 'data', 'pos-inventory.json');
    await fs.writeFile(dataPath, JSON.stringify(inventory, null, 2));
  }

  private async saveEmployees(employees: POSEmployee[]): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const dataPath = path.join(process.cwd(), 'data', 'pos-employees.json');
    await fs.writeFile(dataPath, JSON.stringify(employees, null, 2));
  }

  private async saveCustomers(customers: POSCustomer[]): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const dataPath = path.join(process.cwd(), 'data', 'pos-customers.json');
    await fs.writeFile(dataPath, JSON.stringify(customers, null, 2));
  }

  // Real-time sync methods
  startRealTimeSync(): void {
    // Start WebSocket connections for real-time updates
    console.log('Starting real-time POS sync...');
    
    // For now, we'll use polling every 5 minutes
    setInterval(async () => {
      try {
        await this.syncAllData();
        console.log('Real-time sync completed');
      } catch (error) {
        console.error('Real-time sync failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  stopRealTimeSync(): void {
    // Stop real-time sync
    console.log('Stopping real-time POS sync...');
  }

  onDataUpdate(callback: (data: any) => void): void {
    // Register callback for data updates
    // This would be used with WebSocket connections
  }
}
