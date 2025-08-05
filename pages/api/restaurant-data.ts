import type { NextApiRequest, NextApiResponse } from 'next';

// Use Vercel KV or a simple file-based storage for persistence
// For now, we'll use a more robust in-memory approach with better error handling
const restaurantData: { [key: string]: any } = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { restaurantId } = req.query;

  if (!restaurantId || typeof restaurantId !== 'string') {
    return res.status(400).json({ error: 'Restaurant ID is required' });
  }

  if (req.method === 'GET') {
    try {
      // Retrieve data for a restaurant
      const data = restaurantData[restaurantId] || null;
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
      restaurantData[restaurantId] = data;
      console.log(`POST data for restaurant ${restaurantId}:`, 'saved successfully');
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving data:', error);
      return res.status(500).json({ error: 'Failed to save data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 