import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { RestaurantProvider } from "@/contexts/restaurant-context"

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
      <body className={inter.className}>
        <RestaurantProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">Flavor Pulse</h1>
                </div>
              </header>
              <main className="flex-1 overflow-auto p-4">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </RestaurantProvider>
      </body>
    </html>
  )
}
