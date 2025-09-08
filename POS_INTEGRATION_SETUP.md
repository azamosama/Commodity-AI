# POS Integration Setup Guide

This guide will help you set up Multi-POS integration for your restaurant management app.

## 🎯 Overview

The app now supports integration with multiple Point of Sale (POS) systems:
- **Toast POS** - Restaurant management system
- **Square POS** - Payment and POS system
- **Aloha POS** - Coming soon
- **Custom POS** - Extensible for other systems

## 🔧 Environment Variables Setup

Add these environment variables to your `.env.local` file:

```bash
# POS Integration - Toast
TOAST_API_KEY=your_toast_api_key_here
TOAST_API_SECRET=your_toast_api_secret_here
TOAST_RESTAURANT_ID=your_toast_restaurant_id_here

# POS Integration - Square
SQUARE_API_KEY=your_square_api_key_here
SQUARE_LOCATION_ID=your_square_location_id_here
```

## 📋 Getting API Credentials

### Toast POS Setup

1. **Create Toast Developer Account**
   - Go to [Toast Developer Portal](https://developer.toasttab.com/)
   - Sign up for a developer account
   - Create a new application

2. **Get API Credentials**
   - Navigate to your application settings
   - Copy the `Client ID` (this is your `TOAST_API_KEY`)
   - Copy the `Client Secret` (this is your `TOAST_API_SECRET`)
   - Get your `Restaurant External ID` (this is your `TOAST_RESTAURANT_ID`)

3. **Configure Permissions**
   - Enable the following scopes:
     - `menu.read` - Read menu items
     - `orders.read` - Read sales data
     - `inventory.read` - Read inventory levels
     - `employees.read` - Read employee data
     - `customers.read` - Read customer data

### Square POS Setup

1. **Create Square Developer Account**
   - Go to [Square Developer Dashboard](https://developer.squareup.com/)
   - Sign up for a developer account
   - Create a new application

2. **Get API Credentials**
   - Navigate to your application settings
   - Copy the `Access Token` (this is your `SQUARE_API_KEY`)
   - Get your `Location ID` (this is your `SQUARE_LOCATION_ID`)

3. **Configure Permissions**
   - Enable the following scopes:
     - `ORDERS_READ` - Read orders and sales data
     - `INVENTORY_READ` - Read inventory levels
     - `CUSTOMERS_READ` - Read customer data
     - `EMPLOYEES_READ` - Read employee data
     - `ITEMS_READ` - Read catalog items

## 🚀 Testing the Integration

### 1. Test Connections

Visit the POS Integration dashboard at `/pos-integration` and click "Test Connections" to verify your API credentials.

### 2. Sync Data

Use the dashboard to sync different types of data:
- **Menu Items** - Import your menu with prices and ingredients
- **Sales Data** - Import historical sales transactions
- **Inventory** - Import current stock levels
- **Employees** - Import staff information
- **Customers** - Import customer data

### 3. API Endpoints

You can also test the integration via API:

```bash
# Test connections
curl http://localhost:3000/api/pos/test-connection

# Sync all data
curl -X POST http://localhost:3000/api/pos/sync-data \
  -H "Content-Type: application/json" \
  -d '{"dataType": "all"}'

# Sync specific data type
curl -X POST http://localhost:3000/api/pos/sync-data \
  -H "Content-Type: application/json" \
  -d '{"dataType": "menu"}'
```

## 📊 Data Flow

```
POS System → API Connector → Data Mapper → App Database → React Frontend
```

### Data Types Imported

| **Data Type** | **Toast** | **Square** | **Description** |
|---------------|-----------|------------|-----------------|
| **Menu Items** | ✅ | ✅ | Products, prices, ingredients |
| **Sales Data** | ✅ | ✅ | Transactions, orders, revenue |
| **Inventory** | ✅ | ✅ | Stock levels, SKUs, costs |
| **Employees** | ✅ | ✅ | Staff information, roles |
| **Customers** | ✅ | ✅ | Customer profiles, loyalty |

## 🔄 Sync Frequency

The system supports different sync frequencies:

- **Real-time** - Immediate updates (WebSocket)
- **Hourly** - Every hour
- **Daily** - Once per day
- **Manual** - On-demand only

## 🛠️ Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify API keys are correct
   - Check if API keys have expired
   - Ensure proper permissions are granted

2. **No Data Imported**
   - Check if POS system has data
   - Verify restaurant/location ID
   - Check API rate limits

3. **Connection Timeout**
   - Check internet connection
   - Verify POS system is online
   - Check firewall settings

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=pos-integration:*
```

## 🔒 Security

- API keys are stored securely in environment variables
- All API calls use HTTPS
- Data is encrypted in transit
- Access is restricted to authorized users

## 📈 Benefits

### For Restaurants
- **Automatic Data Import** - No manual data entry
- **Real-time Updates** - Live inventory and sales data
- **Unified Dashboard** - All data in one place
- **AI-Powered Insights** - Enhanced analytics

### For Operations
- **Reduced Errors** - Eliminate manual data entry mistakes
- **Time Savings** - Automated data synchronization
- **Better Decisions** - Real-time data for decision making
- **Cost Optimization** - AI-powered cost analysis

## 🔮 Future Enhancements

- **Aloha POS Integration** - Coming soon
- **Real-time WebSocket Updates** - Live data streaming
- **Advanced Data Mapping** - Custom field mapping
- **Bulk Import** - CSV/Excel file import
- **Data Validation** - Automated data quality checks

## 📞 Support

If you need help with POS integration:

1. Check the troubleshooting section above
2. Review the API documentation for your POS system
3. Contact your POS provider for API support
4. Open an issue in the project repository

## 🎉 Success!

Once configured, your POS system will automatically sync data to the app, providing:
- Real-time inventory tracking
- Automated cost analysis
- AI-powered forecasting
- Comprehensive reporting
- Predictive analytics

Your restaurant management will never be the same! 🚀
