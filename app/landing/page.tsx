"use client"

import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <header className="w-full border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            {/* Flavor Pulse Logo */}
            <Link href="/landing">
              <img 
                src="/flavor-pulse-logo.png" 
                alt="Flavor Pulse Logo" 
                className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-gray-900 mb-8">
            Flavor Pulse: Your AI Restaurant Consultant
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Transform Your Restaurant's Bottom Line with AI-Powered Cost Management
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-8 py-4 text-lg text-white font-medium shadow hover:bg-indigo-700 transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-8 py-4 text-lg text-gray-800 font-medium hover:bg-gray-50 transition-colors"
            >
              Try Demo
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <Feature
              title="Live Costing"
              desc="Auto-updated ingredient prices with per-serving cost and profit insights."
            />
            <Feature
              title="Smart Exports"
              desc="Share exact table views to CSV/Excel with one click for managers."
            />
            <Feature
              title="AI Menu Ideas"
              desc="Generate seasonal, cost-effective menu items based on your cuisine."
            />
          </div>
        </div>
      </section>

      <footer className="border-t bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} FlavorPulse</span>
          <div className="space-x-4">
            <a href="mailto:info@flavorpulse.net" className="hover:text-gray-700">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-5 rounded-lg border bg-white">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </div>
  )
}


