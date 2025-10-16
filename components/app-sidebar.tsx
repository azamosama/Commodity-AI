"use client"

import { BarChart3, Building2, Calculator, Home, Package, TrendingUp, Database, Upload, Download, ChefHat, Target, RefreshCw } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

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
    title: "Profitability Analysis",
    url: "/profitability",
    icon: Target,
    hidden: false,
  },
  {
    title: "Substitution Engine",
    url: "/substitutions",
    icon: RefreshCw,
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
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get the current restaurant parameter from the URL
  const getRestaurantUrl = (baseUrl: string) => {
    const restaurant = searchParams.get('restaurant');
    if (restaurant) {
      return `${baseUrl}?restaurant=${restaurant}`;
    }
    return baseUrl;
  };

  // Check if this is a demo (no restaurant parameter OR path is /app or /demo)
  const isDemo = !searchParams.get('restaurant') || 
    pathname === '/app' || 
    pathname === '/demo';

  // Filter items based on demo vs business mode
  const visibleItems = items.filter(item => {
    if (item.hidden) return false;
    
    // Hide these tabs for demo users
    if (isDemo) {
      const demoHiddenTabs = [
        'Process Documentation',
        'Export Data', 
        'Import Data',
        'POS Integration',
        'Flavor GPT'
      ];
      return !demoHiddenTabs.includes(item.title);
    }
    
    return true;
  });


  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Flavor Pulse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
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
