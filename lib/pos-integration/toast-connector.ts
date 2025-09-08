import { POSAPIConnector, POSConfig, POSMenuItem, POSSalesTransaction, POSInventoryItem, POSEmployee, POSCustomer, POSDataMapper } from './types';

export class ToastConnector implements POSAPIConnector {
  name = 'Toast POS';
  config: POSConfig;
  private baseUrl = 'https://api.toasttab.com';
  private accessToken: string | null = null;

  constructor(config: POSConfig) {
    this.config = config;
  }

  private async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/authentication/v1/authentication/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Toast-Restaurant-External-ID': this.config.restaurantId,
        },
        body: JSON.stringify({
          clientId: this.config.apiKey,
          clientSecret: this.config.apiSecret,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.accessToken;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Toast authentication failed:', error);
      return false;
    }
  }

  private async makeRequest(endpoint: string, method = 'GET', body?: any): Promise<any> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Failed to authenticate with Toast POS');
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Toast-Restaurant-External-ID': this.config.restaurantId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Toast API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/config/v2/restaurants');
      return true;
    } catch (error) {
      console.error('Toast connection test failed:', error);
      return false;
    }
  }

  async getMenuItems(): Promise<POSMenuItem[]> {
    try {
      const data = await this.makeRequest('/menu/v2/menus');
      return this.mapMenuItems(data);
    } catch (error) {
      console.error('Failed to fetch Toast menu items:', error);
      return [];
    }
  }

  async getSalesData(startDate: Date, endDate: Date): Promise<POSSalesTransaction[]> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const data = await this.makeRequest(
        `/orders/v2/orders?startDate=${startDateStr}&endDate=${endDateStr}`
      );
      
      return this.mapSalesData(data);
    } catch (error) {
      console.error('Failed to fetch Toast sales data:', error);
      return [];
    }
  }

  async getInventory(): Promise<POSInventoryItem[]> {
    try {
      const data = await this.makeRequest('/inventory/v1/inventory-items');
      return this.mapInventoryData(data);
    } catch (error) {
      console.error('Failed to fetch Toast inventory:', error);
      return [];
    }
  }

  async getEmployees(): Promise<POSEmployee[]> {
    try {
      const data = await this.makeRequest('/user/v2/employees');
      return this.mapEmployeeData(data);
    } catch (error) {
      console.error('Failed to fetch Toast employees:', error);
      return [];
    }
  }

  async getCustomers(): Promise<POSCustomer[]> {
    try {
      const data = await this.makeRequest('/customer/v2/customers');
      return this.mapCustomerData(data);
    } catch (error) {
      console.error('Failed to fetch Toast customers:', error);
      return [];
    }
  }

  async updateInventory(itemId: string, quantity: number): Promise<boolean> {
    try {
      await this.makeRequest(`/inventory/v1/inventory-items/${itemId}`, 'PUT', {
        quantity: quantity,
      });
      return true;
    } catch (error) {
      console.error('Failed to update Toast inventory:', error);
      return false;
    }
  }

  // Data mapping methods
  private mapMenuItems(rawData: any[]): POSMenuItem[] {
    return rawData.map((item: any) => ({
      id: `toast_${item.guid}`,
      name: item.name,
      description: item.description,
      price: item.price / 100, // Toast prices are in cents
      category: item.category?.name || 'Uncategorized',
      subcategory: item.subcategory?.name,
      isActive: item.active,
      ingredients: item.ingredients?.map((ing: any) => ({
        id: `toast_ing_${ing.guid}`,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        cost: ing.cost / 100,
        posIngredientId: ing.guid,
      })) || [],
      modifiers: item.modifiers?.map((mod: any) => ({
        id: `toast_mod_${mod.guid}`,
        name: mod.name,
        price: mod.price / 100,
        isRequired: mod.required,
        maxSelections: mod.maxSelections,
        options: mod.options?.map((opt: any) => ({
          id: `toast_opt_${opt.guid}`,
          name: opt.name,
          price: opt.price / 100,
          isAvailable: opt.active,
        })) || [],
      })) || [],
      allergens: item.allergens?.map((a: any) => a.name) || [],
      nutritionalInfo: item.nutritionalInfo ? {
        calories: item.nutritionalInfo.calories,
        protein: item.nutritionalInfo.protein,
        carbs: item.nutritionalInfo.carbs,
        fat: item.nutritionalInfo.fat,
        fiber: item.nutritionalInfo.fiber,
        sugar: item.nutritionalInfo.sugar,
        sodium: item.nutritionalInfo.sodium,
      } : undefined,
      posItemId: item.guid,
      posSystem: 'toast',
    }));
  }

  private mapSalesData(rawData: any[]): POSSalesTransaction[] {
    return rawData.map((order: any) => ({
      id: `toast_${order.guid}`,
      orderId: order.orderNumber,
      date: new Date(order.createdDate),
      items: order.items?.map((item: any) => ({
        itemId: `toast_${item.guid}`,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice / 100,
        totalPrice: item.totalPrice / 100,
        modifiers: item.modifiers?.map((mod: any) => ({
          modifierId: `toast_mod_${mod.guid}`,
          name: mod.name,
          price: mod.price / 100,
        })) || [],
        discounts: item.discounts?.map((disc: any) => ({
          type: disc.type,
          amount: disc.amount / 100,
          reason: disc.reason,
        })) || [],
      })) || [],
      subtotal: order.subtotal / 100,
      tax: order.tax / 100,
      tip: order.tip / 100,
      total: order.total / 100,
      paymentMethod: order.paymentMethod,
      employeeId: `toast_emp_${order.employee?.guid}`,
      customerId: order.customer?.guid ? `toast_cust_${order.customer.guid}` : undefined,
      posTransactionId: order.guid,
      posSystem: 'toast',
    }));
  }

  private mapInventoryData(rawData: any[]): POSInventoryItem[] {
    return rawData.map((item: any) => ({
      id: `toast_inv_${item.guid}`,
      name: item.name,
      sku: item.sku,
      currentStock: item.quantity,
      unit: item.unit,
      reorderPoint: item.reorderPoint,
      reorderQuantity: item.reorderQuantity,
      cost: item.cost / 100,
      supplier: item.supplier?.name || 'Unknown',
      lastUpdated: new Date(item.lastUpdated),
      posInventoryId: item.guid,
      posSystem: 'toast',
    }));
  }

  private mapEmployeeData(rawData: any[]): POSEmployee[] {
    return rawData.map((emp: any) => ({
      id: `toast_emp_${emp.guid}`,
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      role: emp.role,
      isActive: emp.active,
      posEmployeeId: emp.guid,
      posSystem: 'toast',
    }));
  }

  private mapCustomerData(rawData: any[]): POSCustomer[] {
    return rawData.map((cust: any) => ({
      id: `toast_cust_${cust.guid}`,
      name: `${cust.firstName} ${cust.lastName}`,
      email: cust.email,
      phone: cust.phone,
      loyaltyPoints: cust.loyaltyPoints,
      totalSpent: cust.totalSpent / 100,
      lastVisit: new Date(cust.lastVisit),
      posCustomerId: cust.guid,
      posSystem: 'toast',
    }));
  }
}
