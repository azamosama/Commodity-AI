"use client";

import { PredictiveAnalyticsDashboard } from '@/components/PredictiveAnalyticsDashboard';
import { useSearchParams } from 'next/navigation';

export default function PredictiveAnalyticsPage() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams?.get('restaurant') || 'default';

  return (
    <div className="container mx-auto p-6">
      <PredictiveAnalyticsDashboard restaurantId={restaurantId} />
    </div>
  );
}
