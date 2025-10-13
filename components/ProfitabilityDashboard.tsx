"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Target,
  Lightbulb,
  ChefHat,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface ProfitabilityAnalysis {
  recipeId: string;
  recipeName: string;
  currentCostPerServing: number;
  salePrice: number;
  profitMargin: number;
  profitMarginPercentage: number;
  isProfitable: boolean;
  profitabilityStatus: 'high' | 'medium' | 'low' | 'unprofitable';
  costBreakdown: IngredientCostBreakdown[];
  recommendations: ProfitabilityRecommendation[];
  lastUpdated: string;
}

interface IngredientCostBreakdown {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  currentPrice: number;
  costPerServing: number;
  priceChangeFromLastUpdate?: number;
  priceChangePercentage?: number;
  isPriceVolatile: boolean;
}

interface ProfitabilityRecommendation {
  type: 'substitution' | 'new_menu_item' | 'price_adjustment' | 'portion_optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings: number;
  potentialProfitImprovement: number;
  implementation: {
    steps: string[];
    estimatedTime: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  alternatives?: AlternativeOption[];
}

interface AlternativeOption {
  name: string;
  description: string;
  costPerServing: number;
  profitMargin: number;
  pros: string[];
  cons: string[];
}

interface MenuOptimizationSuggestion {
  type: 'new_recipe' | 'seasonal_adjustment' | 'cost_reduction';
  name: string;
  description: string;
  estimatedCostPerServing: number;
  suggestedPrice: number;
  estimatedProfitMargin: number;
  ingredients: {
    productId: string;
    name: string;
    quantity: number;
    unit: string;
    currentPrice: number;
  }[];
  seasonalFactors?: {
    ingredient: string;
    priceTrend: 'increasing' | 'decreasing' | 'stable';
    seasonalAvailability: string[];
  }[];
}

interface ProfitabilityData {
  restaurantId: string;
  timestamp: string;
  summary: {
    totalRecipes: number;
    profitableRecipes: number;
    unprofitableRecipes: number;
    averageProfitMargin: number;
    totalPotentialSavings: number;
    criticalAlerts: number;
    warningAlerts: number;
  };
  analyses: ProfitabilityAnalysis[];
  alerts: {
    critical: ProfitabilityAnalysis[];
    warning: ProfitabilityAnalysis[];
    info: ProfitabilityAnalysis[];
  };
  menuSuggestions: MenuOptimizationSuggestion[];
  recommendations: {
    topCostReductions: ProfitabilityRecommendation[];
    priceAdjustments: ProfitabilityRecommendation[];
  };
}

export function ProfitabilityDashboard() {
  const [data, setData] = useState<ProfitabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/profitability-analysis?restaurantId=default&includeRecommendations=true');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching profitability data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getProfitabilityColor = (status: string) => {
    switch (status) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      case 'unprofitable': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Analyzing profitability...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchData} className="mt-2" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No profitability data available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profitability Analysis</h1>
          <p className="text-gray-600">Real-time cost analysis and optimization recommendations</p>
        </div>
        <Button onClick={fetchData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </Button>
      </div>

      {/* Critical Alerts */}
      {data.alerts.critical.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Profitability Issues</AlertTitle>
          <AlertDescription className="text-red-700">
            {data.alerts.critical.length} recipe(s) are currently unprofitable and require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalRecipes}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.profitableRecipes} profitable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Profit Margin</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((data.summary.averageProfitMargin || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.averageProfitMargin >= 0.25 ? 'Healthy' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(data.summary.totalPotentialSavings || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Through recommended optimizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.alerts.critical.length}
        </div>
            <p className="text-xs text-muted-foreground">
              {data.alerts.warning.length} warnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analysis">Recipe Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="menu-optimization">Menu Optimization</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Recipe Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4">
            {data.analyses.map((analysis) => (
              <Card key={analysis.recipeId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{analysis.recipeName}</CardTitle>
                      <CardDescription>
                        Last updated: {new Date(analysis.lastUpdated).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge className={getProfitabilityColor(analysis.profitabilityStatus)}>
                      {analysis.profitabilityStatus.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cost Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Cost per Serving</div>
                      <div className="text-xl font-bold">${(analysis.currentCostPerServing || 0).toFixed(2)}</div>
        </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Sale Price</div>
                      <div className="text-xl font-bold">${(analysis.salePrice || 0).toFixed(2)}</div>
        </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Profit Margin</div>
                      <div className={`text-xl font-bold ${analysis.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                        {((analysis.profitMarginPercentage || 0) * 100).toFixed(1)}%
        </div>
        </div>
      </div>

                  {/* Ingredient Cost Breakdown */}
                  <div>
                    <h4 className="font-medium mb-2">Ingredient Cost Breakdown</h4>
                    <div className="space-y-2">
                      {analysis.costBreakdown.map((ingredient) => (
                        <div key={ingredient.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{ingredient.productName}</span>
                            <span className="text-sm text-gray-600">
                              {ingredient.quantity} {ingredient.unit}
                            </span>
                            {ingredient.isPriceVolatile && (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                Volatile
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${(ingredient.costPerServing || 0).toFixed(2)}</div>
                            {ingredient.priceChangePercentage && (
                              <div className={`text-xs flex items-center ${
                                ingredient.priceChangePercentage > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {ingredient.priceChangePercentage > 0 ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {(Math.abs(ingredient.priceChangePercentage || 0) * 100).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {/* Top Cost Reductions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Top Cost Reduction Opportunities
                </CardTitle>
                <CardDescription>
                  Highest impact ingredient substitutions and optimizations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recommendations.topCostReductions.map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{rec.title}</h4>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <div className="text-sm font-medium text-green-600">
                          Save ${(rec.potentialSavings || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Implementation:</strong> {rec.implementation.estimatedTime} • 
                      <Badge variant="outline" className={`ml-2 ${getRiskColor(rec.implementation.riskLevel)}`}>
                        {rec.implementation.riskLevel} risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Price Adjustments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Price Adjustment Recommendations
                </CardTitle>
                <CardDescription>
                  Menu pricing optimizations to improve profitability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recommendations.priceAdjustments.map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{rec.title}</h4>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <div className="text-sm font-medium text-blue-600">
                          +{(rec.potentialProfitImprovement || 0).toFixed(1)}% margin
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Implementation:</strong> {rec.implementation.estimatedTime} • 
                      <Badge variant="outline" className={`ml-2 ${getRiskColor(rec.implementation.riskLevel)}`}>
                        {rec.implementation.riskLevel} risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Menu Optimization Tab */}
        <TabsContent value="menu-optimization" className="space-y-4">
          <div className="grid gap-4">
            {data.menuSuggestions.map((suggestion, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{suggestion.name}</CardTitle>
                      <CardDescription>{suggestion.description}</CardDescription>
                    </div>
                    <Badge className="text-blue-600 bg-blue-100">
                      {suggestion.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Est. Cost</div>
                      <div className="text-xl font-bold">${(suggestion.estimatedCostPerServing || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Suggested Price</div>
                      <div className="text-xl font-bold">${(suggestion.suggestedPrice || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Est. Profit Margin</div>
                      <div className="text-xl font-bold text-green-600">
                        {((suggestion.estimatedProfitMargin || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Key Ingredients</h4>
                    <div className="space-y-1">
                      {suggestion.ingredients.map((ingredient) => (
                        <div key={ingredient.productId} className="flex justify-between text-sm">
                          <span>{ingredient.name}</span>
                          <span>${(ingredient.currentPrice || 0).toFixed(2)}/{ingredient.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {suggestion.seasonalFactors && (
                    <div>
                      <h4 className="font-medium mb-2">Seasonal Factors</h4>
                      <div className="space-y-1">
                        {suggestion.seasonalFactors.map((factor, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">{factor.ingredient}:</span> {factor.priceTrend} price trend
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {/* Critical Alerts */}
            {data.alerts.critical.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Critical Issues ({data.alerts.critical.length})
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    These recipes are currently unprofitable and require immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.alerts.critical.map((analysis) => (
                    <div key={analysis.recipeId} className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-red-800">{analysis.recipeName}</h4>
                          <p className="text-sm text-red-600">
                            Losing ${Math.abs(analysis.profitMargin || 0).toFixed(2)} per serving
                          </p>
                        </div>
                        <Badge className="text-red-600 bg-red-100">
                          {((analysis.profitMarginPercentage || 0) * 100).toFixed(1)}% LOSS
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Warning Alerts */}
            {data.alerts.warning.length > 0 && (
              <Card className="border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-yellow-800 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Low Profitability Warnings ({data.alerts.warning.length})
                  </CardTitle>
                  <CardDescription className="text-yellow-700">
                    These recipes have low profit margins and should be optimized
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.alerts.warning.map((analysis) => (
                    <div key={analysis.recipeId} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-yellow-800">{analysis.recipeName}</h4>
                          <p className="text-sm text-yellow-600">
                            Only ${(analysis.profitMargin || 0).toFixed(2)} profit per serving
                          </p>
                        </div>
                        <Badge className="text-yellow-600 bg-yellow-100">
                          {((analysis.profitMarginPercentage || 0) * 100).toFixed(1)}% MARGIN
                        </Badge>
                      </div>
                          </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Info Alerts */}
            {data.alerts.info.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2" />
                    Optimization Opportunities ({data.alerts.info.length})
                  </CardTitle>
                  <CardDescription>
                    These recipes have good profitability but could be further optimized
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.alerts.info.map((analysis) => (
                    <div key={analysis.recipeId} className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-800">{analysis.recipeName}</h4>
                          <p className="text-sm text-blue-600">
                            ${(analysis.profitMargin || 0).toFixed(2)} profit per serving
                          </p>
                        </div>
                        <Badge className="text-blue-600 bg-blue-100">
                          {((analysis.profitMarginPercentage || 0) * 100).toFixed(1)}% MARGIN
                        </Badge>
        </div>
      </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 