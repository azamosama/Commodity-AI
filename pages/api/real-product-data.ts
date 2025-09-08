import { NextApiRequest, NextApiResponse } from 'next';
import { ProductDataAPI } from '@/lib/product-data-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productName } = req.query;

  if (!productName || typeof productName !== 'string') {
    return res.status(400).json({ error: 'Product name is required' });
  }

  try {
    console.log(`Fetching real product data for: ${productName}`);
    
    // Get real product data
    const realData = await ProductDataAPI.getRealProductData(productName);
    
    if (realData) {
      console.log(`Found real data for ${productName}:`, realData);
      return res.status(200).json({ success: true, data: realData });
    } else {
      console.log(`No real data found for ${productName}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Product data not found',
        message: 'Using fallback pricing data'
      });
    }
  } catch (error) {
    console.error('Error fetching real product data:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch product data',
      message: 'Using fallback pricing data'
    });
  }
}
