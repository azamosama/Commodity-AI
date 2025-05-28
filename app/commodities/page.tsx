"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Search, TrendingDown, TrendingUp } from "lucide-react"
import { useRestaurant } from "@/contexts/restaurant-context"

export default function CommoditiesPage() {
  const { commodities, suppliers } = useRestaurant()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedCommodity, setSelectedCommodity] = useState(commodities[0])

  const filteredCommodities = commodities.filter((commodity) => {
    const matchesSearch = commodity.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" || commodity.subcategory.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const categories = ["all", ...Array.from(new Set(commodities.map((c) => c.subcategory)))]

  const getSupplierInfo = (commodityId: string) => {
    return suppliers
      .filter((supplier) => supplier.commodities.some((c) => c.commodityId === commodityId))
      .map((supplier) => ({
        name: supplier.name,
        price: supplier.commodities.find((c) => c.commodityId === commodityId)?.price || 0,
        rating: supplier.rating,
        deliveryTime: supplier.deliveryTime,
      }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Commodity Explorer</h1>
        <p className="text-muted-foreground">
          Track prices, compare suppliers, and analyze trends for all your ingredients.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search commodities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Commodities List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">Commodities ({filteredCommodities.length})</h2>
          <div className="space-y-2">
            {filteredCommodities.map((commodity) => (
              <Card
                key={commodity.id}
                className={`cursor-pointer transition-colors ${selectedCommodity.id === commodity.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedCommodity(commodity)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{commodity.name}</h4>
                      <p className="text-sm text-muted-foreground">{commodity.subcategory}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium">
                        ${commodity.currentPrice}/{commodity.unit}
                      </div>
                      <div className="flex items-center gap-1">
                        {commodity.priceChangePercent > 0 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        <Badge
                          variant={commodity.priceChangePercent > 0 ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {commodity.priceChangePercent > 0 ? "+" : ""}
                          {commodity.priceChangePercent.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Commodity Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{selectedCommodity.name}</CardTitle>
              <CardDescription>
                {selectedCommodity.subcategory} • Current Price: ${selectedCommodity.currentPrice}/
                {selectedCommodity.unit}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="price-history" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="price-history">Price History</TabsTrigger>
                  <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                  <TabsTrigger value="menu-impact">Menu Impact</TabsTrigger>
                </TabsList>

                <TabsContent value="price-history" className="space-y-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedCommodity.priceHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value}`, "Price"]} />
                        <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">${selectedCommodity.currentPrice}</div>
                      <div className="text-sm text-muted-foreground">Current Price</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${Math.min(...selectedCommodity.priceHistory.map((p) => p.price)).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">30-Day Low</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        ${Math.max(...selectedCommodity.priceHistory.map((p) => p.price)).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">30-Day High</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="suppliers" className="space-y-4">
                  <div className="space-y-4">
                    {getSupplierInfo(selectedCommodity.id).map((supplier, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h4 className="font-medium">{supplier.name}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">★ {supplier.rating}</Badge>
                                <span className="text-sm text-muted-foreground">{supplier.deliveryTime}h delivery</span>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-lg font-bold">
                                ${supplier.price}/{selectedCommodity.unit}
                              </div>
                              <Button size="sm">Contact Supplier</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="menu-impact" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Menu Items Using This Ingredient</h4>
                    {selectedCommodity.relatedMenuItems.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h4 className="font-medium">{item}</h4>
                              <p className="text-sm text-muted-foreground">
                                Cost impact: ~15% of total ingredient cost
                              </p>
                            </div>
                            <div className="text-right">
                              <Button size="sm" variant="outline">
                                View Recipe
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
