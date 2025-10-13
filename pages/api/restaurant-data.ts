import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Prefer Upstash REST client if present
let upstashClient: any = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = require('@upstash/redis');
    upstashClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('Using Upstash Redis REST client for data storage');
  }
} catch (e) {
  console.log('Upstash client not available:', (e as Error).message);
}

// Try to import Vercel KV (secondary option)
let kv: any = null;
let useKV = false;

try {
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv || kvModule.default || kvModule;
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    useKV = true;
    console.log('Using Vercel KV for data storage');
  }
} catch (error) {
  console.log('Vercel KV not available');
}

// For development, we'll use file-based storage as fallback
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurant-data.json');

const ensureDataDirectory = () => {
  const dataDir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
};

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add cache-busting headers to prevent browser caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  const { restaurantId = 'default' } = req.query;
  if (!restaurantId || typeof restaurantId !== 'string') {
    return res.status(400).json({ error: 'Restaurant ID is required' });
  }

  if (req.method === 'GET') {
    try {
      // For demo purposes, always use local file storage to ensure mock data is loaded
      console.log('API: Using local file storage for demo data');
      const allData = await loadPersistentData();
      console.log('API: Loaded data keys:', Object.keys(allData));
      console.log('API: Looking for restaurantId:', restaurantId);
      console.log('API: Data for restaurantId:', allData[restaurantId] ? 'exists' : 'missing');
      if (allData[restaurantId]) {
        console.log('API: Sales count:', allData[restaurantId].sales?.length || 0);
      }
      return res.status(200).json({ data: allData[restaurantId] || null });
    } catch (error) {
      console.error('GET error:', error);
      return res.status(500).json({ error: 'Failed to retrieve data' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { data } = req.body;
      
      // For demo purposes, always use local file storage to ensure data is saved
      console.log('API: Using local file storage for demo data save');
      const allData = await loadPersistentData();
      allData[restaurantId] = data;
      await savePersistentData(allData);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('POST error:', error);
      return res.status(500).json({ error: 'Failed to save data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 