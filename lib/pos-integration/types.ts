// Multi-POS Integration Types
export interface POSConfig {
  id: string;
  name: string;
  type: 'toast' | 'square' | 'aloha' | 'custom';
  apiKey: string;
  apiSecret?: string;
  baseUrl: string;
  restaurantId: string;
  isActive: boolean;
  lastSync?: Date;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
}

export interface POSMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  subcategory?: string;
  isActive: boolean;
  ingredients?: POSIngredient[];
  modifiers?: POSModifier[];
  allergens?: string[];
  nutritionalInfo?: NutritionalInfo;
  posItemId: string; // Original POS item ID
  posSystem: string; // Which POS system this came from
}

export interface POSIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  posIngredientId: string;
}

export interface POSModifier {
  id: string;
  name: string;
  price: number;
  isRequired: boolean;
  maxSelections: number;
  options: POSModifierOption[];
}

export interface POSModifierOption {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface POSSalesTransaction {
  id: string;
  orderId: string;
  date: Date;
  items: POSSalesItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod: string;
  employeeId: string;
  customerId?: string;
  posTransactionId: string;
  posSystem: string;
}

export interface POSSalesItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers: POSSalesModifier[];
  discounts: POSSalesDiscount[];
}

export interface POSSalesModifier {
  modifierId: string;
  name: string;
  price: number;
}

export interface POSSalesDiscount {
  type: string;
  amount: number;
  reason?: string;
}

export interface POSInventoryItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  unit: string;
  reorderPoint: number;
  reorderQuantity: number;
  cost: number;
  supplier: string;
  lastUpdated: Date;
  posInventoryId: string;
  posSystem: string;
}

export interface POSEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  posEmployeeId: string;
  posSystem: string;
}

export interface POSCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  loyaltyPoints?: number;
  totalSpent: number;
  lastVisit: Date;
  posCustomerId: string;
  posSystem: string;
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface POSSyncResult {
  success: boolean;
  timestamp: Date;
  itemsSynced: {
    menuItems: number;
    sales: number;
    inventory: number;
    employees: number;
    customers: number;
  };
  errors: string[];
  warnings: string[];
}

export interface POSAPIConnector {
  name: string;
  config: POSConfig;
  
  // Core methods
  testConnection(): Promise<boolean>;
  getMenuItems(): Promise<POSMenuItem[]>;
  getSalesData(startDate: Date, endDate: Date): Promise<POSSalesTransaction[]>;
  getInventory(): Promise<POSInventoryItem[]>;
  getEmployees(): Promise<POSEmployee[]>;
  getCustomers(): Promise<POSCustomer[]>;
  
  // Optional methods
  updateInventory?(itemId: string, quantity: number): Promise<boolean>;
  createOrder?(order: any): Promise<string>;
  getRealTimeUpdates?(): Promise<any>;
}

export interface POSDataMapper {
  mapMenuItems(rawData: any[]): POSMenuItem[];
  mapSalesData(rawData: any[]): POSSalesTransaction[];
  mapInventoryData(rawData: any[]): POSInventoryItem[];
  mapEmployeeData(rawData: any[]): POSEmployee[];
  mapCustomerData(rawData: any[]): POSCustomer[];
}

export interface POSSyncEngine {
  syncAllData(): Promise<POSSyncResult>;
  syncMenuItems(): Promise<number>;
  syncSalesData(days: number): Promise<number>;
  syncInventory(): Promise<number>;
  syncEmployees(): Promise<number>;
  syncCustomers(): Promise<number>;
  
  // Real-time sync
  startRealTimeSync(): void;
  stopRealTimeSync(): void;
  onDataUpdate(callback: (data: any) => void): void;
}
