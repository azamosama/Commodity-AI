import { POSAPIConnector, POSConfig, POSMenuItem, POSSalesTransaction, POSInventoryItem, POSEmployee, POSCustomer } from './types';

export class CustomPOSConnector implements POSAPIConnector {
  name = 'Custom POS';
  config: POSConfig;
  private customConfig: any;

  constructor(config: POSConfig, customConfig?: any) {
    this.config = config;
    this.customConfig = customConfig || {};
  }

  private async makeRequest(endpoint: string, method = 'GET', body?: any): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.customConfig.headers,
    };

    // Add authentication based on config type
    if (this.config.apiKey) {
      if (this.customConfig.authType === 'bearer') {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      } else if (this.customConfig.authType === 'api_key') {
        headers['X-API-Key'] = this.config.apiKey;
      } else {
        headers['Authorization'] = `Basic ${btoa(this.config.apiKey + ':' + (this.config.apiSecret || ''))}`;
      }
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Custom POS API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      const testEndpoint = this.customConfig.testEndpoint || '/health' || '/ping' || '/status';
      await this.makeRequest(testEndpoint);
      return true;
    } catch (error) {
      console.error('Custom POS connection test failed:', error);
      return false;
    }
  }

  async getMenuItems(): Promise<POSMenuItem[]> {
    try {
      const endpoint = this.customConfig.endpoints?.menuItems || '/menu' || '/items' || '/products';
      const data = await this.makeRequest(endpoint);
      return this.mapMenuItems(data);
    } catch (error) {
      console.error('Failed to fetch custom POS menu items:', error);
      return [];
    }
  }

  async getSalesData(startDate: Date, endDate: Date): Promise<POSSalesTransaction[]> {
    try {
      const endpoint = this.customConfig.endpoints?.sales || '/sales' || '/orders' || '/transactions';
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...this.customConfig.salesParams,
      });
      
      const data = await this.makeRequest(`${endpoint}?${params}`);
      return this.mapSalesData(data);
    } catch (error) {
      console.error('Failed to fetch custom POS sales data:', error);
      return [];
    }
  }

  async getInventory(): Promise<POSInventoryItem[]> {
    try {
      const endpoint = this.customConfig.endpoints?.inventory || '/inventory' || '/stock' || '/items';
      const data = await this.makeRequest(endpoint);
      return this.mapInventoryData(data);
    } catch (error) {
      console.error('Failed to fetch custom POS inventory:', error);
      return [];
    }
  }

  async getEmployees(): Promise<POSEmployee[]> {
    try {
      const endpoint = this.customConfig.endpoints?.employees || '/employees' || '/staff' || '/users';
      const data = await this.makeRequest(endpoint);
      return this.mapEmployeeData(data);
    } catch (error) {
      console.error('Failed to fetch custom POS employees:', error);
      return [];
    }
  }

  async getCustomers(): Promise<POSCustomer[]> {
    try {
      const endpoint = this.customConfig.endpoints?.customers || '/customers' || '/clients' || '/users';
      const data = await this.makeRequest(endpoint);
      return this.mapCustomerData(data);
    } catch (error) {
      console.error('Failed to fetch custom POS customers:', error);
      return [];
    }
  }

  // Flexible data mapping methods
  private mapMenuItems(rawData: any[]): POSMenuItem[] {
    const mapping = this.customConfig.mapping?.menuItems || {
      id: 'id',
      name: 'name',
      description: 'description',
      price: 'price',
      category: 'category',
      ingredients: 'ingredients',
    };

    return rawData.map((item: any) => ({
      id: `custom_${this.getNestedValue(item, mapping.id)}`,
      name: this.getNestedValue(item, mapping.name) || 'Unknown Item',
      description: this.getNestedValue(item, mapping.description),
      price: parseFloat(this.getNestedValue(item, mapping.price)) || 0,
      category: this.getNestedValue(item, mapping.category) || 'Uncategorized',
      subcategory: this.getNestedValue(item, mapping.subcategory),
      isActive: this.getNestedValue(item, mapping.isActive) !== false,
      ingredients: this.mapIngredients(this.getNestedValue(item, mapping.ingredients) || []),
      posItemId: this.getNestedValue(item, mapping.id),
      posSystem: 'custom',
    }));
  }

  private mapSalesData(rawData: any[]): POSSalesTransaction[] {
    const mapping = this.customConfig.mapping?.sales || {
      id: 'id',
      orderId: 'orderId',
      date: 'date',
      items: 'items',
      total: 'total',
      subtotal: 'subtotal',
      tax: 'tax',
      tip: 'tip',
    };

    return rawData.map((order: any) => ({
      id: `custom_${this.getNestedValue(order, mapping.id)}`,
      orderId: this.getNestedValue(order, mapping.orderId) || this.getNestedValue(order, mapping.id),
      date: new Date(this.getNestedValue(order, mapping.date)),
      items: this.mapSalesItems(this.getNestedValue(order, mapping.items) || []),
      subtotal: parseFloat(this.getNestedValue(order, mapping.subtotal)) || 0,
      tax: parseFloat(this.getNestedValue(order, mapping.tax)) || 0,
      tip: parseFloat(this.getNestedValue(order, mapping.tip)) || 0,
      total: parseFloat(this.getNestedValue(order, mapping.total)) || 0,
      paymentMethod: this.getNestedValue(order, mapping.paymentMethod) || 'unknown',
      employeeId: this.getNestedValue(order, mapping.employeeId) ? `custom_emp_${this.getNestedValue(order, mapping.employeeId)}` : undefined,
      customerId: this.getNestedValue(order, mapping.customerId) ? `custom_cust_${this.getNestedValue(order, mapping.customerId)}` : undefined,
      posTransactionId: this.getNestedValue(order, mapping.id),
      posSystem: 'custom',
    }));
  }

  private mapInventoryData(rawData: any[]): POSInventoryItem[] {
    const mapping = this.customConfig.mapping?.inventory || {
      id: 'id',
      name: 'name',
      sku: 'sku',
      quantity: 'quantity',
      unit: 'unit',
      cost: 'cost',
    };

    return rawData.map((item: any) => ({
      id: `custom_inv_${this.getNestedValue(item, mapping.id)}`,
      name: this.getNestedValue(item, mapping.name) || 'Unknown Item',
      sku: this.getNestedValue(item, mapping.sku) || '',
      currentStock: parseFloat(this.getNestedValue(item, mapping.quantity)) || 0,
      unit: this.getNestedValue(item, mapping.unit) || 'each',
      reorderPoint: parseFloat(this.getNestedValue(item, mapping.reorderPoint)) || 0,
      reorderQuantity: parseFloat(this.getNestedValue(item, mapping.reorderQuantity)) || 0,
      cost: parseFloat(this.getNestedValue(item, mapping.cost)) || 0,
      supplier: this.getNestedValue(item, mapping.supplier) || 'Unknown',
      lastUpdated: new Date(this.getNestedValue(item, mapping.lastUpdated) || Date.now()),
      posInventoryId: this.getNestedValue(item, mapping.id),
      posSystem: 'custom',
    }));
  }

  private mapEmployeeData(rawData: any[]): POSEmployee[] {
    const mapping = this.customConfig.mapping?.employees || {
      id: 'id',
      name: 'name',
      email: 'email',
      role: 'role',
      isActive: 'isActive',
    };

    return rawData.map((emp: any) => ({
      id: `custom_emp_${this.getNestedValue(emp, mapping.id)}`,
      name: this.getNestedValue(emp, mapping.name) || 'Unknown Employee',
      email: this.getNestedValue(emp, mapping.email) || '',
      role: this.getNestedValue(emp, mapping.role) || 'Employee',
      isActive: this.getNestedValue(emp, mapping.isActive) !== false,
      posEmployeeId: this.getNestedValue(emp, mapping.id),
      posSystem: 'custom',
    }));
  }

  private mapCustomerData(rawData: any[]): POSCustomer[] {
    const mapping = this.customConfig.mapping?.customers || {
      id: 'id',
      name: 'name',
      email: 'email',
      phone: 'phone',
      totalSpent: 'totalSpent',
      lastVisit: 'lastVisit',
    };

    return rawData.map((cust: any) => ({
      id: `custom_cust_${this.getNestedValue(cust, mapping.id)}`,
      name: this.getNestedValue(cust, mapping.name) || 'Unknown Customer',
      email: this.getNestedValue(cust, mapping.email) || '',
      phone: this.getNestedValue(cust, mapping.phone),
      loyaltyPoints: parseFloat(this.getNestedValue(cust, mapping.loyaltyPoints)) || 0,
      totalSpent: parseFloat(this.getNestedValue(cust, mapping.totalSpent)) || 0,
      lastVisit: new Date(this.getNestedValue(cust, mapping.lastVisit) || Date.now()),
      posCustomerId: this.getNestedValue(cust, mapping.id),
      posSystem: 'custom',
    }));
  }

  private mapIngredients(ingredients: any[]): any[] {
    const mapping = this.customConfig.mapping?.ingredients || {
      id: 'id',
      name: 'name',
      quantity: 'quantity',
      unit: 'unit',
      cost: 'cost',
    };

    return ingredients.map((ing: any) => ({
      id: `custom_ing_${this.getNestedValue(ing, mapping.id)}`,
      name: this.getNestedValue(ing, mapping.name) || 'Unknown Ingredient',
      quantity: parseFloat(this.getNestedValue(ing, mapping.quantity)) || 1,
      unit: this.getNestedValue(ing, mapping.unit) || 'each',
      cost: parseFloat(this.getNestedValue(ing, mapping.cost)) || 0,
      posIngredientId: this.getNestedValue(ing, mapping.id),
    }));
  }

  private mapSalesItems(items: any[]): any[] {
    const mapping = this.customConfig.mapping?.salesItems || {
      itemId: 'itemId',
      name: 'name',
      quantity: 'quantity',
      unitPrice: 'unitPrice',
      totalPrice: 'totalPrice',
    };

    return items.map((item: any) => ({
      itemId: `custom_${this.getNestedValue(item, mapping.itemId)}`,
      name: this.getNestedValue(item, mapping.name) || 'Unknown Item',
      quantity: parseFloat(this.getNestedValue(item, mapping.quantity)) || 1,
      unitPrice: parseFloat(this.getNestedValue(item, mapping.unitPrice)) || 0,
      totalPrice: parseFloat(this.getNestedValue(item, mapping.totalPrice)) || 0,
      modifiers: [],
      discounts: [],
    }));
  }

  // Helper method to get nested object values
  private getNestedValue(obj: any, path: string): any {
    if (!path) return undefined;
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}
