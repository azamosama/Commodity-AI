"use client"

import { BarChart3, Building2, Calculator, Home, Package, TrendingUp, Database, Upload, Download, ChefHat } from "lucide-react"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    hidden: true,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Package,
    hidden: false,
  },
  {
    title: "Recipes",
    url: "/recipes",
    icon: Calculator,
    hidden: false,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    hidden: false,
  },
  {
    title: "Predictive Analytics",
    url: "/predictive-analytics",
    icon: TrendingUp,
    hidden: false,
  },
  {
    title: "AI Menu Generator",
    url: "/menu-generator",
    icon: ChefHat,
    hidden: false,
  },
  {
    title: "Flavor GPT",
    url: "/questions",
    icon: null, // Special case for emoji
    hidden: false,
  },
  {
    title: "POS Integration",
    url: "/pos-integration",
    icon: Database,
    hidden: false,
  },
  {
    title: "Import Data",
    url: "/data-import",
    icon: Upload,
    hidden: false,
  },
  {
    title: "Export Data",
    url: "/export",
    icon: Download,
    hidden: false,
  },
  {
    title: "Process Documentation",
    url: "/process-documentation",
    icon: Calculator,
    hidden: false,
  },
  {
    title: "Value Proposition",
    url: "/value-proposition",
    icon: TrendingUp,
    hidden: true,
  },
  {
    title: "Commodity Explorer",
    url: "/commodities",
    icon: Package,
    hidden: true,
  },
  {
    title: "Supplier Directory",
    url: "/suppliers",
    icon: Building2,
    hidden: true,
  },
  {
    title: "Menu Cost Calculator",
    url: "/menu-calculator",
    icon: Calculator,
    hidden: true,
  },
  {
    title: "Reports & Analytics",
    url: "/reports",
    icon: BarChart3,
    hidden: true,
  },
  {
    title: "Price Alerts",
    url: "/alerts",
    icon: TrendingUp,
    hidden: true,
  },
]

export function AppSidebar() {
  // Get the current restaurant parameter from the URL
  const getRestaurantUrl = (baseUrl: string) => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const restaurant = urlParams.get('restaurant');
      if (restaurant) {
        console.log(`Sidebar: Adding restaurant=${restaurant} to ${baseUrl}`);
        return `${baseUrl}?restaurant=${restaurant}`;
      }
    }
    return baseUrl;
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Flavor Pulse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.filter(item => !item.hidden).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={getRestaurantUrl(item.url)}>
                      {item.icon ? <item.icon /> : <span>🧠</span>}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
