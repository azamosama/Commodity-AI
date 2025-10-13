import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');

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
  // For demo purposes, always use local file storage to ensure mock data is loaded
  try {
    ensureDataDirectory();
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      const parsed = JSON.parse(fileContent);
      console.log('API: Successfully loaded data from file, keys:', Object.keys(parsed));
      return parsed;
    }
  } catch (error) {
    console.error('Error loading from file:', error);
  }
  return {};
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
