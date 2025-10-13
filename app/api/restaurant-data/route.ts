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
    
    // For demo purposes, always use local file storage to ensure mock data is loaded
    const allData = await loadPersistentData();
    const restaurantData = allData[restaurantId] || null;
    
    console.log('API: Restaurant data loaded:', restaurantData ? 'Found' : 'Not found');
    
    return NextResponse.json(restaurantData);
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
  
  for (const filePath of pathsToTry) {
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(fileContent);
        console.log(`API: Successfully loaded data from ${filePath}, keys:`, Object.keys(parsed));
        return parsed;
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
        { id: 'strawberries-1', name: 'Strawberries', quantity: 1, unit: 'lb', cost: 5.99, category: 'Fruit' },
        { id: 'chocolate-1', name: 'Chocolate', quantity: 1, unit: 'lb', cost: 8.99, category: 'Dessert' },
        { id: 'cups-1', name: 'Cups', quantity: 1, unit: 'each', cost: 0.25, category: 'Supplies' }
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
        { id: 'sale-1', recipeName: 'Chocolate Strawberries', salePrice: 12.99, quantity: 1, date: new Date().toISOString() }
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
