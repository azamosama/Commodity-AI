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
  },
  {
    title: "Value Proposition",
    url: "/value-proposition",
    icon: TrendingUp,
  },
  {
    title: "Commodity Explorer",
    url: "/commodities",
    icon: Package,
  },
  {
    title: "Supplier Directory",
    url: "/suppliers",
    icon: Building2,
  },
  {
    title: "Menu Cost Calculator",
    url: "/menu-calculator",
    icon: Calculator,
  },
  {
    title: "Reports & Analytics",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Price Alerts",
    url: "/alerts",
    icon: TrendingUp,
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
              {items.map((item) => (
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
