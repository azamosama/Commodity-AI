# Data Persistence for Restaurant-Specific URLs

This directory contains the persistent data storage for restaurant-specific URLs in the Flavor Pulse application.

## How It Works

### 1. **Restaurant-Specific URLs**
- Each restaurant gets a unique URL like: `https://your-app.vercel.app?restaurant=restaurant-a`
- The `restaurant` parameter in the URL determines which data is loaded/saved

### 2. **Data Storage**
- **Primary Storage**: File-based storage in `restaurant-data.json`
- **Backup Storage**: Browser localStorage (for offline/fallback scenarios)
- **Cross-Device Sync**: Data is saved to the server file, making it accessible from any device/browser

### 3. **Data Flow**
```
User Action → CostManagementContext → API (/api/restaurant-data) → File Storage
                ↓
            localStorage (backup)
```

### 4. **Persistence Features**
- ✅ **Cross-browser compatibility**: Data saved to server file
- ✅ **Cross-device access**: Same URL works on different devices
- ✅ **Offline fallback**: localStorage backup if API fails
- ✅ **Real-time sync**: Data saves automatically on every change
- ✅ **Restaurant isolation**: Each restaurant's data is completely separate

### 5. **File Structure**
```
data/
├── .gitkeep          # Ensures directory is tracked by git
├── README.md         # This file
└── restaurant-data.json  # Actual data storage (auto-generated)
```

### 6. **Data Format**
The `restaurant-data.json` file contains:
```json
{
  "restaurant-a": {
    "products": [...],
    "recipes": [...],
    "expenses": [...],
    "inventory": [...],
    "sales": [...]
  },
  "restaurant-b": {
    // Separate data for another restaurant
  }
}
```

## Testing Data Persistence

1. **Add data** to Restaurant A via `?restaurant=restaurant-a`
2. **Open the same URL** in a different browser/device
3. **Verify** that the data appears
4. **Make changes** and verify they persist across sessions

## Troubleshooting

- **Data not persisting**: Check browser console for API errors
- **Data not loading**: Verify the restaurant parameter in the URL
- **File permissions**: Ensure the `data/` directory is writable

## Production Considerations

For production deployment, consider:
- Using a proper database (PostgreSQL, MongoDB)
- Implementing user authentication
- Adding data validation and sanitization
- Setting up automated backups
