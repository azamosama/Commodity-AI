import { NextRequest, NextResponse } from 'next/server';
import { ProfitabilityAnalyzer } from '@/lib/profitability-analyzer';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurantId') || 'default';
  const includeRecommendations = searchParams.get('includeRecommendations') || 'true';

  // Return mock data for demo purposes
  const mockResponse = {
    restaurantId,
    timestamp: new Date().toISOString(),
    cacheBuster: Date.now(),
    summary: {
      totalRecipes: 4,
      profitableRecipes: 4,
      unprofitableRecipes: 0,
      averageProfitMargin: 54.3,
      totalPotentialSavings: 1.25,
      criticalAlerts: 0,
      warningAlerts: 2
    },
    analyses: [
      {
        recipeId: 'recipe-1',
        recipeName: 'Chocolate Chip Cookies',
        costPerServing: 1.85,
        salePrice: 4.50,
        profitMarginPercentage: 58.9,
        isProfitable: true,
        profitabilityStatus: 'profitable',
        costBreakdown: [
          {
            productId: 'dark-chocolate-1',
            productName: 'Dark Chocolate',
            quantity: 0.1,
            unit: 'lb',
            costPerUnit: 8.00,
            totalCost: 0.80
          },
          {
            productId: 'all-purpose-flour-1',
            productName: 'All-Purpose Flour',
            quantity: 0.2,
            unit: 'lb',
            costPerUnit: 2.50,
            totalCost: 0.50
          },
          {
            productId: 'granulated-sugar-1',
            productName: 'Granulated Sugar',
            quantity: 0.15,
            unit: 'lb',
            costPerUnit: 3.00,
            totalCost: 0.45
          },
          {
            productId: 'butter-1',
            productName: 'Butter',
            quantity: 0.1,
            unit: 'lb',
            costPerUnit: 1.00,
            totalCost: 0.10
          }
        ],
        recommendations: []
      },
      {
        recipeId: 'recipe-2',
        recipeName: 'Premium Chocolate Dessert',
        costPerServing: 2.95,
        salePrice: 7.00,
        profitMarginPercentage: 57.9,
        isProfitable: true,
        profitabilityStatus: 'profitable',
        costBreakdown: [
          {
            productId: 'dark-chocolate-1',
            productName: 'Dark Chocolate',
            quantity: 0.2,
            unit: 'lb',
            costPerUnit: 8.00,
            totalCost: 1.60
          },
          {
            productId: 'premium-vanilla-1',
            productName: 'Premium Vanilla',
            quantity: 0.05,
            unit: 'oz',
            costPerUnit: 14.00,
            totalCost: 0.70
          },
          {
            productId: 'whole-milk-1',
            productName: 'Whole Milk',
            quantity: 0.1,
            unit: 'gallon',
            costPerUnit: 3.50,
            totalCost: 0.35
          },
          {
            productId: 'large-eggs-1',
            productName: 'Large Eggs',
            quantity: 0.15,
            unit: 'dozen',
            costPerUnit: 3.67,
            totalCost: 0.30
          }
        ],
        recommendations: []
      },
      {
        recipeId: 'recipe-3',
        recipeName: 'Blueberry Pancakes',
        costPerServing: 1.65,
        salePrice: 4.25,
        profitMarginPercentage: 61.2,
        isProfitable: true,
        profitabilityStatus: 'profitable',
        costBreakdown: [
          {
            productId: 'all-purpose-flour-1',
            productName: 'All-Purpose Flour',
            quantity: 0.3,
            unit: 'lb',
            costPerUnit: 2.50,
            totalCost: 0.75
          },
          {
            productId: 'blueberries-1',
            productName: 'Blueberries',
            quantity: 0.2,
            unit: 'lb',
            costPerUnit: 4.00,
            totalCost: 0.80
          },
          {
            productId: 'whole-milk-1',
            productName: 'Whole Milk',
            quantity: 0.15,
            unit: 'gallon',
            costPerUnit: 3.50,
            totalCost: 0.53
          },
          {
            productId: 'large-eggs-1',
            productName: 'Large Eggs',
            quantity: 0.1,
            unit: 'dozen',
            costPerUnit: 3.67,
            totalCost: 0.37
          }
        ],
        recommendations: []
      }
    ],
    alerts: {
      critical: [],
      warning: [
        {
          id: 'alert-1',
          type: 'warning',
          title: 'High Ingredient Cost Alert',
          message: 'Dark Chocolate prices have increased by 15% this month. Consider ingredient substitutions.',
          recipeId: 'recipe-1',
          recipeName: 'Chocolate Chip Cookies',
          severity: 'warning',
          timestamp: new Date().toISOString(),
          actionable: true,
          suggestedActions: [
            'Consider switching to semi-sweet chocolate',
            'Negotiate bulk pricing with suppliers',
            'Adjust menu pricing by $0.25'
          ]
        },
        {
          id: 'alert-2',
          type: 'warning',
          title: 'Low Profit Margin Warning',
          message: 'Blueberry Pancakes profit margin is below target. Review ingredient costs.',
          recipeId: 'recipe-3',
          recipeName: 'Blueberry Pancakes',
          severity: 'warning',
          timestamp: new Date().toISOString(),
          actionable: true,
          suggestedActions: [
            'Switch to frozen blueberries during off-season',
            'Optimize portion sizes',
            'Consider seasonal menu adjustments'
          ]
        }
      ],
      info: [
        {
          id: 'info-1',
          type: 'info',
          title: 'Seasonal Opportunity',
          message: 'Strawberry prices are at seasonal low. Consider adding strawberry items to menu.',
          severity: 'info',
          timestamp: new Date().toISOString(),
          actionable: false,
          recipeId: 'recipe-4',
          recipeName: 'Strawberry Chocolate Parfait',
          profitMargin: 3.10,
          profitMarginPercentage: 0.564
        }
      ]
    },
    menuSuggestions: [
      {
        id: 'suggestion-1',
        type: 'new_item',
        title: 'Strawberry Chocolate Parfait',
        description: 'Seasonal dessert leveraging low strawberry prices',
        estimatedCost: 2.40,
        suggestedPrice: 5.50,
        profitMargin: 56.4,
        ingredients: [
          {
            productId: 'strawberries-1',
            name: 'Strawberries',
            currentPrice: 3.50,
            unit: 'lb'
          },
          {
            productId: 'dark-chocolate-1',
            name: 'Dark Chocolate',
            currentPrice: 8.00,
            unit: 'lb'
          },
          {
            productId: 'whipped-cream-1',
            name: 'Whipped Cream',
            currentPrice: 4.50,
            unit: 'pint'
          }
        ],
        preparationTime: 10,
        difficulty: 'Easy'
      }
    ],
    recommendations: {
      topCostReductions: [
        {
          id: 'rec-1',
          type: 'substitution',
          title: 'Switch to Semi-Sweet Chocolate',
          description: 'Replace dark chocolate with semi-sweet chocolate in Chocolate Chip Cookies',
          recipeId: 'recipe-1',
          recipeName: 'Chocolate Chip Cookies',
          potentialSavings: 0.35,
          priority: 'high',
          implementationDifficulty: 'Easy',
          customerImpact: 'Low',
          timeToImplement: '1 day',
          ingredients: ['Dark Chocolate → Semi-Sweet Chocolate'],
          implementation: {
            estimatedTime: '1 day',
            riskLevel: 'low'
          }
        },
        {
          id: 'rec-2',
          type: 'substitution',
          title: 'Use Frozen Blueberries',
          description: 'Switch to frozen blueberries during off-season for Blueberry Pancakes',
          recipeId: 'recipe-3',
          recipeName: 'Blueberry Pancakes',
          potentialSavings: 0.28,
          priority: 'medium',
          implementationDifficulty: 'Easy',
          customerImpact: 'Minimal',
          timeToImplement: 'Same day',
          ingredients: ['Fresh Blueberries → Frozen Blueberries'],
          implementation: {
            estimatedTime: 'Same day',
            riskLevel: 'low'
          }
        },
        {
          id: 'rec-3',
          type: 'substitution',
          title: 'Bulk Vanilla Extract',
          description: 'Purchase premium vanilla extract in bulk for Premium Chocolate Dessert',
          recipeId: 'recipe-2',
          recipeName: 'Premium Chocolate Dessert',
          potentialSavings: 0.22,
          priority: 'low',
          implementationDifficulty: 'Medium',
          customerImpact: 'None',
          timeToImplement: '1 week',
          ingredients: ['Premium Vanilla → Bulk Vanilla Extract'],
          implementation: {
            estimatedTime: '1 week',
            riskLevel: 'medium'
          }
        }
      ],
      priceAdjustments: [
        {
          id: 'price-1',
          type: 'price_adjustment',
          title: 'Increase Chocolate Chip Cookie Price',
          description: 'Current margin is below target. Increase price to improve profitability.',
          recipeId: 'recipe-1',
          recipeName: 'Chocolate Chip Cookies',
          currentPrice: 4.50,
          suggestedPrice: 4.75,
          potentialSavings: 0.25,
          priority: 'high',
          reason: 'Low profit margin',
          marketComparison: 'Competitors charge $4.50-$5.00',
          customerImpact: 'Low',
          implementation: {
            estimatedTime: 'Immediate',
            riskLevel: 'low'
          }
        },
        {
          id: 'price-2',
          type: 'price_adjustment',
          title: 'Premium Dessert Price Optimization',
          description: 'Premium positioning allows for higher pricing',
          recipeId: 'recipe-2',
          recipeName: 'Premium Chocolate Dessert',
          currentPrice: 7.00,
          suggestedPrice: 7.50,
          potentialSavings: 0.50,
          priority: 'medium',
          reason: 'Premium positioning',
          marketComparison: 'Similar desserts $7.00-$8.50',
          customerImpact: 'Minimal',
          implementation: {
            estimatedTime: 'Immediate',
            riskLevel: 'low'
          }
        }
      ]
    }
  };

  const response = NextResponse.json(mockResponse);
  
  // Add cache-busting headers
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
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
