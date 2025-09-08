import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

interface ImportJob {
  id: string;
  sourceId: string;
  dataType: 'sales' | 'inventory' | 'products' | 'recipes';
  status: 'pending' | 'mapping' | 'validating' | 'importing' | 'completed' | 'failed';
  recordsProcessed: number;
  recordsTotal: number;
  recordsValid: number;
  recordsInvalid: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  preview?: any[];
  mappings?: FieldMapping[];
  restaurantId: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  transform?: string;
}

interface DataPreview {
  headers: string[];
  sampleData: any[][];
  detectedTypes: { [key: string]: string };
  suggestedMappings: { [key: string]: string };
}

// In-memory storage (in production, this would be in a database)
let importJobs: ImportJob[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query, body } = req;
  const restaurantId = query.restaurantId as string || 'default';

  switch (method) {
    case 'GET':
      // Get import jobs for a restaurant
      if (query.type === 'jobs') {
        const restaurantJobs = importJobs.filter(j => j.restaurantId === restaurantId);
        return res.status(200).json({ jobs: restaurantJobs });
      }
      
      return res.status(400).json({ error: 'Invalid query type' });

    case 'POST':
      // Process data import
      if (query.action === 'process') {
        const { sourceType, data, mappings, dataType } = body;
        
        const jobId = uuidv4();
        const newJob: ImportJob = {
          id: jobId,
          sourceId: sourceType,
          dataType: dataType || 'sales',
          status: 'validating',
          recordsProcessed: 0,
          recordsTotal: data.length,
          recordsValid: 0,
          recordsInvalid: 0,
          startedAt: new Date().toISOString(),
          mappings,
          restaurantId
        };
        
        importJobs.push(newJob);
        
        try {
          // Validate and process data
          const processedData = await processData(data, mappings, dataType);
          
          // Update job with results
          const jobIndex = importJobs.findIndex(j => j.id === jobId);
          if (jobIndex !== -1) {
            importJobs[jobIndex] = {
              ...importJobs[jobIndex],
              status: 'completed',
              recordsProcessed: data.length,
              recordsValid: processedData.validRecords.length,
              recordsInvalid: processedData.invalidRecords.length,
              completedAt: new Date().toISOString()
            };
          }
          
          return res.status(200).json({
            job: importJobs[jobIndex],
            processedData: processedData.validRecords,
            invalidRecords: processedData.invalidRecords,
            message: `Successfully processed ${processedData.validRecords.length} records`
          });
          
        } catch (error) {
          const jobIndex = importJobs.findIndex(j => j.id === jobId);
          if (jobIndex !== -1) {
            importJobs[jobIndex] = {
              ...importJobs[jobIndex],
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              completedAt: new Date().toISOString()
            };
          }
          
          return res.status(500).json({
            job: importJobs[jobIndex],
            error: 'Failed to process data'
          });
        }
      }
      
      // Preview data
      if (query.action === 'preview') {
        const { data, sourceType } = body;
        
        try {
          const preview = generateDataPreview(data);
          return res.status(200).json({ preview });
        } catch (error) {
          return res.status(500).json({ error: 'Failed to generate preview' });
        }
      }
      
      return res.status(400).json({ error: 'Invalid action' });

    case 'PUT':
      // Update import job
      if (query.action === 'update-job') {
        const { jobId, updates } = body;
        const jobIndex = importJobs.findIndex(j => j.id === jobId && j.restaurantId === restaurantId);
        
        if (jobIndex === -1) {
          return res.status(404).json({ error: 'Job not found' });
        }
        
        importJobs[jobIndex] = { ...importJobs[jobIndex], ...updates };
        return res.status(200).json({ job: importJobs[jobIndex] });
      }
      
      return res.status(400).json({ error: 'Invalid action' });

    case 'DELETE':
      // Delete import job
      if (query.action === 'delete-job') {
        const { jobId } = query;
        const jobIndex = importJobs.findIndex(j => j.id === jobId && j.restaurantId === restaurantId);
        
        if (jobIndex === -1) {
          return res.status(404).json({ error: 'Job not found' });
        }
        
        importJobs.splice(jobIndex, 1);
        return res.status(200).json({ message: 'Job deleted successfully' });
      }
      
      return res.status(400).json({ error: 'Invalid action' });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}

// Helper function to generate data preview
function generateDataPreview(data: any[][]): DataPreview {
  if (!data || data.length === 0) {
    throw new Error('No data provided');
  }

  const headers = data[0];
  const sampleData = data.slice(1, Math.min(6, data.length)); // Show up to 5 rows as sample
  const detectedTypes: { [key: string]: string } = {};
  const suggestedMappings: { [key: string]: string } = {};

  headers.forEach((header, index) => {
    const values = sampleData.map(row => row[index]).filter(val => val !== null && val !== undefined);
    
    // Detect data type
    if (values.length > 0) {
      const firstValue = values[0];
      if (typeof firstValue === 'number' || !isNaN(Number(firstValue))) {
        detectedTypes[header] = 'number';
      } else if (!isNaN(Date.parse(firstValue))) {
        detectedTypes[header] = 'date';
      } else if (typeof firstValue === 'boolean' || ['true', 'false', 'yes', 'no'].includes(String(firstValue).toLowerCase())) {
        detectedTypes[header] = 'boolean';
      } else {
        detectedTypes[header] = 'string';
      }
    } else {
      detectedTypes[header] = 'string';
    }

    // Suggest mappings based on field names
    const headerLower = header.toLowerCase();
    if (headerLower.includes('recipe') || headerLower.includes('menu') || headerLower.includes('item')) {
      suggestedMappings[header] = 'recipe.name';
    } else if (headerLower.includes('quantity') || headerLower.includes('qty') || headerLower.includes('amount') || headerLower.includes('units sold')) {
      suggestedMappings[header] = 'sale.quantity';
    } else if (headerLower.includes('price') || headerLower.includes('cost') || headerLower.includes('amount') || headerLower.includes('sale price')) {
      suggestedMappings[header] = 'sale.price';
    } else if (headerLower.includes('date') || headerLower.includes('time') || headerLower.includes('created')) {
      suggestedMappings[header] = 'sale.date';
    } else if (headerLower.includes('product') || headerLower.includes('ingredient')) {
      suggestedMappings[header] = 'product.name';
    } else if (headerLower.includes('stock') || headerLower.includes('inventory')) {
      suggestedMappings[header] = 'inventory.currentStock';
    } else if (headerLower.includes('unit') || headerLower.includes('measure')) {
      suggestedMappings[header] = 'product.unit';
    }
  });

  return {
    headers,
    sampleData,
    detectedTypes,
    suggestedMappings
  };
}

// Helper function to process and validate data
async function processData(data: any[][], mappings: FieldMapping[], dataType: string) {
  const validRecords: any[] = [];
  const invalidRecords: any[] = [];
  const errors: string[] = [];

  // Skip header row
  const dataRows = data.slice(1);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const processedRecord: any = {};
    let isValid = true;
    let rowErrors: string[] = [];

    // Process each field based on mapping
    mappings.forEach((mapping) => {
      if (mapping.targetField === 'ignore') return;

      const headerIndex = data[0].indexOf(mapping.sourceField);
      if (headerIndex === -1) {
        if (mapping.required) {
          isValid = false;
          rowErrors.push(`Required field '${mapping.sourceField}' not found`);
        }
        return;
      }

      const value = row[headerIndex];
      
      // Validate required fields
      if (mapping.required && (value === null || value === undefined || value === '')) {
        isValid = false;
        rowErrors.push(`Required field '${mapping.sourceField}' is empty`);
        return;
      }

      // Transform and validate data based on type
      let processedValue = value;
      
      switch (mapping.dataType) {
        case 'number':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            isValid = false;
            rowErrors.push(`Field '${mapping.sourceField}' must be a number`);
          } else {
            processedValue = numValue;
          }
          break;
          
        case 'date':
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime())) {
            isValid = false;
            rowErrors.push(`Field '${mapping.sourceField}' must be a valid date`);
          } else {
            processedValue = dateValue.toISOString().split('T')[0];
          }
          break;
          
        case 'boolean':
          if (typeof value === 'string') {
            processedValue = ['true', 'yes', '1'].includes(value.toLowerCase());
          } else {
            processedValue = Boolean(value);
          }
          break;
          
        default:
          processedValue = String(value);
      }

      // Map to target field
      const targetParts = mapping.targetField.split('.');
      let current = processedRecord;
      
      for (let j = 0; j < targetParts.length - 1; j++) {
        if (!current[targetParts[j]]) {
          current[targetParts[j]] = {};
        }
        current = current[targetParts[j]];
      }
      
      current[targetParts[targetParts.length - 1]] = processedValue;
    });

    // Add record to appropriate array
    if (isValid) {
      validRecords.push(processedRecord);
    } else {
      invalidRecords.push({
        row: i + 2, // +2 because we skipped header and arrays are 0-indexed
        data: row,
        errors: rowErrors
      });
      errors.push(...rowErrors);
    }
  }

  return {
    validRecords,
    invalidRecords,
    errors
  };
}
