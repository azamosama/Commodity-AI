import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { RestaurantProvider } from "@/contexts/restaurant-context"
import { CostManagementProvider } from '@/contexts/CostManagementContext';
import { AlertBannerProvider } from '@/contexts/AlertBannerContext';

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
            <AlertBannerProvider>
              {children}
            </AlertBannerProvider>
          </CostManagementProvider>
        </RestaurantProvider>
      </body>
    </html>
  )
}
