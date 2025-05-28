"use client"

import type React from "react"
import { createContext, useContext } from "react"

interface PricePoint {
  date: string
  price: number
}

interface Commodity {
  id: string
  name: string
  category: "food" | "non-food"
  subcategory: string
  unit: string
  currentPrice: number
  priceHistory: PricePoint[]
  suppliers: string[]
  relatedMenuItems: string[]
  priceChange: number
  priceChangePercent: number
}

interface Supplier {
  id: string
  name: string
  rating: number
  deliveryTime: number
  minimumOrder: number
  location: {
    address: string
    coordinates: [number, number]
    deliveryRadius: number
  }
  commodities: {
    commodityId: string
    price: number
    inStock: boolean
  }[]
}

interface MenuItem {
  id: string
  name: string
  ingredients: string[]
  costPerServing: number
  sellingPrice: number
  profitMargin: number
}

interface Restaurant {
  id: string
  name: string
  location: {
    address: string
    coordinates: [number, number]
  }
  menuItems: MenuItem[]
  preferredSuppliers: string[]
}

interface RestaurantContextType {
  restaurant: Restaurant
  commodities: Commodity[]
  suppliers: Supplier[]
  alerts: any[]
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined)

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  // Mock data
  const mockRestaurant: Restaurant = {
    id: "1",
    name: "Bella Vista Pizzeria",
    location: {
      address: "123 Main St, Downtown, NY 10001",
      coordinates: [40.7128, -74.006],
    },
    menuItems: [
      {
        id: "1",
        name: "Margherita Pizza",
        ingredients: ["flour", "tomatoes", "mozzarella", "basil"],
        costPerServing: 4.5,
        sellingPrice: 16.99,
        profitMargin: 73.5,
      },
      {
        id: "2",
        name: "Caesar Salad",
        ingredients: ["lettuce", "parmesan", "croutons", "chicken"],
        costPerServing: 3.25,
        sellingPrice: 12.99,
        profitMargin: 75.0,
      },
    ],
    preferredSuppliers: ["supplier-1", "supplier-2"],
  }

  const mockCommodities: Commodity[] = [
    {
      id: "flour",
      name: "All-Purpose Flour",
      category: "food",
      subcategory: "Dry Goods",
      unit: "lb",
      currentPrice: 0.89,
      priceHistory: [
        { date: "2024-01-01", price: 0.95 },
        { date: "2024-01-02", price: 0.92 },
        { date: "2024-01-03", price: 0.89 },
      ],
      suppliers: ["supplier-1", "supplier-2"],
      relatedMenuItems: ["Margherita Pizza", "Pepperoni Pizza"],
      priceChange: -0.06,
      priceChangePercent: -6.3,
    },
    {
      id: "tomatoes",
      name: "Roma Tomatoes",
      category: "food",
      subcategory: "Produce",
      unit: "lb",
      currentPrice: 2.49,
      priceHistory: [
        { date: "2024-01-01", price: 2.29 },
        { date: "2024-01-02", price: 2.39 },
        { date: "2024-01-03", price: 2.49 },
      ],
      suppliers: ["supplier-1", "supplier-3"],
      relatedMenuItems: ["Margherita Pizza", "Pasta Marinara"],
      priceChange: 0.2,
      priceChangePercent: 8.7,
    },
    {
      id: "mozzarella",
      name: "Fresh Mozzarella",
      category: "food",
      subcategory: "Dairy",
      unit: "lb",
      currentPrice: 5.99,
      priceHistory: [
        { date: "2024-01-01", price: 6.29 },
        { date: "2024-01-02", price: 6.15 },
        { date: "2024-01-03", price: 5.99 },
      ],
      suppliers: ["supplier-2", "supplier-4"],
      relatedMenuItems: ["Margherita Pizza", "Caprese Salad"],
      priceChange: -0.3,
      priceChangePercent: -4.8,
    },
    {
      id: "chicken",
      name: "Chicken Breast",
      category: "food",
      subcategory: "Meat",
      unit: "lb",
      currentPrice: 4.99,
      priceHistory: [
        { date: "2024-01-01", price: 5.29 },
        { date: "2024-01-02", price: 5.15 },
        { date: "2024-01-03", price: 4.99 },
      ],
      suppliers: ["supplier-1", "supplier-3"],
      relatedMenuItems: ["Caesar Salad", "Chicken Parmesan"],
      priceChange: -0.3,
      priceChangePercent: -5.7,
    },
  ]

  const mockSuppliers: Supplier[] = [
    {
      id: "supplier-1",
      name: "Fresh Foods Wholesale",
      rating: 4.5,
      deliveryTime: 24,
      minimumOrder: 100,
      location: {
        address: "456 Warehouse Ave, NY 10002",
        coordinates: [40.72, -74.01],
        deliveryRadius: 25,
      },
      commodities: [
        { commodityId: "flour", price: 0.89, inStock: true },
        { commodityId: "tomatoes", price: 2.49, inStock: true },
        { commodityId: "chicken", price: 4.99, inStock: true },
      ],
    },
    {
      id: "supplier-2",
      name: "Metro Food Supply",
      rating: 4.2,
      deliveryTime: 48,
      minimumOrder: 150,
      location: {
        address: "789 Industrial Blvd, NY 10003",
        coordinates: [40.73, -74.02],
        deliveryRadius: 30,
      },
      commodities: [
        { commodityId: "flour", price: 0.92, inStock: true },
        { commodityId: "mozzarella", price: 5.99, inStock: true },
      ],
    },
  ]

  const mockAlerts = [
    {
      id: "1",
      type: "price_drop",
      commodity: "Fresh Mozzarella",
      message: "Price dropped 4.8% - Great time to stock up!",
      severity: "success",
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      type: "price_spike",
      commodity: "Roma Tomatoes",
      message: "Price increased 8.7% - Consider alternatives",
      severity: "warning",
      timestamp: new Date().toISOString(),
    },
  ]

  const value = {
    restaurant: mockRestaurant,
    commodities: mockCommodities,
    suppliers: mockSuppliers,
    alerts: mockAlerts,
  }

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>
}

export function useRestaurant() {
  const context = useContext(RestaurantContext)
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider")
  }
  return context
}
