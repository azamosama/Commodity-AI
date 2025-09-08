'use client';

import React, { useState, useEffect } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { useAlertBanner } from '@/contexts/AlertBannerContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, AlertTriangle, Package, TrendingUp, DollarSign, Clock } from 'lucide-react';

interface AlertItem {
  id: string;
  type: 'restock' | 'price' | 'anomaly' | 'waste' | 'theft';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  dismissed: boolean;
}

export function GlobalAlertBanner() {
  const { state } = useCostManagement();
  const { isVisible, setIsVisible, setAlertCount } = useAlertBanner();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  // Generate alerts based on current state
  useEffect(() => {
    const newAlerts: AlertItem[] = [];

    // Check for low stock items
    state.products.forEach(product => {
      const item = state.inventory.find(i => i.productId === product.id);
      const currentStock = item ? item.currentStock : 0;
      const reorderPoint = item ? item.reorderPoint : 0;

      if (currentStock <= reorderPoint && currentStock > 0) {
        newAlerts.push({
          id: `restock-${product.id}`,
          type: 'restock',
          severity: currentStock === 0 ? 'critical' : currentStock <= reorderPoint * 0.5 ? 'high' : 'medium',
          title: 'Low Stock Alert',
          description: `${product.name} is running low (${currentStock} ${product.unit} remaining)`,
          timestamp: new Date(),
          dismissed: false
        });
      } else if (currentStock < 0) {
        newAlerts.push({
          id: `out-of-stock-${product.id}`,
          type: 'restock',
          severity: 'critical',
          title: 'Out of Stock',
          description: `${product.name} is out of stock (${currentStock} ${product.unit})`,
          timestamp: new Date(),
          dismissed: false
        });
      }
    });

    // Check for price fluctuations (mock data for now)
    const priceAlerts = [
      {
        id: 'price-strawberries',
        type: 'price' as const,
        severity: 'medium' as const,
        title: 'Price Increase Detected',
        description: 'Strawberries price increased by 15% this week',
        timestamp: new Date(),
        dismissed: false
      }
    ];

    // Check for anomalies (mock data for now)
    const anomalyAlerts = [
      {
        id: 'waste-spike',
        type: 'waste' as const,
        severity: 'high' as const,
        title: 'Waste Spike Detected',
        description: 'Food waste was 3x higher than normal yesterday',
        timestamp: new Date(),
        dismissed: false
      }
    ];

    const allAlerts = [...newAlerts, ...priceAlerts, ...anomalyAlerts];
    setAlerts(allAlerts);
    setIsVisible(allAlerts.length > 0);
    setAlertCount(allAlerts.length);
  }, [state.products, state.inventory]);

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
    
    // Hide banner if all alerts are dismissed
    const remainingAlerts = alerts.filter(alert => alert.id !== alertId);
    if (remainingAlerts.length === 0) {
      setIsVisible(false);
    }
  };

  const dismissAllAlerts = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, dismissed: true })));
    setIsVisible(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'restock': return <Package className="h-4 w-4" />;
      case 'price': return <TrendingUp className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'waste': return <AlertTriangle className="h-4 w-4" />;
      case 'theft': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (!isVisible) return null;

  const activeAlerts = alerts.filter(alert => !alert.dismissed);

  return (
    <div className="absolute top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="font-medium text-gray-900">Active Alerts</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {activeAlerts.length}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              {activeAlerts.slice(0, 3).map(alert => (
                <Alert key={alert.id} className={`py-2 px-3 border-l-4 border-l-${alert.severity === 'critical' ? 'red' : alert.severity === 'high' ? 'orange' : 'yellow'}-500`}>
                  <div className="flex items-center space-x-2">
                    {getAlertIcon(alert.type)}
                    <AlertDescription className="text-sm font-medium">
                      {alert.title}: {alert.description}
                    </AlertDescription>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </Alert>
              ))}
              
              {activeAlerts.length > 3 && (
                <span className="text-sm text-gray-500">
                  +{activeAlerts.length - 3} more alerts
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={dismissAllAlerts}
              className="text-sm"
            >
              Dismiss All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
