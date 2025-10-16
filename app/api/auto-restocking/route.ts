import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString();
  const addDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };

  const decisions = [
    {
      id: 'rd-1',
      productId: 'milk-1',
      productName: 'Whole Milk',
      currentStock: 6,
      reorderPoint: 10,
      averageDailyUsage: 2.4,
      daysUntilDepletion: 2,
      suggestedOrderQuantity: 12,
      urgency: 'high',
      reason: 'Projected stock-out within 2 days',
    },
    {
      id: 'rd-2',
      productId: 'blueberries-1',
      productName: 'Blueberries',
      currentStock: 14,
      reorderPoint: 12,
      averageDailyUsage: 1.1,
      daysUntilDepletion: 6,
      suggestedOrderQuantity: 8,
      urgency: 'medium',
      reason: 'Maintain safety stock for upcoming weekend',
    },
  ];

  const purchaseOrders = [
    {
      id: 'po-1',
      supplierId: 'sup-1',
      supplierName: 'Fresh Farms',
      status: 'pending',
      totalAmount: 89.5,
      expectedDelivery: fmt(addDays(3)),
      items: [
        { productId: 'milk-1', productName: 'Whole Milk', quantity: 12, unitCost: 4.99 },
        { productId: 'blueberries-1', productName: 'Blueberries', quantity: 8, unitCost: 3.99 },
      ],
    },
  ];

  return NextResponse.json({ data: { decisions, purchaseOrders } });
}


