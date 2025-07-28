import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { RestaurantProvider } from "@/contexts/restaurant-context"
import { CostManagementProvider } from '@/contexts/CostManagementContext';

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Flavor Pulse - Transform Your Restaurant's Bottom Line",
  description:
    "AI-powered purchasing assistant for independent restaurants. Double your profitability with smart ingredient tracking and supplier optimization.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <RestaurantProvider>
          <CostManagementProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-semibold">Flavor Pulse</h1>
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-2 sm:p-4">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </CostManagementProvider>
        </RestaurantProvider>
      </body>
    </html>
  )
}
