"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Download, TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react"

export default function ReportsPage() {
  // Mock data for reports
  const monthlySpending = [
    { month: "Jan", spending: 4200, savings: 180 },
    { month: "Feb", spending: 3950, savings: 220 },
    { month: "Mar", spending: 4100, savings: 195 },
    { month: "Apr", spending: 3800, savings: 280 },
    { month: "May", spending: 4050, savings: 210 },
    { month: "Jun", spending: 3900, savings: 250 },
  ]

  const categorySpending = [
    { category: "Produce", amount: 1200, percentage: 30, color: "#8884d8" },
    { category: "Meat", amount: 1000, percentage: 25, color: "#82ca9d" },
    { category: "Dairy", amount: 800, percentage: 20, color: "#ffc658" },
    { category: "Dry Goods", amount: 600, percentage: 15, color: "#ff7300" },
    { category: "Non-Food", amount: 400, percentage: 10, color: "#00ff88" },
  ]

  const supplierPerformance = [
    { supplier: "Fresh Foods Wholesale", orders: 24, onTime: 96, rating: 4.5, savings: 320 },
    { supplier: "Metro Food Supply", orders: 18, onTime: 89, rating: 4.2, savings: 180 },
    { supplier: "Local Produce Co", orders: 12, onTime: 100, rating: 4.8, savings: 150 },
    { supplier: "Quality Meats Inc", orders: 15, onTime: 93, rating: 4.3, savings: 200 },
  ]

  const priceForecasts = [
    { commodity: "Tomatoes", current: 2.49, forecast: 2.65, change: 6.4, trend: "up" },
    { commodity: "Chicken Breast", current: 4.99, forecast: 4.75, change: -4.8, trend: "down" },
    { commodity: "Flour", current: 0.89, forecast: 0.92, change: 3.4, trend: "up" },
    { commodity: "Mozzarella", current: 5.99, forecast: 5.85, change: -2.3, trend: "down" },
  ]

  const seasonalTrendsData = [
    { month: "Jan", tomatoes: 3.2, lettuce: 1.8, chicken: 4.95, flour: 0.89 },
    { month: "Feb", tomatoes: 3.4, lettuce: 1.75, chicken: 4.98, flour: 0.91 },
    { month: "Mar", tomatoes: 3.1, lettuce: 1.65, chicken: 4.92, flour: 0.88 },
    { month: "Apr", tomatoes: 2.8, lettuce: 1.45, chicken: 4.89, flour: 0.87 },
    { month: "May", tomatoes: 2.4, lettuce: 1.4, chicken: 4.85, flour: 0.86 },
    { month: "Jun", tomatoes: 2.1, lettuce: 1.55, chicken: 4.88, flour: 0.88 },
    { month: "Jul", tomatoes: 1.95, lettuce: 1.7, chicken: 4.91, flour: 0.89 },
    { month: "Aug", tomatoes: 2.05, lettuce: 1.85, chicken: 4.94, flour: 0.9 },
    { month: "Sep", tomatoes: 2.35, lettuce: 1.6, chicken: 4.9, flour: 0.88 },
    { month: "Oct", tomatoes: 2.7, lettuce: 1.5, chicken: 4.87, flour: 0.87 },
    { month: "Nov", tomatoes: 3.0, lettuce: 1.7, chicken: 4.93, flour: 0.9 },
    { month: "Dec", tomatoes: 3.25, lettuce: 1.85, chicken: 4.96, flour: 0.92 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your purchasing patterns and cost optimization opportunities.
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="6months">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="spending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Performance</TabsTrigger>
          <TabsTrigger value="forecasting">Price Forecasting</TabsTrigger>
          <TabsTrigger value="savings">Savings Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="spending" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spending (6M)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$24,000</div>
                <p className="text-xs text-muted-foreground">-8.2% from previous period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Monthly</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$4,000</div>
                <p className="text-xs text-muted-foreground">Consistent spending pattern</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">$1,335</div>
                <p className="text-xs text-muted-foreground">Through smart purchasing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost per Serving</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$4.25</div>
                <p className="text-xs text-muted-foreground">-12% improvement</p>
              </CardContent>
            </Card>
          </div>

          {/* Spending Trends */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trend</CardTitle>
                <CardDescription>Spending and savings over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlySpending}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                    <Line type="monotone" dataKey="spending" stroke="#8884d8" strokeWidth={2} name="Spending" />
                    <Line type="monotone" dataKey="savings" stroke="#22c55e" strokeWidth={2} name="Savings" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Distribution of your food and supply costs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Performance Metrics</CardTitle>
              <CardDescription>Evaluate your suppliers based on delivery, quality, and cost savings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supplierPerformance.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{supplier.supplier}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{supplier.orders} orders</span>
                        <span>{supplier.onTime}% on-time delivery</span>
                        <Badge variant="outline">★ {supplier.rating}</Badge>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium text-green-600">${supplier.savings} saved</div>
                      <div className="text-sm text-muted-foreground">This period</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supplier Comparison</CardTitle>
              <CardDescription>Performance metrics across all suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={supplierPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="supplier" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="onTime" fill="#8884d8" name="On-Time %" />
                  <Bar dataKey="rating" fill="#82ca9d" name="Rating" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price Forecasting</CardTitle>
              <CardDescription>AI-powered predictions for commodity price movements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priceForecasts.map((forecast, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{forecast.commodity}</h4>
                      <div className="text-sm text-muted-foreground">
                        Current: ${forecast.current} → Forecast: ${forecast.forecast}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        {forecast.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        <Badge variant={forecast.trend === "up" ? "destructive" : "default"}>
                          {forecast.change > 0 ? "+" : ""}
                          {forecast.change.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">30-day forecast</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seasonal Trends</CardTitle>
              <CardDescription>Historical price patterns to help plan purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={seasonalTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`$${value}`, name]} />
                  <Line type="monotone" dataKey="tomatoes" stroke="#ef4444" strokeWidth={2} name="Tomatoes" />
                  <Line type="monotone" dataKey="lettuce" stroke="#22c55e" strokeWidth={2} name="Lettuce" />
                  <Line type="monotone" dataKey="chicken" stroke="#3b82f6" strokeWidth={2} name="Chicken" />
                  <Line type="monotone" dataKey="flour" stroke="#f59e0b" strokeWidth={2} name="Flour" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Seasonal Insights</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Tomatoes peak in summer (June-August)</li>
                    <li>• Lettuce prices lowest in spring/fall</li>
                    <li>• Chicken prices stable year-round</li>
                    <li>• Flour shows minimal seasonal variation</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Purchasing Recommendations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Stock up on tomatoes in July-August</li>
                    <li>• Plan lettuce purchases for April-May</li>
                    <li>• Consider menu changes during peak seasons</li>
                    <li>• Lock in flour contracts for price stability</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Savings Opportunities</CardTitle>
              <CardDescription>AI-identified opportunities to reduce costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-green-800">Switch Flour Supplier</h4>
                      <p className="text-sm text-green-700">
                        Metro Food Supply offers 8% lower prices on All-Purpose Flour
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-800">$45/month</div>
                      <Button size="sm" className="mt-2">
                        Explore
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-blue-800">Bulk Purchase Opportunity</h4>
                      <p className="text-sm text-blue-700">
                        Tomato prices expected to rise 15% next month - stock up now
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-blue-800">$120/month</div>
                      <Button size="sm" className="mt-2">
                        Plan Order
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-orange-800">Menu Optimization</h4>
                      <p className="text-sm text-orange-700">
                        Consider seasonal menu changes to reduce high-cost ingredients
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-orange-800">$200/month</div>
                      <Button size="sm" className="mt-2">
                        View Suggestions
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Savings Summary</CardTitle>
              <CardDescription>Track your cost optimization progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">$1,335</div>
                  <div className="text-sm text-muted-foreground">Total Savings (6M)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">$365</div>
                  <div className="text-sm text-muted-foreground">Potential Monthly Savings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">12.5%</div>
                  <div className="text-sm text-muted-foreground">Cost Reduction Achieved</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
