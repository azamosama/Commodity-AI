"""
Anomaly Detection Service for Restaurant Management
Monitors sales, inventory, waste, and operational metrics for unusual patterns
"""

import os
import sys
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import json
from dataclasses import dataclass
from enum import Enum
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from lib.types import Anomaly, WasteLog, Alert, AnomalyConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AnomalyType(Enum):
    SALES_SPIKE = "sales_spike"
    SALES_DROP = "sales_drop"
    WASTE_SPIKE = "waste_spike"
    THEFT_INDICATOR = "theft_indicator"
    OVER_PORTIONING = "over_portioning"
    INVENTORY_MISMATCH = "inventory_mismatch"

class Severity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class AnomalyResult:
    type: AnomalyType
    severity: Severity
    title: str
    description: str
    affected_items: List[str]
    metrics: Dict[str, float]
    cost_impact: Optional[float]
    suggested_actions: List[str]
    z_score: float
    confidence: float

class AnomalyDetectionService:
    def __init__(self, db_url: str, redis_url: str):
        self.db_url = db_url
        self.redis_url = redis_url
        self.redis_client = redis.from_url(redis_url)
        self.scaler = StandardScaler()
        self.isolation_forest = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        
    async def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)
    
    async def get_sales_data(self, days: int = 30) -> pd.DataFrame:
        """Fetch recent sales data for anomaly detection"""
        try:
            conn = await self.get_db_connection()
            query = """
                SELECT 
                    DATE(s.date) as date,
                    r.name as recipe_name,
                    r.id as recipe_id,
                    SUM(s.quantity) as total_quantity,
                    SUM(s.quantity * s.price) as total_revenue,
                    COUNT(*) as transaction_count,
                    AVG(s.price) as avg_price
                FROM sales s
                JOIN recipes r ON s.recipe_id = r.id
                WHERE s.date >= NOW() - INTERVAL '%s days'
                GROUP BY DATE(s.date), r.id, r.name
                ORDER BY date
            """
            
            df = pd.read_sql_query(query, conn, params=[days])
            conn.close()
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching sales data: {e}")
            return pd.DataFrame()
    
    async def get_inventory_data(self, days: int = 30) -> pd.DataFrame:
        """Fetch recent inventory data for anomaly detection"""
        try:
            conn = await self.get_db_connection()
            query = """
                SELECT 
                    DATE(created_at) as date,
                    p.name as product_name,
                    p.id as product_id,
                    current_stock,
                    quantity as change_amount,
                    CASE 
                        WHEN quantity > 0 THEN 'restock'
                        WHEN quantity < 0 THEN 'consumption'
                        ELSE 'adjustment'
                    END as change_type
                FROM inventory_history ih
                JOIN products p ON ih.product_id = p.id
                WHERE ih.created_at >= NOW() - INTERVAL '%s days'
                ORDER BY date
            """
            
            df = pd.read_sql_query(query, conn, params=[days])
            conn.close()
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching inventory data: {e}")
            return pd.DataFrame()
    
    async def get_waste_data(self, days: int = 30) -> pd.DataFrame:
        """Fetch recent waste data for anomaly detection"""
        try:
            conn = await self.get_db_connection()
            query = """
                SELECT 
                    DATE(date) as date,
                    p.name as product_name,
                    p.id as product_id,
                    SUM(quantity) as total_waste,
                    SUM(cost) as total_cost,
                    COUNT(*) as waste_incidents,
                    reason
                FROM waste_logs wl
                JOIN products p ON wl.product_id = p.id
                WHERE wl.date >= NOW() - INTERVAL '%s days'
                GROUP BY DATE(date), p.id, p.name, reason
                ORDER BY date
            """
            
            df = pd.read_sql_query(query, conn, params=[days])
            conn.close()
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching waste data: {e}")
            return pd.DataFrame()
    
    def detect_sales_anomalies(self, sales_data: pd.DataFrame) -> List[AnomalyResult]:
        """Detect anomalies in sales patterns"""
        anomalies = []
        
        try:
            if sales_data.empty:
                return anomalies
            
            # Group by recipe and analyze patterns
            for recipe_id in sales_data['recipe_id'].unique():
                recipe_data = sales_data[sales_data['recipe_id'] == recipe_id]
                recipe_name = recipe_data['recipe_name'].iloc[0]
                
                # Calculate daily statistics
                daily_stats = recipe_data.groupby('date').agg({
                    'total_quantity': ['sum', 'mean', 'std'],
                    'total_revenue': ['sum', 'mean', 'std'],
                    'transaction_count': ['sum', 'mean', 'std']
                }).reset_index()
                
                # Flatten column names
                daily_stats.columns = ['date', 'qty_sum', 'qty_mean', 'qty_std', 
                                     'rev_sum', 'rev_mean', 'rev_std',
                                     'txn_sum', 'txn_mean', 'txn_std']
                
                # Calculate z-scores for quantity
                qty_mean = daily_stats['qty_sum'].mean()
                qty_std = daily_stats['qty_sum'].std()
                
                if qty_std > 0:
                    daily_stats['qty_zscore'] = (daily_stats['qty_sum'] - qty_mean) / qty_std
                    
                    # Detect spikes and drops
                    for _, row in daily_stats.iterrows():
                        z_score = row['qty_zscore']
                        
                        if abs(z_score) > 2.0:  # Significant deviation
                            if z_score > 2.0:
                                anomaly_type = AnomalyType.SALES_SPIKE
                                severity = Severity.HIGH if z_score > 3.0 else Severity.MEDIUM
                                title = f"Sales Spike Detected for {recipe_name}"
                                description = f"Sales for {recipe_name} were {z_score:.1f} standard deviations above normal on {row['date']}"
                            else:
                                anomaly_type = AnomalyType.SALES_DROP
                                severity = Severity.HIGH if z_score < -3.0 else Severity.MEDIUM
                                title = f"Sales Drop Detected for {recipe_name}"
                                description = f"Sales for {recipe_name} were {abs(z_score):.1f} standard deviations below normal on {row['date']}"
                            
                            cost_impact = row['rev_sum'] - qty_mean * (row['rev_sum'] / row['qty_sum'])
                            
                            anomaly = AnomalyResult(
                                type=anomaly_type,
                                severity=severity,
                                title=title,
                                description=description,
                                affected_items=[recipe_id],
                                metrics={
                                    'expected': qty_mean,
                                    'actual': row['qty_sum'],
                                    'deviation': row['qty_sum'] - qty_mean,
                                    'z_score': z_score
                                },
                                cost_impact=cost_impact,
                                suggested_actions=[
                                    "Review marketing activities for the day",
                                    "Check if there were any special events",
                                    "Analyze competitor pricing",
                                    "Review staff scheduling"
                                ],
                                z_score=z_score,
                                confidence=min(0.95, abs(z_score) / 4.0)
                            )
                            anomalies.append(anomaly)
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting sales anomalies: {e}")
            return anomalies
    
    def detect_waste_anomalies(self, waste_data: pd.DataFrame) -> List[AnomalyResult]:
        """Detect anomalies in waste patterns"""
        anomalies = []
        
        try:
            if waste_data.empty:
                return anomalies
            
            # Group by product and analyze patterns
            for product_id in waste_data['product_id'].unique():
                product_data = waste_data[waste_data['product_id'] == product_id]
                product_name = product_data['product_name'].iloc[0]
                
                # Calculate daily waste statistics
                daily_waste = product_data.groupby('date').agg({
                    'total_waste': 'sum',
                    'total_cost': 'sum',
                    'waste_incidents': 'sum'
                }).reset_index()
                
                # Calculate z-scores for waste quantity
                waste_mean = daily_waste['total_waste'].mean()
                waste_std = daily_waste['total_waste'].std()
                
                if waste_std > 0:
                    daily_waste['waste_zscore'] = (daily_waste['total_waste'] - waste_mean) / waste_std
                    
                    # Detect waste spikes
                    for _, row in daily_waste.iterrows():
                        z_score = row['waste_zscore']
                        
                        if z_score > 2.0:  # Significant waste spike
                            severity = Severity.HIGH if z_score > 3.0 else Severity.MEDIUM
                            
                            anomaly = AnomalyResult(
                                type=AnomalyType.WASTE_SPIKE,
                                severity=severity,
                                title=f"Waste Spike Detected for {product_name}",
                                description=f"Waste for {product_name} was {z_score:.1f} standard deviations above normal on {row['date']}",
                                affected_items=[product_id],
                                metrics={
                                    'expected': waste_mean,
                                    'actual': row['total_waste'],
                                    'deviation': row['total_waste'] - waste_mean,
                                    'z_score': z_score
                                },
                                cost_impact=row['total_cost'],
                                suggested_actions=[
                                    "Review portioning procedures",
                                    "Check storage conditions",
                                    "Review expiration dates",
                                    "Train staff on waste reduction"
                                ],
                                z_score=z_score,
                                confidence=min(0.95, z_score / 4.0)
                            )
                            anomalies.append(anomaly)
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting waste anomalies: {e}")
            return anomalies
    
    async def detect_theft_indicators(self, inventory_data: pd.DataFrame, sales_data: pd.DataFrame) -> List[AnomalyResult]:
        """Detect potential theft indicators"""
        anomalies = []
        
        try:
            if inventory_data.empty or sales_data.empty:
                return anomalies
            
            # Analyze inventory consumption vs sales
            for product_id in inventory_data['product_id'].unique():
                product_data = inventory_data[inventory_data['product_id'] == product_id]
                product_name = product_data['product_name'].iloc[0]
                
                # Calculate daily consumption
                daily_consumption = product_data[product_data['change_type'] == 'consumption'].groupby('date').agg({
                    'change_amount': 'sum'
                }).reset_index()
                
                # Get recipe usage for this product
                recipe_usage = await self.get_recipe_usage_for_product(product_id)
                
                if not recipe_usage.empty:
                    # Calculate expected consumption based on sales
                    expected_consumption = recipe_usage.groupby('date').agg({
                        'expected_usage': 'sum'
                    }).reset_index()
                    
                    # Compare actual vs expected consumption
                    comparison = pd.merge(
                        daily_consumption, expected_consumption,
                        on='date', how='inner'
                    )
                    
                    if not comparison.empty:
                        comparison['consumption_diff'] = comparison['change_amount'] - comparison['expected_usage']
                        comparison['consumption_ratio'] = comparison['change_amount'] / comparison['expected_usage']
                        
                        # Detect significant discrepancies
                        for _, row in comparison.iterrows():
                            if row['consumption_ratio'] > 1.5:  # 50% more consumption than expected
                                z_score = (row['consumption_ratio'] - 1.0) / 0.2  # Assuming 20% normal variation
                                
                                if z_score > 2.0:
                                    severity = Severity.HIGH if z_score > 3.0 else Severity.MEDIUM
                                    
                                    anomaly = AnomalyResult(
                                        type=AnomalyType.THEFT_INDICATOR,
                                        severity=severity,
                                        title=f"Potential Theft Indicator for {product_name}",
                                        description=f"Consumption of {product_name} was {row['consumption_ratio']:.1f}x higher than expected on {row['date']}",
                                        affected_items=[product_id],
                                        metrics={
                                            'expected': row['expected_usage'],
                                            'actual': abs(row['change_amount']),
                                            'deviation': row['consumption_diff'],
                                            'z_score': z_score
                                        },
                                        cost_impact=row['consumption_diff'] * 0.1,  # Estimate cost
                                        suggested_actions=[
                                            "Review inventory counts",
                                            "Check for unauthorized usage",
                                            "Review staff access controls",
                                            "Implement inventory tracking"
                                        ],
                                        z_score=z_score,
                                        confidence=min(0.90, z_score / 4.0)
                                    )
                                    anomalies.append(anomaly)
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting theft indicators: {e}")
            return anomalies
    
    async def get_recipe_usage_for_product(self, product_id: str) -> pd.DataFrame:
        """Get expected product usage based on recipe sales"""
        try:
            conn = await self.get_db_connection()
            query = """
                SELECT 
                    DATE(s.date) as date,
                    ri.quantity as ingredient_quantity,
                    s.quantity as sales_quantity,
                    (ri.quantity * s.quantity) as expected_usage
                FROM sales s
                JOIN recipe_ingredients ri ON s.recipe_id = ri.recipe_id
                WHERE ri.product_id = %s
                AND s.date >= NOW() - INTERVAL '30 days'
            """
            
            df = pd.read_sql_query(query, conn, params=[product_id])
            conn.close()
            
            return df
            
        except Exception as e:
            logger.error(f"Error getting recipe usage: {e}")
            return pd.DataFrame()
    
    def detect_over_portioning(self, inventory_data: pd.DataFrame) -> List[AnomalyResult]:
        """Detect over-portioning patterns"""
        anomalies = []
        
        try:
            if inventory_data.empty:
                return anomalies
            
            # Analyze consumption patterns by product
            for product_id in inventory_data['product_id'].unique():
                product_data = inventory_data[inventory_data['product_id'] == product_id]
                product_name = product_data['product_name'].iloc[0]
                
                # Calculate daily consumption rates
                daily_consumption = product_data[product_data['change_type'] == 'consumption'].groupby('date').agg({
                    'change_amount': 'sum'
                }).reset_index()
                
                if len(daily_consumption) >= 7:  # Need at least a week of data
                    # Calculate moving average and standard deviation
                    daily_consumption['ma_7'] = daily_consumption['change_amount'].rolling(7).mean()
                    daily_consumption['std_7'] = daily_consumption['change_amount'].rolling(7).std()
                    
                    # Detect over-portioning (consumption significantly above average)
                    for _, row in daily_consumption.iterrows():
                        if pd.notna(row['ma_7']) and row['std_7'] > 0:
                            z_score = (row['change_amount'] - row['ma_7']) / row['std_7']
                            
                            if z_score > 2.0:  # Significant over-consumption
                                severity = Severity.HIGH if z_score > 3.0 else Severity.MEDIUM
                                
                                anomaly = AnomalyResult(
                                    type=AnomalyType.OVER_PORTIONING,
                                    severity=severity,
                                    title=f"Over-Portioning Detected for {product_name}",
                                    description=f"Consumption of {product_name} was {z_score:.1f} standard deviations above 7-day average on {row['date']}",
                                    affected_items=[product_id],
                                    metrics={
                                        'expected': row['ma_7'],
                                        'actual': abs(row['change_amount']),
                                        'deviation': abs(row['change_amount']) - row['ma_7'],
                                        'z_score': z_score
                                    },
                                    cost_impact=(abs(row['change_amount']) - row['ma_7']) * 0.1,  # Estimate cost
                                    suggested_actions=[
                                        "Review portioning guidelines",
                                        "Train staff on proper measurements",
                                        "Check recipe cards for accuracy",
                                        "Implement portioning tools"
                                    ],
                                    z_score=z_score,
                                    confidence=min(0.90, z_score / 4.0)
                                )
                                anomalies.append(anomaly)
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting over-portioning: {e}")
            return anomalies
    
    async def save_anomalies(self, anomalies: List[AnomalyResult]) -> List[str]:
        """Save detected anomalies to database"""
        saved_ids = []
        
        try:
            conn = await self.get_db_connection()
            
            for anomaly in anomalies:
                anomaly_id = f"anomaly_{anomaly.type.value}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(saved_ids)}"
                
                query = """
                    INSERT INTO anomalies 
                    (id, type, severity, status, title, description, affected_items,
                     expected_value, actual_value, deviation, z_score, cost_impact,
                     suggested_actions, detected_at, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                values = (
                    anomaly_id,
                    anomaly.type.value,
                    anomaly.severity.value,
                    'detected',
                    anomaly.title,
                    anomaly.description,
                    json.dumps(anomaly.affected_items),
                    anomaly.metrics['expected'],
                    anomaly.metrics['actual'],
                    anomaly.metrics['deviation'],
                    anomaly.metrics['z_score'],
                    anomaly.cost_impact,
                    json.dumps(anomaly.suggested_actions),
                    datetime.now().isoformat(),
                    datetime.now().isoformat(),
                    datetime.now().isoformat()
                )
                
                with conn.cursor() as cursor:
                    cursor.execute(query, values)
                
                saved_ids.append(anomaly_id)
            
            conn.commit()
            conn.close()
            
            logger.info(f"Saved {len(anomalies)} anomalies to database")
            return saved_ids
            
        except Exception as e:
            logger.error(f"Error saving anomalies: {e}")
            return saved_ids
    
    async def send_alerts(self, anomalies: List[AnomalyResult]) -> bool:
        """Send alerts for detected anomalies"""
        try:
            # Get alert configuration
            alert_config = await self.get_alert_config()
            
            for anomaly in anomalies:
                if anomaly.severity in [Severity.HIGH, Severity.CRITICAL]:
                    # Send email alert
                    if 'email' in alert_config.get('channels', []):
                        await self.send_email_alert(anomaly, alert_config)
                    
                    # Send SMS alert
                    if 'sms' in alert_config.get('channels', []):
                        await self.send_sms_alert(anomaly, alert_config)
                    
                    # Send in-app notification
                    await self.send_in_app_alert(anomaly)
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending alerts: {e}")
            return False
    
    async def get_alert_config(self) -> Dict[str, Any]:
        """Get alert configuration"""
        try:
            conn = await self.get_db_connection()
            query = "SELECT * FROM anomaly_config WHERE enabled = true"
            
            with conn.cursor() as cursor:
                cursor.execute(query)
                config = cursor.fetchone()
            
            conn.close()
            
            if config:
                return dict(config)
            else:
                return {
                    'channels': ['email'],
                    'recipients': ['admin@restaurant.com'],
                    'thresholds': {
                        'zScoreThreshold': 2.0,
                        'percentageThreshold': 50.0,
                        'minimumDeviation': 10.0
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting alert config: {e}")
            return {
                'channels': ['email'],
                'recipients': ['admin@restaurant.com'],
                'thresholds': {
                    'zScoreThreshold': 2.0,
                    'percentageThreshold': 50.0,
                    'minimumDeviation': 10.0
                }
            }
    
    async def send_email_alert(self, anomaly: AnomalyResult, config: Dict[str, Any]) -> bool:
        """Send email alert for anomaly"""
        try:
            # Email configuration would be set up here
            # For now, just log the alert
            logger.info(f"Email alert sent for {anomaly.title}: {anomaly.description}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email alert: {e}")
            return False
    
    async def send_sms_alert(self, anomaly: AnomalyResult, config: Dict[str, Any]) -> bool:
        """Send SMS alert for anomaly"""
        try:
            # SMS configuration would be set up here
            # For now, just log the alert
            logger.info(f"SMS alert sent for {anomaly.title}: {anomaly.description}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending SMS alert: {e}")
            return False
    
    async def send_in_app_alert(self, anomaly: AnomalyResult) -> bool:
        """Send in-app notification for anomaly"""
        try:
            # Store alert in Redis for real-time notifications
            alert_data = {
                'id': f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                'type': 'anomaly',
                'title': anomaly.title,
                'message': anomaly.description,
                'severity': anomaly.severity.value,
                'timestamp': datetime.now().isoformat(),
                'anomaly_id': anomaly.type.value
            }
            
            self.redis_client.lpush('alerts', json.dumps(alert_data))
            self.redis_client.expire('alerts', 86400)  # Keep for 24 hours
            
            logger.info(f"In-app alert sent for {anomaly.title}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending in-app alert: {e}")
            return False
    
    async def run_anomaly_detection(self):
        """Run comprehensive anomaly detection"""
        try:
            logger.info("Starting anomaly detection job")
            
            all_anomalies = []
            
            # Get data for analysis
            sales_data = await self.get_sales_data(days=30)
            inventory_data = await self.get_inventory_data(days=30)
            waste_data = await self.get_waste_data(days=30)
            
            # Detect different types of anomalies
            sales_anomalies = self.detect_sales_anomalies(sales_data)
            waste_anomalies = self.detect_waste_anomalies(waste_data)
            theft_indicators = await self.detect_theft_indicators(inventory_data, sales_data)
            over_portioning = self.detect_over_portioning(inventory_data)
            
            # Combine all anomalies
            all_anomalies.extend(sales_anomalies)
            all_anomalies.extend(waste_anomalies)
            all_anomalies.extend(theft_indicators)
            all_anomalies.extend(over_portioning)
            
            # Save anomalies to database
            if all_anomalies:
                saved_ids = await self.save_anomalies(all_anomalies)
                
                # Send alerts for high-severity anomalies
                await self.send_alerts(all_anomalies)
            
            logger.info(f"Completed anomaly detection. Found {len(all_anomalies)} anomalies")
            
        except Exception as e:
            logger.error(f"Error in anomaly detection job: {e}")

# Example usage
if __name__ == "__main__":
    # Initialize service
    db_url = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/commodity_ai")
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    service = AnomalyDetectionService(db_url, redis_url)
    
    # Run anomaly detection
    asyncio.run(service.run_anomaly_detection())
