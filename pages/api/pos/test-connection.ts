import { NextApiRequest, NextApiResponse } from 'next';
import { POSManager } from '../../../lib/pos-integration/pos-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const posManager = new POSManager();
    const results = await posManager.testAllConnections();

    return res.status(200).json({
      success: true,
      connections: results,
      message: 'POS connection test completed',
    });
  } catch (error) {
    console.error('POS connection test failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to test POS connections',
      details: error.message,
    });
  }
}
