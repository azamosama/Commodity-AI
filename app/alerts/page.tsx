"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Bell, TrendingUp, TrendingDown, Plus, Trash2, Clock, DollarSign } from "lucide-react"
import { useRestaurant } from "@/contexts/restaurant-context"

interface PriceAlert {
  id: string
  commodityId: string
  commodityName: string
  alertType: "price_drop" | "price_spike" | "threshold"
  threshold: number
  currentPrice: number
  isActive: boolean
  createdAt: string
  triggeredAt?: string
  frequency: "immediate" | "daily" | "weekly"
}

export default function AlertsPage() {
  const { commodities, alerts } = useRestaurant()
  const [activeAlerts, setActiveAlerts] = useState<PriceAlert[]>([
    {
      id: "1",
      commodityId: "flour",
      commodityName: "All-Purpose Flour",
      alertType: "price_drop",
      threshold: 0.85,
      currentPrice: 0.89,
      isActive: true,
      createdAt: "2024-01-01",
      frequency: "immediate",
    },
    {
      id: "2",
      commodityId: "tomatoes",
      commodityName: "Roma Tomatoes",
      alertType: "price_spike",
      threshold: 2.75,
      currentPrice: 2.49,
      isActive: true,
      createdAt: "2024-01-02",
      frequency: "daily",
    },
    {
      id: "3",
      commodityId: "mozzarella",
      commodityName: "Fresh Mozzarella",
      alertType: "threshold",
      threshold: 5.5,
      currentPrice: 5.99,
      isActive: false,
      createdAt: "2024-01-03",
      triggeredAt: "2024-01-05",
      frequency: "immediate",
    },
  ])

  const [newAlert, setNewAlert] = useState({
    commodityId: "",
    alertType: "price_drop" as const,
    threshold: 0,
    frequency: "immediate" as const,
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const recentAlerts = [
    {
      id: "1",
      type: "price_drop",
      commodity: "Fresh Mozzarella",
      message: "Price dropped to $5.99 (4.8% decrease)",
      timestamp: "2 hours ago",
      severity: "success" as const,
      savings: 0.3,
    },
    {
      id: "2",
      type: "price_spike",
      commodity: "Roma Tomatoes",
      message: "Price increased to $2.49 (8.7% increase)",
      timestamp: "5 hours ago",
      severity: "warning" as const,
      impact: 0.2,
    },
    {
      id: "3",
      type: "threshold",
      commodity: "Chicken Breast",
      message: "Price reached your target of $4.99",
      timestamp: "1 day ago",
      severity: "info" as const,
      savings: 0.5,
    },
  ]

  const handleCreateAlert = () => {
    if (!newAlert.commodityId || !newAlert.threshold) return

    const commodity = commodities.find((c) => c.id === newAlert.commodityId)
    if (!commodity) return

    const alert: PriceAlert = {
      id: Date.now().toString(),
      commodityId: newAlert.commodityId,
      commodityName: commodity.name,
      alertType: newAlert.alertType,
      threshold: newAlert.threshold,
      currentPrice: commodity.currentPrice,
      isActive: true,
      createdAt: new Date().toISOString(),
      frequency: newAlert.frequency,
    }

    setActiveAlerts([...activeAlerts, alert])
    setNewAlert({
      commodityId: "",
      alertType: "price_drop",
      threshold: 0,
      frequency: "immediate",
    })
    setIsDialogOpen(false)
  }

  const toggleAlert = (alertId: string) => {
    setActiveAlerts((alerts) =>
      alerts.map((alert) => (alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert)),
    )
  }

  const deleteAlert = (alertId: string) => {
    setActiveAlerts((alerts) => alerts.filter((alert) => alert.id !== alertId))
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "price_drop":
        return <TrendingDown className="h-4 w-4 text-green-500" />
      case "price_spike":
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case "threshold":
        return <DollarSign className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "price_drop":
        return "Price Drop"
      case "price_spike":
        return "Price Spike"
      case "threshold":
        return "Price Threshold"
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Price Alerts</h1>
          <p className="text-muted-foreground">
            Stay informed about price changes and market opportunities for your key ingredients.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Price Alert</DialogTitle>
              <DialogDescription>Set up automated alerts for price changes on your key commodities.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Commodity</Label>
                <Select
                  value={newAlert.commodityId}
                  onValueChange={(value) => setNewAlert({ ...newAlert, commodityId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    {commodities.map((commodity) => (
                      <SelectItem key={commodity.id} value={commodity.id}>
                        {commodity.name} (${commodity.currentPrice}/{commodity.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Alert Type</Label>
                <Select
                  value={newAlert.alertType}
                  onValueChange={(value: any) => setNewAlert({ ...newAlert, alertType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_drop">Price Drop Below</SelectItem>
                    <SelectItem value="price_spike">Price Spike Above</SelectItem>
                    <SelectItem value="threshold">Price Threshold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Threshold Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newAlert.threshold}
                  onChange={(e) => setNewAlert({ ...newAlert, threshold: Number(e.target.value) })}
                  placeholder="Enter price threshold"
                />
              </div>

              <div className="space-y-2">
                <Label>Notification Frequency</Label>
                <Select
                  value={newAlert.frequency}
                  onValueChange={(value: any) => setNewAlert({ ...newAlert, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateAlert} className="flex-1">
                  Create Alert
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Alerts ({activeAlerts.filter((a) => a.isActive).length})</TabsTrigger>
          <TabsTrigger value="recent">Recent Alerts ({recentAlerts.length})</TabsTrigger>
          <TabsTrigger value="settings">Alert Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first price alert to stay informed about market changes.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getAlertIcon(alert.alertType)}
                        <div>
                          <h4 className="font-medium">{alert.commodityName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {getAlertTypeLabel(alert.alertType)} ${alert.threshold}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">Current: ${alert.currentPrice}</div>
                          <div className="text-sm text-muted-foreground">Target: ${alert.threshold}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={alert.isActive ? "default" : "secondary"}>
                            {alert.isActive ? "Active" : "Paused"}
                          </Badge>
                          <Switch checked={alert.isActive} onCheckedChange={() => toggleAlert(alert.id)} />
                          <Button size="sm" variant="outline" onClick={() => deleteAlert(alert.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <Alert
                key={alert.id}
                className={
                  alert.severity === "success"
                    ? "border-green-200 bg-green-50"
                    : alert.severity === "warning"
                      ? "border-orange-200 bg-orange-50"
                      : "border-blue-200 bg-blue-50"
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <AlertDescription className="font-medium">{alert.commodity}</AlertDescription>
                      <AlertDescription className="text-sm">{alert.message}</AlertDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {alert.savings && (
                      <div className="text-sm font-medium text-green-600">${alert.savings.toFixed(2)} saved</div>
                    )}
                    {alert.impact && (
                      <div className="text-sm font-medium text-orange-600">+${alert.impact.toFixed(2)} cost</div>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how and when you receive price alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive urgent alerts via SMS</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">Daily digest of price changes</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Weekend Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts on weekends</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>Set default sensitivity for automatic price alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Price Drop Sensitivity (%)</Label>
                <Input type="number" defaultValue={5} />
                <p className="text-xs text-muted-foreground">Alert when prices drop by this percentage or more</p>
              </div>

              <div className="space-y-2">
                <Label>Price Spike Sensitivity (%)</Label>
                <Input type="number" defaultValue={10} />
                <p className="text-xs text-muted-foreground">Alert when prices increase by this percentage or more</p>
              </div>

              <div className="space-y-2">
                <Label>Minimum Alert Interval (hours)</Label>
                <Input type="number" defaultValue={4} />
                <p className="text-xs text-muted-foreground">Minimum time between alerts for the same commodity</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button>Save Settings</Button>
            <Button variant="outline">Reset to Defaults</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
