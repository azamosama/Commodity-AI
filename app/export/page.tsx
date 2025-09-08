'use client';

import React, { useState } from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  BarChart3, 
  Database,
  TrendingUp,
  Package,
  Calculator,
  Receipt,
  Users,
  DollarSign
} from 'lucide-react';
import { 
  exportRestaurantReport,
  exportSalesRecords,
  exportInventory,
  exportRecipeCosts,
  exportPurchaseOrders
} from '@/lib/export-utils';

export default function ExportPage() {
  const { state } = useCostManagement();
  const [isExporting, setIsExporting] = useState(false);

  const handleComprehensiveExport = async () => {
    setIsExporting(true);
    try {
      await exportRestaurantReport(
        state.sales,
        state.products,
        state.recipes,
        [],
        'excel'
      );
    } catch (error) {
      console.error('Comprehensive export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      title: 'Sales Records',
      description: 'Export all sales transactions with revenue data',
      icon: <Receipt className="h-8 w-8 text-blue-600" />,
      count: state.sales.length,
      export: () => exportSalesRecords(state.sales, state.recipes, 'excel'),
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'Current Inventory',
      description: 'Export product stock levels and reorder points',
      icon: <Package className="h-8 w-8 text-green-600" />,
      count: state.products.length,
      export: () => exportInventory(state.products, state.inventory, state.recipes, state.sales, 'excel'),
      color: 'bg-green-50 border-green-200'
    },
    {
      title: 'Recipe Cost Analysis',
      description: 'Export recipe costs, profitability, and pricing',
      icon: <Calculator className="h-8 w-8 text-purple-600" />,
      count: state.recipes.length,
      export: () => exportRecipeCosts(state.recipes, 'excel'),
      color: 'bg-purple-50 border-purple-200'
    },
    {
      title: 'Purchase Orders',
      description: 'Export supplier orders and procurement data',
      icon: <Database className="h-8 w-8 text-orange-600" />,
      count: 0,
      export: () => exportPurchaseOrders([], 'excel'),
      color: 'bg-orange-50 border-orange-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Export Center</h1>
            <p className="text-gray-600">
              Export your restaurant data for analysis, reporting, and sharing with managers.
            </p>
          </div>

          {/* Comprehensive Export */}
          <Card className="mb-8 border-2 border-dashed border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
                Comprehensive Restaurant Report
              </CardTitle>
              <CardDescription>
                Export all data in a single Excel file with multiple sheets for complete analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Includes: Sales Summary, Inventory Summary, Sales Details, Inventory Details
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{state.sales.length} Sales Records</Badge>
                    <Badge variant="secondary">{state.products.length} Products</Badge>
                    <Badge variant="secondary">{state.recipes.length} Recipes</Badge>
                    <Badge variant="secondary">0 Purchase Orders</Badge>
                  </div>
                </div>
                <Button 
                  onClick={handleComprehensiveExport}
                  disabled={isExporting}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isExporting ? (
                    <>
                      <Download className="h-4 w-4 mr-2 animate-pulse" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export Full Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Individual Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exportOptions.map((option, index) => (
              <Card key={index} className={`${option.color} hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {option.icon}
                    {option.title}
                  </CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{option.count} items</Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => option.export()}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => option.export()}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        Excel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Export Tips */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Export Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">For Managers:</h4>
                  <ul className="space-y-1">
                    <li>• Use the Comprehensive Report for full analysis</li>
                    <li>• Sales Records show revenue trends and performance</li>
                    <li>• Inventory data helps with ordering decisions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">For Analysis:</h4>
                  <ul className="space-y-1">
                    <li>• Excel format supports charts and pivot tables</li>
                    <li>• CSV format works with most data analysis tools</li>
                    <li>• Files are automatically dated for easy tracking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
