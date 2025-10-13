import type { NextApiRequest, NextApiResponse } from 'next';
import { SubstitutionEngine, MenuGenerationContext } from '@/lib/substitution-engine';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    restaurantId = 'default', 
    recipeId, 
    includeOptimization = 'false',
    minSavings = '0.10', // Minimum $0.10 savings per serving
    generateMenuItems = 'false',
    menuCount = '5',
    targetCostMin = '2.00',
    targetCostMax = '8.00',
    targetProfitMargin = '40',
    dietaryRestrictions = '',
    flavorPreferences = ''
  } = req.query;

  try {
    // Load restaurant data
    const restaurantData = await loadRestaurantData(restaurantId as string);
    
    if (!restaurantData) {
      return res.status(404).json({ error: 'Restaurant data not found' });
    }

    const { recipes, products, sales } = restaurantData;
    const minSavingsAmount = parseFloat(minSavings as string);

    let results: any = {};

    if (recipeId) {
      // Get substitutions for specific recipe
      const recipe = recipes.find((r: any) => r.id === recipeId);
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
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
            min: parseFloat(targetCostMin as string),
            max: parseFloat(targetCostMax as string)
          },
          targetProfitMargin: parseFloat(targetProfitMargin as string),
          availableIngredients: products,
          excludedIngredients: [], // Could be made configurable
          preferredCategories: ['main', 'dessert', 'appetizer', 'beverage', 'side'],
          maxPreparationTime: 60, // 60 minutes max
          dietaryRestrictions: dietaryRestrictions ? (dietaryRestrictions as string).split(',') : [],
          flavorPreferences: flavorPreferences ? (flavorPreferences as string).split(',') : []
        };

        const generatedMenuItems = await SubstitutionEngine.generateMenuItems(
          menuContext,
          parseInt(menuCount as string)
        );

        results.generatedMenuItems = generatedMenuItems;
        results.menuGenerationContext = menuContext;
      }
    }

    return res.status(200).json(results);

  } catch (error) {
    console.error('Error in substitution recommendations:', error);
    return res.status(500).json({ 
      error: 'Failed to generate substitution recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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
