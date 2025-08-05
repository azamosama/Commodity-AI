"use client"

import { useEffect, useState } from 'react';

export function RestaurantIndicator() {
  const [restaurantId, setRestaurantId] = useState<string>('default');
  const [restaurantName, setRestaurantName] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('restaurant') || 'default';
    setRestaurantId(id);
    
    // Convert restaurant ID to a more readable name
    if (id === 'restaurant-a') {
      setRestaurantName('Restaurant A');
    } else if (id === 'restaurant-b') {
      setRestaurantName('Restaurant B');
    } else if (id.startsWith('restaurant-')) {
      // For custom restaurant IDs, show a generic name
      setRestaurantName('Custom Restaurant');
    } else {
      setRestaurantName(id);
    }
  }, []);

  if (restaurantId === 'default') {
    return null; // Don't show indicator for default restaurant
  }

  return (
    <div className="bg-blue-100 border border-blue-300 text-blue-800 px-3 py-2 rounded-md mb-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">Restaurant: {restaurantName}</span>
        <span className="text-sm text-blue-600">
          Data is isolated to this restaurant
        </span>
      </div>
    </div>
  );
} 