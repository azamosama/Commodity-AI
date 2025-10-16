import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const data = {
    usdaInsights: {
      marketTrends: {
        overallSupplyTrend: 'stable',
        overallDemandTrend: 'increasing',
        supplyTrendPercentage: 0,
        demandTrendPercentage: 12,
        averageVolatility: 7.5,
        averagePriceChange: '-1.2',
        trendAnalysis: { trendStrength: 'moderate' },
        seasonalCommodities: ['Strawberries', 'Blueberries', 'Avocados'],
        highVolatilityCommodities: ['Cocoa', 'Butter'],
      },
      recommendations: [
        'Advance-buy cocoa before holiday spike',
        'Negotiate milk price with local dairy due to stable supply',
      ],
    },
  };

  return NextResponse.json({ data });
}


