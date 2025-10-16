import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const days = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };

  const data = [
    {
      id: 'if-1',
      productId: 'chocolate-1',
      productName: 'Dark Chocolate',
      date: fmt(days(1)),
      predictedStock: 32,
      depletionDate: null,
    },
    {
      id: 'if-2',
      productId: 'milk-1',
      productName: 'Whole Milk',
      date: fmt(days(2)),
      predictedStock: 15,
      depletionDate: fmt(days(5)),
    },
    {
      id: 'if-3',
      productId: 'blueberries-1',
      productName: 'Blueberries',
      date: fmt(days(3)),
      predictedStock: 12,
      depletionDate: null,
    },
  ];

  return NextResponse.json({ data });
}


