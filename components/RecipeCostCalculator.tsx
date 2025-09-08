import React, { useState, useEffect } from 'react';
import { useCostManagement, useEditing } from '@/contexts/CostManagementContext';
import { Recipe, RecipeIngredient, Product, CostAnalysis, PreparationStep } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Trash, Plus, Settings } from 'lucide-react';
import { calculateTotalUnits } from '@/lib/utils';
import { RecipeSubstitutionPanel } from './RecipeSubstitutionPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ExportButton from './ExportButton';

// Helper function for cost per base unit
function getCostPerBaseUnit(product: Product) {
  if ((product.unit === 'count' || product.unit === 'pieces' || product.unit === 'units') && product.unitsPerPackage) {
    const totalUnits = product.quantity * product.unitsPerPackage;
    return totalUnits > 0 ? product.cost / totalUnits : 0;
  } else {
    const totalUnits = product.quantity * (product.packageSize || 1);
    return totalUnits > 0 ? product.cost / totalUnits : 0;
  }
}

export function RecipeCostCalculator() {
  const { state, dispatch } = useCostManagement();
  const { isEditing, setIsEditing } = useEditing();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState<string>('1');
  const [servingSize, setServingSize] = useState<string>('1');
  const [servingUnit, setServingUnit] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  
  // New advanced fields
  const [totalYieldPercentage, setTotalYieldPercentage] = useState<string>('100');
  const [totalLossPercentage, setTotalLossPercentage] = useState<string>('0');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [prepTime, setPrepTime] = useState<string>('0');
  const [cookTime, setCookTime] = useState<string>('0');
  const [tags, setTags] = useState<string[]>([]);
  const [preparationSteps, setPreparationSteps] = useState<PreparationStep[]>([]);
  const [instructions, setInstructions] = useState('');

  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSubstitutions, setShowSubstitutions] = useState(false);

  useEffect(() => { setHasMounted(true); }, []);

  // Handle edit parameter from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const editRecipeId = urlParams.get('edit');
      
      if (editRecipeId && !isEditing) {
        const recipeToEdit = state.recipes.find(r => r.id === editRecipeId);
        if (recipeToEdit) {
          handleEdit(recipeToEdit);
          // Remove the edit parameter from URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('edit');
          window.history.replaceState({}, '', newUrl.toString());
        }
      }
    }
  }, [state.recipes, isEditing]);

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setRecipeName(recipe.name);
    setServings(recipe.servings.toString());
    setServingSize(recipe.servingSize.toString());
    setServingUnit(recipe.servingUnit);
    setIngredients(recipe.ingredients);
    setInstructions(recipe.instructions || '');
    setTotalYieldPercentage((recipe.totalYieldPercentage || 100).toString());
    setTotalLossPercentage((recipe.totalLossPercentage || 0).toString());
    setDifficulty(recipe.difficulty || 'medium');
    setPrepTime((recipe.prepTime || 0).toString());
    setCookTime((recipe.cookTime || 0).toString());
    setTags(recipe.tags || []);
    setPreparationSteps(recipe.preparationSteps || []);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditingRecipe(null);
    setRecipeName('');
    setServings('1');
    setServingSize('1');
    setServingUnit('');
    setIngredients([]);
    setInstructions('');
    setTotalYieldPercentage('100');
    setTotalLossPercentage('0');
    setDifficulty('medium');
    setPrepTime('0');
    setCookTime('0');
    setTags([]);
    setPreparationSteps([]);
    setIsEditing(false);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { 
      productId: '', 
      quantity: 0, 
      unit: '',
      yieldPercentage: 100,
      lossPercentage: 0,
      preparationNotes: '',
      isOptional: false,
      substitutionGroup: ''
    }]);
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: any) => {
    const newIngredients = ingredients.map((ing, i) => {
      if (i === index) {
        const updated = { ...ing };
        if (field === 'quantity') {
          // Store as string to allow empty field, convert to number when needed
          updated.quantity = value;
        } else if (field === 'productId') {
          updated.productId = value;
          const product = state.products.find(p => p.id === value);
          if (product) {
            updated.unit = product.unit;
          }
        } else if (field === 'unit') {
          updated.unit = value;
        } else if (field === 'yieldPercentage') {
          updated.yieldPercentage = value;
        } else if (field === 'lossPercentage') {
          updated.lossPercentage = value;
        } else if (field === 'preparationNotes') {
          updated.preparationNotes = value;
        } else if (field === 'isOptional') {
          updated.isOptional = value;
        } else if (field === 'substitutionGroup') {
          updated.substitutionGroup = value;
        }
        return updated;
      }
      return ing;
    });
    setIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddPreparationStep = () => {
    const newStep: PreparationStep = {
      id: uuidv4(),
      stepNumber: preparationSteps.length + 1,
      description: '',
      duration: 0,
      temperature: undefined,
      equipment: [],
      ingredients: [],
      notes: ''
    };
    setPreparationSteps([...preparationSteps, newStep]);
  };

  const handlePreparationStepChange = (stepId: string, field: keyof PreparationStep, value: any) => {
    setPreparationSteps(preparationSteps.map(step => {
      if (step.id === stepId) {
        return { ...step, [field]: value };
      }
      return step;
    }));
  };

  const handleRemovePreparationStep = (stepId: string) => {
    setPreparationSteps(preparationSteps.filter(step => step.id !== stepId));
    // Renumber remaining steps
    setPreparationSteps(prev => prev
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, stepNumber: index + 1 }))
    );
  };

  const handleSubstitutionApplied = (updatedRecipe: Recipe) => {
    console.log('Substitution applied:', updatedRecipe);
    console.log('Current editingRecipe:', editingRecipe);
    console.log('Updated ingredients:', updatedRecipe.ingredients);
    
    // Update the current recipe with the substitution
    if (editingRecipe) {
      // Update both the editingRecipe and the ingredients state
      const updatedEditingRecipe = {
        ...editingRecipe,
        ingredients: updatedRecipe.ingredients
      };
      setEditingRecipe(updatedEditingRecipe);
      setIngredients(updatedRecipe.ingredients);
    } else {
      // For new recipes, just update the ingredients
      setIngredients(updatedRecipe.ingredients);
    }
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      dispatch({ type: 'DELETE_RECIPE', payload: recipeId });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting recipe with ingredients:', ingredients);
    console.log('Current editingRecipe:', editingRecipe);
    
    const recipeData = {
      name: recipeName,
      servings: parseInt(servings, 10) || 1,
      servingSize: parseFloat(servingSize) || 1,
      servingUnit,
      ingredients: ingredients.map(ing => ({
        ...ing,
        quantity: typeof ing.quantity === 'string' ? parseFloat(ing.quantity) || 0 : ing.quantity,
        yieldPercentage: typeof ing.yieldPercentage === 'string' ? parseFloat(ing.yieldPercentage) || 100 : (ing.yieldPercentage || 100),
        lossPercentage: typeof ing.lossPercentage === 'string' ? parseFloat(ing.lossPercentage) || 0 : (ing.lossPercentage || 0)
      })),
      instructions,
      totalYieldPercentage: parseFloat(totalYieldPercentage) || 100,
      totalLossPercentage: parseFloat(totalLossPercentage) || 0,
      difficulty,
      prepTime: parseInt(prepTime, 10) || 0,
      cookTime: parseInt(cookTime, 10) || 0,
      tags,
      preparationSteps
    };

    console.log('Recipe data being saved:', recipeData);

    if (editingRecipe) {
      dispatch({ type: 'UPDATE_RECIPE', payload: { ...recipeData, id: editingRecipe.id } });
    } else {
      dispatch({ type: 'ADD_RECIPE', payload: { ...recipeData, id: uuidv4() } });
    }
    handleCancel();
    setIsEditing(false);
  };

  // Enhanced cost calculation with yield and loss percentages
  useEffect(() => {
    let totalCost = 0;
    ingredients.forEach((ingredient) => {
      const product = state.products.find((p) => p.id === ingredient.productId);
      if (product) {
        // Convert string quantities to numbers for calculation
        const quantity = typeof ingredient.quantity === 'string' ? parseFloat(ingredient.quantity) || 0 : ingredient.quantity;
        const yieldPercentage = typeof ingredient.yieldPercentage === 'string' ? parseFloat(ingredient.yieldPercentage) || 100 : (ingredient.yieldPercentage || 100);
        const lossPercentage = typeof ingredient.lossPercentage === 'string' ? parseFloat(ingredient.lossPercentage) || 0 : (ingredient.lossPercentage || 0);
        
        // Calculate cost per unit based on product packaging
        let costPerUnit = product.cost;
        if (product.packageSize && product.packageSize > 0) {
          // Calculate total units in the package
          const totalUnits = product.quantity * product.packageSize;
          if (totalUnits > 0) {
            costPerUnit = product.cost / totalUnits;
          }
        }
        
        // Calculate ingredient cost
        let ingredientCost = costPerUnit * quantity;

        // Apply yield and loss percentages
        const yieldFactor = yieldPercentage / 100;
        const lossFactor = 1 - (lossPercentage / 100);
        ingredientCost = ingredientCost / (yieldFactor * lossFactor);

        totalCost += ingredientCost;
      }
    });

    // Apply overall recipe yield and loss percentages
    const recipeYieldFactor = (parseFloat(totalYieldPercentage) || 100) / 100;
    const recipeLossFactor = 1 - ((parseFloat(totalLossPercentage) || 0) / 100);
    const adjustedTotalCost = totalCost / (recipeYieldFactor * recipeLossFactor);

    const costPerServing = (parseFloat(servings) || 1) > 0 ? adjustedTotalCost / (parseFloat(servings) || 1) : 0;

    // Enhanced pricing analysis with multiple markup strategies
    const markupStrategies = {
      conservative: 2.5, // 250% markup for competitive pricing
      standard: 3.0,     // 300% markup for standard pricing
      premium: 4.0,      // 400% markup for premium pricing
      luxury: 5.0        // 500% markup for luxury pricing
    };

    const suggestedPrices = {
      conservative: costPerServing * markupStrategies.conservative,
      standard: costPerServing * markupStrategies.standard,
      premium: costPerServing * markupStrategies.premium,
      luxury: costPerServing * markupStrategies.luxury
    };

    const profitMargins = {
      conservative: costPerServing > 0 ? ((suggestedPrices.conservative - costPerServing) / suggestedPrices.conservative) * 100 : 0,
      standard: costPerServing > 0 ? ((suggestedPrices.standard - costPerServing) / suggestedPrices.standard) * 100 : 0,
      premium: costPerServing > 0 ? ((suggestedPrices.premium - costPerServing) / suggestedPrices.premium) * 100 : 0,
      luxury: costPerServing > 0 ? ((suggestedPrices.luxury - costPerServing) / suggestedPrices.luxury) * 100 : 0
    };

    // Market analysis based on recipe characteristics
    const marketAnalysis = {
      competitivePosition: calculateCompetitivePosition(costPerServing, ingredients),
      seasonalPricing: calculateSeasonalPricing(ingredients),
      trendAlignment: calculateTrendAlignment(recipeName, ingredients),
      costEfficiency: calculateCostEfficiency(adjustedTotalCost, ingredients.length)
    };

    setCostAnalysis({
      totalCost: adjustedTotalCost,
      costPerServing,
      suggestedPrice: suggestedPrices.standard, // Default to standard pricing
      profitMargin: profitMargins.standard,
      markupStrategies,
      suggestedPrices,
      profitMargins,
      marketAnalysis,
      breakevenPoint: 0, // Placeholder
    });
  }, [ingredients, servings, state.products, totalYieldPercentage, totalLossPercentage]);

  // Helper functions for market analysis
  function calculateCompetitivePosition(costPerServing: number, ingredients: RecipeIngredient[]): string {
    const avgCost = costPerServing;
    if (avgCost < 5) return 'Very Competitive - Low cost structure';
    if (avgCost < 8) return 'Competitive - Good value proposition';
    if (avgCost < 12) return 'Moderate - Standard market positioning';
    if (avgCost < 15) return 'Premium - Higher-end positioning';
    return 'Luxury - Premium market segment';
  }

  function calculateSeasonalPricing(ingredients: RecipeIngredient[]): string {
    const seasonalIngredients = ingredients.filter(ing => {
      const product = state.products.find(p => p.id === ing.productId);
      return product && ['strawberries', 'tomatoes', 'basil', 'asparagus'].some(seasonal => 
        product.name.toLowerCase().includes(seasonal)
      );
    });
    
    const seasonalPercentage = (seasonalIngredients.length / ingredients.length) * 100;
    if (seasonalPercentage > 50) return 'High seasonal pricing opportunity';
    if (seasonalPercentage > 25) return 'Moderate seasonal pricing opportunity';
    return 'Limited seasonal pricing opportunity';
  }

  function calculateTrendAlignment(recipeName: string, ingredients: RecipeIngredient[]): string {
    const trendKeywords = ['fusion', 'bowl', 'fresh', 'plant-based', 'sustainable', 'artisanal'];
    const hasTrendKeywords = trendKeywords.some(keyword => 
      recipeName.toLowerCase().includes(keyword)
    );
    
    const premiumIngredients = ingredients.filter(ing => {
      const product = state.products.find(p => p.id === ing.productId);
      return product && product.cost > 10; // High-cost ingredients
    });
    
    if (hasTrendKeywords && premiumIngredients.length > 0) return 'High trend alignment - Premium positioning';
    if (hasTrendKeywords) return 'Good trend alignment - Modern appeal';
    if (premiumIngredients.length > 0) return 'Premium ingredients - Quality focus';
    return 'Standard positioning - Traditional appeal';
  }

  function calculateCostEfficiency(totalCost: number, ingredientCount: number): string {
    const costPerIngredient = totalCost / ingredientCount;
    if (costPerIngredient < 2) return 'Very efficient - Low cost per ingredient';
    if (costPerIngredient < 4) return 'Efficient - Good cost management';
    if (costPerIngredient < 6) return 'Moderate - Standard cost structure';
    if (costPerIngredient < 8) return 'Higher cost - Premium ingredients';
    return 'High cost - Luxury ingredients';
  }

  if (!hasMounted) return null;

  return (
    <div className="space-y-6" key={`recipe-calculator-${state.products.length}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recipe Cost Calculator</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings className="w-4 h-4 mr-2" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </Button>
          {/* Show substitutions button for any recipe with ingredients */}
          {ingredients.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubstitutions(!showSubstitutions)}
            >
              <Settings className="w-4 h-4 mr-2" />
              {showSubstitutions ? 'Hide' : 'Show'} Substitutions
            </Button>
          )}
          <ExportButton 
            data={state.recipes} 
            dataType="recipes" 
            variant="outline"
            size="sm"
          />
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="preparation">Preparation</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipeName">Recipe Name</Label>
                  <Input
                    id="recipeName"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="Enter recipe name"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="servings">Number of Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                        setServings('1');
                      }
                    }}
                    min="1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="servingSize">Serving Size</Label>
                    <Input
                      id="servingSize"
                      type="number"
                      value={servingSize}
                      onChange={(e) => setServingSize(e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
                          setServingSize('1');
                        }
                      }}
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="servingUnit">Unit</Label>
                    <Input
                      id="servingUnit"
                      value={servingUnit}
                      onChange={(e) => setServingUnit(e.target.value)}
                      placeholder="e.g., cups, pieces"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="prepTime">Prep Time (minutes)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                        setPrepTime('0');
                      }
                    }}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="cookTime">Cook Time (minutes)</Label>
                  <Input
                    id="cookTime"
                    type="number"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                        setCookTime('0');
                      }
                    }}
                    min="0"
                  />
                </div>
              </div>

              {showAdvanced && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="totalYieldPercentage">Total Yield Percentage</Label>
                      <Input
                        id="totalYieldPercentage"
                        type="number"
                        value={totalYieldPercentage}
                        onChange={(e) => setTotalYieldPercentage(e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
                            setTotalYieldPercentage('100');
                          }
                        }}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <p className="text-xs text-gray-500">Percentage of ingredients that become final product</p>
                    </div>
                    <div>
                      <Label htmlFor="totalLossPercentage">Total Loss Percentage</Label>
                      <Input
                        id="totalLossPercentage"
                        type="number"
                        value={totalLossPercentage}
                        onChange={(e) => setTotalLossPercentage(e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
                            setTotalLossPercentage('0');
                          }
                        }}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <p className="text-xs text-gray-500">Percentage lost during preparation</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Enter recipe instructions..."
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingredients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
              <CardDescription>
                Add ingredients with yield and loss percentages for accurate cost calculation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <Label>Product</Label>
                        <Select
                          value={ingredient.productId}
                          onValueChange={(value) => handleIngredientChange(index, 'productId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {state.products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={ingredient.quantity}
                          onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                          onBlur={(e) => {
                            if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
                              handleIngredientChange(index, 'quantity', '0');
                            }
                          }}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <Input
                          value={ingredient.unit}
                          onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveIngredient(index)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {showAdvanced && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t">
                        <div>
                          <Label>Yield %</Label>
                          <Input
                            type="number"
                            value={ingredient.yieldPercentage || 100}
                            onChange={(e) => handleIngredientChange(index, 'yieldPercentage', e.target.value)}
                            onBlur={(e) => {
                              if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
                                handleIngredientChange(index, 'yieldPercentage', '100');
                              }
                            }}
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <Label>Loss %</Label>
                          <Input
                            type="number"
                            value={ingredient.lossPercentage || 0}
                            onChange={(e) => handleIngredientChange(index, 'lossPercentage', e.target.value)}
                            onBlur={(e) => {
                              if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
                                handleIngredientChange(index, 'lossPercentage', '0');
                              }
                            }}
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <Label>Substitution Group</Label>
                          <Input
                            value={ingredient.substitutionGroup || ''}
                            onChange={(e) => handleIngredientChange(index, 'substitutionGroup', e.target.value)}
                            placeholder="e.g., dairy, sweetener"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`optional-${index}`}
                            checked={ingredient.isOptional || false}
                            onChange={(e) => handleIngredientChange(index, 'isOptional', e.target.checked)}
                          />
                          <Label htmlFor={`optional-${index}`}>Optional</Label>
                        </div>
                      </div>
                    )}

                    {showAdvanced && (
                      <div>
                        <Label>Preparation Notes</Label>
                        <Textarea
                          value={ingredient.preparationNotes || ''}
                          onChange={(e) => handleIngredientChange(index, 'preparationNotes', e.target.value)}
                          placeholder="Special preparation instructions for this ingredient..."
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                ))}

                <Button onClick={handleAddIngredient} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ingredient
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preparation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preparation Steps</CardTitle>
              <CardDescription>
                Define detailed preparation steps with timing and equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {preparationSteps.map((step) => (
                  <div key={step.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Step {step.stepNumber}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePreparationStep(step.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={step.description}
                          onChange={(e) => handlePreparationStepChange(step.id, 'description', e.target.value)}
                          placeholder="Describe this step..."
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Duration (min)</Label>
                          <Input
                            type="number"
                            value={step.duration || 0}
                            onChange={(e) => handlePreparationStepChange(step.id, 'duration', e.target.value)}
                            onBlur={(e) => {
                              if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                                handlePreparationStepChange(step.id, 'duration', 0);
                              }
                            }}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label>Temperature (°F)</Label>
                          <Input
                            type="number"
                            value={step.temperature || ''}
                            onChange={(e) => handlePreparationStepChange(step.id, 'temperature', e.target.value ? parseInt(e.target.value) : undefined)}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={step.notes || ''}
                        onChange={(e) => handlePreparationStepChange(step.id, 'notes', e.target.value)}
                        placeholder="Additional notes for this step..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}

                <Button onClick={handleAddPreparationStep} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Preparation Step
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cost Analysis */}
      {costAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Total Cost</Label>
                <p className="text-2xl font-bold">${costAnalysis.totalCost.toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Cost per Serving</Label>
                <p className="text-2xl font-bold">${costAnalysis.costPerServing.toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Suggested Price</Label>
                <p className="text-2xl font-bold text-green-600">${costAnalysis.suggestedPrice.toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Profit Margin</Label>
                <p className="text-2xl font-bold text-blue-600">{(costAnalysis.profitMargin * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Substitution Panel */}
      {showSubstitutions && ingredients.length > 0 && (
        <RecipeSubstitutionPanel
          recipeId={editingRecipe?.id || 'temp-recipe'}
          onSubstitutionApplied={handleSubstitutionApplied}
          currentIngredients={ingredients}
        />
      )}

      {/* Recipe Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recipe Log</CardTitle>
          <CardDescription>
            All saved recipes in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.recipes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recipes saved yet. Create your first recipe above!
            </div>
          ) : (
            <div className="space-y-4">
              {state.recipes.map((recipe) => (
                <div key={recipe.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{recipe.name}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="mr-4">Servings: {recipe.servings}</span>
                        <span className="mr-4">Difficulty: {recipe.difficulty || 'Medium'}</span>
                        {(recipe.prepTime || 0) > 0 && <span className="mr-4">Prep: {recipe.prepTime}min</span>}
                        {(recipe.cookTime || 0) > 0 && <span className="mr-4">Cook: {recipe.cookTime}min</span>}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {recipe.ingredients.length} ingredients • {recipe.tags?.join(', ') || 'No tags'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(recipe)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        disabled={isEditing}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={!recipeName || ingredients.length === 0}>
          {editingRecipe ? 'Update Recipe' : 'Add Recipe'}
        </Button>
        {isEditing && (
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
} 