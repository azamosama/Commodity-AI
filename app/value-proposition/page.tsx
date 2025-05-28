"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, Clock, Shield, Target, Users, Zap, CheckCircle, ArrowRight } from "lucide-react"

export default function ValuePropositionPage() {
  const impactMetrics = [
    {
      metric: "Average profit margin increase",
      value: "4.2 percentage points",
      description: "Effectively doubling profitability for most restaurants",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      metric: "Management time saved",
      value: "15-20 hours weekly",
      description: "Equivalent to a $25,000+ purchasing manager",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      metric: "Menu price optimization",
      value: "12-18% revenue increase",
      description: "On strategically adjusted items",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      metric: "Supply chain disruption reduction",
      value: "87% fewer stockouts",
      description: "Of critical ingredients",
      icon: Shield,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      metric: "Average annual savings",
      value: "$45,000-$75,000",
      description: "For restaurants with $1M+ revenue",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    {
      metric: "ROI Timeline",
      value: "30-45 days",
      description: "Complete return on investment",
      icon: Zap,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
  ]

  const benefits = [
    {
      title: "Dramatic Profit Margin Enhancement",
      description:
        "In an industry where profit margins average just 3-5%, CommodityChef can potentially double your profitability by optimizing purchasing decisions.",
      example:
        "For a restaurant with $1M in annual revenue and 30% food costs, even a 20% reduction in ingredient costs translates to $60,000 in additional profit annually.",
      icon: TrendingUp,
    },
    {
      title: "Strategic Inflation Protection",
      description:
        "With food inflation reaching record levels, restaurants without sophisticated price tracking are particularly vulnerable.",
      example:
        "Flavor Pulse acts as your financial shield, automatically identifying alternative suppliers and ingredients before price spikes erode your margins.",
      icon: Shield,
    },
    {
      title: "Competitive Menu Engineering",
      description: "Beyond cost savings, Flavor Pulse enables data-driven menu decisions that competitors can't match.",
      example:
        "Identify high-margin seasonal opportunities, optimize pricing in real-time, and create special offerings based on market advantages only you can see.",
      icon: Target,
    },
    {
      title: "Labor Multiplication",
      description:
        "In today's challenging staffing environment, Flavor Pulse eliminates 15-20 hours of weekly management time.",
      example: "This is equivalent to adding a part-time purchasing manager without the $25,000+ annual salary.",
      icon: Users,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Transform Your Restaurant's Bottom Line</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Flavor Pulse is the first AI-powered purchasing assistant built specifically for independent restaurants and
          small franchises.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            Double Your Profitability
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            30-45 Day ROI
          </Badge>
          <Badge variant="outline" className="text-purple-600 border-purple-600">
            Enterprise-Level Intelligence
          </Badge>
        </div>
      </div>

      {/* Impact Metrics */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-6">Impact Metrics from Beta Users</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {impactMetrics.map((metric, index) => (
            <Card key={index} className={`${metric.borderColor} ${metric.bgColor}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                  <h3 className="font-semibold text-sm">{metric.metric}</h3>
                </div>
                <div className={`text-2xl font-bold ${metric.color} mb-2`}>{metric.value}</div>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Key Benefits */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Why Flavor Pulse is a Game-Changer</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {benefits.map((benefit, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <benefit.icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">{benefit.description}</p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{benefit.example}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ROI Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Calculate Your Potential Savings</CardTitle>
          <CardDescription className="text-center">
            See how Flavor Pulse could transform your restaurant's profitability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              <h4 className="font-semibold">Current Situation</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Annual Revenue:</span>
                  <span className="font-medium">$1,000,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Food Costs (30%):</span>
                  <span className="font-medium">$300,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Profit Margin:</span>
                  <span className="font-medium">4%</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Profit:</span>
                  <span className="font-medium">$40,000</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-green-600">With Flavor Pulse</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Food Cost Reduction:</span>
                  <span className="font-medium text-green-600">20%</span>
                </div>
                <div className="flex justify-between">
                  <span>New Food Costs:</span>
                  <span className="font-medium text-green-600">$240,000</span>
                </div>
                <div className="flex justify-between">
                  <span>New Profit Margin:</span>
                  <span className="font-medium text-green-600">10%</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Profit:</span>
                  <span className="font-medium text-green-600">$100,000</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-blue-600">Your Gains</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Additional Profit:</span>
                  <span className="font-medium text-blue-600">$60,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Increase:</span>
                  <span className="font-medium text-blue-600">150%</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Saved:</span>
                  <span className="font-medium text-blue-600">936 hours/year</span>
                </div>
                <div className="flex justify-between">
                  <span>ROI Timeline:</span>
                  <span className="font-medium text-blue-600">32 days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-bold text-green-800 mb-2">Total Annual Impact: $60,000 Additional Profit</h3>
              <p className="text-green-700">
                That's enough to hire 2-3 additional staff members or expand your location!
              </p>
            </div>
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Start Your Transformation
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Advantages */}
      <Card>
        <CardHeader>
          <CardTitle>Why Independent Restaurants Choose Flavor Pulse</CardTitle>
          <CardDescription>
            Unlike generic inventory systems or manual price checking, CommodityChef delivers transformative business
            impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Enterprise-Level Purchasing Power</h4>
                  <p className="text-sm text-muted-foreground">
                    Access the same sophisticated purchasing intelligence used by major chains with 500+ locations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Supply Chain Resilience</h4>
                  <p className="text-sm text-muted-foreground">
                    Never run out of critical ingredients again with early warning systems and automatic alternatives
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Rapid ROI</h4>
                  <p className="text-sm text-muted-foreground">
                    Most restaurants see complete return on investment within the first 30-45 days
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">AI-Powered Intelligence</h4>
                  <p className="text-sm text-muted-foreground">
                    Machine learning algorithms that get smarter with every purchase decision
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">No Additional Staff Required</h4>
                  <p className="text-sm text-muted-foreground">
                    Eliminate the need for dedicated procurement staff or expensive enterprise software
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Competitive Edge</h4>
                  <p className="text-sm text-muted-foreground">
                    Give independent restaurants the technological edge needed to thrive against chains
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center space-y-4 p-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
        <h2 className="text-2xl font-bold">Ready to Transform Your Restaurant?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Join hundreds of independent restaurants that have already doubled their profitability with Flavor Pulse.
          Start your 30-day free trial today.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="bg-green-600 hover:bg-green-700">
            Start Free Trial
          </Button>
          <Button size="lg" variant="outline">
            Schedule Demo
          </Button>
        </div>
      </div>
    </div>
  )
}
