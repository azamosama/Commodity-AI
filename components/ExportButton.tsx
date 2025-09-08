'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  BarChart3,
  Loader2
} from 'lucide-react';
import { 
  exportToCSV, 
  exportToExcel, 
  exportSalesRecords, 
  exportInventory, 
  exportRecipeCosts, 
  exportPurchaseOrders,
  exportRestaurantReport 
} from '@/lib/export-utils';

interface ExportButtonProps {
  data: any[];
  dataType: 'sales' | 'inventory' | 'recipes' | 'purchase-orders' | 'comprehensive';
  filename?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
          additionalData?: {
          salesRecords?: any[];
          products?: any[];
          recipes?: any[];
          purchaseOrders?: any[];
          inventory?: any[];
          sales?: any[];
        };
}

export default function ExportButton({ 
  data, 
  dataType, 
  filename, 
  variant = 'outline',
  size = 'default',
  className = '',
  additionalData = {}
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      switch (dataType) {
        case 'sales':
          exportSalesRecords(data, additionalData.recipes || [], format);
          break;
        case 'inventory':
          exportInventory(data, additionalData.inventory || [], additionalData.recipes || [], additionalData.sales || [], format);
          break;
        case 'recipes':
          exportRecipeCosts(data, format);
          break;
        case 'purchase-orders':
          exportPurchaseOrders(data, format);
          break;
        case 'comprehensive':
          if (additionalData.salesRecords && additionalData.products && additionalData.recipes && additionalData.purchaseOrders) {
            await exportRestaurantReport(
              additionalData.salesRecords,
              additionalData.products,
              additionalData.recipes,
              additionalData.purchaseOrders,
              format
            );
          }
          break;
        default:
          // Generic export
          if (format === 'excel') {
            await exportToExcel(data, filename || 'export');
          } else {
            exportToCSV(data, filename || 'export');
          }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getExportLabel = () => {
    switch (dataType) {
      case 'sales': return 'Export Sales';
      case 'inventory': return 'Export Inventory';
      case 'recipes': return 'Export Recipes';
      case 'purchase-orders': return 'Export Orders';
      case 'comprehensive': return 'Export Report';
      default: return 'Export Data';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {getExportLabel()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        {dataType === 'comprehensive' && (
          <DropdownMenuItem onClick={() => handleExport('excel')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Full Restaurant Report
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
