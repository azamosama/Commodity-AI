import { BarChart3, Building2, Calculator, Home, Package, TrendingUp } from "lucide-react"

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
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    hidden: false,
  },
  {
    title: "Process Documentation",
    url: "/process-documentation",
    icon: Calculator, // You can change this to a more appropriate icon if desired
    hidden: false,
  },
]

export function AppSidebar() {
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
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
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
