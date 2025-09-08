"""
Predictive Analytics Service for Restaurant Management
Handles sales forecasting, inventory forecasting, and demand prediction
"""

import os
import sys
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import json
from dataclasses import dataclass
from enum import Enum

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from lib.types import SalesForecast, InventoryForecast, Recipe, Product, Sale

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelType(Enum):
    PROPHET = "prophet"
    ARIMA = "arima"
    REGRESSION = "regression"
    LSTM = "lstm"

@dataclass
class ForecastResult:
    date: str
    predicted_value: float
    confidence_lower: float
    confidence_upper: float
    model_type: ModelType
    accuracy: float

class ForecastingService:
    def __init__(self, db_url: str, redis_url: str):
        self.db_url = db_url
        self.redis_url = redis_url
        self.redis_client = redis.from_url(redis_url)
        self.models = {}
        self.scaler = StandardScaler()
        
    async def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)
    
    async def get_sales_data(self, recipe_id: str, days: int = 365) -> pd.DataFrame:
        """Fetch historical sales data for a recipe"""
        try:
            conn = await self.get_db_connection()
            query = """
                SELECT 
                    DATE(s.date) as ds,
                    SUM(s.quantity) as y,
                    COUNT(*) as transactions
                FROM sales s
                WHERE s.recipe_id = %s
                AND s.date >= NOW() - INTERVAL '%s days'
                GROUP BY DATE(s.date)
                ORDER BY ds
            """
            
            df = pd.read_sql_query(query, conn, params=[recipe_id, days])
            conn.close()
            
            if df.empty:
                logger.warning(f"No sales data found for recipe {recipe_id}")
                return pd.DataFrame(columns=['ds', 'y', 'transactions'])
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching sales data: {e}")
            return pd.DataFrame(columns=['ds', 'y', 'transactions'])
    
    async def get_inventory_data(self, product_id: str, days: int = 365) -> pd.DataFrame:
        """Fetch historical inventory data for a product"""
        try:
            conn = await self.get_db_connection()
            query = """
                SELECT 
                    DATE(created_at) as ds,
                    current_stock as y,
                    quantity as change_amount
                FROM inventory_history
                WHERE product_id = %s
                AND created_at >= NOW() - INTERVAL '%s days'
                ORDER BY ds
            """
            
            df = pd.read_sql_query(query, conn, params=[product_id, days])
            conn.close()
            
            if df.empty:
                logger.warning(f"No inventory data found for product {product_id}")
                return pd.DataFrame(columns=['ds', 'y', 'change_amount'])
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching inventory data: {e}")
            return pd.DataFrame(columns=['ds', 'y', 'change_amount'])
    
    def train_prophet_model(self, data: pd.DataFrame, model_name: str) -> Prophet:
        """Train a Prophet model for time series forecasting"""
        try:
            # Prepare data for Prophet
            if data.empty or len(data) < 7:  # Need at least a week of data
                raise ValueError("Insufficient data for Prophet model")
            
            # Prophet requires 'ds' and 'y' columns
            prophet_data = data[['ds', 'y']].copy()
            prophet_data.columns = ['ds', 'y']
            
            # Initialize and configure Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_mode='multiplicative',
                changepoint_prior_scale=0.05,
                seasonality_prior_scale=10.0
            )
            
            # Add custom seasonality for restaurant patterns
            model.add_seasonality(name='monthly', period=30.5, fourier_order=5)
            model.add_seasonality(name='quarterly', period=91.25, fourier_order=8)
            
            # Fit the model
            model.fit(prophet_data)
            
            # Store the model
            self.models[model_name] = model
            
            logger.info(f"Prophet model trained successfully for {model_name}")
            return model
            
        except Exception as e:
            logger.error(f"Error training Prophet model: {e}")
            raise
    
    def forecast_with_prophet(self, model: Prophet, periods: int = 14) -> pd.DataFrame:
        """Generate forecasts using Prophet model"""
        try:
            # Create future dataframe
            future = model.make_future_dataframe(periods=periods, freq='D')
            
            # Generate forecast
            forecast = model.predict(future)
            
            # Extract forecast results
            forecast_df = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
            forecast_df.columns = ['date', 'predicted', 'lower', 'upper']
            
            return forecast_df
            
        except Exception as e:
            logger.error(f"Error generating Prophet forecast: {e}")
            raise
    
    async def forecast_sales(self, recipe_id: str, recipe_name: str, days: int = 14) -> List[SalesForecast]:
        """Forecast sales for a specific recipe"""
        try:
            # Get historical sales data
            sales_data = await self.get_sales_data(recipe_id, days=365)
            
            if sales_data.empty:
                logger.warning(f"No sales data available for recipe {recipe_id}")
                return []
            
            # Train Prophet model
            model_name = f"sales_{recipe_id}"
            model = self.train_prophet_model(sales_data, model_name)
            
            # Generate forecast
            forecast_df = self.forecast_with_prophet(model, periods=days)
            
            # Calculate model accuracy (using last 30 days as validation)
            if len(sales_data) >= 30:
                validation_data = sales_data.tail(30)
                accuracy = self.calculate_forecast_accuracy(model, validation_data)
            else:
                accuracy = 0.85  # Default accuracy for new models
            
            # Convert to SalesForecast objects
            forecasts = []
            for _, row in forecast_df.iterrows():
                forecast = SalesForecast(
                    id=f"sf_{recipe_id}_{row['date'].strftime('%Y%m%d')}",
                    recipeId=recipe_id,
                    recipeName=recipe_name,
                    date=row['date'].strftime('%Y-%m-%d'),
                    predictedQuantity=max(0, row['predicted']),  # Ensure non-negative
                    confidenceInterval={
                        'lower': max(0, row['lower']),
                        'upper': max(0, row['upper'])
                    },
                    modelType='prophet',
                    accuracy=accuracy,
                    createdAt=datetime.now().isoformat(),
                    updatedAt=datetime.now().isoformat()
                )
                forecasts.append(forecast)
            
            logger.info(f"Generated {len(forecasts)} sales forecasts for recipe {recipe_name}")
            return forecasts
            
        except Exception as e:
            logger.error(f"Error forecasting sales for recipe {recipe_id}: {e}")
            return []
    
    async def forecast_inventory(self, product_id: str, product_name: str, days: int = 14) -> List[InventoryForecast]:
        """Forecast inventory levels for a specific product"""
        try:
            # Get historical inventory data
            inventory_data = await self.get_inventory_data(product_id, days=365)
            
            if inventory_data.empty:
                logger.warning(f"No inventory data available for product {product_id}")
                return []
            
            # Train Prophet model for inventory
            model_name = f"inventory_{product_id}"
            model = self.train_prophet_model(inventory_data, model_name)
            
            # Generate forecast
            forecast_df = self.forecast_with_prophet(model, periods=days)
            
            # Calculate depletion date and reorder date
            current_stock = inventory_data['y'].iloc[-1] if not inventory_data.empty else 0
            
            # Get product configuration
            product_config = await self.get_product_config(product_id)
            safety_stock = product_config.get('safetyStock', 0)
            reorder_point = product_config.get('reorderPoint', 0)
            lead_time = product_config.get('leadTime', 7)
            
            # Calculate model accuracy
            if len(inventory_data) >= 30:
                validation_data = inventory_data.tail(30)
                accuracy = self.calculate_forecast_accuracy(model, validation_data)
            else:
                accuracy = 0.85
            
            # Convert to InventoryForecast objects
            forecasts = []
            for _, row in forecast_df.iterrows():
                predicted_stock = max(0, row['predicted'])
                
                # Calculate depletion date
                depletion_date = None
                if predicted_stock <= safety_stock:
                    # Estimate when stock will deplete
                    days_until_depletion = self.estimate_depletion_days(
                        current_stock, predicted_stock, days
                    )
                    if days_until_depletion:
                        depletion_date = (datetime.now() + timedelta(days=days_until_depletion)).strftime('%Y-%m-%d')
                
                # Calculate reorder date
                reorder_date = None
                if predicted_stock <= reorder_point:
                    reorder_date = (datetime.now() + timedelta(days=lead_time)).strftime('%Y-%m-%d')
                
                # Calculate suggested order quantity
                suggested_quantity = self.calculate_order_quantity(
                    predicted_stock, safety_stock, reorder_point, lead_time
                )
                
                forecast = InventoryForecast(
                    id=f"if_{product_id}_{row['date'].strftime('%Y%m%d')}",
                    productId=product_id,
                    productName=product_name,
                    date=row['date'].strftime('%Y-%m-%d'),
                    predictedStock=predicted_stock,
                    depletionDate=depletion_date,
                    reorderDate=reorder_date,
                    suggestedOrderQuantity=suggested_quantity,
                    confidenceLevel=accuracy,
                    modelType='prophet',
                    createdAt=datetime.now().isoformat(),
                    updatedAt=datetime.now().isoformat()
                )
                forecasts.append(forecast)
            
            logger.info(f"Generated {len(forecasts)} inventory forecasts for product {product_name}")
            return forecasts
            
        except Exception as e:
            logger.error(f"Error forecasting inventory for product {product_id}: {e}")
            return []
    
    async def get_product_config(self, product_id: str) -> Dict[str, Any]:
        """Get product configuration for forecasting"""
        try:
            conn = await self.get_db_connection()
            query = """
                SELECT 
                    safety_stock, reorder_point, lead_time, 
                    auto_restock_enabled, forecast_accuracy
                FROM products 
                WHERE id = %s
            """
            
            with conn.cursor() as cursor:
                cursor.execute(query, [product_id])
                result = cursor.fetchone()
                
            conn.close()
            
            if result:
                return {
                    'safetyStock': result['safety_stock'] or 0,
                    'reorderPoint': result['reorder_point'] or 0,
                    'leadTime': result['lead_time'] or 7,
                    'autoRestockEnabled': result['auto_restock_enabled'] or False,
                    'forecastAccuracy': result['forecast_accuracy'] or 0.85
                }
            else:
                return {
                    'safetyStock': 0,
                    'reorderPoint': 0,
                    'leadTime': 7,
                    'autoRestockEnabled': False,
                    'forecastAccuracy': 0.85
                }
                
        except Exception as e:
            logger.error(f"Error getting product config: {e}")
            return {
                'safetyStock': 0,
                'reorderPoint': 0,
                'leadTime': 7,
                'autoRestockEnabled': False,
                'forecastAccuracy': 0.85
            }
    
    def calculate_forecast_accuracy(self, model: Prophet, validation_data: pd.DataFrame) -> float:
        """Calculate forecast accuracy using validation data"""
        try:
            if validation_data.empty:
                return 0.85
            
            # Generate predictions for validation period
            future = model.make_future_dataframe(periods=len(validation_data), freq='D')
            forecast = model.predict(future)
            
            # Compare predictions with actual values
            actual = validation_data['y'].values
            predicted = forecast['yhat'].tail(len(validation_data)).values
            
            # Calculate MAPE (Mean Absolute Percentage Error)
            mape = np.mean(np.abs((actual - predicted) / actual)) * 100
            accuracy = max(0, 100 - mape) / 100  # Convert to 0-1 scale
            
            return min(1.0, max(0.0, accuracy))
            
        except Exception as e:
            logger.error(f"Error calculating forecast accuracy: {e}")
            return 0.85
    
    def estimate_depletion_days(self, current_stock: float, predicted_stock: float, forecast_days: int) -> Optional[int]:
        """Estimate days until stock depletion"""
        try:
            if current_stock <= 0 or predicted_stock >= current_stock:
                return None
            
            # Linear interpolation to estimate depletion
            daily_consumption = (current_stock - predicted_stock) / forecast_days
            if daily_consumption <= 0:
                return None
            
            days_until_depletion = current_stock / daily_consumption
            return int(days_until_depletion)
            
        except Exception as e:
            logger.error(f"Error estimating depletion days: {e}")
            return None
    
    def calculate_order_quantity(self, predicted_stock: float, safety_stock: float, 
                               reorder_point: float, lead_time: int) -> float:
        """Calculate suggested order quantity"""
        try:
            # Basic EOQ (Economic Order Quantity) calculation
            if predicted_stock <= reorder_point:
                # Order enough to reach safety stock + lead time buffer
                order_quantity = safety_stock + (lead_time * 0.1) - predicted_stock
                return max(0, order_quantity)
            else:
                return 0
                
        except Exception as e:
            logger.error(f"Error calculating order quantity: {e}")
            return 0
    
    async def save_forecasts(self, forecasts: List[SalesForecast | InventoryForecast]) -> bool:
        """Save forecasts to database"""
        try:
            conn = await self.get_db_connection()
            
            for forecast in forecasts:
                if isinstance(forecast, SalesForecast):
                    query = """
                        INSERT INTO sales_forecasts 
                        (id, recipe_id, recipe_name, date, predicted_quantity, 
                         confidence_lower, confidence_upper, model_type, accuracy, 
                         created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                        predicted_quantity = EXCLUDED.predicted_quantity,
                        confidence_lower = EXCLUDED.confidence_lower,
                        confidence_upper = EXCLUDED.confidence_upper,
                        accuracy = EXCLUDED.accuracy,
                        updated_at = EXCLUDED.updated_at
                    """
                    values = (
                        forecast.id, forecast.recipeId, forecast.recipeName,
                        forecast.date, forecast.predictedQuantity,
                        forecast.confidenceInterval['lower'],
                        forecast.confidenceInterval['upper'],
                        forecast.modelType, forecast.accuracy,
                        forecast.createdAt, forecast.updatedAt
                    )
                else:  # InventoryForecast
                    query = """
                        INSERT INTO inventory_forecasts 
                        (id, product_id, product_name, date, predicted_stock,
                         depletion_date, reorder_date, suggested_order_quantity,
                         confidence_level, model_type, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                        predicted_stock = EXCLUDED.predicted_stock,
                        depletion_date = EXCLUDED.depletion_date,
                        reorder_date = EXCLUDED.reorder_date,
                        suggested_order_quantity = EXCLUDED.suggested_order_quantity,
                        confidence_level = EXCLUDED.confidence_level,
                        updated_at = EXCLUDED.updated_at
                    """
                    values = (
                        forecast.id, forecast.productId, forecast.productName,
                        forecast.date, forecast.predictedStock,
                        forecast.depletionDate, forecast.reorderDate,
                        forecast.suggestedOrderQuantity, forecast.confidenceLevel,
                        forecast.modelType, forecast.createdAt, forecast.updatedAt
                    )
                
                with conn.cursor() as cursor:
                    cursor.execute(query, values)
            
            conn.commit()
            conn.close()
            
            logger.info(f"Saved {len(forecasts)} forecasts to database")
            return True
            
        except Exception as e:
            logger.error(f"Error saving forecasts: {e}")
            return False
    
    async def run_daily_forecasting(self):
        """Run daily forecasting for all recipes and products"""
        try:
            logger.info("Starting daily forecasting job")
            
            # Get all recipes and products
            recipes = await self.get_all_recipes()
            products = await self.get_all_products()
            
            all_forecasts = []
            
            # Forecast sales for all recipes
            for recipe in recipes:
                sales_forecasts = await self.forecast_sales(
                    recipe['id'], recipe['name'], days=14
                )
                all_forecasts.extend(sales_forecasts)
            
            # Forecast inventory for all products
            for product in products:
                inventory_forecasts = await self.forecast_inventory(
                    product['id'], product['name'], days=14
                )
                all_forecasts.extend(inventory_forecasts)
            
            # Save all forecasts
            if all_forecasts:
                await self.save_forecasts(all_forecasts)
            
            logger.info(f"Completed daily forecasting for {len(recipes)} recipes and {len(products)} products")
            
        except Exception as e:
            logger.error(f"Error in daily forecasting job: {e}")
    
    async def get_all_recipes(self) -> List[Dict[str, Any]]:
        """Get all recipes from database"""
        try:
            conn = await self.get_db_connection()
            query = "SELECT id, name FROM recipes WHERE is_active = true"
            
            with conn.cursor() as cursor:
                cursor.execute(query)
                recipes = cursor.fetchall()
            
            conn.close()
            return [dict(recipe) for recipe in recipes]
            
        except Exception as e:
            logger.error(f"Error getting recipes: {e}")
            return []
    
    async def get_all_products(self) -> List[Dict[str, Any]]:
        """Get all products from database"""
        try:
            conn = await self.get_db_connection()
            query = "SELECT id, name FROM products WHERE is_active = true"
            
            with conn.cursor() as cursor:
                cursor.execute(query)
                products = cursor.fetchall()
            
            conn.close()
            return [dict(product) for product in products]
            
        except Exception as e:
            logger.error(f"Error getting products: {e}")
            return []

# Example usage
if __name__ == "__main__":
    # Initialize service
    db_url = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/commodity_ai")
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    service = ForecastingService(db_url, redis_url)
    
    # Run daily forecasting
    asyncio.run(service.run_daily_forecasting())
