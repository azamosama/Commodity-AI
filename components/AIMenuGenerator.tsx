'use client';

import React, { useState, useEffect } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChefHat, 
  TrendingUp, 
  DollarSign, 
  Leaf, 
  Clock, 
  Target, 
  Sparkles,
  Lightbulb,
  Calculator,
  Star,
  Calendar,
  Zap
} from 'lucide-react';

interface MenuSuggestion {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  category: 'appetizer' | 'main' | 'dessert' | 'beverage';
  estimatedCost: number;
  suggestedPrice: number;
  profitMargin: number;
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  cookTime: number;
  seasonalScore: number;
  trendScore: number;
  costEffectiveness: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    seasonalAvailability: 'peak' | 'good' | 'limited' | 'out';
    costTrend: 'decreasing' | 'stable' | 'increasing';
  }>;
  tags: string[];
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  substitutionOptions: Array<{
    original: string;
    substitute: string;
    costSavings: number;
    impact: 'minimal' | 'moderate' | 'significant';
  }>;
}

interface CuisineProfile {
  name: string;
  description: string;
  commonIngredients: string[];
  typicalCostRange: { min: number; max: number };
  profitMarginRange: { min: number; max: number };
  prepTimeRange: { min: number; max: number };
  flavorProfiles: string[];
  dietaryConsiderations: string[];
}

const CUISINE_PROFILES: Record<string, CuisineProfile> = {
  'italian': {
    name: 'Italian',
    description: 'Fresh, simple ingredients with bold flavors',
    commonIngredients: ['tomatoes', 'basil', 'olive oil', 'garlic', 'mozzarella', 'parmesan', 'pasta', 'arugula'],
    typicalCostRange: { min: 8, max: 18 },
    profitMarginRange: { min: 65, max: 75 },
    prepTimeRange: { min: 15, max: 45 },
    flavorProfiles: ['herbaceous', 'acidic', 'umami', 'fresh'],
    dietaryConsiderations: ['vegetarian-friendly', 'gluten-free options']
  },
  'mexican': {
    name: 'Mexican',
    description: 'Bold spices and fresh ingredients',
    commonIngredients: ['corn', 'beans', 'chili peppers', 'lime', 'cilantro', 'avocado', 'tortillas', 'cheese'],
    typicalCostRange: { min: 6, max: 14 },
    profitMarginRange: { min: 70, max: 80 },
    prepTimeRange: { min: 20, max: 40 },
    flavorProfiles: ['spicy', 'citrusy', 'smoky', 'fresh'],
    dietaryConsiderations: ['vegetarian-friendly', 'vegan options', 'gluten-free options']
  },
  'asian': {
    name: 'Asian Fusion',
    description: 'Umami-rich with balanced flavors',
    commonIngredients: ['soy sauce', 'ginger', 'garlic', 'sesame oil', 'rice', 'noodles', 'vegetables', 'fish sauce'],
    typicalCostRange: { min: 7, max: 16 },
    profitMarginRange: { min: 68, max: 78 },
    prepTimeRange: { min: 15, max: 35 },
    flavorProfiles: ['umami', 'sweet', 'sour', 'spicy'],
    dietaryConsiderations: ['vegetarian-friendly', 'vegan options', 'gluten-free options']
  },
  'mediterranean': {
    name: 'Mediterranean',
    description: 'Healthy, fresh, and flavorful',
    commonIngredients: ['olive oil', 'lemon', 'herbs', 'feta', 'chickpeas', 'tomatoes', 'cucumber', 'yogurt'],
    typicalCostRange: { min: 9, max: 19 },
    profitMarginRange: { min: 62, max: 72 },
    prepTimeRange: { min: 20, max: 50 },
    flavorProfiles: ['herbaceous', 'citrusy', 'fresh', 'tangy'],
    dietaryConsiderations: ['vegetarian-friendly', 'vegan options', 'gluten-free options']
  },
  'american': {
    name: 'American Comfort',
    description: 'Classic comfort food with modern twists',
    commonIngredients: ['cheese', 'potatoes', 'beef', 'chicken', 'bacon', 'onions', 'garlic', 'herbs'],
    typicalCostRange: { min: 8, max: 17 },
    profitMarginRange: { min: 65, max: 75 },
    prepTimeRange: { min: 25, max: 55 },
    flavorProfiles: ['savory', 'rich', 'comforting', 'bold'],
    dietaryConsiderations: ['vegetarian options', 'gluten-free options']
  }
};

const SEASONAL_INGREDIENTS = {
  spring: ['asparagus', 'peas', 'strawberries', 'rhubarb', 'artichokes', 'fava beans'],
  summer: ['tomatoes', 'corn', 'zucchini', 'berries', 'basil', 'mint'],
  fall: ['pumpkin', 'squash', 'apples', 'mushrooms', 'sweet potatoes', 'cranberries'],
  winter: ['citrus', 'root vegetables', 'winter squash', 'cabbage', 'kale', 'parsnips']
};

const CURRENT_TRENDS = [
  'plant-based proteins',
  'fermented foods',
  'global fusion',
  'comfort food',
  'healthy bowls',
  'sustainable ingredients',
  'bold flavors',
  'texture contrast',
  'colorful plating',
  'functional ingredients'
];

export function AIMenuGenerator() {
  const { state } = useCostManagement();
  const [selectedCuisine, setSelectedCuisine] = useState<string>('italian');
  const [budgetRange, setBudgetRange] = useState<[number, number]>([8, 15]);
  const [targetProfitMargin, setTargetProfitMargin] = useState<number>(70);
  const [maxPrepTime, setMaxPrepTime] = useState<number>(30);
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [seasonalFocus, setSeasonalFocus] = useState<boolean>(true);
  const [suggestions, setSuggestions] = useState<MenuSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const currentSeason = getCurrentSeason();
  const availableIngredients = state.products.map(p => p.name.toLowerCase());

  function getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  function calculateIngredientCost(ingredientName: string, quantity: number): number {
    const product = state.products.find(p => 
      p.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
      ingredientName.toLowerCase().includes(p.name.toLowerCase())
    );
    
    if (!product) return quantity * 2; // Default cost estimate
    
    const costPerUnit = product.cost / (product.quantity * (product.packageSize || 1));
    return costPerUnit * quantity;
  }

  function getSeasonalAvailability(ingredient: string): 'peak' | 'good' | 'limited' | 'out' {
    const seasonalList = SEASONAL_INGREDIENTS[currentSeason as keyof typeof SEASONAL_INGREDIENTS];
    if (seasonalList.includes(ingredient)) return 'peak';
    
    // Check other seasons
    for (const [season, ingredients] of Object.entries(SEASONAL_INGREDIENTS)) {
      if (season !== currentSeason && ingredients.includes(ingredient)) {
        return 'limited';
      }
    }
    return 'good'; // Available year-round
  }

  function generateMenuSuggestions(): MenuSuggestion[] {
    const cuisine = CUISINE_PROFILES[selectedCuisine];
    const suggestions: MenuSuggestion[] = [];

    // Generate 5-8 menu suggestions based on parameters
    const numSuggestions = Math.floor(Math.random() * 4) + 5;
    
    for (let i = 0; i < numSuggestions; i++) {
      const suggestion = generateSingleSuggestion(cuisine);
      suggestions.push(suggestion);
    }

    return suggestions.sort((a, b) => b.costEffectiveness - a.costEffectiveness);
  }

  function generateSingleSuggestion(cuisine: CuisineProfile): MenuSuggestion {
    const categories: Array<'appetizer' | 'main' | 'dessert' | 'beverage'> = ['appetizer', 'main', 'dessert', 'beverage'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // Generate recipe name based on cuisine and category
    const recipeName = generateRecipeName(cuisine.name, category);
    
    // Select ingredients based on cuisine profile and availability
    const ingredients = selectOptimalIngredients(cuisine, category);
    
    // Calculate costs
    const totalCost = ingredients.reduce((sum, ing) => sum + ing.estimatedCost, 0);
    const suggestedPrice = totalCost * (1 + targetProfitMargin / 100);
    const profitMargin = ((suggestedPrice - totalCost) / suggestedPrice) * 100;
    
    // Calculate scores
    const seasonalScore = calculateSeasonalScore(ingredients);
    const trendScore = calculateTrendScore(recipeName, ingredients);
    const costEffectiveness = calculateCostEffectiveness(totalCost, profitMargin, seasonalScore);
    
    return {
      id: `suggestion-${Date.now()}-${Math.random()}`,
      name: recipeName,
      description: generateDescription(recipeName, cuisine, ingredients),
      cuisine: cuisine.name,
      category,
      estimatedCost: totalCost,
      suggestedPrice,
      profitMargin,
      difficulty: Math.random() > 0.6 ? 'easy' : Math.random() > 0.3 ? 'medium' : 'hard',
      prepTime: Math.floor(Math.random() * maxPrepTime) + 10,
      cookTime: Math.floor(Math.random() * 30) + 10,
      seasonalScore,
      trendScore,
      costEffectiveness,
      ingredients,
      tags: generateTags(recipeName, cuisine, ingredients),
      nutritionInfo: generateNutritionInfo(ingredients, category),
      substitutionOptions: generateSubstitutionOptions(ingredients)
    };
  }

  function generateRecipeName(cuisine: string, category: string): string {
    const cuisinePrefixes = {
      'Italian': ['Rustic', 'Traditional', 'Authentic', 'Classic'],
      'Mexican': ['Spicy', 'Fresh', 'Authentic', 'Traditional'],
      'Asian Fusion': ['Fusion', 'Modern', 'Traditional', 'Authentic'],
      'Mediterranean': ['Fresh', 'Light', 'Traditional', 'Rustic'],
      'American Comfort': ['Classic', 'Comfort', 'Modern', 'Traditional']
    };
    
    const categorySuffixes = {
      appetizer: ['Bites', 'Crostini', 'Dips', 'Sliders', 'Skewers'],
      main: ['Bowl', 'Plate', 'Skillet', 'Pasta', 'Salad'],
      dessert: ['Delight', 'Treat', 'Parfait', 'Tart', 'Cake'],
      beverage: ['Refresher', 'Spritzer', 'Smoothie', 'Tea', 'Cocktail']
    };
    
    // Get the cuisine key that matches the cuisine name
    const cuisineKey = Object.keys(cuisinePrefixes).find(key => key === cuisine) || 'Italian';
    const prefix = cuisinePrefixes[cuisineKey as keyof typeof cuisinePrefixes][Math.floor(Math.random() * 4)];
    const suffix = categorySuffixes[category as keyof typeof categorySuffixes][Math.floor(Math.random() * 5)];
    const mainIngredient = ['Tomato', 'Basil', 'Lemon', 'Garlic', 'Herb', 'Citrus'][Math.floor(Math.random() * 6)];
    
    return `${prefix} ${mainIngredient} ${suffix}`;
  }

  function selectOptimalIngredients(cuisine: CuisineProfile, category: string) {
    const ingredients = [];
    const numIngredients = Math.floor(Math.random() * 4) + 3; // 3-6 ingredients
    
    // Prioritize seasonal ingredients if seasonal focus is enabled
    const priorityIngredients = seasonalFocus 
      ? [...SEASONAL_INGREDIENTS[currentSeason as keyof typeof SEASONAL_INGREDIENTS], ...cuisine.commonIngredients]
      : cuisine.commonIngredients;
    
    for (let i = 0; i < numIngredients; i++) {
      const ingredientName = priorityIngredients[Math.floor(Math.random() * priorityIngredients.length)];
      const quantity = Math.random() * 2 + 0.5; // 0.5 to 2.5 units
      const unit = ['oz', 'cup', 'tbsp', 'tsp', 'clove', 'piece'][Math.floor(Math.random() * 6)];
      
      const estimatedCost = calculateIngredientCost(ingredientName, quantity);
      const seasonalAvailability = getSeasonalAvailability(ingredientName);
      const costTrend = Math.random() > 0.6 ? 'stable' as const : Math.random() > 0.3 ? 'decreasing' as const : 'increasing' as const;
      
      ingredients.push({
        name: ingredientName,
        quantity,
        unit,
        estimatedCost,
        seasonalAvailability,
        costTrend
      });
    }
    
    return ingredients;
  }

  function calculateSeasonalScore(ingredients: any[]): number {
    if (!seasonalFocus) return 50; // Neutral score if not focusing on seasonality
    
    const seasonalCount = ingredients.filter(ing => ing.seasonalAvailability === 'peak').length;
    return Math.min(100, (seasonalCount / ingredients.length) * 100);
  }

  function calculateTrendScore(recipeName: string, ingredients: any[]): number {
    let score = 50; // Base score
    
    // Check if recipe name contains trend keywords
    const trendKeywords = ['fusion', 'bowl', 'fresh', 'plant-based', 'sustainable'];
    trendKeywords.forEach(keyword => {
      if (recipeName.toLowerCase().includes(keyword)) score += 10;
    });
    
    // Check selected trends
    selectedTrends.forEach(trend => {
      if (recipeName.toLowerCase().includes(trend.replace('-', ' '))) score += 15;
    });
    
    return Math.min(100, score);
  }

  function calculateCostEffectiveness(cost: number, profitMargin: number, seasonalScore: number): number {
    // Higher score = more cost effective
    const costScore = Math.max(0, 100 - (cost / budgetRange[1]) * 100);
    const profitScore = profitMargin;
    const seasonalBonus = seasonalFocus ? seasonalScore * 0.2 : 0;
    
    return Math.min(100, (costScore + profitScore + seasonalBonus) / 3);
  }

  function generateDescription(name: string, cuisine: CuisineProfile, ingredients: any[]): string {
    const seasonalIngredient = ingredients.find(ing => ing.seasonalAvailability === 'peak');
    const seasonalText = seasonalIngredient ? ` featuring fresh ${seasonalIngredient.name}` : '';
    
    return `A delicious ${cuisine.name.toLowerCase()} ${name.toLowerCase()}${seasonalText}. Made with carefully selected ingredients for optimal flavor and cost-effectiveness.`;
  }

  function generateTags(name: string, cuisine: CuisineProfile, ingredients: any[]): string[] {
    const tags = [cuisine.name.toLowerCase()];
    
    if (seasonalFocus) tags.push('seasonal');
    if (ingredients.some(ing => ing.seasonalAvailability === 'peak')) tags.push('fresh');
    if (cuisine.dietaryConsiderations.includes('vegetarian-friendly')) tags.push('vegetarian');
    if (cuisine.dietaryConsiderations.includes('gluten-free options')) tags.push('gluten-free');
    
    selectedTrends.forEach(trend => {
      if (name.toLowerCase().includes(trend.replace('-', ' '))) tags.push(trend);
    });
    
    return tags;
  }

  function generateNutritionInfo(ingredients: any[], category: string) {
    // Simplified nutrition calculation
    const baseCalories = category === 'dessert' ? 300 : category === 'main' ? 500 : 200;
    const baseProtein = category === 'main' ? 25 : 8;
    const baseCarbs = category === 'dessert' ? 45 : 30;
    const baseFat = category === 'dessert' ? 15 : 12;
    
    return {
      calories: baseCalories + Math.floor(Math.random() * 100),
      protein: baseProtein + Math.floor(Math.random() * 10),
      carbs: baseCarbs + Math.floor(Math.random() * 15),
      fat: baseFat + Math.floor(Math.random() * 8)
    };
  }

  function generateSubstitutionOptions(ingredients: any[]): Array<{
    original: string;
    substitute: string;
    costSavings: number;
    impact: 'minimal' | 'moderate' | 'significant';
  }> {
    const substitutions: Array<{
      original: string;
      substitute: string;
      costSavings: number;
      impact: 'minimal' | 'moderate' | 'significant';
    }> = [];
    
    ingredients.forEach(ingredient => {
      if (ingredient.costTrend === 'increasing' || ingredient.estimatedCost > 3) {
        // Find cheaper alternatives
        const alternatives = ['onion', 'garlic', 'herbs', 'lemon', 'olive oil'];
        const substitute = alternatives[Math.floor(Math.random() * alternatives.length)];
        const costSavings = ingredient.estimatedCost * 0.3; // 30% savings estimate
        const impact = costSavings > 2 ? 'significant' : costSavings > 1 ? 'moderate' : 'minimal';
        
        substitutions.push({
          original: ingredient.name,
          substitute,
          costSavings,
          impact
        });
      }
    });
    
    return substitutions.slice(0, 3); // Limit to 3 substitutions
  }

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newSuggestions = generateMenuSuggestions();
    setSuggestions(newSuggestions);
    setIsGenerating(false);
  };

  const handleCreateRecipe = (suggestion: MenuSuggestion) => {
    // Convert suggestion to recipe format and add to recipes
    // This would integrate with the existing recipe system
    console.log('Creating recipe from suggestion:', suggestion);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <ChefHat className="h-8 w-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold">AI Menu Generator</h1>
          <p className="text-gray-600">Generate cost-effective menu items based on cuisine style, seasonality, and trends</p>
        </div>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator">Menu Generator</TabsTrigger>
          <TabsTrigger value="suggestions">Generated Suggestions</TabsTrigger>
          <TabsTrigger value="analysis">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cuisine Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Cuisine Style
                </CardTitle>
                <CardDescription>Select your preferred cuisine style</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CUISINE_PROFILES).map(([key, profile]) => (
                      <SelectItem key={key} value={key}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedCuisine && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">{CUISINE_PROFILES[selectedCuisine].name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{CUISINE_PROFILES[selectedCuisine].description}</p>
                    <div className="flex flex-wrap gap-1">
                      {CUISINE_PROFILES[selectedCuisine].commonIngredients.slice(0, 6).map(ingredient => (
                        <Badge key={ingredient} variant="secondary" className="text-xs">
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget & Profit Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget & Profit
                </CardTitle>
                <CardDescription>Set your cost and profit targets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Cost Range (per serving)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input 
                      type="number" 
                      value={budgetRange[0] || ''} 
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setBudgetRange([isNaN(value) ? 8 : value, budgetRange[1]]);
                      }}
                      className="w-20"
                    />
                    <span>to</span>
                    <Input 
                      type="number" 
                      value={budgetRange[1] || ''} 
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setBudgetRange([budgetRange[0], isNaN(value) ? 15 : value]);
                      }}
                      className="w-20"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Target Profit Margin: {targetProfitMargin}%</Label>
                  <Slider
                    value={[targetProfitMargin]}
                    onValueChange={(value) => setTargetProfitMargin(value[0])}
                    max={100}
                    min={30}
                    step={5}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Max Prep Time: {maxPrepTime} minutes</Label>
                  <Slider
                    value={[maxPrepTime]}
                    onValueChange={(value) => setMaxPrepTime(value[0])}
                    max={60}
                    min={10}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trends & Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trends & Preferences
              </CardTitle>
              <CardDescription>Select current trends and dietary preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-base font-medium">Current Trends</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {CURRENT_TRENDS.map(trend => (
                      <div key={trend} className="flex items-center space-x-2">
                        <Checkbox
                          id={trend}
                          checked={selectedTrends.includes(trend)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTrends([...selectedTrends, trend]);
                            } else {
                              setSelectedTrends(selectedTrends.filter(t => t !== trend));
                            }
                          }}
                        />
                        <Label htmlFor={trend} className="text-sm">{trend}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-base font-medium">Seasonal Focus</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="seasonal"
                      checked={seasonalFocus}
                      onCheckedChange={(checked) => setSeasonalFocus(checked as boolean)}
                    />
                    <Label htmlFor="seasonal">Prioritize seasonal ingredients</Label>
                  </div>
                  
                  {seasonalFocus && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Current Season: {currentSeason}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-green-600">Peak ingredients: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {SEASONAL_INGREDIENTS[currentSeason as keyof typeof SEASONAL_INGREDIENTS].slice(0, 4).map(ingredient => (
                            <Badge key={ingredient} variant="outline" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleGenerateSuggestions}
                disabled={isGenerating}
                className="w-full h-12 text-lg"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    Generating Menu Suggestions...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Generate Menu Suggestions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Lightbulb className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No suggestions generated yet. Use the Menu Generator tab to create your first suggestions.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{suggestion.name}</CardTitle>
                        <CardDescription>{suggestion.cuisine} • {suggestion.category}</CardDescription>
                      </div>
                      <Badge variant={suggestion.difficulty === 'easy' ? 'default' : suggestion.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                        {suggestion.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{suggestion.description}</p>
                    
                    {/* Cost & Profit Info */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Cost</p>
                        <p className="font-semibold">${suggestion.estimatedCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Suggested Price</p>
                        <p className="font-semibold">${suggestion.suggestedPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Profit Margin</p>
                        <p className="font-semibold text-green-600">{suggestion.profitMargin.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Prep Time</p>
                        <p className="font-semibold">{suggestion.prepTime} min</p>
                      </div>
                    </div>
                    
                    {/* Scores */}
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Leaf className="h-3 w-3 mr-1" />
                        {suggestion.seasonalScore.toFixed(0)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {suggestion.trendScore.toFixed(0)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        {suggestion.costEffectiveness.toFixed(0)}
                      </Badge>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {suggestion.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleCreateRecipe(suggestion)}
                        className="flex-1"
                      >
                        <Calculator className="h-4 w-4 mr-1" />
                        Create Recipe
                      </Button>
                      <Button size="sm" variant="outline">
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis & Insights</CardTitle>
              <CardDescription>Analysis of generated suggestions and cost optimization opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <p className="text-gray-600">Generate suggestions first to see cost analysis.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Average Cost</h4>
                      <p className="text-2xl font-bold text-blue-700">
                        ${(suggestions.reduce((sum, s) => sum + s.estimatedCost, 0) / suggestions.length).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900">Average Profit Margin</h4>
                      <p className="text-2xl font-bold text-green-700">
                        {(suggestions.reduce((sum, s) => sum + s.profitMargin, 0) / suggestions.length).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-900">Best Value</h4>
                      <p className="text-lg font-bold text-orange-700">
                        {suggestions.sort((a, b) => b.costEffectiveness - a.costEffectiveness)[0]?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Cost Optimization Tips</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Seasonal ingredients are typically 20-40% cheaper during peak season</li>
                      <li>• Consider bulk purchasing for frequently used ingredients</li>
                      <li>• Substitute expensive ingredients with similar, more affordable alternatives</li>
                      <li>• Monitor ingredient price trends to time purchases optimally</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
