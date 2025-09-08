"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, AlertTriangle, Package, DollarSign, Calendar, Clock, Database, Search } from 'lucide-react';
import { SalesForecast, InventoryForecast, Anomaly, RestockingDecision, PurchaseOrder } from '@/lib/types';

interface PredictiveAnalyticsDashboardProps {
  restaurantId?: string;
}

export function PredictiveAnalyticsDashboard({ restaurantId = 'default' }: PredictiveAnalyticsDashboardProps) {
  const [salesForecasts, setSalesForecasts] = useState<SalesForecast[]>([]);
  const [inventoryForecasts, setInventoryForecasts] = useState<InventoryForecast[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [restockingDecisions, setRestockingDecisions] = useState<RestockingDecision[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [usdaData, setUsdaData] = useState<any>(null);
  const [usdaSearchQuery, setUsdaSearchQuery] = useState('');
  const [usdaSearchResults, setUsdaSearchResults] = useState<any>(null);
  const [usdaSearchLoading, setUsdaSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [salesRes, inventoryRes, anomaliesRes, restockingRes, usdaRes] = await Promise.all([
          fetch(`/api/forecast/sales?restaurantId=${restaurantId}`),
          fetch(`/api/forecast/inventory?restaurantId=${restaurantId}`),
          fetch(`/api/exceptions?limit=10`),
          fetch(`/api/auto-restocking?restaurantId=${restaurantId}`),
          fetch(`/api/price-peak-analysis?restaurantId=${restaurantId}&includeUSDA=true`)
        ]);

        if (salesRes.ok) {
          const salesData = await salesRes.json();
          setSalesForecasts(salesData.data || []);
        }

        if (inventoryRes.ok) {
          const inventoryData = await inventoryRes.json();
          setInventoryForecasts(inventoryData.data || []);
        }

        if (anomaliesRes.ok) {
          const anomaliesData = await anomaliesRes.json();
          setAnomalies(anomaliesData.data || []);
        }

        if (restockingRes.ok) {
          const restockingData = await restockingRes.json();
          setRestockingDecisions(restockingData.data?.decisions || []);
          setPurchaseOrders(restockingData.data?.purchaseOrders || []);
        }

        if (usdaRes.ok) {
          const usdaData = await usdaRes.json();
          setUsdaData(usdaData.data || null);
        }
      } catch (error) {
        console.error('Error fetching predictive analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'waste': return '🗑️';
      case 'theft': return '🚨';
      case 'over_portioning': return '⚖️';
      case 'sales_anomaly': return '📊';
      default: return '⚠️';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleUSDASearch = async () => {
    if (!usdaSearchQuery.trim()) return;
    
    setUsdaSearchLoading(true);
    try {
      const response = await fetch(`/api/usda-search?query=${encodeURIComponent(usdaSearchQuery)}&type=all`);
      if (response.ok) {
        const data = await response.json();
        setUsdaSearchResults(data);
      }
    } catch (error) {
      console.error('USDA search error:', error);
    } finally {
      setUsdaSearchLoading(false);
    }
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // Prepare chart data
  const salesChartData = salesForecasts.slice(0, 7).map(forecast => ({
    date: forecast.date,
    predicted: forecast.predictedQuantity,
    lower: forecast.confidenceInterval.lower,
    upper: forecast.confidenceInterval.upper
  }));

  const inventoryChartData = inventoryForecasts.slice(0, 7).map(forecast => ({
    date: forecast.date,
    stock: forecast.predictedStock,
    reorderPoint: 20 // Example reorder point
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading predictive analytics...</div>
      </div>
    );
  }

  const getMonthName = (monthNumber: number) => {
    const date = new Date(2024, monthNumber - 1, 1); // Month is 0-indexed
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Predictive Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered insights for restaurant optimization
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Restaurant: {restaurantId}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="auto-restocking">Auto-Restocking</TabsTrigger>
          <TabsTrigger value="usda-data">USDA Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Recipes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesForecasts.length > 0 ? new Set(salesForecasts.map(f => f.recipeId)).size : 0}</div>
                <p className="text-xs text-muted-foreground">
                  Being forecasted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{restockingDecisions.filter(d => d.urgency === 'high').length}</div>
                <p className="text-xs text-muted-foreground">
                  Need immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseOrders.filter(po => po.status === 'pending').length}</div>
                <p className="text-xs text-muted-foreground">
                  Auto-generated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{anomalies.filter(a => a.status === 'active').length}</div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Anomalies</CardTitle>
                <CardDescription>Latest detected issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {anomalies.slice(0, 5).map((anomaly) => (
                    <div key={anomaly.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <span>{getAnomalyIcon(anomaly.type)}</span>
                        <div>
                          <p className="font-medium">{anomaly.title}</p>
                          <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(anomaly.severity)}>
                        {anomaly.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Restocking Needs</CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {restockingDecisions.slice(0, 5).map((decision) => (
                    <div key={decision.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{decision.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: {decision.currentStock} | Order: {decision.suggestedOrderQuantity}
                        </p>
                      </div>
                      <Badge className={getSeverityColor(decision.urgency)}>
                        {decision.urgency}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Forecast (7 Days)</CardTitle>
                <CardDescription>Predicted sales volume trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="predicted" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="lower" stroke="#82ca9d" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="upper" stroke="#ffc658" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Forecast (7 Days)</CardTitle>
                <CardDescription>Predicted stock levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={inventoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="stock" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="reorderPoint" stroke="#ff7300" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Forecasts</CardTitle>
              <CardDescription>Complete forecasting data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Sales Forecasts</h4>
                  <div className="grid gap-2 md:grid-cols-3">
                    {salesForecasts.slice(0, 6).map((forecast) => (
                      <div key={forecast.id} className="p-3 border rounded">
                        <p className="font-medium">{forecast.recipeName}</p>
                        <p className="text-sm text-muted-foreground">{forecast.date}</p>
                        <p className="text-lg font-bold">{forecast.predictedQuantity} units</p>
                        <p className="text-xs text-muted-foreground">
                          Confidence: {(forecast.accuracy * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Inventory Forecasts</h4>
                  <div className="grid gap-2 md:grid-cols-3">
                    {inventoryForecasts.slice(0, 6).map((forecast) => (
                      <div key={forecast.id} className="p-3 border rounded">
                        <p className="font-medium">{forecast.productName}</p>
                        <p className="text-sm text-muted-foreground">{forecast.date}</p>
                        <p className="text-lg font-bold">{forecast.predictedStock.toFixed(1)} units</p>
                        {forecast.depletionDate && (
                          <p className="text-xs text-red-600">
                            Depletes: {formatDate(forecast.depletionDate)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection</CardTitle>
              <CardDescription>AI-detected operational issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalies.map((anomaly) => (
                  <div key={anomaly.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{getAnomalyIcon(anomaly.type)}</span>
                        <div>
                          <h4 className="font-medium">{anomaly.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{anomaly.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span>Type: {anomaly.type}</span>
                            <span>Impact: {anomaly.impact}</span>
                            <span>Detected: {formatDate(anomaly.detectedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getSeverityColor(anomaly.severity)}>
                          {anomaly.severity}
                        </Badge>
                        <Badge variant={anomaly.status === 'active' ? 'default' : 'secondary'}>
                          {anomaly.status}
                        </Badge>
                      </div>
                    </div>
                    {anomaly.suggestedActions && (
                      <div className="mt-3 p-3 bg-muted rounded">
                        <p className="text-sm font-medium">Suggested Actions:</p>
                        <ul className="text-sm mt-1 space-y-1">
                          {anomaly.suggestedActions.map((action, index) => (
                            <li key={index}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto-restocking" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Restocking Decisions</CardTitle>
                <CardDescription>AI-generated restocking recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {restockingDecisions.map((decision) => (
                    <div key={decision.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{decision.productName}</h4>
                        <Badge className={getSeverityColor(decision.urgency)}>
                          {decision.urgency}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Current Stock:</span>
                          <p className="font-medium">{decision.currentStock}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reorder Point:</span>
                          <p className="font-medium">{decision.reorderPoint}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Daily Usage:</span>
                          <p className="font-medium">{decision.averageDailyUsage.toFixed(1)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Days Until Depletion:</span>
                          <p className="font-medium">{decision.daysUntilDepletion}</p>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-muted rounded">
                        <p className="text-sm">
                          <strong>Suggested Order:</strong> {decision.suggestedOrderQuantity} units
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{decision.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>Auto-generated orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {purchaseOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Order #{order.id.slice(-8)}</h4>
                        <Badge variant={order.status === 'pending' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Supplier:</span> {order.supplierName}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Total:</span> {formatCurrency(order.totalAmount)}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Expected Delivery:</span> {formatDate(order.expectedDelivery)}
                        </p>
                      </div>
                      <div className="mt-3 space-y-1">
                        {order.items.map((item) => (
                          <div key={item.productId} className="flex justify-between text-sm">
                            <span>{item.productName}</span>
                            <span>{item.quantity} x {formatCurrency(item.unitCost)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm" variant="outline">Review</Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usda-data" className="space-y-4">
          {/* USDA Product Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                USDA Product Search
              </CardTitle>
              <CardDescription>Search for any product in the USDA database for nutritional and price data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search for any ingredient (e.g., quinoa, salmon, kale)..."
                  value={usdaSearchQuery}
                  onChange={(e) => setUsdaSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUSDASearch()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button 
                  onClick={handleUSDASearch}
                  disabled={usdaSearchLoading || !usdaSearchQuery.trim()}
                  className="flex items-center gap-2"
                >
                  {usdaSearchLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>

              {usdaSearchResults && (
                <div className="space-y-4">
                  {usdaSearchResults.data?.nutritional && usdaSearchResults.data.nutritional.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Nutritional Information</h4>
                      <div className="space-y-2">
                        {usdaSearchResults.data.nutritional.map((food: any, index: number) => (
                          <div 
                            key={index} 
                            className="border rounded p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleProductClick(food)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium">{food.description}</h5>
                                <p className="text-sm text-muted-foreground">{food.foodCategory}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Click for Details
                              </Badge>
                            </div>
                            {food.foodNutrients && food.foodNutrients.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                {food.foodNutrients.slice(0, 4).map((nutrient: any, nIndex: number) => (
                                  <div key={nIndex} className="flex justify-between">
                                    <span className="truncate">{nutrient.nutrientName}:</span>
                                    <span className="font-medium">{nutrient.value} {nutrient.unitName}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {usdaSearchResults.data?.price && (
                    <div>
                      <h4 className="font-medium mb-2">Market Analysis</h4>
                      <div className="border rounded p-3">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium mb-2">Price Information</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Current Price:</span>
                                <span className="font-medium">{formatCurrency(usdaSearchResults.data.price.currentPrice)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Volatility:</span>
                                <span className="font-medium">{(usdaSearchResults.data.price.volatilityMetrics.overallVolatility * 100).toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Peak Price:</span>
                                <span className="font-medium">{formatCurrency(usdaSearchResults.data.price.volatilityMetrics.peakPrice)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Low Price:</span>
                                <span className="font-medium">{formatCurrency(usdaSearchResults.data.price.volatilityMetrics.lowPrice)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium mb-2">Market Trends</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Supply Trend:</span>
                                <span className="font-medium capitalize">{usdaSearchResults.data.price.marketInsights.supplyTrend}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Demand Trend:</span>
                                <span className="font-medium capitalize">{usdaSearchResults.data.price.marketInsights.demandTrend}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Seasonal Pattern:</span>
                                <span className="font-medium capitalize">{usdaSearchResults.data.price.volatilityMetrics.seasonalPattern}</span>
                              </div>
                            </div>
                            
                            {usdaSearchResults.data.price.marketInsights.recommendations.length > 0 && (
                              <div className="mt-3">
                                <h6 className="font-medium text-sm mb-1">Recommendations:</h6>
                                <ul className="text-xs space-y-1">
                                  {usdaSearchResults.data.price.marketInsights.recommendations.map((rec: string, index: number) => (
                                    <li key={index} className="text-muted-foreground">• {rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  USDA Market Insights
                </CardTitle>
                <CardDescription>Real USDA price data and market trends</CardDescription>
              </CardHeader>
              <CardContent>
                {usdaData?.usdaInsights ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-muted-foreground">Supply Trend</p>
                        <p className="font-semibold capitalize">{usdaData.usdaInsights.marketTrends?.overallSupplyTrend || 'N/A'}</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-muted-foreground">Demand Trend</p>
                        <p className="font-semibold capitalize">{usdaData.usdaInsights.marketTrends?.overallDemandTrend || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {/* Enhanced Market Analysis */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Market Analysis</h4>
                      
                      {/* Trend Analysis with Percentages */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 rounded">
                          <p className="text-sm font-medium text-blue-800">Supply Analysis</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Trend:</span>
                              <span className="font-medium capitalize">{usdaData.usdaInsights.marketTrends?.overallSupplyTrend || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Strength:</span>
                              <span className="font-medium">{usdaData.usdaInsights.marketTrends?.supplyTrendPercentage || '0'}%</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                              {usdaData.usdaInsights.marketTrends?.overallSupplyTrend === 'increasing' 
                                ? 'Supply is increasing, indicating good availability and potential for price negotiations'
                                : usdaData.usdaInsights.marketTrends?.overallSupplyTrend === 'decreasing'
                                ? 'Supply is decreasing, consider stockpiling or finding alternative suppliers'
                                : 'Supply is stable, normal market conditions'
                              }
                            </p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-green-50 rounded">
                          <p className="text-sm font-medium text-green-800">Demand Analysis</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Trend:</span>
                              <span className="font-medium capitalize">{usdaData.usdaInsights.marketTrends?.overallDemandTrend || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Strength:</span>
                              <span className="font-medium">{usdaData.usdaInsights.marketTrends?.demandTrendPercentage || '0'}%</span>
                            </div>
                            <p className="text-xs text-green-600 mt-2">
                              {usdaData.usdaInsights.marketTrends?.overallDemandTrend === 'increasing' 
                                ? 'Demand is increasing, prices may rise - consider purchasing soon'
                                : usdaData.usdaInsights.marketTrends?.overallDemandTrend === 'decreasing'
                                ? 'Demand is decreasing, good time to negotiate better prices'
                                : 'Demand is stable, normal market conditions'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Market Statistics */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 border rounded">
                          <p className="text-sm text-muted-foreground">Avg Volatility</p>
                          <p className="font-semibold">{usdaData.usdaInsights.marketTrends?.averageVolatility || '0'}%</p>
                        </div>
                        <div className="text-center p-3 border rounded">
                          <p className="text-sm text-muted-foreground">Price Change</p>
                          <p className={`font-semibold ${parseFloat(usdaData.usdaInsights.marketTrends?.averagePriceChange || '0') > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {usdaData.usdaInsights.marketTrends?.averagePriceChange || '0'}%
                          </p>
                        </div>
                        <div className="text-center p-3 border rounded">
                          <p className="text-sm text-muted-foreground">Trend Strength</p>
                          <p className="font-semibold capitalize">{usdaData.usdaInsights.marketTrends?.trendAnalysis?.trendStrength || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Seasonal Factors */}
                      {usdaData.usdaInsights.marketTrends?.seasonalCommodities && usdaData.usdaInsights.marketTrends.seasonalCommodities.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Seasonal Commodities ({usdaData.usdaInsights.marketTrends.seasonalCommodities.length})</h5>
                          <div className="flex flex-wrap gap-1">
                            {usdaData.usdaInsights.marketTrends.seasonalCommodities.map((commodity: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {commodity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* High Volatility Warning */}
                      {usdaData.usdaInsights.marketTrends?.highVolatilityCommodities && usdaData.usdaInsights.marketTrends.highVolatilityCommodities.length > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <h5 className="font-medium text-yellow-800 mb-2">⚠️ High Volatility Alert</h5>
                          <p className="text-sm text-yellow-700 mb-2">These commodities have significant price fluctuations:</p>
                          <div className="flex flex-wrap gap-1">
                            {usdaData.usdaInsights.marketTrends.highVolatilityCommodities.map((commodity: string, index: number) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {commodity}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-yellow-600 mt-2">
                            Consider monitoring prices closely and timing purchases strategically.
                          </p>
                        </div>
                      )}

                      {/* Market Recommendations */}
                      {usdaData.usdaInsights.recommendations && usdaData.usdaInsights.recommendations.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Market Recommendations</h5>
                          <ul className="space-y-1">
                            {usdaData.usdaInsights.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">USDA Data Loading...</p>
                    <p className="text-sm text-muted-foreground">Fetching real market data from USDA APIs</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Product Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Product Analysis</CardTitle>
                <CardDescription>USDA data integration for each product</CardDescription>
              </CardHeader>
              <CardContent>
                {usdaData?.productAnalysis ? (
                  <div className="space-y-4">
                    {usdaData.productAnalysis.map((product: any, index: number) => (
                      <div key={product.productId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{product.productName}</h4>
                          {product.usdaData && (
                            <Badge variant="outline" className="text-xs">USDA Data Available</Badge>
                          )}
                        </div>
                        
                        {product.usdaData ? (
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-sm mb-2">Price Analysis</h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Current Price:</span>
                                  <span className="font-medium">{formatCurrency(product.usdaData.currentPrice)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Volatility:</span>
                                  <span className="font-medium">{(product.usdaData.volatilityMetrics.overallVolatility * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Peak Price:</span>
                                  <span className="font-medium">{formatCurrency(product.usdaData.volatilityMetrics.peakPrice)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Low Price:</span>
                                  <span className="font-medium">{formatCurrency(product.usdaData.volatilityMetrics.lowPrice)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-sm mb-2">Seasonal Patterns</h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Peak Month:</span>
                                  <span className="font-medium">{getMonthName(product.usdaData.volatilityMetrics.peakMonth)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Low Month:</span>
                                  <span className="font-medium">{getMonthName(product.usdaData.volatilityMetrics.lowMonth)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Pattern:</span>
                                  <span className="font-medium capitalize">{product.usdaData.volatilityMetrics.seasonalPattern}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <Database className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground text-sm">No USDA data available for this product</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Product Analysis Loading...</p>
                    <p className="text-sm text-muted-foreground">Analyzing USDA data for each product</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* USDA Data Tab Content */}
        </TabsContent>
      </Tabs>

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Product Analysis</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowProductModal(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {/* Product Header */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold">{selectedProduct.description}</h3>
                  <p className="text-muted-foreground">{selectedProduct.foodCategory}</p>
                  {selectedProduct.scientificName && (
                    <p className="text-sm text-muted-foreground italic">{selectedProduct.scientificName}</p>
                  )}
                </div>

                {/* Nutritional Information */}
                {selectedProduct.foodNutrients && selectedProduct.foodNutrients.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Complete Nutritional Profile</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedProduct.foodNutrients.map((nutrient: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">{nutrient.nutrientName}</span>
                          <span className="font-medium text-sm">
                            {nutrient.value} {nutrient.unitName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Analysis (if available) */}
                {usdaSearchResults?.data?.price && (
                  <div>
                    <h4 className="font-medium mb-3">Market Analysis</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                       <div className="space-y-3">
                         <div className="p-3 bg-blue-50 rounded">
                           <h5 className="font-medium text-blue-800">Price Information</h5>
                           <div className="space-y-1 text-sm mt-2">
                             <div className="flex justify-between">
                               <span>Current Price:</span>
                               <span className="font-medium">{formatCurrency(usdaSearchResults.data.price.currentPrice)}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Volatility:</span>
                               <span className="font-medium">{(usdaSearchResults.data.price.volatilityMetrics.overallVolatility * 100).toFixed(1)}%</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Peak Price:</span>
                               <span className="font-medium">{formatCurrency(usdaSearchResults.data.price.volatilityMetrics.peakPrice)}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Low Price:</span>
                               <span className="font-medium">{formatCurrency(usdaSearchResults.data.price.volatilityMetrics.lowPrice)}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Average Price:</span>
                               <span className="font-medium">{formatCurrency(usdaSearchResults.data.price.volatilityMetrics.averagePrice)}</span>
                             </div>
                           </div>
                         </div>
                       </div>

                       <div className="space-y-3">
                         <div className="p-3 bg-green-50 rounded">
                           <h5 className="font-medium text-green-800">Market Trends</h5>
                           <div className="space-y-1 text-sm mt-2">
                             <div className="flex justify-between">
                               <span>Supply Trend:</span>
                               <span className="font-medium capitalize">{usdaSearchResults.data.price.marketInsights.supplyTrend}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Demand Trend:</span>
                               <span className="font-medium capitalize">{usdaSearchResults.data.price.marketInsights.demandTrend}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Seasonal Pattern:</span>
                               <span className="font-medium capitalize">{usdaSearchResults.data.price.volatilityMetrics.seasonalPattern}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Trend Strength:</span>
                               <span className="font-medium capitalize">{usdaSearchResults.data.price.volatilityMetrics.trendStrength}</span>
                             </div>
                           </div>
                         </div>

                         <div className="p-3 bg-purple-50 rounded">
                           <h5 className="font-medium text-purple-800">Seasonal Analysis</h5>
                           <div className="space-y-1 text-sm mt-2">
                             <div className="flex justify-between">
                               <span>Peak Month:</span>
                               <span className="font-medium">{getMonthName(usdaSearchResults.data.price.volatilityMetrics.peakMonth)}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Low Month:</span>
                               <span className="font-medium">{getMonthName(usdaSearchResults.data.price.volatilityMetrics.lowMonth)}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Peak Price:</span>
                               <span className="font-medium">{formatCurrency(usdaSearchResults.data.price.volatilityMetrics.peakPrice)}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Low Price:</span>
                               <span className="font-medium">{formatCurrency(usdaSearchResults.data.price.volatilityMetrics.lowPrice)}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Price Range:</span>
                               <span className="font-medium">{formatCurrency(usdaSearchResults.data.price.volatilityMetrics.peakPrice - usdaSearchResults.data.price.volatilityMetrics.lowPrice)}</span>
                             </div>
                           </div>
                         </div>
                       </div>

                       {usdaSearchResults.data.price.marketInsights.recommendations.length > 0 && (
                         <div className="p-3 bg-yellow-50 rounded">
                           <h5 className="font-medium text-yellow-800">Recommendations</h5>
                           <ul className="text-sm mt-2 space-y-1">
                             {usdaSearchResults.data.price.marketInsights.recommendations.map((rec: string, index: number) => (
                               <li key={index} className="flex items-start gap-2">
                                 <span className="text-yellow-600 mt-1">•</span>
                                 <span>{rec}</span>
                               </li>
                             ))}
                           </ul>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                {/* Usage Suggestions */}
                <div>
                  <h4 className="font-medium mb-3">Usage Suggestions</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded">
                      <h5 className="font-medium mb-2">Culinary Applications</h5>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Main ingredient in various dishes</li>
                        <li>• Nutritional supplement</li>
                        <li>• Ingredient substitution</li>
                        <li>• Seasonal menu planning</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <h5 className="font-medium mb-2">Cost Optimization</h5>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Monitor seasonal price trends</li>
                        <li>• Consider bulk purchasing</li>
                        <li>• Explore alternative suppliers</li>
                        <li>• Plan menu around availability</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

