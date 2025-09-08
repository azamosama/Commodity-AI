import type { NextApiRequest, NextApiResponse } from 'next';

interface POSConnection {
  id: string;
  name: string;
  type: 'square' | 'toast' | 'clover' | 'stripe' | 'custom';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  apiKey?: string;
  endpoint?: string;
  restaurantId: string;
}

interface ImportJob {
  id: string;
  type: 'sales' | 'inventory' | 'products';
  status: 'pending' | 'running' | 'completed' | 'failed';
  recordsProcessed: number;
  recordsTotal: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  restaurantId: string;
}

// In-memory storage (in production, this would be in a database)
let connections: POSConnection[] = [];
let importJobs: ImportJob[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query, body } = req;
  const restaurantId = query.restaurantId as string || 'default';

  switch (method) {
    case 'GET':
      // Get connections for a restaurant
      if (query.type === 'connections') {
        const restaurantConnections = connections.filter(c => c.restaurantId === restaurantId);
        return res.status(200).json({ connections: restaurantConnections });
      }
      
      // Get import jobs for a restaurant
      if (query.type === 'jobs') {
        const restaurantJobs = importJobs.filter(j => j.restaurantId === restaurantId);
        return res.status(200).json({ jobs: restaurantJobs });
      }
      
      return res.status(400).json({ error: 'Invalid query type' });

    case 'POST':
      // Create new connection
      if (query.action === 'connect') {
        const { type, name, apiKey, endpoint } = body;
        
        const newConnection: POSConnection = {
          id: Date.now().toString(),
          name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} POS`,
          type,
          status: 'connected',
          lastSync: new Date().toISOString(),
          syncFrequency: 'realtime',
          apiKey,
          endpoint,
          restaurantId
        };
        
        connections.push(newConnection);
        return res.status(201).json({ connection: newConnection });
      }
      
      // Sync data from POS
      if (query.action === 'sync') {
        const { connectionId, dataType } = body;
        const connection = connections.find(c => c.id === connectionId && c.restaurantId === restaurantId);
        
        if (!connection) {
          return res.status(404).json({ error: 'Connection not found' });
        }
        
        // Create import job
        const importJob: ImportJob = {
          id: Date.now().toString(),
          type: dataType || 'sales',
          status: 'running',
          recordsProcessed: 0,
          recordsTotal: 0,
          startedAt: new Date().toISOString(),
          restaurantId
        };
        
        importJobs.push(importJob);
        
        // Simulate data processing (in production, this would call POS APIs)
        try {
          // Simulate fetching data from POS
          const mockData = generateMockPOSData(dataType, restaurantId);
          importJob.recordsTotal = mockData.length;
          
          // Process records in batches
          for (let i = 0; i < mockData.length; i += 10) {
            importJob.recordsProcessed = Math.min(i + 10, mockData.length);
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
          }
          
          importJob.status = 'completed';
          importJob.completedAt = new Date().toISOString();
          
          // Update connection last sync
          connection.lastSync = new Date().toISOString();
          
          return res.status(200).json({ 
            job: importJob,
            message: `Successfully imported ${importJob.recordsProcessed} ${dataType} records`
          });
          
        } catch (error) {
          importJob.status = 'failed';
          importJob.error = error instanceof Error ? error.message : 'Unknown error';
          importJob.completedAt = new Date().toISOString();
          
          return res.status(500).json({ 
            job: importJob,
            error: 'Failed to sync data from POS system'
          });
        }
      }
      
      return res.status(400).json({ error: 'Invalid action' });

    case 'PUT':
      // Update connection settings
      if (query.action === 'update-connection') {
        const { connectionId, updates } = body;
        const connectionIndex = connections.findIndex(c => c.id === connectionId && c.restaurantId === restaurantId);
        
        if (connectionIndex === -1) {
          return res.status(404).json({ error: 'Connection not found' });
        }
        
        connections[connectionIndex] = { ...connections[connectionIndex], ...updates };
        return res.status(200).json({ connection: connections[connectionIndex] });
      }
      
      return res.status(400).json({ error: 'Invalid action' });

    case 'DELETE':
      // Delete connection
      if (query.action === 'disconnect') {
        const { connectionId } = query;
        const connectionIndex = connections.findIndex(c => c.id === connectionId && c.restaurantId === restaurantId);
        
        if (connectionIndex === -1) {
          return res.status(404).json({ error: 'Connection not found' });
        }
        
        connections.splice(connectionIndex, 1);
        return res.status(200).json({ message: 'Connection deleted successfully' });
      }
      
      return res.status(400).json({ error: 'Invalid action' });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}

// Helper function to generate mock POS data
function generateMockPOSData(dataType: string, restaurantId: string) {
  const baseData = [];
  
  switch (dataType) {
    case 'sales':
      // Generate mock sales data
      for (let i = 0; i < 50; i++) {
        baseData.push({
          id: `sale_${restaurantId}_${i}`,
          recipeId: `recipe_${Math.floor(Math.random() * 5) + 1}`,
          quantity: Math.floor(Math.random() * 10) + 1,
          price: (Math.random() * 20 + 5).toFixed(2),
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
      break;
      
    case 'inventory':
      // Generate mock inventory data
      for (let i = 0; i < 20; i++) {
        baseData.push({
          id: `product_${restaurantId}_${i}`,
          name: `Product ${i + 1}`,
          quantity: Math.floor(Math.random() * 100) + 10,
          unit: ['lb', 'kg', 'each', 'pack'][Math.floor(Math.random() * 4)],
          cost: (Math.random() * 50 + 5).toFixed(2)
        });
      }
      break;
      
    case 'products':
      // Generate mock product catalog data
      for (let i = 0; i < 15; i++) {
        baseData.push({
          id: `catalog_${restaurantId}_${i}`,
          name: `Menu Item ${i + 1}`,
          category: ['Food', 'Beverage', 'Dessert'][Math.floor(Math.random() * 3)],
          price: (Math.random() * 25 + 8).toFixed(2),
          ingredients: []
        });
      }
      break;
  }
  
  return baseData;
}
