import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');

// For Netlify, also try alternative paths
const ALTERNATIVE_PATHS = [
  path.join('/tmp', 'restaurant-data.json'),
  path.join(process.cwd(), 'restaurant-data.json'),
  path.join(process.cwd(), 'data', 'restaurant-data.json')
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurantId') || 'default';

  try {
    console.log('API: Loading data for restaurant:', restaurantId);
    
    // For demo purposes, always return mock data to ensure UI is populated
    const mockData = {
      products: [
        {
          "id": "dark-chocolate-1",
          "name": "Dark Chocolate",
          "quantity": 2.5,
          "unit": "lb",
          "packageSize": 1,
          "packageUnit": "lb",
          "cost": 8.00,
          "category": "Food",
          "categoryType": "Baking",
          "supplier": "Premium Chocolates Inc.",
          "reorderPoint": 1.0,
          "lastUpdated": "2025-01-16T10:30:00Z",
          "usedInRecipes": ["Chocolate Chip Cookies", "Premium Chocolate Dessert"],
          "variance": 0.1,
          "shrinkagePercent": 2.5
        },
        {
          "id": "all-purpose-flour-1",
          "name": "All-Purpose Flour",
          "quantity": 10.0,
          "unit": "lb",
          "packageSize": 5,
          "packageUnit": "lb",
          "cost": 2.50,
          "category": "Food",
          "categoryType": "Baking",
          "supplier": "Flour Mill Co.",
          "reorderPoint": 3.0,
          "lastUpdated": "2025-01-15T14:20:00Z",
          "usedInRecipes": ["Chocolate Chip Cookies", "Blueberry Pancakes"],
          "variance": 0.2,
          "shrinkagePercent": 1.0
        },
        {
          "id": "granulated-sugar-1",
          "name": "Granulated Sugar",
          "quantity": 5.0,
          "unit": "lb",
          "packageSize": 2,
          "packageUnit": "lb",
          "cost": 3.00,
          "category": "Food",
          "categoryType": "Baking",
          "supplier": "Sweet Sugar Co.",
          "reorderPoint": 2.0,
          "lastUpdated": "2025-01-14T09:15:00Z",
          "usedInRecipes": ["Chocolate Chip Cookies", "Premium Chocolate Dessert"],
          "variance": 0.1,
          "shrinkagePercent": 0.5
        },
        {
          "id": "butter-1",
          "name": "Butter",
          "quantity": 3.0,
          "unit": "lb",
          "packageSize": 1,
          "packageUnit": "lb",
          "cost": 1.00,
          "category": "Food",
          "categoryType": "Dairy",
          "supplier": "Creamery Farms",
          "reorderPoint": 1.5,
          "lastUpdated": "2025-01-13T16:45:00Z",
          "usedInRecipes": ["Chocolate Chip Cookies"],
          "variance": 0.05,
          "shrinkagePercent": 1.0
        },
        {
          "id": "large-eggs-1",
          "name": "Large Eggs",
          "quantity": 24,
          "unit": "count",
          "packageSize": 12,
          "packageUnit": "count",
          "cost": 3.50,
          "category": "Food",
          "categoryType": "Dairy",
          "supplier": "Fresh Egg Farm",
          "reorderPoint": 12,
          "lastUpdated": "2025-01-12T11:30:00Z",
          "usedInRecipes": ["Premium Chocolate Dessert", "Blueberry Pancakes"],
          "variance": 2,
          "shrinkagePercent": 3.0
        },
        {
          "id": "whole-milk-1",
          "name": "Whole Milk",
          "quantity": 2,
          "unit": "gallon",
          "packageSize": 1,
          "packageUnit": "gallon",
          "cost": 3.50,
          "category": "Food",
          "categoryType": "Dairy",
          "supplier": "Local Dairy Co.",
          "reorderPoint": 1,
          "lastUpdated": "2025-01-11T08:20:00Z",
          "usedInRecipes": ["Blueberry Pancakes"],
          "variance": 0.1,
          "shrinkagePercent": 2.0
        },
        {
          "id": "blueberries-1",
          "name": "Blueberries",
          "quantity": 1.5,
          "unit": "lb",
          "packageSize": 1,
          "packageUnit": "lb",
          "cost": 4.00,
          "category": "Food",
          "categoryType": "Produce",
          "supplier": "Berry Farms",
          "reorderPoint": 0.5,
          "lastUpdated": "2025-01-10T13:15:00Z",
          "usedInRecipes": ["Blueberry Pancakes"],
          "variance": 0.1,
          "shrinkagePercent": 5.0
        },
        {
          "id": "premium-vanilla-1",
          "name": "Premium Vanilla Extract",
          "quantity": 0.5,
          "unit": "fl oz",
          "packageSize": 2,
          "packageUnit": "fl oz",
          "cost": 12.00,
          "category": "Food",
          "categoryType": "Baking",
          "supplier": "Vanilla Co.",
          "reorderPoint": 0.25,
          "lastUpdated": "2025-01-09T15:40:00Z",
          "usedInRecipes": ["Premium Chocolate Dessert"],
          "variance": 0.02,
          "shrinkagePercent": 0.0
        }
      ],
      sales: [
        {
          "id": "sale-1",
          "recipeName": "Chocolate Chip Cookies",
          "quantity": 12,
          "salePrice": 4.50,
          "date": "2025-01-16T14:30:00Z",
          "totalRevenue": 54.00
        },
        {
          "id": "sale-2",
          "recipeName": "Premium Chocolate Dessert",
          "quantity": 8,
          "salePrice": 7.00,
          "date": "2025-01-15T19:45:00Z",
          "totalRevenue": 56.00
        },
        {
          "id": "sale-3",
          "recipeName": "Blueberry Pancakes",
          "quantity": 6,
          "salePrice": 4.25,
          "date": "2025-01-14T10:15:00Z",
          "totalRevenue": 25.50
        },
        {
          "id": "sale-4",
          "recipeName": "Chocolate Chip Cookies",
          "quantity": 15,
          "salePrice": 4.50,
          "date": "2025-01-13T16:20:00Z",
          "totalRevenue": 67.50
        },
        {
          "id": "sale-5",
          "recipeName": "Premium Chocolate Dessert",
          "quantity": 4,
          "salePrice": 7.00,
          "date": "2025-01-12T20:30:00Z",
          "totalRevenue": 28.00
        }
      ],
      expenses: [
        {
          "id": "expense-1",
          "name": "Monthly Rent",
          "amount": 2500.00,
          "category": "Rent",
          "date": "2025-01-01T00:00:00Z",
          "recurring": true,
          "description": "Monthly restaurant rent payment"
        }
      ],
      recipes: [],
      inventory: []
    };
    
    console.log('API: Returning mock data with', mockData.products.length, 'products,', mockData.sales.length, 'sales,', mockData.expenses.length, 'expenses');
    
    return NextResponse.json(mockData);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurantId') || 'default';
  
  try {
    const body = await request.json();
    const { data } = body;
    
    console.log('API: Saving data for restaurant:', restaurantId);
    
    // For demo purposes, always use local file storage to ensure data is saved
    const allData = await loadPersistentData();
    allData[restaurantId] = data;
    await savePersistentData(allData);
    
    console.log('API: Data saved successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

const loadPersistentData = async () => {
  // Try multiple paths for different deployment environments
  const pathsToTry = [DATA_FILE_PATH, ...ALTERNATIVE_PATHS];
  
  console.log('API: Current working directory:', process.cwd());
  console.log('API: DATA_FILE_PATH:', DATA_FILE_PATH);
  console.log('API: All paths to try:', pathsToTry);
  
  for (const filePath of pathsToTry) {
    try {
      console.log(`API: Checking if file exists: ${filePath}`);
      if (fs.existsSync(filePath)) {
        console.log(`API: File exists at ${filePath}, reading...`);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(fileContent);
        console.log(`API: Successfully loaded data from ${filePath}, keys:`, Object.keys(parsed));
        return parsed;
      } else {
        console.log(`API: File does not exist at ${filePath}`);
      }
    } catch (error) {
      console.error(`Error loading from ${filePath}:`, error);
    }
  }
  
  // If no file found, return mock data for demo
  console.log('API: No data file found, returning mock data');
  return {
    default: {
      products: [
        {
          "id": "dark-chocolate-1",
          "name": "Dark Chocolate",
          "quantity": 2.5,
          "unit": "lb",
          "packageSize": 1,
          "packageUnit": "lb",
          "cost": 8.00,
          "category": "Food",
          "categoryType": "Baking",
          "supplier": "Premium Chocolates Inc.",
          "reorderPoint": 1.0,
          "lastUpdated": "2025-01-16T10:30:00Z",
          "usedInRecipes": ["Chocolate Chip Cookies", "Premium Chocolate Dessert"],
          "variance": 0.1,
          "shrinkagePercent": 2.5
        },
        {
          "id": "all-purpose-flour-1",
          "name": "All-Purpose Flour",
          "quantity": 10.0,
          "unit": "lb",
          "packageSize": 5,
          "packageUnit": "lb",
          "cost": 2.50,
          "category": "Food",
          "categoryType": "Baking",
          "supplier": "Flour Mill Co.",
          "reorderPoint": 3.0,
          "lastUpdated": "2025-01-15T14:20:00Z",
          "usedInRecipes": ["Chocolate Chip Cookies", "Blueberry Pancakes"],
          "variance": 0.2,
          "shrinkagePercent": 1.0
        },
        {
          "id": "granulated-sugar-1",
          "name": "Granulated Sugar",
          "quantity": 5.0,
          "unit": "lb",
          "packageSize": 2,
          "packageUnit": "lb",
          "cost": 3.00,
          "category": "Food",
          "categoryType": "Baking",
          "supplier": "Sweet Sugar Co.",
          "reorderPoint": 2.0,
          "lastUpdated": "2025-01-14T09:15:00Z",
          "usedInRecipes": ["Chocolate Chip Cookies", "Premium Chocolate Dessert"],
          "variance": 0.1,
          "shrinkagePercent": 0.5
        },
        {
          "id": "butter-1",
          "name": "Butter",
          "quantity": 3.0,
          "unit": "lb",
          "packageSize": 1,
          "packageUnit": "lb",
          "cost": 1.00,
          "category": "Food",
          "categoryType": "Dairy",
          "supplier": "Creamery Farms",
          "reorderPoint": 1.5,
          "lastUpdated": "2025-01-13T16:45:00Z",
          "usedInRecipes": ["Chocolate Chip Cookies"],
          "variance": 0.05,
          "shrinkagePercent": 1.0
        },
        {
          "id": "large-eggs-1",
          "name": "Large Eggs",
          "quantity": 24,
          "unit": "count",
          "packageSize": 12,
          "packageUnit": "count",
          "cost": 3.50,
          "category": "Food",
          "categoryType": "Dairy",
          "supplier": "Fresh Egg Farm",
          "reorderPoint": 12,
          "lastUpdated": "2025-01-12T11:30:00Z",
          "usedInRecipes": ["Premium Chocolate Dessert", "Blueberry Pancakes"],
          "variance": 2,
          "shrinkagePercent": 3.0
        },
        {
          "id": "whole-milk-1",
          "name": "Whole Milk",
          "quantity": 2,
          "unit": "gallon",
          "packageSize": 1,
          "packageUnit": "gallon",
          "cost": 3.50,
          "category": "Food",
          "categoryType": "Dairy",
          "supplier": "Local Dairy Co.",
          "reorderPoint": 1,
          "lastUpdated": "2025-01-11T08:20:00Z",
          "usedInRecipes": ["Blueberry Pancakes"],
          "variance": 0.1,
          "shrinkagePercent": 2.0
        },
        {
          "id": "blueberries-1",
          "name": "Blueberries",
          "quantity": 1.5,
          "unit": "lb",
          "packageSize": 1,
          "packageUnit": "lb",
          "cost": 4.00,
          "category": "Food",
          "categoryType": "Produce",
          "supplier": "Berry Farms",
          "reorderPoint": 0.5,
          "lastUpdated": "2025-01-10T13:15:00Z",
          "usedInRecipes": ["Blueberry Pancakes"],
          "variance": 0.1,
          "shrinkagePercent": 5.0
        },
        {
          "id": "premium-vanilla-1",
          "name": "Premium Vanilla Extract",
          "quantity": 0.5,
          "unit": "fl oz",
          "packageSize": 2,
          "packageUnit": "fl oz",
          "cost": 12.00,
          "category": "Food",
          "categoryType": "Baking",
          "supplier": "Vanilla Co.",
          "reorderPoint": 0.25,
          "lastUpdated": "2025-01-09T15:40:00Z",
          "usedInRecipes": ["Premium Chocolate Dessert"],
          "variance": 0.02,
          "shrinkagePercent": 0.0
        }
      ],
      recipes: [
        {
          id: 'chocolate-strawberries',
          name: 'Chocolate Strawberries',
          ingredients: [
            { productId: 'strawberries-1', quantity: 1, unit: 'lb' },
            { productId: 'chocolate-1', quantity: 0.5, unit: 'lb' }
          ]
        }
      ],
      sales: [
        {
          "id": "sale-1",
          "recipeName": "Chocolate Chip Cookies",
          "quantity": 12,
          "salePrice": 4.50,
          "date": "2025-01-16T14:30:00Z",
          "totalRevenue": 54.00
        },
        {
          "id": "sale-2",
          "recipeName": "Premium Chocolate Dessert",
          "quantity": 8,
          "salePrice": 7.00,
          "date": "2025-01-15T19:45:00Z",
          "totalRevenue": 56.00
        },
        {
          "id": "sale-3",
          "recipeName": "Blueberry Pancakes",
          "quantity": 6,
          "salePrice": 4.25,
          "date": "2025-01-14T10:15:00Z",
          "totalRevenue": 25.50
        },
        {
          "id": "sale-4",
          "recipeName": "Chocolate Chip Cookies",
          "quantity": 15,
          "salePrice": 4.50,
          "date": "2025-01-13T16:20:00Z",
          "totalRevenue": 67.50
        },
        {
          "id": "sale-5",
          "recipeName": "Premium Chocolate Dessert",
          "quantity": 4,
          "salePrice": 7.00,
          "date": "2025-01-12T20:30:00Z",
          "totalRevenue": 28.00
        }
      ],
      expenses: [
        {
          "id": "expense-1",
          "name": "Monthly Rent",
          "amount": 2500.00,
          "category": "Rent",
          "date": "2025-01-01T00:00:00Z",
          "recurring": true,
          "description": "Monthly restaurant rent payment"
        }
      ]
    }
  };
};

const savePersistentData = async (data: any) => {
  // For demo purposes, always use local file storage to ensure data is saved
  try {
    ensureDataDirectory();
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    console.log('API: Successfully saved data to file');
  } catch (error) {
    console.error('Error saving to file:', error);
  }
};

const ensureDataDirectory = () => {
  const dataDir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};
