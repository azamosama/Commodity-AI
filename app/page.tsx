"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingDown, TrendingUp, AlertTriangle, DollarSign, Package, Users, Clock, Calendar } from "lucide-react"
import { useRestaurant } from "@/contexts/restaurant-context"

export default function Dashboard() {
  const { restaurant, commodities, suppliers, alerts } = useRestaurant()

  const priceChangeData = commodities.map((commodity) => ({
    name: commodity.name,
    change: commodity.priceChangePercent,
    price: commodity.currentPrice,
  }))

  const weeklySpendingData = [
    { week: "Week 1", spending: 1250 },
    { week: "Week 2", spending: 1180 },
    { week: "Week 3", spending: 1320 },
    { week: "Week 4", spending: 1090 },
  ]

  const totalSpending = weeklySpendingData.reduce((sum, week) => sum + week.spending, 0)
  const avgWeeklySpending = totalSpending / weeklySpendingData.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transform Your Bottom Line</h1>
        <p className="text-muted-foreground">
          Welcome back to {restaurant.name}. Your AI-powered purchasing assistant is working to double your
          profitability.
        </p>
      </div>

      {/* Alerts Section */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Price Alerts</h2>
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            className={alert.severity === "success" ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{alert.commodity}:</strong> {alert.message}
            </AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Impact Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin Increase</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+4.2%</div>
            <p className="text-xs text-green-700">Effectively doubled profitability</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">$62,000</div>
            <p className="text-xs text-blue-700">20% reduction in ingredient costs</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved Weekly</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">18 hrs</div>
            <p className="text-xs text-purple-700">Equivalent to $25K+ manager</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">32 days</div>
            <p className="text-xs text-orange-700">Complete return on investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">Avg rating: 4.4/5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracked Commodities</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commodities.length}</div>
            <p className="text-xs text-muted-foreground">Across 4 categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Weekly Spending</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgWeeklySpending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">-5.2% from last period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Spending Trend</CardTitle>
            <CardDescription>Your purchasing patterns over the last 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklySpendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, "Spending"]} />
                <Line type="monotone" dataKey="spending" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price Changes</CardTitle>
            <CardDescription>Recent price movements for your key commodities</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priceChangeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, "Price Change"]} />
                <Bar dataKey="change" fill={(entry) => (entry > 0 ? "#ef4444" : "#22c55e")} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Opportunities</CardTitle>
          <CardDescription>Your AI-powered system has identified these profit-boosting opportunities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 p-4 border rounded-lg bg-green-50 border-green-200">
              <h4 className="font-medium text-green-800">Supplier Switch Opportunity</h4>
              <p className="text-sm text-green-700">Switch flour supplier to save $180/month</p>
              <div className="text-lg font-bold text-green-800">+2.1% margin</div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Implement Now
              </Button>
            </div>
            <div className="space-y-2 p-4 border rounded-lg bg-blue-50 border-blue-200">
              <h4 className="font-medium text-blue-800">Menu Engineering Alert</h4>
              <p className="text-sm text-blue-700">Seasonal pricing adjustment opportunity</p>
              <div className="text-lg font-bold text-blue-800">+$320/week</div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Optimize Menu
              </Button>
            </div>
            <div className="space-y-2 p-4 border rounded-lg bg-purple-50 border-purple-200">
              <h4 className="font-medium text-purple-800">Supply Chain Protection</h4>
              <p className="text-sm text-purple-700">Tomato shortage predicted - secure supply</p>
              <div className="text-lg font-bold text-purple-800">Avoid 15% spike</div>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                Secure Supply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Commodities */}
      <Card>
        <CardHeader>
          <CardTitle>Your Key Commodities</CardTitle>
          <CardDescription>Price overview for your most important ingredients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commodities.map((commodity) => (
              <div key={commodity.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                    <Badge variant={commodity.priceChangePercent > 0 ? "destructive" : "default"}>
                      {commodity.priceChangePercent > 0 ? "+" : ""}
                      {commodity.priceChangePercent.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
