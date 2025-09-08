import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const customConfig = req.body;
    
    // Validate required fields
    if (!customConfig.name || !customConfig.baseUrl) {
      return res.status(400).json({
        success: false,
        error: 'Name and Base URL are required',
      });
    }

    // Create configs directory if it doesn't exist
    const configsDir = path.join(process.cwd(), 'data', 'pos-configs');
    await fs.mkdir(configsDir, { recursive: true });

    // Save configuration to file
    const configFileName = `${customConfig.name.toLowerCase().replace(/\s+/g, '-')}-config.json`;
    const configPath = path.join(configsDir, configFileName);
    
    await fs.writeFile(configPath, JSON.stringify(customConfig, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Configuration saved successfully',
      configPath: configPath,
    });
  } catch (error) {
    console.error('Failed to save custom POS config:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save configuration',
      details: error.message,
    });
  }
}
