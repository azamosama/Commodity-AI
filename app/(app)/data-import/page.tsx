"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Upload, 
  FileText, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Zap,
  Database,
  MapPin,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  X
} from 'lucide-react';

interface ImportSource {
  id: string;
  name: string;
  type: 'google-sheets' | 'toast' | 'square' | 'csv' | 'excel' | 'custom';
  url?: string;
  apiKey?: string;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error';
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  transform?: string; // transformation rule
}

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
}

interface DataPreview {
  headers: string[];
  sampleData: any[][];
  detectedTypes: { [key: string]: string };
  suggestedMappings: { [key: string]: string };
}

export default function DataImportPage() {
  const { state, dispatch } = useCostManagement();
  const [sources, setSources] = useState<ImportSource[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  // Sample data sources (in real app, these would come from API/database)
  useEffect(() => {
    const sampleSources: ImportSource[] = [
      {
        id: '1',
        name: 'Google Sheets - Sales Data',
        type: 'google-sheets',
        url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        lastSync: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        status: 'connected'
      },
      {
        id: '2',
        name: 'Toast POS - Inventory',
        type: 'toast',
        apiKey: 'toast_api_key_123',
        lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'connected'
      }
    ];
    setSources(sampleSources);
  }, []);

  // Smart field detection and mapping
  const detectFieldTypes = useCallback((headers: string[], sampleData: any[][]) => {
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

    return { detectedTypes, suggestedMappings };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock CSV/Excel data processing
      const mockHeaders = ['Recipe Name', 'Quantity Sold', 'Price Per Unit', 'Sale Date', 'Location', 'Extra Column'];
      const mockSampleData = [
        ['Chocolate Strawberries', '5', '14.63', '2025-08-11', 'Main Kitchen', 'Extra Data 1'],
        ['Chocolate Strawberries', '3', '14.63', '2025-08-10', 'Main Kitchen', 'Extra Data 2'],
        ['Chocolate Strawberries', '7', '14.63', '2025-08-09', 'Main Kitchen', 'Extra Data 3'],
      ];

      const { detectedTypes, suggestedMappings } = detectFieldTypes(mockHeaders, mockSampleData);

      setDataPreview({
        headers: mockHeaders,
        sampleData: mockSampleData,
        detectedTypes,
        suggestedMappings
      });

      // Create import job
      const newJob: ImportJob = {
        id: Date.now().toString(),
        sourceId: 'file-upload',
        dataType: 'sales',
        status: 'mapping',
        recordsProcessed: 0,
        recordsTotal: mockSampleData.length,
        recordsValid: 0,
        recordsInvalid: 0,
        startedAt: new Date().toISOString(),
        preview: mockSampleData,
        mappings: Object.entries(suggestedMappings).map(([sourceField, targetField]) => ({
          sourceField,
          targetField,
          dataType: detectedTypes[sourceField] as any,
          required: ['Recipe Name', 'Quantity Sold', 'Price Per Unit'].includes(sourceField)
        }))
      };

      setCurrentJob(newJob);
      setImportJobs(prev => [...prev, newJob]);

    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataUrlImport = async () => {
    if (!dataUrl.trim()) return;

    setIsProcessing(true);

    try {
      // Fetch actual data from Google Sheets
      const response = await fetch(`/api/data-url?url=${encodeURIComponent(dataUrl)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Google Sheets data');
      }

      const result = await response.json();
      const actualData = result.data;

      if (!actualData || actualData.length === 0) {
        throw new Error('No data found in Google Sheets');
      }

      // Extract headers and sample data from actual Google Sheets
      const headers = actualData[0];
      const allData = actualData.slice(1); // All data rows (not just sample)
      const sampleData = actualData.slice(1, Math.min(5, actualData.length)); // Show up to 4 rows as sample

      const { detectedTypes, suggestedMappings } = detectFieldTypes(headers, sampleData);

      setDataPreview({
        headers: headers,
        sampleData: allData, // Store ALL data, not just sample
        detectedTypes,
        suggestedMappings
      });

      const newJob: ImportJob = {
        id: Date.now().toString(),
        sourceId: 'google-sheets',
        dataType: 'sales',
        status: 'mapping',
        recordsProcessed: 0,
        recordsTotal: actualData.length - 1, // Exclude header row
        recordsValid: 0,
        recordsInvalid: 0,
        startedAt: new Date().toISOString(),
        preview: sampleData,
        mappings: Object.entries(suggestedMappings).map(([sourceField, targetField]) => ({
          sourceField,
          targetField,
          dataType: detectedTypes[sourceField] as any,
          required: ['Recipe/Menu Item', 'Units Sold', 'Sale Price (per)'].includes(sourceField)
        }))
      };

      setCurrentJob(newJob);
      setImportJobs(prev => [...prev, newJob]);

    } catch (error) {
      console.error('Error importing from Google Sheets:', error);
      alert(`Error importing from Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateFieldMapping = (sourceField: string, targetField: string) => {
    if (!currentJob?.mappings) return;

    const updatedMappings = currentJob.mappings.map(mapping =>
      mapping.sourceField === sourceField
        ? { ...mapping, targetField }
        : mapping
    );

    setCurrentJob({ ...currentJob, mappings: updatedMappings });
  };

  const toggleFieldVisibility = (sourceField: string) => {
    if (!currentJob?.mappings) return;

    const updatedMappings = currentJob.mappings.map(mapping =>
      mapping.sourceField === sourceField
        ? { ...mapping, targetField: mapping.targetField ? '' : mapping.sourceField }
        : mapping
    );

    setCurrentJob({ ...currentJob, mappings: updatedMappings });
  };

  const validateAndImport = async () => {
    if (!currentJob?.mappings || !dataPreview) return;

    setIsProcessing(true);
    setCurrentJob({ ...currentJob, status: 'validating' });

    try {
      // Validate mappings
      const validMappings = currentJob.mappings.filter(m => m.targetField && m.required);
      const invalidCount = currentJob.mappings.filter(m => m.required && !m.targetField).length;

      if (invalidCount > 0) {
        setCurrentJob({ ...currentJob, status: 'failed', error: `${invalidCount} required fields are not mapped` });
        return;
      }

      // Process and import data
      setCurrentJob({ ...currentJob, status: 'importing' });
      
      // Convert the data based on mappings - use ALL data from Google Sheets
      const importedData = dataPreview.sampleData.map((row, index) => {
        const record: any = {};
        
        currentJob.mappings?.forEach(mapping => {
          if (mapping.targetField === 'ignore') return;
          
          const columnIndex = dataPreview.headers.indexOf(mapping.sourceField);
          if (columnIndex !== -1) {
            const value = row[columnIndex];
            
            // Map to the correct field structure
            if (mapping.targetField === 'recipe.name') {
              record.recipeName = value;
            } else if (mapping.targetField === 'sale.quantity') {
              record.quantity = parseInt(value) || 0;
            } else if (mapping.targetField === 'sale.price') {
              record.price = parseFloat(value) || 0;
            } else if (mapping.targetField === 'sale.date') {
              record.date = value;
            }
          }
        });
        
        return record;
      }).filter(record => record.recipeName && record.quantity && record.price && record.date);

      // Add the imported data to the app state
      importedData.forEach(record => {
        // Add recipe if it doesn't exist
        console.log('Processing record:', record);
        console.log('Looking for recipe:', record.recipeName);
        console.log('Existing recipes:', state.recipes.map(r => ({ id: r.id, name: r.name })));
        
        const existingRecipe = state.recipes.find(r => r.name.toLowerCase() === record.recipeName.toLowerCase());
        let recipeId: string;
        
        if (existingRecipe) {
          recipeId = existingRecipe.id;
          console.log('Found existing recipe:', existingRecipe.name, 'with ID:', recipeId);
        } else {
          recipeId = `recipe-${record.recipeName.toLowerCase().replace(/\s+/g, '-')}`;
          console.log('Creating new recipe with ID:', recipeId);
          dispatch({
            type: 'ADD_RECIPE',
            payload: {
              id: recipeId,
              name: record.recipeName,
              ingredients: [],
              instructions: '',
              servings: 1,
              servingSize: 1,
              servingUnit: 'serving'
            }
          });
        }

        // Add to sales records
        dispatch({
          type: 'ADD_SALE',
          payload: {
            id: `imported-${Date.now()}-${Math.random()}`,
            recipeName: record.recipeName,
            quantity: record.quantity,
            salePrice: record.price,
            date: record.date
          }
        });
      });

      // Update job status
      setCurrentJob(prev => prev ? {
        ...prev,
        status: 'completed',
        recordsProcessed: importedData.length,
        recordsValid: importedData.length,
        completedAt: new Date().toISOString()
      } : null);

      // Update import jobs list
      setImportJobs(prev => prev.map(job =>
        job.id === currentJob.id
          ? { ...job, status: 'completed', recordsProcessed: importedData.length, recordsValid: importedData.length, completedAt: new Date().toISOString() }
          : job
      ));

      // Show success message
      alert(`Successfully imported ${importedData.length} sales records!`);

    } catch (error) {
      console.error('Import error:', error);
      setCurrentJob(prev => prev ? { ...prev, status: 'failed', error: 'Import failed' } : null);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'google-sheets': return '📊';
      case 'toast': return '🍞';
      case 'square': return '💳';
      case 'csv': return '📄';
      case 'excel': return '📊';
      default: return '🔗';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Import</h1>
          <p className="text-gray-600 mt-2">
            Import data from any source - URLs, files, APIs, or custom data sources
          </p>
        </div>

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="sources">Data Sources</TabsTrigger>
            <TabsTrigger value="jobs">Import Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            {/* Import Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload File
                  </CardTitle>
                  <CardDescription>
                    Import CSV, Excel, or JSON files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Choose File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={handleFileUpload}
                      disabled={isProcessing}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Supported formats: CSV, Excel (.xlsx, .xls), JSON
                  </p>
                </CardContent>
              </Card>

              {/* Import from URL */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Import from URL
                  </CardTitle>
                  <CardDescription>
                    Connect to Google Sheets, Excel Online, or other data sources by URL
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="data-url">Data URL</Label>
                    <Input
                      id="data-url"
                      placeholder="https://docs.google.com/spreadsheets/d/... or https://..."
                      value={dataUrl}
                      onChange={(e) => setDataUrl(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                  <Button
                    onClick={handleDataUrlImport}
                    disabled={!dataUrl.trim() || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Import from URL
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Data Preview and Mapping */}
            {dataPreview && currentJob && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Data Mapping
                  </CardTitle>
                  <CardDescription>
                    Map your data fields to the app structure. Unmapped fields will be ignored.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Data Preview */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Data Preview</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {dataPreview.headers.map((header, index) => (
                              <TableHead key={index} className="min-w-[120px]">
                                <div className="flex items-center gap-2">
                                  <span>{header}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {dataPreview.detectedTypes[header]}
                                  </Badge>
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dataPreview.sampleData.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex} className="max-w-[200px] truncate">
                                  {String(cell)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Field Mapping */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Field Mapping</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentJob.mappings?.map((mapping) => (
                        <div key={mapping.sourceField} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">
                              {mapping.sourceField}
                              {mapping.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFieldVisibility(mapping.sourceField)}
                            >
                              {mapping.targetField ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          {mapping.targetField && (
                            <Select
                              value={mapping.targetField}
                              onValueChange={(value) => updateFieldMapping(mapping.sourceField, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="recipe.name">Recipe Name</SelectItem>
                                <SelectItem value="sale.quantity">Quantity Sold</SelectItem>
                                <SelectItem value="sale.price">Sale Price</SelectItem>
                                <SelectItem value="sale.date">Sale Date</SelectItem>
                                <SelectItem value="product.name">Product Name</SelectItem>
                                <SelectItem value="inventory.currentStock">Current Stock</SelectItem>
                                <SelectItem value="product.unit">Unit</SelectItem>
                                <SelectItem value="product.cost">Product Cost</SelectItem>
                                <SelectItem value="ignore">Ignore Field</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-1">
                            Type: {mapping.dataType}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={validateAndImport}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Zap className="h-4 w-4 mr-2" />
                        )}
                        Import Data
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDataPreview(null);
                          setCurrentJob(null);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            {/* Data Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Connected Data Sources
                </CardTitle>
                <CardDescription>
                  Manage your connected data sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sources.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No data sources connected</p>
                    <p className="text-sm text-gray-400">Add your first data source above</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getSourceIcon(source.type)}</span>
                          <div>
                            <h3 className="font-medium">{source.name}</h3>
                            <p className="text-sm text-gray-500">
                              Last sync: {source.lastSync ? new Date(source.lastSync).toLocaleString() : 'Never'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(source.status)}>
                            {source.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            {/* Import Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Import History
                </CardTitle>
                <CardDescription>
                  Monitor your data import jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {importJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No import jobs yet</p>
                    <p className="text-sm text-gray-400">Start an import to see job history</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {importJobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{job.dataType} Import</span>
                            <Badge variant={
                              job.status === 'completed' ? 'default' :
                              job.status === 'failed' ? 'destructive' :
                              job.status === 'importing' ? 'secondary' : 'outline'
                            }>
                              {job.status}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(job.startedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {job.status === 'importing' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{job.recordsProcessed} / {job.recordsTotal}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(job.recordsProcessed / job.recordsTotal) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {job.status === 'completed' && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">
                              Successfully imported {job.recordsValid} records
                              {job.recordsInvalid > 0 && ` (${job.recordsInvalid} invalid)`}
                            </span>
                          </div>
                        )}
                        
                        {job.status === 'failed' && job.error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{job.error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Import Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {importJobs.reduce((sum, job) => sum + job.recordsProcessed, 0)}
                  </div>
                  <p className="text-xs text-gray-500">All time</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Valid Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {importJobs.reduce((sum, job) => sum + job.recordsValid, 0)}
                  </div>
                  <p className="text-xs text-gray-500">Successfully imported</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {importJobs.length > 0 
                      ? Math.round((importJobs.filter(job => job.status === 'completed').length / importJobs.length) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-gray-500">Import success</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Last Import</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {importJobs.length > 0 
                      ? new Date(importJobs[0].startedAt).toLocaleTimeString()
                      : 'Never'
                    }
                  </div>
                  <p className="text-xs text-gray-500">Today</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
