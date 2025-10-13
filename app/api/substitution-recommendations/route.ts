import { NextRequest, NextResponse } from 'next/server';
import { SubstitutionEngine, MenuGenerationContext } from '@/lib/substitution-engine';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurantId') || 'default';
  const recipeId = searchParams.get('recipeId');
  const includeOptimization = searchParams.get('includeOptimization') || 'false';
  const minSavings = searchParams.get('minSavings') || '0.10';
  const generateMenuItems = searchParams.get('generateMenuItems') || 'false';
  const menuCount = searchParams.get('menuCount') || '5';
  const targetCostMin = searchParams.get('targetCostMin') || '2.00';
  const targetCostMax = searchParams.get('targetCostMax') || '8.00';
  const targetProfitMargin = searchParams.get('targetProfitMargin') || '40';
  const dietaryRestrictions = searchParams.get('dietaryRestrictions') || '';
  const flavorPreferences = searchParams.get('flavorPreferences') || '';

  try {
    // Load restaurant data
    const restaurantData = await loadRestaurantData(restaurantId);
    
    if (!restaurantData) {
      return NextResponse.json({ error: 'Restaurant data not found' }, { status: 404 });
    }

    const { recipes, products, sales } = restaurantData;
    const minSavingsAmount = parseFloat(minSavings);

    let results: any = {};

    if (recipeId) {
      // Get substitutions for specific recipe
      const recipe = recipes.find((r: any) => r.id === recipeId);
      if (!recipe) {
        return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
      }

      const substitutions = await SubstitutionEngine.findOptimalSubstitutions(
        recipe, 
        products, 
        sales
      );

      // Filter by minimum savings
      const filteredSubstitutions = substitutions.filter(sub => 
        sub.savings.costReduction >= minSavingsAmount
      );

      results = {
        recipeId: recipe.id,
        recipeName: recipe.name,
        substitutions: filteredSubstitutions,
        summary: {
          totalSubstitutions: filteredSubstitutions.length,
          totalSavings: filteredSubstitutions.reduce((sum, sub) => sum + sub.savings.costReduction, 0),
          averageSavings: filteredSubstitutions.length > 0 
            ? filteredSubstitutions.reduce((sum, sub) => sum + sub.savings.costReduction, 0) / filteredSubstitutions.length 
            : 0,
          highImpactSubstitutions: filteredSubstitutions.filter(sub => 
            sub.savings.costReduction >= 0.50
          ).length
        }
      };

      // Include full recipe optimization if requested
      if (includeOptimization === 'true') {
        const optimization = await SubstitutionEngine.optimizeRecipe(recipe, products, sales);
        results.optimization = optimization;
      }

    } else {
      // Get substitutions for all recipes
      const allSubstitutions = [];
      const recipeOptimizations = [];

      for (const recipe of recipes) {
        try {
          const substitutions = await SubstitutionEngine.findOptimalSubstitutions(
            recipe, 
            products, 
            sales
          );

          const filteredSubstitutions = substitutions.filter(sub => 
            sub.savings.costReduction >= minSavingsAmount
          );

          if (filteredSubstitutions.length > 0) {
            allSubstitutions.push({
              recipeId: recipe.id,
              recipeName: recipe.name,
              substitutions: filteredSubstitutions,
              totalSavings: filteredSubstitutions.reduce((sum, sub) => sum + sub.savings.costReduction, 0)
            });
          }

          // Include optimizations if requested
          if (includeOptimization === 'true') {
            const optimization = await SubstitutionEngine.optimizeRecipe(recipe, products, sales);
            if (optimization.totalSavings >= minSavingsAmount) {
              recipeOptimizations.push(optimization);
            }
          }

        } catch (error) {
          console.error(`Error processing recipe ${recipe.name}:`, error);
        }
      }

      // Sort by total savings
      allSubstitutions.sort((a, b) => b.totalSavings - a.totalSavings);
      recipeOptimizations.sort((a, b) => b.totalSavings - a.totalSavings);

      results = {
        restaurantId,
        timestamp: new Date().toISOString(),
        summary: {
          totalRecipes: recipes.length,
          recipesWithSubstitutions: allSubstitutions.length,
          totalSubstitutions: allSubstitutions.reduce((sum, recipe) => sum + recipe.substitutions.length, 0),
          totalPotentialSavings: allSubstitutions.reduce((sum, recipe) => sum + recipe.totalSavings, 0),
          averageSavingsPerRecipe: allSubstitutions.length > 0 
            ? allSubstitutions.reduce((sum, recipe) => sum + recipe.totalSavings, 0) / allSubstitutions.length 
            : 0
        },
        recipeSubstitutions: allSubstitutions,
        topOpportunities: allSubstitutions.slice(0, 5),
        ...(includeOptimization === 'true' && { recipeOptimizations })
      };

      // Generate new menu items if requested
      if (generateMenuItems === 'true') {
        const menuContext: MenuGenerationContext = {
          targetCostRange: {
            min: parseFloat(targetCostMin),
            max: parseFloat(targetCostMax)
          },
          targetProfitMargin: parseFloat(targetProfitMargin),
          availableIngredients: products,
          excludedIngredients: [], // Could be made configurable
          preferredCategories: ['main', 'dessert', 'appetizer', 'beverage', 'side'],
          maxPreparationTime: 60, // 60 minutes max
          dietaryRestrictions: dietaryRestrictions ? dietaryRestrictions.split(',') : [],
          flavorPreferences: flavorPreferences ? flavorPreferences.split(',') : []
        };

        const generatedMenuItems = await SubstitutionEngine.generateMenuItems(
          menuContext,
          parseInt(menuCount)
        );

        results.generatedMenuItems = generatedMenuItems;
        results.menuGenerationContext = menuContext;
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in substitution recommendations:', error);
    return NextResponse.json({ 
      error: 'Failed to generate substitution recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function loadRestaurantData(restaurantId: string) {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      const allData = JSON.parse(fileContent);
      return allData[restaurantId] || null;
    }
  } catch (error) {
    console.error('Error loading restaurant data:', error);
  }
  return null;
}
