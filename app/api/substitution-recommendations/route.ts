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

  // Return mock data for demo purposes
  const makeSub = (
    originalName: string,
    originalCost: number,
    substituteName: string,
    substituteCost: number,
    ratio: number,
    costReduction: number,
    pctReduction: number,
    compat: number,
    difficulty: 'easy' | 'medium' | 'hard',
    time: string,
    risk: 'low' | 'medium' | 'high'
  ) => ({
    originalIngredient: {
      productId: originalName.toLowerCase().replace(/\s+/g, '-'),
      name: originalName,
      currentPrice: originalCost,
      costPerServing: originalCost,
    },
    suggestedSubstitute: {
      productId: substituteName.toLowerCase().replace(/\s+/g, '-'),
      name: substituteName,
      currentPrice: substituteCost,
      costPerServing: substituteCost,
      substitutionRatio: ratio,
    },
    savings: {
      costReduction,
      percentageReduction: pctReduction,
      annualSavings: Math.round(costReduction * 365 * 10) / 10,
    },
    compatibility: {
      score: Math.round(compat * 100) / 100,
      factors: {
        flavorMatch: Math.min(100, Math.round(compat + 5)),
        textureMatch: Math.min(100, Math.round(compat - 5)),
        nutritionalMatch: Math.min(100, Math.round(compat - 3)),
        allergenCompatibility: 100,
      },
    },
    implementation: {
      difficulty,
      timeToImplement: time,
      testingRequired: difficulty !== 'easy',
      staffTrainingNeeded: difficulty === 'hard',
    },
    risks: {
      customerAcceptance: risk,
      supplyReliability: 'low',
      qualityConsistency: risk,
    },
  });

  const mockResults = {
    restaurantId,
    timestamp: new Date().toISOString(),
    summary: {
      totalRecipes: 3,
      recipesWithSubstitutions: 3,
      totalSubstitutions: 8,
      totalPotentialSavings: 2.45,
      averageSavingsPerRecipe: 0.82
    },
    recipeSubstitutions: [
      {
        recipeId: 'recipe-1',
        recipeName: 'Chocolate Chip Cookies',
        substitutions: [
          makeSub('Dark Chocolate', 0.8, 'Semi-Sweet Chocolate', 0.45, 1.0, 0.35, 43.8, 92, 'easy', 'Same day', 'low'),
          makeSub('Butter', 0.7, 'Margarine', 0.42, 1.0, 0.28, 40.0, 85, 'medium', '2 days', 'medium'),
        ],
        totalSavings: 0.63,
      },
      {
        recipeId: 'recipe-2',
        recipeName: 'Premium Chocolate Dessert',
        substitutions: [
          makeSub('Premium Vanilla', 0.9, 'Vanilla Extract', 0.45, 1.0, 0.45, 50.0, 90, 'easy', 'Same day', 'low'),
        ],
        totalSavings: 0.45,
      },
      {
        recipeId: 'recipe-3',
        recipeName: 'Blueberry Pancakes',
        substitutions: [
          makeSub('Fresh Blueberries', 0.95, 'Frozen Blueberries', 0.43, 1.0, 0.52, 54.7, 88, 'easy', 'Same day', 'low'),
          makeSub('Whole Milk', 0.5, '2% Milk', 0.32, 1.0, 0.18, 36.0, 92, 'easy', 'Same day', 'low'),
        ],
        totalSavings: 0.70,
      },
    ],
    topOpportunities: [
      {
        recipeId: 'recipe-3',
        recipeName: 'Blueberry Pancakes',
        substitutions: [
          makeSub('Fresh Blueberries', 0.95, 'Frozen Blueberries', 0.43, 1.0, 0.52, 54.7, 88, 'easy', 'Same day', 'low'),
        ],
        totalSavings: 0.70,
      },
      {
        recipeId: 'recipe-1',
        recipeName: 'Chocolate Chip Cookies',
        substitutions: [
          makeSub('Dark Chocolate', 0.8, 'Semi-Sweet Chocolate', 0.45, 1.0, 0.35, 43.8, 92, 'easy', 'Same day', 'low'),
        ],
        totalSavings: 0.63,
      }
    ],
    ...(includeOptimization === 'true' && {
      recipeOptimizations: [
        {
          recipeId: 'recipe-1',
          recipeName: 'Chocolate Chip Cookies',
          currentCostPerServing: 3.25,
          optimizedCostPerServing: 2.62,
          totalSavings: 0.63,
          substitutions: [
            makeSub('Dark Chocolate', 0.8, 'Semi-Sweet Chocolate', 0.45, 1.0, 0.35, 43.8, 92, 'easy', 'Same day', 'low'),
            makeSub('Butter', 0.7, 'Margarine', 0.42, 1.0, 0.28, 40.0, 85, 'medium', '2 days', 'medium'),
          ],
          implementation: { totalTimeToImplement: '3 days', riskLevel: 'low', testingPhases: 1 },
        },
      ]
    }),
    ...(generateMenuItems === 'true' && {
      generatedMenuItems: [
        {
          id: 'menu-1',
          name: 'Chocolate Berry Parfait',
          category: 'dessert',
          description: 'Layered dessert with chocolate, berries, and cream',
          ingredients: [
            { productId: 'dark-chocolate', productName: 'Dark Chocolate', quantity: 0.05, unit: 'lb', costPerUnit: 9.0, totalCost: 0.45 },
            { productId: 'blueberries', productName: 'Blueberries', quantity: 0.1, unit: 'lb', costPerUnit: 4.3, totalCost: 0.43 },
            { productId: 'whole-milk', productName: 'Whole Milk', quantity: 0.2, unit: 'cup', costPerUnit: 0.5, totalCost: 0.10 },
          ],
          estimatedCostPerServing: 2.85,
          suggestedPrice: 6.5,
          estimatedProfitMargin: 56.2,
          flavorProfile: ['sweet', 'chocolate', 'berry'],
          nutritionalHighlights: ['antioxidants', 'calcium'],
          preparationTime: 15,
          difficulty: 'easy',
          seasonalAvailability: ['spring', 'summer'],
          inspiration: 'Classic parfait with cost-optimized ingredients',
          tags: ['dessert', 'berries']
        },
        {
          id: 'menu-2',
          name: 'Vanilla Berry Smoothie',
          category: 'beverage',
          description: 'Creamy smoothie with vanilla and mixed berries',
          ingredients: [
            { productId: 'vanilla-extract', productName: 'Vanilla Extract', quantity: 0.01, unit: 'cup', costPerUnit: 20, totalCost: 0.2 },
            { productId: 'blueberries', productName: 'Blueberries', quantity: 0.15, unit: 'lb', costPerUnit: 4.3, totalCost: 0.65 },
            { productId: 'whole-milk', productName: 'Whole Milk', quantity: 0.5, unit: 'cup', costPerUnit: 0.5, totalCost: 0.25 },
          ],
          estimatedCostPerServing: 1.95,
          suggestedPrice: 4.5,
          estimatedProfitMargin: 56.7,
          flavorProfile: ['sweet', 'vanilla', 'fruity'],
          nutritionalHighlights: ['vitamin C', 'protein'],
          preparationTime: 5,
          difficulty: 'easy',
          seasonalAvailability: ['year-round'],
          inspiration: 'Healthy breakfast option with seasonal ingredients',
          tags: ['beverage']
        }
      ],
      menuGenerationContext: {
        targetCostRange: { min: 2.00, max: 8.00 },
        targetProfitMargin: 40,
        availableIngredients: 8,
        excludedIngredients: [],
        preferredCategories: ['main', 'dessert', 'appetizer', 'beverage', 'side'],
        maxPreparationTime: 60,
        dietaryRestrictions: [],
        flavorPreferences: []
      }
    })
  };

  return NextResponse.json(mockResults);
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
