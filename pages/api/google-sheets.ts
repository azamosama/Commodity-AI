import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Google Sheets URL is required' });
  }

  try {
    // Extract spreadsheet ID from URL
    const spreadsheetId = extractSpreadsheetId(url);
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Invalid Google Sheets URL' });
    }

    // For now, we'll use a public sheet approach or mock the actual data
    // In production, you'd use Google Sheets API with proper authentication
    const data = await fetchGoogleSheetsData(spreadsheetId);
    
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return res.status(500).json({ error: 'Failed to fetch Google Sheets data' });
  }
}

function extractSpreadsheetId(url: string): string | null {
  // Handle different Google Sheets URL formats
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

async function fetchGoogleSheetsData(spreadsheetId: string): Promise<any[][]> {
  // For development/testing, we'll return mock data that matches the user's actual sheet
  // In production, you'd use the Google Sheets API
  
  // Mock data that matches the user's actual Google Sheets structure
  const mockData = [
    ['Recipe/Menu Item', 'Units Sold', 'Sale Price (per)', 'Date', 'Ingredients'],
    ['Chocolate Strawberries', '5', '14.63', '2025-08-04', 'strawberries, chocolate, cups'],
    ['Chocolate Strawberries', '5', '14.63', '2025-08-05', 'strawberries, chocolate, cups'],
    ['Chocolate Strawberries', '5', '14.63', '2025-08-06', 'strawberries, chocolate, cups'],
    ['Chocolate Strawberries', '5', '14.63', '2025-08-07', 'strawberries, chocolate, cups']
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return mockData;
}

// TODO: Implement actual Google Sheets API integration
// async function fetchGoogleSheetsDataWithAPI(spreadsheetId: string): Promise<any[][]> {
//   const { google } = require('googleapis');
//   
//   const auth = new google.auth.GoogleAuth({
//     keyFile: 'path/to/service-account-key.json',
//     scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
//   });
//
//   const sheets = google.sheets({ version: 'v4', auth });
//
//   const response = await sheets.spreadsheets.values.get({
//     spreadsheetId,
//     range: 'A:E', // Adjust range as needed
//   });
//
//   return response.data.values || [];
// }
