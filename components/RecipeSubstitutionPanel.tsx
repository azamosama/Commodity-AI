"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings
} from 'lucide-react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { SubstitutionEngine } from '@/lib/substitution-engine';
import { SubstitutionSuggestion, Recipe, RecipeIngredient } from '@/lib/types';

interface RecipeSubstitutionPanelProps {
  recipeId: string;
  onSubstitutionApplied?: (updatedRecipe: Recipe) => void;
  currentIngredients?: RecipeIngredient[]; // Add this prop for current form ingredients
}

export function RecipeSubstitutionPanel({ recipeId, onSubstitutionApplied, currentIngredients }: RecipeSubstitutionPanelProps) {
  const { state } = useCostManagement();
  const [suggestions, setSuggestions] = useState<SubstitutionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SubstitutionSuggestion | null>(null);

  const recipe = state.recipes.find(r => r.id === recipeId);

  useEffect(() => {
    if ((recipe || recipeId === 'temp-recipe') && state.products.length > 0) {
      generateSuggestions();
    }
  }, [recipe, recipeId, state.products, currentIngredients]);

  const generateSuggestions = async () => {
    setLoading(true);
    
    try {
      const engine = new SubstitutionEngine(state.products, state.recipes);
      
      // If we have current ingredients, use them for suggestions
      if (currentIngredients && currentIngredients.length > 0) {
        console.log('Generating suggestions for current ingredients:', currentIngredients);
        console.log('Available inventory data:', state.inventory);
        console.log('Full product list:', state.products.map(p => p.name));
        console.log('Total products in system:', state.products.length);
        const newSuggestions: SubstitutionSuggestion[] = [];
        
        // Get ingredient substitution suggestions
        for (const ingredient of currentIngredients) {
          const product = state.products.find(p => p.id === ingredient.productId);
          const inventoryItem = state.inventory.find(i => i.productId === ingredient.productId);
          if (product) {
            console.log('Processing product:', product.name, 'with inventory:', inventoryItem);
            console.log('Product ID:', ingredient.productId, 'Product name:', product.name);
            // Get realistic substitution suggestions with real pricing data
            const ingredientSuggestions = await engine.getRealisticSubstitutionSuggestions(ingredient.productId, state.products, state.inventory);
            console.log('Found suggestions for', product.name, ':', ingredientSuggestions);
            newSuggestions.push(...ingredientSuggestions);
          } else {
            console.log('Product not found for ingredient ID:', ingredient.productId);
          }
        }
        
        // Get quantity optimization suggestions
        const quantitySuggestions = engine.getQuantityOptimizationSuggestions(currentIngredients, 1); // Assuming 1 serving for now
        console.log('Found quantity optimization suggestions:', quantitySuggestions);
        newSuggestions.push(...quantitySuggestions);
        
        console.log('Total suggestions generated:', newSuggestions);
        setSuggestions(newSuggestions);
      } else {
        // Fall back to recipe-based suggestions
        const newSuggestions = engine.getSubstitutionSuggestions(recipeId);
        setSuggestions(newSuggestions);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySubstitution = (suggestion: SubstitutionSuggestion) => {
    // For quantity adjustments, we need to update the current ingredients directly
    if (suggestion.reason === 'quantity' && currentIngredients) {
      const updatedIngredients = currentIngredients.map(ingredient => {
        if (ingredient.productId === suggestion.originalProductId) {
          // Convert string quantity to number for calculation
          const currentQuantity = typeof ingredient.quantity === 'string' ? parseFloat(ingredient.quantity) || 0 : ingredient.quantity;
          return {
            ...ingredient,
            quantity: currentQuantity * suggestion.quantityAdjustment
          };
        }
        return ingredient;
      });
      
      // Create a temporary recipe with updated ingredients
      const updatedRecipe: Recipe = {
        id: 'temp-recipe',
        name: 'Temporary Recipe',
        ingredients: updatedIngredients,
        servings: 1,
        servingSize: 1,
        servingUnit: 'serving'
      };
      
      if (onSubstitutionApplied) {
        onSubstitutionApplied(updatedRecipe);
      }
    } else {
      // For other types of substitutions, create a simple recipe update
      if (currentIngredients) {
        const updatedIngredients = currentIngredients.map(ingredient => {
          if (ingredient.productId === suggestion.originalProductId) {
            return {
              ...ingredient,
              productId: suggestion.suggestedProductId
            };
          }
          return ingredient;
        });
        
        const updatedRecipe: Recipe = {
          id: 'temp-recipe',
          name: 'Temporary Recipe',
          ingredients: updatedIngredients,
          servings: 1,
          servingSize: 1,
          servingUnit: 'serving'
        };
        
        if (onSubstitutionApplied) {
          onSubstitutionApplied(updatedRecipe);
        }
      }
    }
    
    setSelectedSuggestion(null);
  };

  const getImpactIcon = (impact: 'better' | 'similar' | 'worse' | 'different') => {
    switch (impact) {
      case 'better':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'worse':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'similar':
        return <Minus className="w-4 h-4 text-gray-600" />;
      case 'different':
        return <Settings className="w-4 h-4 text-blue-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: 'better' | 'similar' | 'worse' | 'different') => {
    switch (impact) {
      case 'better':
        return 'text-green-600';
      case 'worse':
        return 'text-red-600';
      case 'similar':
        return 'text-gray-600';
      case 'different':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'availability':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'cost':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'quantity':
        return <Settings className="w-4 h-4 text-blue-600" />;
      default:
        return <Lightbulb className="w-4 h-4 text-blue-600" />;
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'availability':
        return 'bg-orange-100 text-orange-800';
      case 'cost':
        return 'bg-green-100 text-green-800';
      case 'quantity':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const availabilitySuggestions = suggestions.filter(s => s.reason === 'availability');
  const costSuggestions = suggestions.filter(s => s.reason === 'cost');
  const quantitySuggestions = suggestions.filter(s => s.reason === 'quantity');

  // Don't show "Recipe not found" if we have current ingredients to work with
  if (!recipe && (!currentIngredients || currentIngredients.length === 0)) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Recipe not found</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          AI Substitution Suggestions
        </CardTitle>
        <CardDescription>
          Smart ingredient substitutions based on availability and cost optimization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Analyzing substitutions...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              No substitution suggestions found. All ingredients are available and optimally priced.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="availability" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="availability" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Availability ({availabilitySuggestions.length})
              </TabsTrigger>
              <TabsTrigger value="cost" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cost Optimization ({costSuggestions.length})
              </TabsTrigger>
              <TabsTrigger value="quantity" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Quantity ({quantitySuggestions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="availability" className="space-y-4 mt-4">
              {availabilitySuggestions.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>All ingredients are currently available in stock.</AlertDescription>
                </Alert>
              ) : (
                availabilitySuggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={index}
                    suggestion={suggestion}
                    onApply={() => applySubstitution(suggestion)}
                    getImpactIcon={getImpactIcon}
                    getImpactColor={getImpactColor}
                    getReasonIcon={getReasonIcon}
                    getReasonColor={getReasonColor}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="cost" className="space-y-4 mt-4">
              {costSuggestions.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>No cost optimization opportunities found.</AlertDescription>
                </Alert>
              ) : (
                costSuggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={index}
                    suggestion={suggestion}
                    onApply={() => applySubstitution(suggestion)}
                    getImpactIcon={getImpactIcon}
                    getImpactColor={getImpactColor}
                    getReasonIcon={getReasonIcon}
                    getReasonColor={getReasonColor}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="quantity" className="space-y-4 mt-4">
              {quantitySuggestions.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>No quantity optimization opportunities found.</AlertDescription>
                </Alert>
              ) : (
                quantitySuggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={index}
                    suggestion={suggestion}
                    onApply={() => applySubstitution(suggestion)}
                    getImpactIcon={getImpactIcon}
                    getImpactColor={getImpactColor}
                    getReasonIcon={getReasonIcon}
                    getReasonColor={getReasonColor}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="mt-6 pt-4 border-t">
          <Button 
            onClick={generateSuggestions} 
            variant="outline" 
            className="w-full"
            disabled={loading}
          >
            Refresh Suggestions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface SuggestionCardProps {
  suggestion: SubstitutionSuggestion;
  onApply: () => void;
  getImpactIcon: (impact: 'better' | 'similar' | 'worse' | 'different') => React.ReactNode;
  getImpactColor: (impact: 'better' | 'similar' | 'worse' | 'different') => string;
  getReasonIcon: (reason: string) => React.ReactNode;
  getReasonColor: (reason: string) => string;
}

function SuggestionCard({ 
  suggestion, 
  onApply, 
  getImpactIcon, 
  getImpactColor, 
  getReasonIcon, 
  getReasonColor 
}: SuggestionCardProps) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getReasonIcon(suggestion.reason)}
            <Badge className={getReasonColor(suggestion.reason)}>
              {suggestion.reason === 'availability' ? 'Low Stock' : 'Cost Savings'}
            </Badge>
            <Badge variant="secondary">
              {Math.round(suggestion.confidence * 100)}% confidence
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {suggestion.costDifference < 0 ? '+' : ''}
              ${Math.abs(suggestion.costDifference).toFixed(2)}
            </div>
            <div className={`text-xs ${suggestion.costDifference < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {suggestion.costDifference < 0 ? 'savings' : 'additional cost'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{suggestion.originalProductName}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-blue-600">{suggestion.suggestedProductName}</span>
          </div>

          <p className="text-sm text-gray-600">{suggestion.notes}</p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span>Taste:</span>
              {getImpactIcon(suggestion.impact.taste)}
              <span className={getImpactColor(suggestion.impact.taste)}>
                {suggestion.impact.taste}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>Cost:</span>
              {getImpactIcon(suggestion.impact.cost)}
              <span className={getImpactColor(suggestion.impact.cost)}>
                {suggestion.impact.cost}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>Nutrition:</span>
              {getImpactIcon(suggestion.impact.nutrition)}
              <span className={getImpactColor(suggestion.impact.nutrition)}>
                {suggestion.impact.nutrition}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>Texture:</span>
              {getImpactIcon(suggestion.impact.texture)}
              <span className={getImpactColor(suggestion.impact.texture)}>
                {suggestion.impact.texture}
              </span>
            </div>
          </div>

          {suggestion.quantityAdjustment !== 1 && (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              ⚠️ Use {suggestion.quantityAdjustment}x the amount of {suggestion.suggestedProductName}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button 
            onClick={onApply} 
            size="sm" 
            className="flex-1"
          >
            Apply Substitution
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
