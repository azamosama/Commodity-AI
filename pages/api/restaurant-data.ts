import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Try to import Vercel KV (available in production)
let kv: any = null;
let useKV = false;

// Debug environment variables
console.log('Environment check:', {
  KV_REST_API_URL: !!process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
  KV_URL: !!process.env.KV_URL,
  REDIS_URL: !!process.env.REDIS_URL,
  NODE_ENV: process.env.NODE_ENV
});

try {
  kv = require('@vercel/kv').kv;
  // Check for KV environment variables (Vercel sets these automatically)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    useKV = true;
    console.log('Using Vercel KV for data storage');
  } else if (process.env.KV_URL) {
    // Alternative KV setup
    useKV = true;
    console.log('Using Vercel KV for data storage (alternative setup)');
  } else {
    console.log('Vercel KV environment variables not found, using file-based storage');
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('KV') || key.includes('REDIS')));
  }
} catch (error) {
  console.log('Vercel KV not available, using file-based storage', error.message);
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
      
      // Try to get all restaurant keys
      let keys: string[] = [];
      try {
        keys = await kv.keys('restaurant:*');
      } catch (keysError) {
        console.log('Keys command not available, using direct key approach');
        // If keys() is not available, we'll handle it differently
        return {};
      }
      
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
      if (useKV && kv) {
        // Direct KV lookup for specific restaurant
        try {
          const data = await kv.get(`restaurant:${restaurantId}`);
          console.log(`GET data for restaurant ${restaurantId}:`, data ? 'found' : 'not found');
          return res.status(200).json({ data });
        } catch (kvError) {
          console.error('KV get error:', kvError);
          // Fall through to file-based approach
        }
      }
      
      // Fallback to file-based storage or if KV failed
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
      
      if (useKV && kv) {
        // Direct KV save for specific restaurant
        try {
          await kv.set(`restaurant:${restaurantId}`, data);
          console.log(`POST data for restaurant ${restaurantId}:`, 'saved successfully to KV');
          return res.status(200).json({ success: true });
        } catch (kvError) {
          console.error('KV set error:', kvError);
          // Fall through to file-based approach
        }
      }
      
      // Fallback to file-based storage or if KV failed
      const allData = await loadPersistentData();
      allData[restaurantId] = data;
      await savePersistentData(allData);
      
      console.log(`POST data for restaurant ${restaurantId}:`, 'saved successfully to file');
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving data:', error);
      return res.status(500).json({ error: 'Failed to save data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 