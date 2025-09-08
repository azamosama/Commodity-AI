import { NextApiRequest, NextApiResponse } from 'next';
import { CustomPOSConnector } from '../../../lib/pos-integration/custom-pos-connector';
import { POSConfig } from '../../../lib/pos-integration/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const customConfig = req.body;
    
    // Create a POS config from the custom config
    const posConfig: POSConfig = {
      id: 'custom_pos',
      name: customConfig.name || 'Custom POS',
      type: 'custom',
      apiKey: customConfig.apiKey,
      apiSecret: customConfig.apiSecret,
      baseUrl: customConfig.baseUrl,
      restaurantId: 'custom_restaurant',
      isActive: true,
      syncFrequency: 'manual',
    };

    // Create custom connector
    const connector = new CustomPOSConnector(posConfig, customConfig);
    
    // Test connection
    const isConnected = await connector.testConnection();

    return res.status(200).json({
      success: isConnected,
      message: isConnected ? 'Connection successful!' : 'Connection failed. Check your configuration.',
      config: customConfig,
    });
  } catch (error) {
    console.error('Custom POS test failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to test custom POS connection',
      details: error.message,
    });
  }
}
