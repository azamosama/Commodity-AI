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
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Package,
  Plus,
  Star,
  Utensils
} from 'lucide-react';

interface SubstitutionSuggestion {
  originalIngredient: {
    productId: string;
    name: string;
    currentPrice: number;
    costPerServing: number;
  };
  suggestedSubstitute: {
    productId: string;
    name: string;
    currentPrice: number;
    costPerServing: number;
    substitutionRatio: number;
  };
  savings: {
    costReduction: number;
    percentageReduction: number;
    annualSavings?: number;
  };
  compatibility: {
    score: number;
    factors: {
      flavorMatch: number;
      textureMatch: number;
      nutritionalMatch: number;
      allergenCompatibility: number;
    };
  };
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    timeToImplement: string;
    testingRequired: boolean;
    staffTrainingNeeded: boolean;
  };
  risks: {
    customerAcceptance: 'low' | 'medium' | 'high';
    supplyReliability: 'low' | 'medium' | 'high';
    qualityConsistency: 'low' | 'medium' | 'high';
  };
}

interface RecipeOptimization {
  recipeId: string;
  recipeName: string;
  currentCostPerServing: number;
  optimizedCostPerServing: number;
  totalSavings: number;
  substitutions: SubstitutionSuggestion[];
  implementation: {
    totalTimeToImplement: string;
    riskLevel: 'low' | 'medium' | 'high';
    testingPhases: number;
  };
}

interface SubstitutionData {
  restaurantId: string;
  timestamp: string;
  summary: {
    totalRecipes: number;
    recipesWithSubstitutions: number;
    totalSubstitutions: number;
    totalPotentialSavings: number;
    averageSavingsPerRecipe: number;
  };
  recipeSubstitutions: Array<{
    recipeId: string;
    recipeName: string;
    substitutions: SubstitutionSuggestion[];
    totalSavings: number;
  }>;
  topOpportunities: Array<{
    recipeId: string;
    recipeName: string;
    substitutions: SubstitutionSuggestion[];
    totalSavings: number;
  }>;
  recipeOptimizations?: RecipeOptimization[];
  generatedMenuItems?: GeneratedMenuItem[];
  menuGenerationContext?: any;
}

interface GeneratedMenuItem {
  id: string;
  name: string;
  description: string;
  category: 'appetizer' | 'main' | 'dessert' | 'beverage' | 'side';
  ingredients: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
    totalCost: number;
  }[];
  estimatedCostPerServing: number;
  suggestedPrice: number;
  estimatedProfitMargin: number;
  flavorProfile: string[];
  nutritionalHighlights: string[];
  preparationTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  seasonalAvailability: string[];
  inspiration: string;
  tags: string[];
}

export function SubstitutionRecommendations() {
  const [data, setData] = useState<SubstitutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
        const response = await fetch('/api/substitution-recommendations?restaurantId=default&includeOptimization=true&minSavings=0.10&generateMenuItems=true&menuCount=5&targetCostMin=2.00&targetCostMax=8.00&targetProfitMargin=40');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching substitution data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Analyzing substitution opportunities...</span>
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
        <AlertDescription>No substitution recommendations available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ingredient Substitution Recommendations</h1>
          <p className="text-gray-600">AI-powered cost optimization through smart ingredient substitutions</p>
        </div>
        <Button onClick={fetchData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalSubstitutions}</div>
            <p className="text-xs text-muted-foreground">
              Across {data.summary.recipesWithSubstitutions} recipes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(data.summary.totalPotentialSavings || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per serving across all recipes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Savings</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(data.summary.averageSavingsPerRecipe || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per recipe optimization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.topOpportunities.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Top optimization opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="top-opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="top-opportunities">Top Opportunities</TabsTrigger>
          <TabsTrigger value="all-recipes">All Recipes</TabsTrigger>
          <TabsTrigger value="optimizations">Full Optimizations</TabsTrigger>
          <TabsTrigger value="new-menu-items">New Menu Items</TabsTrigger>
        </TabsList>

        {/* Top Opportunities Tab */}
        <TabsContent value="top-opportunities" className="space-y-4">
          <div className="grid gap-4">
            {data.topOpportunities.map((recipe) => (
              <Card key={recipe.recipeId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{recipe.recipeName}</CardTitle>
                      <CardDescription>
                        {recipe.substitutions.length} substitution opportunities
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${(recipe.totalSavings || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Total savings per serving</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recipe.substitutions.slice(0, 3).map((substitution, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-900">
                              {substitution.originalIngredient.name}
                            </span>
                            <TrendingDown className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-green-600">
                              {substitution.suggestedSubstitute.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Use {substitution.suggestedSubstitute.substitutionRatio}x the amount
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ${(substitution.savings.costReduction || 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {(substitution.savings.percentageReduction || 0).toFixed(1)}% reduction
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Compatibility</div>
                          <Badge className={getCompatibilityColor(substitution.compatibility.score)}>
                            {substitution.compatibility.score}%
                          </Badge>
                        </div>
                        <div>
                          <div className="text-gray-600">Difficulty</div>
                          <Badge className={getDifficultyColor(substitution.implementation.difficulty)}>
                            {substitution.implementation.difficulty}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-gray-600">Time</div>
                          <div className="font-medium">{substitution.implementation.timeToImplement}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Risk</div>
                          <Badge className={getRiskColor(substitution.risks.customerAcceptance)}>
                            {substitution.risks.customerAcceptance}
                          </Badge>
                        </div>
                      </div>

                      {substitution.savings.annualSavings && (
                        <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                          <strong>Annual Savings:</strong> ${(substitution.savings.annualSavings || 0).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* All Recipes Tab */}
        <TabsContent value="all-recipes" className="space-y-4">
          <div className="grid gap-4">
            {data.recipeSubstitutions.map((recipe) => (
              <Card key={recipe.recipeId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{recipe.recipeName}</CardTitle>
                      <CardDescription>
                        {recipe.substitutions.length} substitution opportunities
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        ${(recipe.totalSavings || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Total savings per serving</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recipe.substitutions.map((substitution, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium">{substitution.originalIngredient.name}</div>
                            <div className="text-sm text-gray-600">
                              ${substitution.originalIngredient.costPerServing.toFixed(2)} per serving
                            </div>
                          </div>
                          <TrendingDown className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-green-600">
                              {substitution.suggestedSubstitute.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              ${substitution.suggestedSubstitute.costPerServing.toFixed(2)} per serving
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            ${(substitution.savings.costReduction || 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {substitution.savings.percentageReduction.toFixed(1)}% savings
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Full Optimizations Tab */}
        <TabsContent value="optimizations" className="space-y-4">
          {data.recipeOptimizations && data.recipeOptimizations.length > 0 ? (
            <div className="grid gap-4">
              {data.recipeOptimizations.map((optimization) => (
                <Card key={optimization.recipeId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{optimization.recipeName}</CardTitle>
                        <CardDescription>
                          Complete recipe optimization with {optimization.substitutions.length} substitutions
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${optimization.totalSavings.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Total savings per serving</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cost Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Current Cost</div>
                        <div className="text-xl font-bold">${optimization.currentCostPerServing.toFixed(2)}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Optimized Cost</div>
                        <div className="text-xl font-bold text-green-600">
                          ${optimization.optimizedCostPerServing.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Total Savings</div>
                        <div className="text-xl font-bold text-green-600">
                          ${optimization.totalSavings.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Implementation Details */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2">Implementation Plan</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Time to Implement</div>
                          <div className="font-medium">{optimization.implementation.totalTimeToImplement}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Risk Level</div>
                          <Badge className={getRiskColor(optimization.implementation.riskLevel)}>
                            {optimization.implementation.riskLevel}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-gray-600">Testing Phases</div>
                          <div className="font-medium">{optimization.implementation.testingPhases}</div>
                        </div>
                      </div>
                    </div>

                    {/* Substitutions */}
                    <div>
                      <h4 className="font-medium mb-2">Recommended Substitutions</h4>
                      <div className="space-y-2">
                        {optimization.substitutions.map((substitution, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{substitution.originalIngredient.name}</span>
                              <TrendingDown className="h-3 w-3 text-gray-400" />
                              <span className="text-green-600">{substitution.suggestedSubstitute.name}</span>
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              ${(substitution.savings.costReduction || 0).toFixed(2)} savings
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>No Full Optimizations Available</AlertTitle>
              <AlertDescription>
                Full recipe optimizations are only available when includeOptimization=true is set in the API call.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* New Menu Items Tab */}
        <TabsContent value="new-menu-items" className="space-y-4">
          {data.generatedMenuItems && data.generatedMenuItems.length > 0 ? (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    AI-Generated Menu Items
                  </CardTitle>
                  <CardDescription>
                    New menu items created based on your available ingredients and cost optimization goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {data.generatedMenuItems.map((menuItem) => (
                      <Card key={menuItem.id} className="border-2 border-dashed border-blue-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{menuItem.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {menuItem.category.charAt(0).toUpperCase() + menuItem.category.slice(1)}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {menuItem.estimatedProfitMargin.toFixed(1)}% margin
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-gray-600">{menuItem.description}</p>
                          
                          {/* Cost & Pricing */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="font-medium">Cost</div>
                              <div className="text-lg font-bold">${menuItem.estimatedCostPerServing.toFixed(2)}</div>
                            </div>
                            <div className="bg-blue-50 p-2 rounded">
                              <div className="font-medium">Suggested Price</div>
                              <div className="text-lg font-bold text-blue-600">${menuItem.suggestedPrice.toFixed(2)}</div>
                            </div>
                          </div>

                          {/* Flavor Profile */}
                          <div>
                            <div className="text-sm font-medium mb-1">Flavor Profile</div>
                            <div className="flex flex-wrap gap-1">
                              {menuItem.flavorProfile.slice(0, 3).map((flavor, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {flavor}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Nutritional Highlights */}
                          <div>
                            <div className="text-sm font-medium mb-1">Nutritional Highlights</div>
                            <div className="flex flex-wrap gap-1">
                              {menuItem.nutritionalHighlights.map((highlight, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700">
                                  {highlight}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Preparation Info */}
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {menuItem.preparationTime} min
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {menuItem.difficulty}
                            </Badge>
                          </div>

                          {/* Ingredients */}
                          <div>
                            <div className="text-sm font-medium mb-1">Key Ingredients</div>
                            <div className="text-xs text-gray-600">
                              {menuItem.ingredients.slice(0, 3).map(ing => ing.productName).join(', ')}
                              {menuItem.ingredients.length > 3 && ` +${menuItem.ingredients.length - 3} more`}
                            </div>
                          </div>

                          {/* Inspiration */}
                          <div className="text-xs text-gray-500 italic">
                            💡 {menuItem.inspiration}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Menu Items Generated</h3>
                <p className="text-gray-600">
                  Unable to generate new menu items with current ingredient constraints.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
