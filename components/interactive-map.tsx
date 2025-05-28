"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Star, Phone, Navigation } from "lucide-react"

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

interface Restaurant {
  id: string
  name: string
  location: {
    address: string
    coordinates: [number, number]
  }
  menuItems: any[]
  preferredSuppliers: string[]
}

interface InteractiveMapProps {
  suppliers: Supplier[]
  restaurant: Restaurant
}

export function InteractiveMap({ suppliers, restaurant }: InteractiveMapProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [mapCenter, setMapCenter] = useState(restaurant.location.coordinates)
  const [zoomLevel, setZoomLevel] = useState(12)

  // Calculate distance between two coordinates (simplified)
  const calculateDistance = (coord1: [number, number], coord2: [number, number]) => {
    const [lat1, lon1] = coord1
    const [lat2, lon2] = coord2
    const R = 3959 // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Convert coordinates to pixel positions (simplified for demo)
  const coordsToPixels = (coords: [number, number]) => {
    const [lat, lng] = coords
    const [centerLat, centerLng] = mapCenter
    const scale = Math.pow(2, zoomLevel - 10)

    const x = 400 + (lng - centerLng) * scale * 1000
    const y = 300 - (lat - centerLat) * scale * 1000

    return { x: Math.max(20, Math.min(780, x)), y: Math.max(20, Math.min(580, y)) }
  }

  const restaurantPixels = coordsToPixels(restaurant.location.coordinates)

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setZoomLevel(Math.min(16, zoomLevel + 1))}>
            Zoom In
          </Button>
          <Button size="sm" variant="outline" onClick={() => setZoomLevel(Math.max(8, zoomLevel - 1))}>
            Zoom Out
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setMapCenter(restaurant.location.coordinates)
              setZoomLevel(12)
            }}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Center on Restaurant
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Zoom: {zoomLevel} | Showing {suppliers.length} suppliers
        </div>
      </div>

      {/* Interactive Map */}
      <div className="relative">
        <svg
          width="800"
          height="600"
          className="border rounded-lg bg-gradient-to-br from-green-50 to-blue-50"
          viewBox="0 0 800 600"
        >
          {/* Grid lines for map feel */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="800" height="600" fill="url(#grid)" />

          {/* Restaurant location */}
          <g>
            <circle
              cx={restaurantPixels.x}
              cy={restaurantPixels.y}
              r="8"
              fill="#ef4444"
              stroke="#fff"
              strokeWidth="2"
            />
            <text
              x={restaurantPixels.x}
              y={restaurantPixels.y - 15}
              textAnchor="middle"
              className="text-xs font-medium fill-red-600"
            >
              {restaurant.name}
            </text>
          </g>

          {/* Supplier locations */}
          {suppliers.map((supplier) => {
            const pixels = coordsToPixels(supplier.location.coordinates)
            const distance = calculateDistance(restaurant.location.coordinates, supplier.location.coordinates)
            const isSelected = selectedSupplier?.id === supplier.id

            return (
              <g key={supplier.id}>
                {/* Delivery radius circle */}
                <circle
                  cx={pixels.x}
                  cy={pixels.y}
                  r={supplier.location.deliveryRadius * 2}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                  opacity="0.3"
                />

                {/* Supplier marker */}
                <circle
                  cx={pixels.x}
                  cy={pixels.y}
                  r={isSelected ? "10" : "6"}
                  fill={isSelected ? "#3b82f6" : "#22c55e"}
                  stroke="#fff"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-8 transition-all"
                  onClick={() => setSelectedSupplier(supplier)}
                />

                {/* Supplier name */}
                <text
                  x={pixels.x}
                  y={pixels.y - (isSelected ? 18 : 12)}
                  textAnchor="middle"
                  className={`text-xs font-medium cursor-pointer ${isSelected ? "fill-blue-600" : "fill-green-600"}`}
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  {supplier.name}
                </text>

                {/* Distance label */}
                <text
                  x={pixels.x}
                  y={pixels.y + (isSelected ? 25 : 20)}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {distance.toFixed(1)} mi
                </text>
              </g>
            )
          })}

          {/* Legend */}
          <g transform="translate(20, 20)">
            <rect width="180" height="80" fill="white" stroke="#e5e7eb" rx="4" />
            <text x="10" y="20" className="text-sm font-medium fill-gray-700">
              Map Legend
            </text>
            <circle cx="20" cy="35" r="4" fill="#ef4444" />
            <text x="30" y="40" className="text-xs fill-gray-600">
              Your Restaurant
            </text>
            <circle cx="20" cy="55" r="4" fill="#22c55e" />
            <text x="30" y="60" className="text-xs fill-gray-600">
              Suppliers
            </text>
            <line x1="20" y1="70" x2="35" y2="70" stroke="#3b82f6" strokeDasharray="2,2" />
            <text x="40" y="75" className="text-xs fill-gray-600">
              Delivery Range
            </text>
          </g>
        </svg>
      </div>

      {/* Supplier Details Panel */}
      {selectedSupplier && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedSupplier.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selectedSupplier.location.address}
                </p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                {selectedSupplier.rating}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold">{selectedSupplier.deliveryTime}h</div>
                <div className="text-xs text-muted-foreground">Delivery</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">${selectedSupplier.minimumOrder}</div>
                <div className="text-xs text-muted-foreground">Min Order</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {calculateDistance(restaurant.location.coordinates, selectedSupplier.location.coordinates).toFixed(1)}
                  mi
                </div>
                <div className="text-xs text-muted-foreground">Distance</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Phone className="h-4 w-4 mr-2" />
                Contact Supplier
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedSupplier(null)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
