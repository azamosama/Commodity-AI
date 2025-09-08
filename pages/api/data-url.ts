import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Detect the type of URL and handle accordingly
    if (url.includes('docs.google.com/spreadsheets')) {
      // Handle Google Sheets
      return await handleGoogleSheets(url, res);
    } else if (url.includes('onedrive.live.com') || url.includes('office.com')) {
      // Handle Excel Online / OneDrive
      return await handleExcelOnline(url, res);
    } else if (url.includes('airtable.com')) {
      // Handle Airtable
      return await handleAirtable(url, res);
    } else {
      // Try to handle as generic CSV/JSON
      return await handleGenericUrl(url, res);
    }
  } catch (error) {
    console.error('Error processing data URL:', error);
    return res.status(500).json({ 
      error: 'Failed to process data URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGoogleSheets(url: string, res: NextApiResponse) {
  // For now, we'll use the existing Google Sheets logic
  // In the future, this could be enhanced to handle different Google Sheets formats
  
  // Mock data for demonstration - replace with actual Google Sheets API integration
  const mockData = [
    ['Recipe/Menu Item', 'Units Sold', 'Sale Price (per)', 'Date'],
    ['Chocolate Strawberries', '5', '14.63', '2025-08-04'],
    ['Chocolate Strawberries', '5', '14.63', '2025-08-05'],
    ['Chocolate Strawberries', '5', '14.63', '2025-08-06'],
    ['Chocolate Strawberries', '5', '14.63', '2025-08-07']
  ];

  return res.status(200).json({ data: mockData });
}

async function handleExcelOnline(url: string, res: NextApiResponse) {
  // Mock data for Excel Online - replace with actual Microsoft Graph API integration
  const mockData = [
    ['Recipe/Menu Item', 'Units Sold', 'Sale Price (per)', 'Date'],
    ['Sample Recipe', '10', '12.50', '2025-08-01'],
    ['Sample Recipe', '8', '12.50', '2025-08-02']
  ];

  return res.status(200).json({ data: mockData });
}

async function handleAirtable(url: string, res: NextApiResponse) {
  // Mock data for Airtable - replace with actual Airtable API integration
  const mockData = [
    ['Recipe/Menu Item', 'Units Sold', 'Sale Price (per)', 'Date'],
    ['Airtable Recipe', '15', '18.00', '2025-08-01'],
    ['Airtable Recipe', '12', '18.00', '2025-08-02']
  ];

  return res.status(200).json({ data: mockData });
}

async function handleGenericUrl(url: string, res: NextApiResponse) {
  try {
    // Try to fetch the URL and parse as CSV or JSON
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    const text = await response.text();

    if (contentType?.includes('application/json')) {
      // Handle JSON data
      const jsonData = JSON.parse(text);
      const data = convertJsonToTable(jsonData);
      return res.status(200).json({ data });
    } else {
      // Handle CSV data
      const csvData = parseCSV(text);
      return res.status(200).json({ data: csvData });
    }
  } catch (error) {
    throw new Error(`Failed to fetch or parse data from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function convertJsonToTable(jsonData: any): any[][] {
  // Convert JSON data to table format
  if (Array.isArray(jsonData)) {
    if (jsonData.length === 0) return [];
    
    // Get headers from first object
    const headers = Object.keys(jsonData[0]);
    const table = [headers];
    
    // Add data rows
    jsonData.forEach(item => {
      const row = headers.map(header => item[header] || '');
      table.push(row);
    });
    
    return table;
  } else {
    // Single object
    const headers = Object.keys(jsonData);
    return [headers, Object.values(jsonData)];
  }
}

function parseCSV(csvText: string): any[][] {
  // Simple CSV parser - in production, use a proper CSV library
  const lines = csvText.split('\n').filter(line => line.trim());
  return lines.map(line => {
    // Handle quoted fields and commas
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current.trim());
    return fields;
  });
}
