"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Star, Package, Phone, Mail } from "lucide-react"
import { useRestaurant } from "@/contexts/restaurant-context"
import { InteractiveMap } from "@/components/interactive-map"

export default function SuppliersPage() {
  const { suppliers, commodities, restaurant } = useRestaurant()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("rating")

  const filteredSuppliers = suppliers
    .filter((supplier) => supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "delivery":
          return a.deliveryTime - b.deliveryTime
        case "distance":
          return a.location.deliveryRadius - b.location.deliveryRadius
        default:
          return 0
      }
    })

  const getCommodityName = (commodityId: string) => {
    return commodities.find((c) => c.id === commodityId)?.name || commodityId
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supplier Directory</h1>
        <p className="text-muted-foreground">
          Find and compare suppliers in your area. View ratings, delivery times, and available products.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Input placeholder="Search suppliers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="delivery">Fastest Delivery</SelectItem>
            <SelectItem value="distance">Closest Distance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Locations</CardTitle>
          <CardDescription>Interactive map showing suppliers in your delivery area</CardDescription>
        </CardHeader>
        <CardContent>
          <InteractiveMap suppliers={suppliers} restaurant={restaurant} />
        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{supplier.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {supplier.location.address}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  {supplier.rating}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{supplier.deliveryTime}h</div>
                  <div className="text-xs text-muted-foreground">Delivery Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">${supplier.minimumOrder}</div>
                  <div className="text-xs text-muted-foreground">Min Order</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{supplier.location.deliveryRadius}mi</div>
                  <div className="text-xs text-muted-foreground">Delivery Radius</div>
                </div>
              </div>

              {/* Available Commodities */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Available Products ({supplier.commodities.length})
                </h4>
                <div className="space-y-2">
                  {supplier.commodities.slice(0, 3).map((commodity) => (
                    <div key={commodity.commodityId} className="flex items-center justify-between text-sm">
                      <span>{getCommodityName(commodity.commodityId)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${commodity.price}</span>
                        <Badge variant={commodity.inStock ? "default" : "secondary"} className="text-xs">
                          {commodity.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {supplier.commodities.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{supplier.commodities.length - 3} more products</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact
                </Button>
                <Button variant="outline" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Quote
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last delivery: 2 days ago</span>
                  <span>Orders this month: 8</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Supplier */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium">Can't find what you're looking for?</h3>
            <p className="text-muted-foreground">
              Add a new supplier to your directory or request quotes from additional vendors.
            </p>
            <div className="flex gap-2 justify-center">
              <Button>Add New Supplier</Button>
              <Button variant="outline">Request Quotes</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
