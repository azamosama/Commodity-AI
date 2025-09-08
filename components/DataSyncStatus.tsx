'use client';

import React from 'react';
import { useCostManagement } from '@/contexts/CostManagementContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Database,
  Cloud,
  HardDrive
} from 'lucide-react';

export function DataSyncStatus() {
  const { syncStatus, lastError, forceRefresh, isLoading } = useCostManagement();

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'idle':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'loading':
        return 'Loading data...';
      case 'syncing':
        return 'Syncing with server...';
      case 'error':
        return 'Sync error';
      case 'idle':
        return 'Data synced';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'error':
        return 'destructive';
      case 'idle':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-2">
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge variant={getStatusColor()}>
          {getStatusText()}
        </Badge>
        {isLoading && (
          <Badge variant="outline">
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            Loading
          </Badge>
        )}
      </div>

      {/* Error Display */}
      {lastError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lastError}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={forceRefresh}
          disabled={isLoading || syncStatus === 'syncing'}
          size="sm"
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Force Refresh
        </Button>
        
        <Button
          onClick={() => {
            localStorage.clear();
            forceRefresh();
          }}
          disabled={isLoading || syncStatus === 'syncing'}
          size="sm"
          variant="outline"
        >
          <HardDrive className="h-4 w-4 mr-2" />
          Clear Cache
        </Button>
      </div>

      {/* Data Source Indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Cloud className="h-3 w-3" />
        <span>Data source: API + Local Storage backup</span>
      </div>
    </div>
  );
}
