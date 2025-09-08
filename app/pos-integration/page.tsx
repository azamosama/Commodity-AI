"use client"
import { useSearchParams } from 'next/navigation';
import POSIntegrationDashboard from '@/components/POSIntegrationDashboard';

export default function POSIntegrationPage() {
  return (
    <div className="container mx-auto py-6">
      <POSIntegrationDashboard />
    </div>
  );
}
