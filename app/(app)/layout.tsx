"use client"

import type React from "react"
import { Suspense } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { RestaurantIndicator } from '@/components/RestaurantIndicator';
import { GlobalAlertBanner } from '@/components/GlobalAlertBanner';
import { DynamicLayout } from '@/components/DynamicLayout';
import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={<div>Loading sidebar...</div>}>
        <AppSidebar />
      </Suspense>
      <SidebarInset className="relative">
        <GlobalAlertBanner />
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link 
              href="/landing"
              onClick={(e) => {
                const confirmed = window.confirm('You are leaving the demo, your data will not be saved.');
                if (!confirmed) {
                  e.preventDefault();
                }
              }}
            >
              <img 
                src="/flavor-pulse-logo.png" 
                alt="Flavor Pulse Logo" 
                className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                style={{ 
                  display: 'block',
                  maxWidth: '150px',
                  height: '48px',
                  objectFit: 'contain'
                }}
              />
            </Link>
          </div>
          <div className="flex-1" />
        </header>
        <DynamicLayout>
          <RestaurantIndicator />
          {children}
        </DynamicLayout>
      </SidebarInset>
    </SidebarProvider>
  )
}
