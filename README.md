# Commodity AI - Restaurant Management Platform

A comprehensive restaurant management platform with predictive analytics, automated restocking, and anomaly detection.

## 🚀 Features

### Core Management
- **Inventory Management** - Track ingredients, costs, and stock levels
- **Recipe Management** - Create recipes with cost calculations and AI substitution suggestions
- **Sales Tracking** - Record sales and analyze profitability
- **Expense Management** - Track operational costs and breakeven analysis
- **Analytics Dashboard** - Comprehensive reporting and insights

### 🧠 AI-Powered Features
- **Flavor GPT** - AI assistant for restaurant data analysis and insights
- **AI Ingredient Substitutions** - Smart suggestions based on availability and cost optimization
- **Real Product Data Integration** - USDA API integration for accurate pricing and nutritional data

### 🔮 Predictive Analytics (New)
- **Predictive Auto-Restocking** - Automated inventory management with demand forecasting
- **Sales & Inventory Forecasting** - Advanced forecasting for menu items and ingredients
- **Exception Reporting** - Anomaly detection for operational issues

## 🏗️ Architecture

### Frontend
- **React + TypeScript** - Modern, type-safe UI
- **Next.js 15** - App Router with server-side rendering
- **Shadcn UI** - Beautiful, accessible components
- **Recharts** - Data visualization
- **D3.js** - Advanced analytics charts

### Backend
- **Node.js + TypeScript** - RESTful APIs and services
- **Python** - AI/ML forecasting and anomaly detection
- **PostgreSQL** - Primary database for sales, inventory, and analytics
- **Redis** - Caching and session management

### AI/ML Stack
- **Prophet** - Time series forecasting
- **Scikit-learn** - Machine learning models
- **Isolation Forest** - Anomaly detection
- **Ollama** - Local AI chat (Flavor GPT)

### External Integrations
- **USDA Food Database API** - Nutritional and pricing data
- **POS APIs** - Sales data integration
- **Supplier APIs** - Automated purchasing
- **Email/SMS Services** - Alert notifications

## 📊 Predictive Analytics Modules

### 1. Predictive Auto-Restocking
- **Demand Forecasting** - 14-day ingredient usage predictions
- **Automated Purchase Orders** - Supplier API integration
- **Safety Stock Management** - Configurable thresholds and lead times
- **Admin Dashboard** - Review and approve automatic orders
- **Decision Logging** - Complete audit trail of restocking decisions

### 2. Sales & Inventory Forecasting
- **12-Month Historical Analysis** - Comprehensive data aggregation
- **Menu Item Forecasting** - Daily and weekly sales predictions
- **Ingredient Demand Mapping** - Recipe-based demand conversion
- **Visualization Dashboard** - Interactive charts and trend analysis
- **Shortage Predictions** - Proactive inventory management

### 3. Exception Reporting
- **Real-time Monitoring** - Sales, inventory, waste, and purchases
- **Anomaly Detection** - Statistical analysis and machine learning
- **Alert System** - Email, SMS, and in-app notifications
- **Weekly Reports** - Comprehensive anomaly summaries
- **Root Cause Analysis** - Suggested corrective actions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- Redis 6+

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Commodity-AI
```

2. **Install dependencies**
```bash
# Frontend dependencies
pnpm install

# Python dependencies
pip install -r requirements.txt
```

3. **Environment Setup**
```bash
cp .env.example .env.local
# Configure your environment variables
```

4. **Database Setup**
```bash
# Run migrations
pnpm run db:migrate

# Seed initial data
pnpm run db:seed
```

5. **Start Development Servers**
```bash
# Frontend (Next.js)
pnpm run dev

# Backend API (Node.js)
pnpm run dev:api

# Python ML Services
pnpm run dev:ml
```

## 📁 Project Structure

```
Commodity-AI/
├── app/                    # Next.js frontend (App Router)
├── components/             # React components
├── contexts/              # React context providers
├── lib/                   # Shared utilities and types
├── pages/api/             # Next.js API routes
├── services/              # Backend services
│   ├── forecasting/       # Python forecasting service
│   ├── anomaly-detection/ # Python anomaly detection
│   └── restocking/        # Auto-restocking logic
├── ml/                    # Python ML models and scripts
├── database/              # Database schemas and migrations
└── docker/                # Docker configurations
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/commodity_ai

# Redis
REDIS_URL=redis://localhost:6379

# External APIs
USDA_API_KEY=your_usda_api_key
POS_API_KEY=your_pos_api_key
SUPPLIER_API_KEY=your_supplier_api_key

# AI Services
OLLAMA_HOST=http://localhost:11434

# Notifications
EMAIL_SERVICE_KEY=your_email_service_key
SMS_SERVICE_KEY=your_sms_service_key
```

## 📈 API Endpoints

### Forecasting
- `GET /api/forecast/sales` - Sales forecasts by menu item
- `GET /api/forecast/inventory` - Inventory depletion predictions
- `POST /api/forecast/update` - Trigger forecast updates

### Auto-Restocking
- `GET /api/restocking/status` - Current restocking status
- `POST /api/restocking/orders` - Generate purchase orders
- `PUT /api/restocking/approve` - Approve pending orders
- `GET /api/restocking/history` - Restocking decision logs

### Exception Reporting
- `GET /api/exceptions` - List detected anomalies
- `GET /api/exceptions/summary` - Weekly anomaly summary
- `POST /api/exceptions/acknowledge` - Acknowledge alerts
- `GET /api/exceptions/analytics` - Anomaly analytics

## 🧪 Testing

```bash
# Frontend tests
pnpm run test

# Backend tests
pnpm run test:api

# ML model tests
pnpm run test:ml

# Integration tests
pnpm run test:e2e
```

## 🐳 Docker Deployment

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📊 Monitoring

- **Application Metrics** - Prometheus + Grafana
- **Error Tracking** - Sentry integration
- **Performance Monitoring** - New Relic or DataDog
- **Log Aggregation** - ELK Stack

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

---

**Built with ❤️ for restaurant owners and managers**
