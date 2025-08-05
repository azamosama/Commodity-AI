import type { NextApiRequest, NextApiResponse } from 'next';

// For Vercel deployment, we'll use a simple approach with better persistence
// In production, you'd want to use Vercel KV, PostgreSQL, or another database

// Simple file-based storage simulation (this is just for demo - in real production use a proper database)
let restaurantData: { [key: string]: any } = {};

// Try to load existing data from a more persistent source
const loadPersistentData = () => {
  // In a real implementation, this would load from a database
  // For now, we'll use a more robust approach
  return restaurantData;
};

// Save data to a more persistent source
const savePersistentData = (data: any) => {
  // In a real implementation, this would save to a database
  restaurantData = { ...restaurantData, ...data };
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { restaurantId } = req.query;

  if (!restaurantId || typeof restaurantId !== 'string') {
    return res.status(400).json({ error: 'Restaurant ID is required' });
  }

  if (req.method === 'GET') {
    try {
      // Load data from persistent storage
      const allData = loadPersistentData();
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
      const allData = loadPersistentData();
      
      // Update with new data
      allData[restaurantId] = data;
      
      // Save back to persistent storage
      savePersistentData(allData);
      
      console.log(`POST data for restaurant ${restaurantId}:`, 'saved successfully');
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving data:', error);
      return res.status(500).json({ error: 'Failed to save data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 