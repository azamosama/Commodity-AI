# Flexible Data Import System

## Overview

The Flexible Data Import System allows restaurants to import data from any source - Google Sheets, Toast POS, CSV files, Excel spreadsheets, or custom APIs - with intelligent field mapping and data validation. The system automatically detects data types, suggests field mappings, and ignores irrelevant columns that don't fit the app's structure.

## Key Features

### 🔄 **Universal Data Source Support**
- **Google Sheets** - Direct URL import with real-time sync
- **Toast POS** - API integration for sales and inventory
- **CSV Files** - Upload and process any CSV format
- **Excel Files** - Support for .xlsx and .xls formats
- **Custom APIs** - Connect to any external data source
- **Manual Entry** - Copy-paste data from any source

### 🧠 **Smart Field Detection**
- **Automatic Type Detection** - Numbers, dates, text, booleans
- **Intelligent Mapping** - Suggests field mappings based on column names
- **Flexible Validation** - Handles various data formats and edge cases
- **Error Handling** - Detailed error reporting for invalid data

### 🎯 **Smart Data Processing**
- **Column Filtering** - Ignores irrelevant columns automatically
- **Data Transformation** - Converts data to app-compatible format
- **Validation Rules** - Ensures data quality and completeness
- **Batch Processing** - Handles large datasets efficiently

## How It Works

### 1. **Data Source Connection**
```
External Data Source → Data Import System → App Database
```

1. **Connect Source**: Upload file or provide API credentials
2. **Preview Data**: System shows sample data and detected types
3. **Map Fields**: User confirms or modifies field mappings
4. **Validate & Import**: System processes and validates data

### 2. **Smart Field Mapping**
The system automatically suggests mappings based on column names:

| Source Column | Detected Type | Suggested Mapping | Description |
|---------------|---------------|-------------------|-------------|
| `Recipe Name` | string | `recipe.name` | Menu item name |
| `Quantity Sold` | number | `sale.quantity` | Number of items sold |
| `Price Per Unit` | number | `sale.price` | Sale price |
| `Sale Date` | date | `sale.date` | Transaction date |
| `Extra Column` | string | `ignore` | Irrelevant data |

### 3. **Data Processing Pipeline**
```
Raw Data → Type Detection → Field Mapping → Validation → Transformation → Import
```

## Supported Data Formats

### Google Sheets
- **URL Import**: Direct connection via Google Sheets URL
- **Real-time Sync**: Automatic updates when sheet changes
- **Multiple Sheets**: Support for multiple tabs
- **Permission Handling**: OAuth authentication

### CSV Files
- **Standard CSV**: Comma-separated values
- **Custom Delimiters**: Tab, semicolon, pipe-separated
- **Encoding Support**: UTF-8, ASCII, ISO-8859-1
- **Header Detection**: Automatic or manual header specification

### Excel Files
- **Multiple Formats**: .xlsx, .xls, .xlsm
- **Multiple Sheets**: Import from specific worksheets
- **Formula Handling**: Extracts calculated values
- **Format Preservation**: Maintains data types

### Toast POS Integration
- **API Connection**: Direct integration with Toast API
- **Sales Data**: Transaction records, quantities, prices
- **Inventory Data**: Stock levels, product information
- **Real-time Sync**: Automatic data synchronization

## Field Mapping System

### Automatic Detection
The system analyzes column names and data to suggest mappings:

```javascript
// Example: Toast POS data with extra columns
{
  "Menu Item": "Chocolate Strawberries",        // → recipe.name
  "Units Sold": 5,                             // → sale.quantity
  "Unit Price": 14.63,                         // → sale.price
  "Transaction Date": "2025-08-11",            // → sale.date
  "Store Location": "Downtown",                // → ignore (not needed)
  "Payment Method": "Credit Card",             // → ignore (not needed)
  "Customer Notes": "Customer loved it!",      // → ignore (not needed)
  "Extra Column": "Some other data"            // → ignore (not needed)
}
```

### Manual Override
Users can customize any field mapping:

1. **Show/Hide Fields**: Toggle field visibility
2. **Change Mappings**: Select different target fields
3. **Set Required Fields**: Mark critical data fields
4. **Ignore Irrelevant Data**: Exclude unnecessary columns

### Supported Target Fields
- `recipe.name` - Recipe or menu item name
- `sale.quantity` - Quantity sold
- `sale.price` - Sale price per unit
- `sale.date` - Sale date
- `product.name` - Product or ingredient name
- `inventory.currentStock` - Current stock level
- `product.unit` - Unit of measurement
- `product.cost` - Product cost
- `ignore` - Exclude from import

## Data Validation

### Type Validation
- **Numbers**: Validates numeric values, handles currency symbols
- **Dates**: Accepts multiple date formats (YYYY-MM-DD, MM/DD/YYYY, etc.)
- **Text**: Handles special characters and encoding
- **Booleans**: Converts yes/no, true/false, 1/0

### Business Rules
- **Required Fields**: Ensures critical data is present
- **Data Ranges**: Validates reasonable values (e.g., positive quantities)
- **Format Consistency**: Ensures uniform data structure
- **Duplicate Detection**: Identifies and handles duplicate records

### Error Handling
- **Detailed Reports**: Shows exactly which records failed and why
- **Partial Imports**: Continues processing valid records
- **Error Recovery**: Allows fixing and re-importing failed records
- **Data Preview**: Shows sample data before import

## Import Process

### Step 1: Connect Data Source
1. Navigate to **Data Import** in the sidebar
2. Choose import method (File Upload, Google Sheets, etc.)
3. Provide source details (file, URL, API credentials)

### Step 2: Preview and Map
1. System shows data preview with detected types
2. Review suggested field mappings
3. Customize mappings as needed
4. Set required fields and validation rules

### Step 3: Validate and Import
1. System validates all data against rules
2. Shows validation results and any errors
3. User confirms import or fixes issues
4. Data is processed and imported to app

### Step 4: Monitor Progress
1. Real-time import progress tracking
2. Success/failure statistics
3. Detailed error reporting
4. Import history and audit trail

## Example Use Cases

### Case 1: Toast POS Integration
**Scenario**: Restaurant wants to import sales data from Toast POS

**Data Source**:
```csv
Menu Item,Units Sold,Unit Price,Transaction Date,Store Location,Payment Method
Chocolate Strawberries,5,14.63,2025-08-11,Downtown,Credit Card
Chocolate Strawberries,3,14.63,2025-08-10,Downtown,Cash
```

**System Processing**:
1. **Detects Types**: Menu Item (string), Units Sold (number), etc.
2. **Suggests Mappings**: Menu Item → recipe.name, Units Sold → sale.quantity
3. **Ignores Irrelevant**: Store Location, Payment Method (not needed)
4. **Validates Data**: Ensures all required fields are present
5. **Imports Clean Data**: Only relevant fields imported

### Case 2: Google Sheets Import
**Scenario**: Restaurant has sales data in Google Sheets with extra columns

**Sheet Structure**:
| Recipe Name | Qty Sold | Price | Date | Location | Notes | Extra Column |
|-------------|----------|-------|------|----------|-------|--------------|
| Chocolate Strawberries | 5 | 14.63 | 2025-08-11 | Main Kitchen | Customer loved it! | Some data |

**System Action**:
- Maps: Recipe Name → recipe.name, Qty Sold → sale.quantity, Price → sale.price, Date → sale.date
- Ignores: Location, Notes, Extra Column (not relevant to app)
- Validates: Ensures quantities are positive, dates are valid
- Imports: Clean, structured data into app

### Case 3: CSV File with Different Format
**Scenario**: Restaurant has data in different format from another system

**CSV Format**:
```csv
item_description,amount_sold,unit_cost,sale_timestamp,store_id,employee_id
Chocolate Strawberries,5,14.63,2025-08-11T10:30:00,STORE001,EMP123
```

**System Processing**:
1. **Detects Types**: All fields properly typed
2. **Suggests Mappings**: item_description → recipe.name, amount_sold → sale.quantity
3. **Ignores Irrelevant**: store_id, employee_id (not needed)
4. **Transforms Data**: Converts timestamp to date format
5. **Imports Successfully**: Clean data imported

## Benefits

### 🚀 **Universal Compatibility**
- **Any Data Source**: Works with any format or system
- **No Manual Entry**: Eliminates typing errors
- **Flexible Mapping**: Adapts to different data structures
- **Automatic Processing**: Handles data transformation

### 📊 **Data Quality**
- **Validation**: Ensures data accuracy and completeness
- **Error Detection**: Identifies and reports issues
- **Clean Import**: Only relevant, valid data imported
- **Audit Trail**: Complete import history and tracking

### ⚡ **Efficiency**
- **Batch Processing**: Handles large datasets quickly
- **Smart Mapping**: Reduces manual configuration
- **Error Recovery**: Easy fix and re-import process
- **Real-time Sync**: Automatic updates from connected sources

### 🔧 **Ease of Use**
- **Visual Interface**: Intuitive mapping and preview
- **Progress Tracking**: Real-time import status
- **Error Reporting**: Clear, actionable error messages
- **Flexible Configuration**: Customizable validation rules

## Technical Implementation

### API Endpoints

#### POST /api/data-import?action=preview
```javascript
// Preview data structure
{
  "data": [["Recipe Name", "Quantity", "Price"], ["Chocolate Strawberries", "5", "14.63"]],
  "sourceType": "csv"
}

// Response
{
  "preview": {
    "headers": ["Recipe Name", "Quantity", "Price"],
    "sampleData": [["Chocolate Strawberries", "5", "14.63"]],
    "detectedTypes": {"Recipe Name": "string", "Quantity": "number", "Price": "number"},
    "suggestedMappings": {"Recipe Name": "recipe.name", "Quantity": "sale.quantity", "Price": "sale.price"}
  }
}
```

#### POST /api/data-import?action=process
```javascript
// Process data import
{
  "sourceType": "csv",
  "data": [["Recipe Name", "Quantity", "Price"], ["Chocolate Strawberries", "5", "14.63"]],
  "mappings": [
    {"sourceField": "Recipe Name", "targetField": "recipe.name", "dataType": "string", "required": true},
    {"sourceField": "Quantity", "targetField": "sale.quantity", "dataType": "number", "required": true},
    {"sourceField": "Price", "targetField": "sale.price", "dataType": "number", "required": true}
  ],
  "dataType": "sales"
}
```

### Data Processing Pipeline
1. **Input Validation**: Check data format and structure
2. **Type Detection**: Analyze data types automatically
3. **Field Mapping**: Apply user-defined mappings
4. **Data Transformation**: Convert to app format
5. **Validation**: Apply business rules
6. **Import**: Store in database
7. **Reporting**: Generate import results

## Best Practices

### Data Preparation
1. **Clean Source Data**: Remove unnecessary columns before import
2. **Consistent Format**: Use consistent date and number formats
3. **Header Row**: Ensure first row contains column names
4. **Data Validation**: Check for obvious errors in source data

### Import Configuration
1. **Test with Sample**: Import small dataset first
2. **Review Mappings**: Verify field mappings are correct
3. **Set Required Fields**: Mark critical data fields
4. **Monitor Results**: Check import statistics and errors

### Error Handling
1. **Fix Source Data**: Correct errors in original data
2. **Adjust Mappings**: Modify field mappings if needed
3. **Re-import**: Process corrected data
4. **Document Issues**: Keep track of common problems

## Troubleshooting

### Common Issues

#### Import Fails
- **Check Data Format**: Ensure file is in supported format
- **Verify Mappings**: Confirm field mappings are correct
- **Review Errors**: Check detailed error messages
- **Test Sample**: Try with smaller dataset first

#### Data Not Importing
- **Required Fields**: Ensure all required fields are mapped
- **Data Types**: Check that data types match expectations
- **Validation Rules**: Review business rule violations
- **Permissions**: Verify API access and permissions

#### Incorrect Data
- **Field Mapping**: Review and correct field mappings
- **Data Transformation**: Check data conversion rules
- **Source Data**: Verify original data is correct
- **Import Settings**: Review import configuration

### Support Resources
1. **Import Logs**: Check detailed import history
2. **Error Reports**: Review specific error messages
3. **Data Preview**: Verify data structure before import
4. **Documentation**: Reference setup and configuration guides

## Future Enhancements

### Planned Features
- **Advanced Transformations**: Custom data transformation rules
- **Scheduled Imports**: Automated import scheduling
- **Data Enrichment**: Add missing data automatically
- **Machine Learning**: Improved field detection and mapping
- **Multi-language Support**: International data format support

### Integration Roadmap
- **Additional POS Systems**: More POS platform integrations
- **ERP Systems**: Enterprise resource planning integration
- **Accounting Software**: Financial data import
- **Inventory Systems**: Advanced inventory management
- **Analytics Platforms**: Business intelligence integration
