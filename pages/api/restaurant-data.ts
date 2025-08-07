import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Try to import Vercel KV (available in production)
let kv: any = null;
let useKV = false;
try {
  kv = require('@vercel/kv').kv;
  // Only use KV if environment variables are available
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    useKV = true;
    console.log('Using Vercel KV for data storage');
  } else {
    console.log('Vercel KV environment variables not found, using file-based storage');
  }
} catch (error) {
  console.log('Vercel KV not available, using file-based storage');
}

// For development, we'll use file-based storage as fallback
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load data from persistent storage (KV in production, file in development)
const loadPersistentData = async () => {
  if (useKV && kv) {
    try {
      // Use Vercel KV in production
      const allData: { [key: string]: any } = {};
      const keys = await kv.keys('restaurant:*');
      
      for (const key of keys) {
        const restaurantId = key.replace('restaurant:', '');
        const data = await kv.get(key);
        if (data) {
          allData[restaurantId] = data;
        }
      }
      
      return allData;
    } catch (error) {
      console.error('Error loading from Vercel KV:', error);
      return {};
    }
  } else {
    // Fallback to file-based storage for development
    try {
      ensureDataDirectory();
      if (fs.existsSync(DATA_FILE_PATH)) {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        return JSON.parse(fileContent);
      }
    } catch (error) {
      console.error('Error loading persistent data:', error);
    }
    return {};
  }
};

// Save data to persistent storage (KV in production, file in development)
const savePersistentData = async (data: any) => {
  if (useKV && kv) {
    try {
      // Use Vercel KV in production
      for (const [restaurantId, restaurantData] of Object.entries(data)) {
        await kv.set(`restaurant:${restaurantId}`, restaurantData);
      }
      console.log('Data saved to Vercel KV successfully');
    } catch (error) {
      console.error('Error saving to Vercel KV:', error);
      throw error;
    }
  } else {
    // Fallback to file-based storage for development
    try {
      ensureDataDirectory();
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
      console.log('Data saved to persistent storage successfully');
    } catch (error) {
      console.error('Error saving persistent data:', error);
      throw error;
    }
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { restaurantId } = req.query;

  if (!restaurantId || typeof restaurantId !== 'string') {
    return res.status(400).json({ error: 'Restaurant ID is required' });
  }

  if (req.method === 'GET') {
    try {
      // Load data from persistent storage
      const allData = await loadPersistentData();
      const data = allData[restaurantId] || null;
      console.log(`GET data for restaurant ${restaurantId}:`, data ? 'found' : 'not found');
      return res.status(200).json({ data });
    } catch (error) {
      console.error('Error retrieving data:', error);
      return res.status(500).json({ error: 'Failed to retrieve data' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Store data for a restaurant
      const { data } = req.body;
      
      // Load existing data
      const allData = await loadPersistentData();
      
      // Update with new data
      allData[restaurantId] = data;
      
      // Save back to persistent storage
      await savePersistentData(allData);
      
      console.log(`POST data for restaurant ${restaurantId}:`, 'saved successfully');
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving data:', error);
      return res.status(500).json({ error: 'Failed to save data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 