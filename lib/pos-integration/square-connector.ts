import { POSAPIConnector, POSConfig, POSMenuItem, POSSalesTransaction, POSInventoryItem, POSEmployee, POSCustomer } from './types';

export class SquareConnector implements POSAPIConnector {
  name = 'Square POS';
  config: POSConfig;
  private baseUrl = 'https://connect.squareup.com';

  constructor(config: POSConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, method = 'GET', body?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-17',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Square API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/v2/locations');
      return true;
    } catch (error) {
      console.error('Square connection test failed:', error);
      return false;
    }
  }

  async getMenuItems(): Promise<POSMenuItem[]> {
    try {
      const data = await this.makeRequest('/v2/catalog/list?types=ITEM');
      return this.mapMenuItems(data.objects || []);
    } catch (error) {
      console.error('Failed to fetch Square menu items:', error);
      return [];
    }
  }

  async getSalesData(startDate: Date, endDate: Date): Promise<POSSalesTransaction[]> {
    try {
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      const data = await this.makeRequest(
        `/v2/orders/search`,
        'POST',
        {
          location_ids: [this.config.restaurantId],
          query: {
            filter: {
              date_time_filter: {
                created_at: {
                  start_at: startDateStr,
                  end_at: endDateStr,
                },
              },
            },
          },
        }
      );
      
      return this.mapSalesData(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch Square sales data:', error);
      return [];
    }
  }

  async getInventory(): Promise<POSInventoryItem[]> {
    try {
      const data = await this.makeRequest('/v2/inventory/counts');
      return this.mapInventoryData(data.counts || []);
    } catch (error) {
      console.error('Failed to fetch Square inventory:', error);
      return [];
    }
  }

  async getEmployees(): Promise<POSEmployee[]> {
    try {
      const data = await this.makeRequest('/v2/team-members');
      return this.mapEmployeeData(data.team_members || []);
    } catch (error) {
      console.error('Failed to fetch Square employees:', error);
      return [];
    }
  }

  async getCustomers(): Promise<POSCustomer[]> {
    try {
      const data = await this.makeRequest('/v2/customers');
      return this.mapCustomerData(data.customers || []);
    } catch (error) {
      console.error('Failed to fetch Square customers:', error);
      return [];
    }
  }

  async updateInventory(itemId: string, quantity: number): Promise<boolean> {
    try {
      await this.makeRequest('/v2/inventory/counts', 'POST', {
        idempotency_key: `${itemId}_${Date.now()}`,
        changes: [
          {
            type: 'ADJUSTMENT',
            adjustment: {
              catalog_object_id: itemId,
              location_id: this.config.restaurantId,
              quantity: quantity.toString(),
            },
          },
        ],
      });
      return true;
    } catch (error) {
      console.error('Failed to update Square inventory:', error);
      return false;
    }
  }

  // Data mapping methods
  private mapMenuItems(rawData: any[]): POSMenuItem[] {
    return rawData
      .filter((item: any) => item.type === 'ITEM')
      .map((item: any) => ({
        id: `square_${item.id}`,
        name: item.item_data?.name || 'Unknown Item',
        description: item.item_data?.description,
        price: this.extractPrice(item.item_data?.variations),
        category: item.item_data?.category?.name || 'Uncategorized',
        subcategory: item.item_data?.category?.parent_category?.name,
        isActive: item.item_data?.present_at_all_locations !== false,
        ingredients: item.item_data?.ingredients?.map((ing: any) => ({
          id: `square_ing_${ing.id}`,
          name: ing.name,
          quantity: ing.quantity || 1,
          unit: ing.unit || 'each',
          cost: 0, // Square doesn't provide ingredient costs
          posIngredientId: ing.id,
        })) || [],
        modifiers: item.item_data?.modifier_list_info?.map((mod: any) => ({
          id: `square_mod_${mod.modifier_list_id}`,
          name: mod.name,
          price: 0, // Will be populated from modifier list
          isRequired: mod.enabled,
          maxSelections: mod.max_selections || 1,
          options: [], // Will be populated separately
        })) || [],
        allergens: item.item_data?.allergens?.map((a: any) => a.name) || [],
        nutritionalInfo: item.item_data?.nutrition_info ? {
          calories: item.item_data.nutrition_info.calories,
          protein: item.item_data.nutrition_info.protein,
          carbs: item.item_data.nutrition_info.carbohydrates,
          fat: item.item_data.nutrition_info.fat,
          fiber: item.item_data.nutrition_info.fiber,
          sugar: item.item_data.nutrition_info.sugar,
          sodium: item.item_data.nutrition_info.sodium,
        } : undefined,
        posItemId: item.id,
        posSystem: 'square',
      }));
  }

  private extractPrice(variations: any[]): number {
    if (!variations || variations.length === 0) return 0;
    
    // Get the first variation with a price
    const variation = variations.find((v: any) => v.item_variation_data?.price_money);
    return variation?.item_variation_data?.price_money?.amount / 100 || 0;
  }

  private mapSalesData(rawData: any[]): POSSalesTransaction[] {
    return rawData.map((order: any) => ({
      id: `square_${order.id}`,
      orderId: order.reference_id || order.id,
      date: new Date(order.created_at),
      items: order.line_items?.map((item: any) => ({
        itemId: `square_${item.catalog_object_id}`,
        name: item.name,
        quantity: parseInt(item.quantity),
        unitPrice: item.base_price_money?.amount / 100 || 0,
        totalPrice: item.total_money?.amount / 100 || 0,
        modifiers: item.modifiers?.map((mod: any) => ({
          modifierId: `square_mod_${mod.catalog_object_id}`,
          name: mod.name,
          price: mod.base_price_money?.amount / 100 || 0,
        })) || [],
        discounts: item.applied_discounts?.map((disc: any) => ({
          type: disc.discount_type,
          amount: disc.applied_money?.amount / 100 || 0,
          reason: disc.discount_name,
        })) || [],
      })) || [],
      subtotal: order.total_money?.amount / 100 || 0,
      tax: order.total_tax_money?.amount / 100 || 0,
      tip: order.total_tip_money?.amount / 100 || 0,
      total: order.total_money?.amount / 100 || 0,
      paymentMethod: order.fulfillments?.[0]?.type || 'unknown',
      employeeId: order.team_member_id ? `square_emp_${order.team_member_id}` : undefined,
      customerId: order.customer_id ? `square_cust_${order.customer_id}` : undefined,
      posTransactionId: order.id,
      posSystem: 'square',
    }));
  }

  private mapInventoryData(rawData: any[]): POSInventoryItem[] {
    return rawData.map((item: any) => ({
      id: `square_inv_${item.catalog_object_id}`,
      name: item.catalog_object?.item_data?.name || 'Unknown Item',
      sku: item.catalog_object?.item_data?.sku || '',
      currentStock: parseInt(item.quantity),
      unit: item.catalog_object?.item_data?.variations?.[0]?.item_variation_data?.measurement_unit_data?.precision_unit || 'each',
      reorderPoint: 0, // Square doesn't provide reorder points
      reorderQuantity: 0, // Square doesn't provide reorder quantities
      cost: 0, // Square doesn't provide costs
      supplier: 'Unknown', // Square doesn't provide supplier info
      lastUpdated: new Date(item.calculated_at),
      posInventoryId: item.catalog_object_id,
      posSystem: 'square',
    }));
  }

  private mapEmployeeData(rawData: any[]): POSEmployee[] {
    return rawData.map((emp: any) => ({
      id: `square_emp_${emp.id}`,
      name: `${emp.given_name} ${emp.family_name}`,
      email: emp.email_address,
      role: emp.status,
      isActive: emp.status === 'ACTIVE',
      posEmployeeId: emp.id,
      posSystem: 'square',
    }));
  }

  private mapCustomerData(rawData: any[]): POSCustomer[] {
    return rawData.map((cust: any) => ({
      id: `square_cust_${cust.id}`,
      name: `${cust.given_name} ${cust.family_name}`,
      email: cust.email_address,
      phone: cust.phone_number,
      loyaltyPoints: 0, // Square doesn't have built-in loyalty points
      totalSpent: 0, // Would need to calculate from orders
      lastVisit: new Date(cust.created_at),
      posCustomerId: cust.id,
      posSystem: 'square',
    }));
  }
}
