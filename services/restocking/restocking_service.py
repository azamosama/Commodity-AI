"""
Auto-Restocking Service for Restaurant Management
Uses forecasting data to automatically generate purchase orders and manage inventory
"""

import os
import sys
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import json
from dataclasses import dataclass
from enum import Enum

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from lib.types import PurchaseOrder, PurchaseOrderItem, RestockingDecision, Supplier, RestockingConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RestockingTrigger(Enum):
    FORECAST = "forecast"
    LOW_STOCK = "low_stock"
    SAFETY_STOCK = "safety_stock"
    MANUAL = "manual"

class OrderStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    ORDERED = "ordered"
    RECEIVED = "received"
    CANCELLED = "cancelled"

@dataclass
class RestockingDecision:
    product_id: str
    product_name: str
    decision: str
    trigger_reason: RestockingTrigger
    current_stock: float
    forecasted_demand: float
    suggested_order_quantity: float
    safety_stock_level: float
    lead_time: int
    confidence: float
    reasoning: str
    cost_estimate: float

class AutoRestockingService:
    def __init__(self, db_url: str, redis_url: str):
        self.db_url = db_url
        self.redis_url = redis_url
        self.redis_client = redis.from_url(redis_url)
        
    async def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)
    
    async def get_inventory_forecasts(self, days: int = 14) -> pd.DataFrame:
        """Get inventory forecasts for restocking decisions"""
        try:
            conn = await self.get_db_connection()
            query = """
                SELECT 
                    product_id, product_name, date, predicted_stock,
                    depletion_date, reorder_date, suggested_order_quantity,
                    confidence_level
                FROM inventory_forecasts
                WHERE date >= NOW()
                AND date <= NOW() + INTERVAL '%s days'
                ORDER BY product_id, date
            """
            
            df = pd.read_sql_query(query, conn, params=[days])
            conn.close()
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching inventory forecasts: {e}")
            return pd.DataFrame()
    
    async def get_product_configs(self) -> Dict[str, RestockingConfig]:
        """Get restocking configurations for all products"""
        try:
            conn = await self.get_db_connection()
            query = """
                SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    p.current_stock,
                    p.safety_stock,
                    p.reorder_point,
                    p.lead_time,
                    p.auto_restock_enabled,
                    p.cost as unit_cost,
                    s.id as supplier_id,
                    s.name as supplier_name,
                    s.lead_time as supplier_lead_time,
                    s.minimum_order,
                    s.payment_terms
                FROM products p
                LEFT JOIN suppliers s ON p.supplier_id = s.id
                WHERE p.is_active = true
            """
            
            with conn.cursor() as cursor:
                cursor.execute(query)
                results = cursor.fetchall()
            
            conn.close()
            
            configs = {}
            for result in results:
                configs[result['product_id']] = RestockingConfig(
                    productId=result['product_id'],
                    autoRestockEnabled=result['auto_restock_enabled'] or False,
                    safetyStockLevel=result['safety_stock'] or 0,
                    reorderPoint=result['reorder_point'] or 0,
                    leadTime=result['lead_time'] or 7,
                    minimumOrderQuantity=result['minimum_order'] or 1,
                    supplierId=result['supplier_id'],
                    costThreshold=None,
                    updatedAt=datetime.now().isoformat()
                )
            
            return configs
            
        except Exception as e:
            logger.error(f"Error getting product configs: {e}")
            return {}
    
    async def get_current_inventory(self) -> Dict[str, float]:
        """Get current inventory levels for all products"""
        try:
            conn = await self.get_db_connection()
            query = """
                SELECT id, name, current_stock, quantity
                FROM products
                WHERE is_active = true
            """
            
            with conn.cursor() as cursor:
                cursor.execute(query)
                results = cursor.fetchall()
            
            conn.close()
            
            inventory = {}
            for result in results:
                inventory[result['id']] = result['current_stock'] or 0
            
            return inventory
            
        except Exception as e:
            logger.error(f"Error getting current inventory: {e}")
            return {}
    
    def calculate_restocking_decisions(self, forecasts: pd.DataFrame, 
                                     configs: Dict[str, RestockingConfig],
                                     current_inventory: Dict[str, float]) -> List[RestockingDecision]:
        """Calculate restocking decisions based on forecasts and current inventory"""
        decisions = []
        
        try:
            for product_id in forecasts['product_id'].unique():
                product_forecasts = forecasts[forecasts['product_id'] == product_id]
                product_name = product_forecasts['product_name'].iloc[0]
                current_stock = current_inventory.get(product_id, 0)
                config = configs.get(product_id)
                
                if not config or not config.autoRestockEnabled:
                    continue
                
                # Get the most recent forecast
                latest_forecast = product_forecasts.iloc[-1]
                predicted_stock = latest_forecast['predicted_stock']
                depletion_date = latest_forecast['depletion_date']
                reorder_date = latest_forecast['reorder_date']
                
                # Determine if restocking is needed
                decision = "hold"
                trigger_reason = None
                suggested_quantity = 0
                reasoning = ""
                
                # Check if stock will deplete below safety stock
                if predicted_stock <= config.safetyStockLevel:
                    decision = "order"
                    trigger_reason = RestockingTrigger.SAFETY_STOCK
                    suggested_quantity = self.calculate_order_quantity(
                        current_stock, config.safetyStockLevel, 
                        config.reorderPoint, config.leadTime
                    )
                    reasoning = f"Stock predicted to fall below safety level ({config.safetyStockLevel})"
                
                # Check if current stock is below reorder point
                elif current_stock <= config.reorderPoint:
                    decision = "order"
                    trigger_reason = RestockingTrigger.LOW_STOCK
                    suggested_quantity = self.calculate_order_quantity(
                        current_stock, config.safetyStockLevel,
                        config.reorderPoint, config.leadTime
                    )
                    reasoning = f"Current stock ({current_stock}) below reorder point ({config.reorderPoint})"
                
                # Check if forecast suggests depletion within lead time
                elif depletion_date and datetime.strptime(depletion_date, '%Y-%m-%d') <= datetime.now() + timedelta(days=config.leadTime):
                    decision = "order"
                    trigger_reason = RestockingTrigger.FORECAST
                    suggested_quantity = self.calculate_order_quantity(
                        current_stock, config.safetyStockLevel,
                        config.reorderPoint, config.leadTime
                    )
                    reasoning = f"Forecast predicts depletion on {depletion_date} within lead time ({config.leadTime} days)"
                
                # Ensure minimum order quantity
                if suggested_quantity > 0 and suggested_quantity < config.minimumOrderQuantity:
                    suggested_quantity = config.minimumOrderQuantity
                    reasoning += f" (adjusted to minimum order quantity: {config.minimumOrderQuantity})"
                
                # Calculate cost estimate
                cost_estimate = suggested_quantity * 0.1  # Placeholder - would get from supplier
                
                if decision == "order":
                    restocking_decision = RestockingDecision(
                        product_id=product_id,
                        product_name=product_name,
                        decision=decision,
                        trigger_reason=trigger_reason,
                        current_stock=current_stock,
                        forecasted_demand=current_stock - predicted_stock,
                        suggested_order_quantity=suggested_quantity,
                        safety_stock_level=config.safetyStockLevel,
                        lead_time=config.leadTime,
                        confidence=latest_forecast['confidence_level'],
                        reasoning=reasoning,
                        cost_estimate=cost_estimate
                    )
                    decisions.append(restocking_decision)
            
            return decisions
            
        except Exception as e:
            logger.error(f"Error calculating restocking decisions: {e}")
            return decisions
    
    def calculate_order_quantity(self, current_stock: float, safety_stock: float,
                               reorder_point: float, lead_time: int) -> float:
        """Calculate suggested order quantity using EOQ principles"""
        try:
            # Basic EOQ calculation
            if current_stock <= reorder_point:
                # Order enough to reach safety stock + lead time buffer
                order_quantity = safety_stock + (lead_time * 0.1) - current_stock
                return max(0, order_quantity)
            else:
                return 0
                
        except Exception as e:
            logger.error(f"Error calculating order quantity: {e}")
            return 0
    
    async def generate_purchase_orders(self, decisions: List[RestockingDecision]) -> List[PurchaseOrder]:
        """Generate purchase orders from restocking decisions"""
        purchase_orders = []
        
        try:
            # Group decisions by supplier
            supplier_orders = {}
            
            for decision in decisions:
                config = await self.get_product_config(product_id=decision.product_id)
                supplier_id = config.get('supplierId')
                
                if not supplier_id:
                    logger.warning(f"No supplier configured for product {decision.product_name}")
                    continue
                
                if supplier_id not in supplier_orders:
                    supplier_orders[supplier_id] = {
                        'items': [],
                        'total_cost': 0,
                        'supplier_name': config.get('supplierName', 'Unknown Supplier')
                    }
                
                # Add item to supplier order
                item_cost = decision.cost_estimate
                supplier_orders[supplier_id]['items'].append({
                    'product_id': decision.product_id,
                    'product_name': decision.product_name,
                    'quantity': decision.suggested_order_quantity,
                    'unit_cost': item_cost / decision.suggested_order_quantity if decision.suggested_order_quantity > 0 else 0,
                    'total_cost': item_cost
                })
                supplier_orders[supplier_id]['total_cost'] += item_cost
            
            # Create purchase orders for each supplier
            for supplier_id, order_data in supplier_orders.items():
                if order_data['items']:
                    purchase_order = PurchaseOrder(
                        id=f"po_{supplier_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                        supplierId=supplier_id,
                        supplierName=order_data['supplier_name'],
                        status='pending',
                        items=[
                            PurchaseOrderItem(
                                id=f"poi_{item['product_id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                                productId=item['product_id'],
                                productName=item['product_name'],
                                quantity=item['quantity'],
                                unitCost=item['unit_cost'],
                                totalCost=item['total_cost']
                            ) for item in order_data['items']
                        ],
                        totalCost=order_data['total_cost'],
                        orderDate=datetime.now().isoformat(),
                        expectedDeliveryDate=(datetime.now() + timedelta(days=7)).isoformat(),
                        autoGenerated=True,
                        triggerReason='forecast',
                        createdAt=datetime.now().isoformat(),
                        updatedAt=datetime.now().isoformat()
                    )
                    purchase_orders.append(purchase_order)
            
            return purchase_orders
            
        except Exception as e:
            logger.error(f"Error generating purchase orders: {e}")
            return purchase_orders
    
    async def get_product_config(self, product_id: str) -> Dict[str, Any]:
        """Get configuration for a specific product"""
        try:
            conn = await self.get_db_connection()
            query = """
                SELECT 
                    p.id, p.name, p.supplier_id, p.auto_restock_enabled,
                    s.name as supplier_name, s.lead_time as supplier_lead_time
                FROM products p
                LEFT JOIN suppliers s ON p.supplier_id = s.id
                WHERE p.id = %s
            """
            
            with conn.cursor() as cursor:
                cursor.execute(query, [product_id])
                result = cursor.fetchone()
            
            conn.close()
            
            if result:
                return {
                    'supplierId': result['supplier_id'],
                    'supplierName': result['supplier_name'],
                    'autoRestockEnabled': result['auto_restock_enabled'],
                    'supplierLeadTime': result['supplier_lead_time']
                }
            else:
                return {}
                
        except Exception as e:
            logger.error(f"Error getting product config: {e}")
            return {}
    
    async def save_restocking_decisions(self, decisions: List[RestockingDecision]) -> List[str]:
        """Save restocking decisions to database"""
        saved_ids = []
        
        try:
            conn = await self.get_db_connection()
            
            for decision in decisions:
                decision_id = f"rd_{decision.product_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(saved_ids)}"
                
                query = """
                    INSERT INTO restocking_decisions 
                    (id, product_id, product_name, decision, trigger_reason,
                     current_stock, forecasted_demand, suggested_order_quantity,
                     safety_stock_level, lead_time, confidence, reasoning, cost_estimate,
                     created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                values = (
                    decision_id,
                    decision.product_id,
                    decision.product_name,
                    decision.decision,
                    decision.trigger_reason.value,
                    decision.current_stock,
                    decision.forecasted_demand,
                    decision.suggested_order_quantity,
                    decision.safety_stock_level,
                    decision.lead_time,
                    decision.confidence,
                    decision.reasoning,
                    decision.cost_estimate,
                    datetime.now().isoformat(),
                    datetime.now().isoformat()
                )
                
                with conn.cursor() as cursor:
                    cursor.execute(query, values)
                
                saved_ids.append(decision_id)
            
            conn.commit()
            conn.close()
            
            logger.info(f"Saved {len(decisions)} restocking decisions to database")
            return saved_ids
            
        except Exception as e:
            logger.error(f"Error saving restocking decisions: {e}")
            return saved_ids
    
    async def save_purchase_orders(self, purchase_orders: List[PurchaseOrder]) -> List[str]:
        """Save purchase orders to database"""
        saved_ids = []
        
        try:
            conn = await self.get_db_connection()
            
            for po in purchase_orders:
                # Save purchase order
                po_query = """
                    INSERT INTO purchase_orders 
                    (id, supplier_id, supplier_name, status, total_cost,
                     order_date, expected_delivery_date, auto_generated,
                     trigger_reason, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                po_values = (
                    po.id,
                    po.supplierId,
                    po.supplierName,
                    po.status,
                    po.totalCost,
                    po.orderDate,
                    po.expectedDeliveryDate,
                    po.autoGenerated,
                    po.triggerReason,
                    po.createdAt,
                    po.updatedAt
                )
                
                with conn.cursor() as cursor:
                    cursor.execute(po_query, po_values)
                
                # Save purchase order items
                for item in po.items:
                    item_query = """
                        INSERT INTO purchase_order_items 
                        (id, purchase_order_id, product_id, product_name,
                         quantity, unit_cost, total_cost, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    
                    item_values = (
                        item.id,
                        po.id,
                        item.productId,
                        item.productName,
                        item.quantity,
                        item.unitCost,
                        item.totalCost,
                        datetime.now().isoformat()
                    )
                    
                    with conn.cursor() as cursor:
                        cursor.execute(item_query, item_values)
                
                saved_ids.append(po.id)
            
            conn.commit()
            conn.close()
            
            logger.info(f"Saved {len(purchase_orders)} purchase orders to database")
            return saved_ids
            
        except Exception as e:
            logger.error(f"Error saving purchase orders: {e}")
            return saved_ids
    
    async def send_to_supplier_api(self, purchase_order: PurchaseOrder) -> bool:
        """Send purchase order to supplier API"""
        try:
            # This would integrate with actual supplier APIs
            # For now, just log the order
            logger.info(f"Purchase order {purchase_order.id} sent to supplier {purchase_order.supplierName}")
            logger.info(f"Order details: {len(purchase_order.items)} items, total cost: ${purchase_order.totalCost}")
            
            # Simulate API call
            await asyncio.sleep(1)
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending to supplier API: {e}")
            return False
    
    async def run_auto_restocking(self):
        """Run the complete auto-restocking process"""
        try:
            logger.info("Starting auto-restocking process")
            
            # Get data for restocking decisions
            forecasts = await self.get_inventory_forecasts(days=14)
            configs = await self.get_product_configs()
            current_inventory = await self.get_current_inventory()
            
            if forecasts.empty:
                logger.warning("No inventory forecasts available for restocking decisions")
                return
            
            # Calculate restocking decisions
            decisions = self.calculate_restocking_decisions(forecasts, configs, current_inventory)
            
            if not decisions:
                logger.info("No restocking decisions needed")
                return
            
            # Save restocking decisions
            await self.save_restocking_decisions(decisions)
            
            # Generate purchase orders
            purchase_orders = await self.generate_purchase_orders(decisions)
            
            if purchase_orders:
                # Save purchase orders
                await self.save_purchase_orders(purchase_orders)
                
                # Send to supplier APIs (for auto-approved orders)
                for po in purchase_orders:
                    if po.autoGenerated:
                        await self.send_to_supplier_api(po)
            
            logger.info(f"Completed auto-restocking. Generated {len(purchase_orders)} purchase orders")
            
        except Exception as e:
            logger.error(f"Error in auto-restocking process: {e}")
    
    async def approve_purchase_order(self, order_id: str, approved_by: str) -> bool:
        """Approve a pending purchase order"""
        try:
            conn = await self.get_db_connection()
            
            # Update order status
            query = """
                UPDATE purchase_orders 
                SET status = 'approved', approved_by = %s, approved_at = %s, updated_at = %s
                WHERE id = %s AND status = 'pending'
            """
            
            with conn.cursor() as cursor:
                cursor.execute(query, [
                    approved_by,
                    datetime.now().isoformat(),
                    datetime.now().isoformat(),
                    order_id
                ])
                
                if cursor.rowcount == 0:
                    logger.warning(f"Purchase order {order_id} not found or not pending")
                    return False
            
            conn.commit()
            conn.close()
            
            # Send to supplier API
            purchase_order = await self.get_purchase_order(order_id)
            if purchase_order:
                await self.send_to_supplier_api(purchase_order)
            
            logger.info(f"Purchase order {order_id} approved by {approved_by}")
            return True
            
        except Exception as e:
            logger.error(f"Error approving purchase order: {e}")
            return False
    
    async def get_purchase_order(self, order_id: str) -> Optional[PurchaseOrder]:
        """Get a purchase order by ID"""
        try:
            conn = await self.get_db_connection()
            
            # Get purchase order
            po_query = "SELECT * FROM purchase_orders WHERE id = %s"
            with conn.cursor() as cursor:
                cursor.execute(po_query, [order_id])
                po_result = cursor.fetchone()
            
            if not po_result:
                return None
            
            # Get purchase order items
            items_query = "SELECT * FROM purchase_order_items WHERE purchase_order_id = %s"
            with conn.cursor() as cursor:
                cursor.execute(items_query, [order_id])
                items_results = cursor.fetchall()
            
            conn.close()
            
            # Convert to PurchaseOrder object
            items = [
                PurchaseOrderItem(
                    id=item['id'],
                    productId=item['product_id'],
                    productName=item['product_name'],
                    quantity=item['quantity'],
                    unitCost=item['unit_cost'],
                    totalCost=item['total_cost']
                ) for item in items_results
            ]
            
            purchase_order = PurchaseOrder(
                id=po_result['id'],
                supplierId=po_result['supplier_id'],
                supplierName=po_result['supplier_name'],
                status=po_result['status'],
                items=items,
                totalCost=po_result['total_cost'],
                orderDate=po_result['order_date'],
                expectedDeliveryDate=po_result['expected_delivery_date'],
                autoGenerated=po_result['auto_generated'],
                triggerReason=po_result['trigger_reason'],
                approvedBy=po_result.get('approved_by'),
                approvedAt=po_result.get('approved_at'),
                createdAt=po_result['created_at'],
                updatedAt=po_result['updated_at']
            )
            
            return purchase_order
            
        except Exception as e:
            logger.error(f"Error getting purchase order: {e}")
            return None

# Example usage
if __name__ == "__main__":
    # Initialize service
    db_url = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/commodity_ai")
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    service = AutoRestockingService(db_url, redis_url)
    
    # Run auto-restocking
    asyncio.run(service.run_auto_restocking())
