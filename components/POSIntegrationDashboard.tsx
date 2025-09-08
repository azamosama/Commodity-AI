'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Database, 
  Users, 
  ShoppingCart, 
  Package,
  Settings,
  Activity,
  Plus
} from 'lucide-react';
import CustomPOSConfigurator from './CustomPOSConfigurator';

interface POSConnectionStatus {
  [key: string]: boolean;
}

interface SyncResult {
  success: boolean;
  itemsSynced: {
    menuItems: number;
    sales: number;
    inventory: number;
    employees: number;
    customers: number;
  };
  errors: string[];
  warnings: string[];
  timestamp: string;
}

export default function POSIntegrationDashboard() {
  const [connectionStatus, setConnectionStatus] = useState<POSConnectionStatus>({});
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showCustomConfig, setShowCustomConfig] = useState(false);

  // Test POS connections
  const testConnections = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/pos/test-connection');
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus(data.connections);
      } else {
        console.error('Connection test failed:', data.error);
      }
    } catch (error) {
      console.error('Failed to test connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync POS data
  const syncData = async (dataType: string, days?: number) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/pos/sync-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataType, days }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSyncResult(data.result);
        setLastSync(new Date());
      } else {
        console.error('Sync failed:', data.error);
      }
    } catch (error) {
      console.error('Failed to sync data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    testConnections();
  }, []);

  const getConnectionIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getConnectionBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Connected
      </Badge>
    ) : (
      <Badge variant="destructive">
        Disconnected
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">POS Integration Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your Point of Sale system integrations
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={testConnections} 
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Test Connections
          </Button>
          <Button 
            onClick={() => setShowCustomConfig(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom POS
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Current status of your POS system connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getConnectionIcon(connectionStatus.toast)}
                <div>
                  <h3 className="font-semibold">Toast POS</h3>
                  <p className="text-sm text-muted-foreground">Restaurant management system</p>
                </div>
              </div>
              {getConnectionBadge(connectionStatus.toast)}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getConnectionIcon(connectionStatus.square)}
                <div>
                  <h3 className="font-semibold">Square POS</h3>
                  <p className="text-sm text-muted-foreground">Payment and POS system</p>
                </div>
              </div>
              {getConnectionBadge(connectionStatus.square)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Synchronization
          </CardTitle>
          <CardDescription>
            Sync data from your POS systems to the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button
              onClick={() => syncData('all')}
              disabled={isSyncing}
              className="flex flex-col items-center gap-2 h-24"
            >
              <Database className="h-5 w-5" />
              <span className="text-xs">Sync All</span>
            </Button>
            
            <Button
              onClick={() => syncData('menu')}
              disabled={isSyncing}
              variant="outline"
              className="flex flex-col items-center gap-2 h-24"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs">Menu Items</span>
            </Button>
            
            <Button
              onClick={() => syncData('sales')}
              disabled={isSyncing}
              variant="outline"
              className="flex flex-col items-center gap-2 h-24"
            >
              <Activity className="h-5 w-5" />
              <span className="text-xs">Sales Data</span>
            </Button>
            
            <Button
              onClick={() => syncData('inventory')}
              disabled={isSyncing}
              variant="outline"
              className="flex flex-col items-center gap-2 h-24"
            >
              <Package className="h-5 w-5" />
              <span className="text-xs">Inventory</span>
            </Button>
            
            <Button
              onClick={() => syncData('employees')}
              disabled={isSyncing}
              variant="outline"
              className="flex flex-col items-center gap-2 h-24"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Employees</span>
            </Button>
            
            <Button
              onClick={() => syncData('customers')}
              disabled={isSyncing}
              variant="outline"
              className="flex flex-col items-center gap-2 h-24"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Customers</span>
            </Button>
          </div>

          {isSyncing && (
            <div className="mt-4">
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                Syncing data from POS systems...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Results */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Last Sync Results
            </CardTitle>
            <CardDescription>
              Results from the most recent data synchronization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {syncResult.itemsSynced?.menuItems || 0}
                </div>
                <div className="text-sm text-muted-foreground">Menu Items</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {syncResult.itemsSynced?.sales || 0}
                </div>
                <div className="text-sm text-muted-foreground">Sales</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {syncResult.itemsSynced?.inventory || 0}
                </div>
                <div className="text-sm text-muted-foreground">Inventory</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {syncResult.itemsSynced?.employees || 0}
                </div>
                <div className="text-sm text-muted-foreground">Employees</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {syncResult.itemsSynced?.customers || 0}
                </div>
                <div className="text-sm text-muted-foreground">Customers</div>
              </div>
            </div>

            {syncResult.errors && syncResult.errors.length > 0 && (
              <Alert className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Errors:</strong> {syncResult.errors.join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {syncResult.warnings && syncResult.warnings.length > 0 && (
              <Alert className="mt-4">
                <AlertDescription>
                  <strong>Warnings:</strong> {syncResult.warnings.join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {lastSync && (
              <p className="text-sm text-muted-foreground mt-4">
                Last synced: {lastSync.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
          <CardDescription>
            Configure your POS system integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Environment Variables Required:</h4>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="text-sm">
                  <strong>Toast POS:</strong> TOAST_API_KEY, TOAST_API_SECRET, TOAST_RESTAURANT_ID
                </div>
                <div className="text-sm">
                  <strong>Square POS:</strong> SQUARE_API_KEY, SQUARE_LOCATION_ID
                </div>
              </div>
            </div>
            
            <Alert>
              <AlertDescription>
                Add these environment variables to your <code>.env.local</code> file to enable POS integrations.
                Contact your POS provider to obtain the necessary API credentials.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Custom POS Configuration Modal */}
      {showCustomConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Custom POS Configuration</h2>
              <Button 
                onClick={() => setShowCustomConfig(false)}
                variant="outline"
                size="sm"
              >
                ✕
              </Button>
            </div>
            <CustomPOSConfigurator />
          </div>
        </div>
      )}
    </div>
  );
}
