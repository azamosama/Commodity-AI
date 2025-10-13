"use client";

import { PredictiveAnalyticsDashboard } from '@/components/PredictiveAnalyticsDashboard';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PredictiveAnalyticsContent() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams?.get('restaurant') || 'default';

  return (
    <div className="container mx-auto p-6">
      <PredictiveAnalyticsDashboard restaurantId={restaurantId} />
    </div>
  );
}

export default function PredictiveAnalyticsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Loading...</div>}>
      <PredictiveAnalyticsContent />
    </Suspense>
  );
}
