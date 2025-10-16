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
      id: 'sf-1',
      recipeId: 'recipe-1',
      recipeName: 'Chocolate Chip Cookies',
      date: fmt(days(1)),
      predictedQuantity: 24,
      accuracy: 0.92,
      confidenceInterval: { lower: 20, upper: 28 },
    },
    {
      id: 'sf-2',
      recipeId: 'recipe-2',
      recipeName: 'Premium Chocolate Dessert',
      date: fmt(days(2)),
      predictedQuantity: 10,
      accuracy: 0.88,
      confidenceInterval: { lower: 8, upper: 13 },
    },
    {
      id: 'sf-3',
      recipeId: 'recipe-3',
      recipeName: 'Blueberry Pancakes',
      date: fmt(days(3)),
      predictedQuantity: 18,
      accuracy: 0.9,
      confidenceInterval: { lower: 15, upper: 22 },
    },
  ];

  return NextResponse.json({ data });
}


