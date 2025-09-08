# 🚀 USDA API Setup Guide - Quick Start

## 📋 **What You Need to Do**

### **Step 1: Get USDA FoodData Central API Key**

1. **Go to**: https://api.nal.usda.gov:443
2. **Click**: "Get an API Key" 
3. **Fill out**:
   - Email: Your email
   - Organization: Your restaurant name
   - Purpose: "Restaurant cost management and price analysis"
4. **Submit** and check your email

### **Step 2: Get USDA Quick Stats API Key**

1. **Go to**: https://quickstats.nass.usda.gov/api/
2. **Click**: "Get API Key"
3. **Fill out** similar information
4. **Submit** and check your email

### **Step 3: Update Your Environment File**

Once you have the API keys, edit the `.env.local` file in your project:

```bash
# Replace these placeholder values with your actual API keys
USDA_FOODDATA_API_KEY=your_actual_fooddata_api_key_here
USDA_QUICKSTATS_API_KEY=your_actual_quickstats_api_key_here
```

### **Step 4: Test the APIs**

After updating the API keys, restart your development server and test:

```bash
# Restart your dev server
npm run dev

# Test the APIs (in a new terminal)
curl "http://localhost:3000/api/test-usda-api?commodity=strawberries"
```

## 🎯 **What You'll Get**

Once the APIs are working, you'll have access to:

- **Real USDA price data** for commodities
- **Seasonal price patterns** from actual market data
- **Volatility metrics** based on real market fluctuations
- **Market insights** and recommendations

## 🔧 **Current Status**

✅ **Environment file created**: `.env.local`
✅ **API integration ready**: Updated to use new API keys
✅ **Test endpoint ready**: `/api/test-usda-api`

⏳ **Waiting for**: Your USDA API keys

## 💡 **Need Help?**

If you have trouble getting the API keys or need assistance, let me know! The system is ready to integrate real USDA data once you have the keys.
