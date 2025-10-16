import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date().toISOString();
  const data = [
    { id: 'an-1', type: 'waste', title: 'High waste detected', description: 'Blueberries waste above threshold', severity: 'medium', impact: 'inventory', detectedAt: now, status: 'active', suggestedActions: ['Adjust ordering', 'Review storage temperature'] },
    { id: 'an-2', type: 'sales_anomaly', title: 'Sales spike', description: 'Cookies selling faster than usual', severity: 'low', impact: 'sales', detectedAt: now, status: 'active', suggestedActions: ['Increase batch size', 'Check staffing'] },
  ];
  return NextResponse.json({ data });
}


