import type { NextApiRequest, NextApiResponse } from 'next';
import { Anomaly } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { status, severity, type, limit = '50' } = req.query;

  try {
    // Call Python anomaly detection service
    const anomalies = await fetchAnomalies({
      status: status as string,
      severity: severity as string,
      type: type as string,
      limit: parseInt(limit as string)
    });
    
    res.status(200).json({
      success: true,
      data: anomalies
    });
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch anomalies'
    });
  }
}

async function fetchAnomalies(filters: {
  status?: string;
  severity?: string;
  type?: string;
  limit: number;
}): Promise<Anomaly[]> {
  try {
    // In a real implementation, this would call the Python anomaly detection service
    // For now, we'll return mock data
    const anomalies: Anomaly[] = [];
    
    const anomalyTypes = ['sales_spike', 'sales_drop', 'waste_spike', 'theft_indicator', 'over_portioning', 'inventory_mismatch'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['detected', 'acknowledged', 'resolved', 'false_positive'];
    
    for (let i = 0; i < filters.limit; i++) {
      const type = filters.type || anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
      const severity = filters.severity || severities[Math.floor(Math.random() * severities.length)];
      const status = filters.status || statuses[Math.floor(Math.random() * statuses.length)];
      
      const detectedAt = new Date();
      detectedAt.setDate(detectedAt.getDate() - Math.floor(Math.random() * 30));
      
      const anomaly: Anomaly = {
        id: `anomaly_${type}_${Date.now()}_${i}`,
        type: type as any,
        severity: severity as any,
        status: status as any,
        title: generateAnomalyTitle(type, severity),
        description: generateAnomalyDescription(type, severity),
        affectedItems: [`item-${Math.floor(Math.random() * 10) + 1}`],
        metrics: {
          expected: Math.floor(Math.random() * 100) + 50,
          actual: Math.floor(Math.random() * 100) + 50,
          deviation: Math.floor(Math.random() * 50) - 25,
          zScore: (Math.random() * 4) - 2
        },
        costImpact: Math.floor(Math.random() * 1000) + 100,
        suggestedActions: generateSuggestedActions(type),
        detectedAt: detectedAt.toISOString(),
        acknowledgedAt: status !== 'detected' ? new Date(detectedAt.getTime() + 24 * 60 * 60 * 1000).toISOString() : undefined,
        resolvedAt: status === 'resolved' ? new Date(detectedAt.getTime() + 48 * 60 * 60 * 1000).toISOString() : undefined,
        acknowledgedBy: status !== 'detected' ? 'admin@restaurant.com' : undefined,
        resolvedBy: status === 'resolved' ? 'manager@restaurant.com' : undefined,
        createdAt: detectedAt.toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      anomalies.push(anomaly);
    }
    
    // Apply filters
    let filteredAnomalies = anomalies;
    
    if (filters.status) {
      filteredAnomalies = filteredAnomalies.filter(a => a.status === filters.status);
    }
    
    if (filters.severity) {
      filteredAnomalies = filteredAnomalies.filter(a => a.severity === filters.severity);
    }
    
    if (filters.type) {
      filteredAnomalies = filteredAnomalies.filter(a => a.type === filters.type);
    }
    
    return filteredAnomalies;
  } catch (error) {
    console.error('Error in fetchAnomalies:', error);
    throw error;
  }
}

function generateAnomalyTitle(type: string, severity: string): string {
  const titles = {
    sales_spike: `Sales Spike Detected`,
    sales_drop: `Sales Drop Detected`,
    waste_spike: `Waste Spike Detected`,
    theft_indicator: `Potential Theft Indicator`,
    over_portioning: `Over-Portioning Detected`,
    inventory_mismatch: `Inventory Mismatch Detected`
  };
  
  return titles[type as keyof typeof titles] || 'Anomaly Detected';
}

function generateAnomalyDescription(type: string, severity: string): string {
  const descriptions = {
    sales_spike: `Sales were ${Math.floor(Math.random() * 3) + 2} standard deviations above normal`,
    sales_drop: `Sales were ${Math.floor(Math.random() * 3) + 2} standard deviations below normal`,
    waste_spike: `Waste was ${Math.floor(Math.random() * 3) + 2} standard deviations above normal`,
    theft_indicator: `Consumption was ${Math.floor(Math.random() * 2) + 1.5}x higher than expected`,
    over_portioning: `Portioning was ${Math.floor(Math.random() * 3) + 2} standard deviations above average`,
    inventory_mismatch: `Inventory levels don't match expected consumption patterns`
  };
  
  return descriptions[type as keyof typeof descriptions] || 'Unusual pattern detected';
}

function generateSuggestedActions(type: string): string[] {
  const actions = {
    sales_spike: [
      'Review marketing activities for the day',
      'Check if there were any special events',
      'Analyze competitor pricing',
      'Review staff scheduling'
    ],
    sales_drop: [
      'Review marketing activities for the day',
      'Check if there were any special events',
      'Analyze competitor pricing',
      'Review staff scheduling'
    ],
    waste_spike: [
      'Review portioning procedures',
      'Check storage conditions',
      'Review expiration dates',
      'Train staff on waste reduction'
    ],
    theft_indicator: [
      'Review inventory counts',
      'Check for unauthorized usage',
      'Review staff access controls',
      'Implement inventory tracking'
    ],
    over_portioning: [
      'Review portioning guidelines',
      'Train staff on proper measurements',
      'Check recipe cards for accuracy',
      'Implement portioning tools'
    ],
    inventory_mismatch: [
      'Conduct physical inventory count',
      'Review inventory tracking procedures',
      'Check for data entry errors',
      'Implement barcode scanning'
    ]
  };
  
  return actions[type as keyof typeof actions] || ['Review the situation', 'Take appropriate action'];
}
