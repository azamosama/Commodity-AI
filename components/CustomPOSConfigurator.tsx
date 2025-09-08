'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Database, 
  TestTube, 
  Save, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface CustomPOSConfig {
  name: string;
  baseUrl: string;
  authType: 'bearer' | 'api_key' | 'basic' | 'none';
  apiKey?: string;
  apiSecret?: string;
  testEndpoint: string;
  endpoints: {
    menuItems: string;
    sales: string;
    inventory: string;
    employees: string;
    customers: string;
  };
  mapping: {
    menuItems: {
      id: string;
      name: string;
      description: string;
      price: string;
      category: string;
      ingredients: string;
    };
    sales: {
      id: string;
      orderId: string;
      date: string;
      items: string;
      total: string;
      subtotal: string;
      tax: string;
      tip: string;
    };
    inventory: {
      id: string;
      name: string;
      sku: string;
      quantity: string;
      unit: string;
      cost: string;
    };
    employees: {
      id: string;
      name: string;
      email: string;
      role: string;
      isActive: string;
    };
    customers: {
      id: string;
      name: string;
      email: string;
      phone: string;
      totalSpent: string;
      lastVisit: string;
    };
  };
  headers?: Record<string, string>;
}

export default function CustomPOSConfigurator() {
  const [config, setConfig] = useState<CustomPOSConfig>({
    name: '',
    baseUrl: '',
    authType: 'bearer',
    testEndpoint: '/health',
    endpoints: {
      menuItems: '/menu',
      sales: '/sales',
      inventory: '/inventory',
      employees: '/employees',
      customers: '/customers',
    },
    mapping: {
      menuItems: {
        id: 'id',
        name: 'name',
        description: 'description',
        price: 'price',
        category: 'category',
        ingredients: 'ingredients',
      },
      sales: {
        id: 'id',
        orderId: 'orderId',
        date: 'date',
        items: 'items',
        total: 'total',
        subtotal: 'subtotal',
        tax: 'tax',
        tip: 'tip',
      },
      inventory: {
        id: 'id',
        name: 'name',
        sku: 'sku',
        quantity: 'quantity',
        unit: 'unit',
        cost: 'cost',
      },
      employees: {
        id: 'id',
        name: 'name',
        email: 'email',
        role: 'role',
        isActive: 'isActive',
      },
      customers: {
        id: 'id',
        name: 'name',
        email: 'email',
        phone: 'phone',
        totalSpent: 'totalSpent',
        lastVisit: 'lastVisit',
      },
    },
  });

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/pos/test-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'Connection successful!' : 'Connection failed'),
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/pos/save-custom-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Configuration saved successfully!',
        });
      } else {
        setTestResult({
          success: false,
          message: 'Failed to save configuration',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to save configuration',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateConfigCode = () => {
    return `const customPOSConfig = ${JSON.stringify(config, null, 2)};`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateConfigCode());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom POS Configuration</h1>
          <p className="text-muted-foreground">
            Configure integration with any POS system
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={testConnection} disabled={isTesting} variant="outline">
            <TestTube className="h-4 w-4 mr-2" />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button onClick={saveConfig} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {testResult && (
        <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {testResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
          <TabsTrigger value="mapping">Data Mapping</TabsTrigger>
          <TabsTrigger value="code">Configuration Code</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Configuration</CardTitle>
              <CardDescription>
                Set up the basic connection details for your POS system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">POS System Name</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => updateConfig('name', e.target.value)}
                    placeholder="e.g., My Restaurant POS"
                  />
                </div>
                <div>
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    value={config.baseUrl}
                    onChange={(e) => updateConfig('baseUrl', e.target.value)}
                    placeholder="https://api.mypos.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="authType">Authentication Type</Label>
                <Select value={config.authType} onValueChange={(value: any) => updateConfig('authType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="none">No Authentication</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.authType !== 'none' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="apiKey">
                      {config.authType === 'bearer' ? 'Bearer Token' : 
                       config.authType === 'api_key' ? 'API Key' : 'Username'}
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={config.apiKey || ''}
                      onChange={(e) => updateConfig('apiKey', e.target.value)}
                      placeholder="Enter your API key or token"
                    />
                  </div>
                  {(config.authType === 'basic' || config.authType === 'bearer') && (
                    <div>
                      <Label htmlFor="apiSecret">
                        {config.authType === 'basic' ? 'Password' : 'Client Secret'}
                      </Label>
                      <Input
                        id="apiSecret"
                        type="password"
                        value={config.apiSecret || ''}
                        onChange={(e) => updateConfig('apiSecret', e.target.value)}
                        placeholder="Enter your secret"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="testEndpoint">Test Endpoint</Label>
                <Input
                  id="testEndpoint"
                  value={config.testEndpoint}
                  onChange={(e) => updateConfig('testEndpoint', e.target.value)}
                  placeholder="/health or /ping or /status"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>
                Configure the API endpoints for different data types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="menuItems">Menu Items Endpoint</Label>
                  <Input
                    id="menuItems"
                    value={config.endpoints.menuItems}
                    onChange={(e) => updateConfig('endpoints.menuItems', e.target.value)}
                    placeholder="/menu"
                  />
                </div>
                <div>
                  <Label htmlFor="sales">Sales Endpoint</Label>
                  <Input
                    id="sales"
                    value={config.endpoints.sales}
                    onChange={(e) => updateConfig('endpoints.sales', e.target.value)}
                    placeholder="/sales"
                  />
                </div>
                <div>
                  <Label htmlFor="inventory">Inventory Endpoint</Label>
                  <Input
                    id="inventory"
                    value={config.endpoints.inventory}
                    onChange={(e) => updateConfig('endpoints.inventory', e.target.value)}
                    placeholder="/inventory"
                  />
                </div>
                <div>
                  <Label htmlFor="employees">Employees Endpoint</Label>
                  <Input
                    id="employees"
                    value={config.endpoints.employees}
                    onChange={(e) => updateConfig('endpoints.employees', e.target.value)}
                    placeholder="/employees"
                  />
                </div>
                <div>
                  <Label htmlFor="customers">Customers Endpoint</Label>
                  <Input
                    id="customers"
                    value={config.endpoints.customers}
                    onChange={(e) => updateConfig('endpoints.customers', e.target.value)}
                    placeholder="/customers"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Field Mapping</CardTitle>
              <CardDescription>
                Map your POS system's data fields to the app's expected format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Use dot notation for nested fields (e.g., "item.id" for nested objects)
                </AlertDescription>
              </Alert>

              <Tabs defaultValue="menu" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="menu">Menu Items</TabsTrigger>
                  <TabsTrigger value="sales">Sales</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="employees">Employees</TabsTrigger>
                  <TabsTrigger value="customers">Customers</TabsTrigger>
                </TabsList>

                <TabsContent value="menu">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ID Field</Label>
                      <Input
                        value={config.mapping.menuItems.id}
                        onChange={(e) => updateConfig('mapping.menuItems.id', e.target.value)}
                        placeholder="id"
                      />
                    </div>
                    <div>
                      <Label>Name Field</Label>
                      <Input
                        value={config.mapping.menuItems.name}
                        onChange={(e) => updateConfig('mapping.menuItems.name', e.target.value)}
                        placeholder="name"
                      />
                    </div>
                    <div>
                      <Label>Description Field</Label>
                      <Input
                        value={config.mapping.menuItems.description}
                        onChange={(e) => updateConfig('mapping.menuItems.description', e.target.value)}
                        placeholder="description"
                      />
                    </div>
                    <div>
                      <Label>Price Field</Label>
                      <Input
                        value={config.mapping.menuItems.price}
                        onChange={(e) => updateConfig('mapping.menuItems.price', e.target.value)}
                        placeholder="price"
                      />
                    </div>
                    <div>
                      <Label>Category Field</Label>
                      <Input
                        value={config.mapping.menuItems.category}
                        onChange={(e) => updateConfig('mapping.menuItems.category', e.target.value)}
                        placeholder="category"
                      />
                    </div>
                    <div>
                      <Label>Ingredients Field</Label>
                      <Input
                        value={config.mapping.menuItems.ingredients}
                        onChange={(e) => updateConfig('mapping.menuItems.ingredients', e.target.value)}
                        placeholder="ingredients"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sales">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ID Field</Label>
                      <Input
                        value={config.mapping.sales.id}
                        onChange={(e) => updateConfig('mapping.sales.id', e.target.value)}
                        placeholder="id"
                      />
                    </div>
                    <div>
                      <Label>Order ID Field</Label>
                      <Input
                        value={config.mapping.sales.orderId}
                        onChange={(e) => updateConfig('mapping.sales.orderId', e.target.value)}
                        placeholder="orderId"
                      />
                    </div>
                    <div>
                      <Label>Date Field</Label>
                      <Input
                        value={config.mapping.sales.date}
                        onChange={(e) => updateConfig('mapping.sales.date', e.target.value)}
                        placeholder="date"
                      />
                    </div>
                    <div>
                      <Label>Total Field</Label>
                      <Input
                        value={config.mapping.sales.total}
                        onChange={(e) => updateConfig('mapping.sales.total', e.target.value)}
                        placeholder="total"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="inventory">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ID Field</Label>
                      <Input
                        value={config.mapping.inventory.id}
                        onChange={(e) => updateConfig('mapping.inventory.id', e.target.value)}
                        placeholder="id"
                      />
                    </div>
                    <div>
                      <Label>Name Field</Label>
                      <Input
                        value={config.mapping.inventory.name}
                        onChange={(e) => updateConfig('mapping.inventory.name', e.target.value)}
                        placeholder="name"
                      />
                    </div>
                    <div>
                      <Label>SKU Field</Label>
                      <Input
                        value={config.mapping.inventory.sku}
                        onChange={(e) => updateConfig('mapping.inventory.sku', e.target.value)}
                        placeholder="sku"
                      />
                    </div>
                    <div>
                      <Label>Quantity Field</Label>
                      <Input
                        value={config.mapping.inventory.quantity}
                        onChange={(e) => updateConfig('mapping.inventory.quantity', e.target.value)}
                        placeholder="quantity"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="employees">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ID Field</Label>
                      <Input
                        value={config.mapping.employees.id}
                        onChange={(e) => updateConfig('mapping.employees.id', e.target.value)}
                        placeholder="id"
                      />
                    </div>
                    <div>
                      <Label>Name Field</Label>
                      <Input
                        value={config.mapping.employees.name}
                        onChange={(e) => updateConfig('mapping.employees.name', e.target.value)}
                        placeholder="name"
                      />
                    </div>
                    <div>
                      <Label>Email Field</Label>
                      <Input
                        value={config.mapping.employees.email}
                        onChange={(e) => updateConfig('mapping.employees.email', e.target.value)}
                        placeholder="email"
                      />
                    </div>
                    <div>
                      <Label>Role Field</Label>
                      <Input
                        value={config.mapping.employees.role}
                        onChange={(e) => updateConfig('mapping.employees.role', e.target.value)}
                        placeholder="role"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="customers">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ID Field</Label>
                      <Input
                        value={config.mapping.customers.id}
                        onChange={(e) => updateConfig('mapping.customers.id', e.target.value)}
                        placeholder="id"
                      />
                    </div>
                    <div>
                      <Label>Name Field</Label>
                      <Input
                        value={config.mapping.customers.name}
                        onChange={(e) => updateConfig('mapping.customers.name', e.target.value)}
                        placeholder="name"
                      />
                    </div>
                    <div>
                      <Label>Email Field</Label>
                      <Input
                        value={config.mapping.customers.email}
                        onChange={(e) => updateConfig('mapping.customers.email', e.target.value)}
                        placeholder="email"
                      />
                    </div>
                    <div>
                      <Label>Phone Field</Label>
                      <Input
                        value={config.mapping.customers.phone}
                        onChange={(e) => updateConfig('mapping.customers.phone', e.target.value)}
                        placeholder="phone"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Configuration Code
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </CardTitle>
              <CardDescription>
                Use this configuration code to integrate with your POS system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  <code>{generateConfigCode()}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
