import type { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory storage (in production, you'd use a real database)
const restaurantData: { [key: string]: any } = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { restaurantId } = req.query;

  if (!restaurantId || typeof restaurantId !== 'string') {
    return res.status(400).json({ error: 'Restaurant ID is required' });
  }

  if (req.method === 'GET') {
    // Retrieve data for a restaurant
    const data = restaurantData[restaurantId] || null;
    return res.status(200).json({ data });
  }

  if (req.method === 'POST') {
    // Store data for a restaurant
    const { data } = req.body;
    restaurantData[restaurantId] = data;
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 