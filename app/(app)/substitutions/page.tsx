"use client";

import { SubstitutionRecommendations } from '@/components/SubstitutionRecommendations';

export default function SubstitutionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-3 sm:py-4 md:py-6 px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Substitution Engine</h1>
          <SubstitutionRecommendations />
        </div>
      </div>
    </div>
  );
}
