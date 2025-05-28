"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Plus, Minus } from "lucide-react"
import { useRestaurant } from "@/contexts/restaurant-context"

export default function MenuCalculatorPage() {
  const { restaurant, commodities } = useRestaurant()
  const [selectedMenuItem, setSelectedMenuItem] = useState(restaurant.menuItems[0])
  const [newIngredient, setNewIngredient] = useState({ name: "", quantity: 0, unit: "lb" })
  const [sellingPrice, setSellingPrice] = useState(selectedMenuItem.sellingPrice)

  // Mock ingredient breakdown for the selected menu item
  const ingredientBreakdown = [
    { name: "Flour", cost: 0.45, percentage: 10, color: "#8884d8" },
    { name: "Tomatoes", cost: 1.25, percentage: 28, color: "#82ca9d" },
    { name: "Mozzarella", cost: 2.4, percentage: 53, color: "#ffc658" },
    { name: "Basil", cost: 0.4, percentage: 9, color: "#ff7300" },
  ]

  const profitAnalysis = [
    { scenario: "Current", cost: 4.5, price: 16.99, profit: 12.49, margin: 73.5 },
    { scenario: "10% Price Increase", cost: 4.95, price: 16.99, profit: 12.04, margin: 70.9 },
    { scenario: "Alternative Supplier", cost: 4.2, price: 16.99, profit: 12.79, margin: 75.3 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Menu Cost Calculator</h1>
        <p className="text-muted-foreground">
          Analyze ingredient costs, calculate profit margins, and optimize your menu pricing.
        </p>
      </div>

      {/* Menu Item Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Menu Item</CardTitle>
          <CardDescription>Choose a menu item to analyze its cost breakdown and profitability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {restaurant.menuItems.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer transition-colors ${selectedMenuItem.id === item.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedMenuItem(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.ingredients.length} ingredients</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium">${item.sellingPrice}</div>
                      <Badge variant="default">{item.profitMargin.toFixed(1)}% margin</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      <Tabs defaultValue="cost-breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cost-breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="profit-analysis">Profit Analysis</TabsTrigger>
          <TabsTrigger value="scenario-modeling">Scenario Modeling</TabsTrigger>
          <TabsTrigger value="recipe-editor">Recipe Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="cost-breakdown" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cost Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{selectedMenuItem.name} - Cost Breakdown</CardTitle>
                <CardDescription>Ingredient cost distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ingredientBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="cost"
                      >
                        {ingredientBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, "Cost"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cost Details */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Details</CardTitle>
                <CardDescription>Per serving cost breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ingredientBreakdown.map((ingredient) => (
                  <div key={ingredient.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ingredient.color }} />
                      <span className="font-medium">{ingredient.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${ingredient.cost.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{ingredient.percentage}%</div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between font-medium">
                    <span>Total Cost per Serving</span>
                    <span>${selectedMenuItem.costPerServing.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Selling Price</span>
                    <span>${selectedMenuItem.sellingPrice}</span>
                  </div>
                  <div className="flex items-center justify-between font-medium text-green-600">
                    <span>Profit per Serving</span>
                    <span>${(selectedMenuItem.sellingPrice - selectedMenuItem.costPerServing).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profit-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profit Analysis</CardTitle>
              <CardDescription>Compare different scenarios and their impact on profitability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scenario" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                    <Bar dataKey="cost" fill="#ef4444" name="Cost" />
                    <Bar dataKey="profit" fill="#22c55e" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {profitAnalysis.map((scenario, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">{scenario.scenario}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Cost:</span>
                          <span>${scenario.cost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span>${scenario.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Profit:</span>
                          <span className="text-green-600">${scenario.profit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Margin:</span>
                          <Badge variant="outline">{scenario.margin.toFixed(1)}%</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenario-modeling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What-If Scenario Modeling</CardTitle>
              <CardDescription>Model different pricing and cost scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <Label>Adjust Selling Price</Label>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="text-center"
                    />
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Ingredient Cost Change (%)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select change" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-10">-10% (Better supplier)</SelectItem>
                      <SelectItem value="0">No change</SelectItem>
                      <SelectItem value="5">+5% (Market increase)</SelectItem>
                      <SelectItem value="10">+10% (Significant increase)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${(sellingPrice - selectedMenuItem.costPerServing).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Profit per Serving</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">
                      {(sellingPrice / selectedMenuItem.costPerServing).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Profit Margin</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${(sellingPrice - selectedMenuItem.costPerServing) * 100}
                    </div>
                    <div className="text-sm text-muted-foreground">Daily Profit (100 servings)</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipe-editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Editor - {selectedMenuItem.name}</CardTitle>
              <CardDescription>Modify ingredients and quantities to see cost impact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Current Ingredients</h4>
                {selectedMenuItem.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium capitalize">{ingredient}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue={1} className="w-20" />
                      <Select defaultValue="lb">
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lb">lb</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                          <SelectItem value="cup">cup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" variant="outline">
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Add New Ingredient</h4>
                <div className="flex items-center gap-4">
                  <Select>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {commodities.map((commodity) => (
                        <SelectItem key={commodity.id} value={commodity.id}>
                          {commodity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Quantity" className="w-24" />
                  <Select defaultValue="lb">
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="oz">oz</SelectItem>
                      <SelectItem value="cup">cup</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button>Save Recipe</Button>
                <Button variant="outline">Reset Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
