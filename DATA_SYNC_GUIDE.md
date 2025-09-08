# Data Synchronization Guide

## Overview

The Flavor Pulse app now includes an enhanced data synchronization system that prevents issues like missing sales records and ensures data consistency between the server and your browser.

## New Features

### 1. Data Sync Status Component

Located in the top-right corner of the Inventory page, this component shows:
- **Sync Status**: Loading, Syncing, Error, or Data Synced
- **Error Messages**: Clear indication if something goes wrong
- **Action Buttons**: Force refresh and clear cache options

### 2. Version Tracking

The system now tracks:
- **Data Version**: Ensures you're using the latest data
- **Last Sync Time**: Shows when data was last synchronized
- **Automatic Updates**: Detects when server data is newer

### 3. Enhanced Error Handling

- **Graceful Fallbacks**: If API fails, uses localStorage backup
- **Clear Error Messages**: Shows exactly what went wrong
- **Retry Mechanisms**: Easy ways to recover from errors

## How to Use

### If You're Missing Sales Records

1. **Check the Sync Status** (top-right of Inventory page)
   - Green checkmark = Data is synced
   - Red error = There's a sync issue
   - Spinning icon = Currently syncing

2. **Force Refresh** (if needed)
   - Click the "Force Refresh" button
   - This bypasses cache and gets fresh data from server

3. **Clear Cache** (if problems persist)
   - Click the "Clear Cache" button
   - This removes all local data and reloads from server

### Automatic Features

- **Debounced Saves**: Changes are automatically saved after 1 second of inactivity
- **Version Checking**: System automatically detects when server data is newer
- **Cross-Tab Sync**: Changes in one tab automatically sync to other tabs

## Troubleshooting

### Missing Sales Records (8/12, 8/13, etc.)

**Symptoms**: You see sales records in exports but not in the app

**Solution**:
1. Go to Inventory page
2. Look at the Data Sync Status component
3. Click "Force Refresh" button
4. If that doesn't work, click "Clear Cache" button

### Data Not Saving

**Symptoms**: Changes disappear after refresh

**Solution**:
1. Check for error messages in the sync status
2. Ensure you have internet connection
3. Try "Force Refresh" to re-establish connection

### Slow Performance

**Symptoms**: App feels sluggish

**Solution**:
1. The system uses debounced saves (1-second delay)
2. This is normal and prevents excessive API calls
3. Wait for the sync status to show "Data Synced"

## Technical Details

### Data Sources (in order of preference)
1. **API Server**: Primary data source
2. **LocalStorage**: Backup when API is unavailable
3. **Initial State**: Fallback for new installations

### Sync Process
1. **Load**: Try API first, fallback to localStorage
2. **Version Check**: Compare local vs server versions
3. **Update**: Only sync if server data is newer
4. **Save**: Debounced saves to prevent spam

### Cache Management
- **Automatic**: System manages cache automatically
- **Manual**: Use "Clear Cache" button for manual reset
- **Cross-Tab**: Changes sync across browser tabs

## Best Practices

1. **Check Sync Status**: Always verify data is synced before making important changes
2. **Use Force Refresh**: If you suspect data is stale
3. **Clear Cache**: As a last resort for persistent issues
4. **Wait for Sync**: Don't close browser while sync is in progress

## Support

If you continue to experience issues:
1. Check the browser console for error messages
2. Try clearing browser cache completely
3. Contact support with specific error messages from the sync status
