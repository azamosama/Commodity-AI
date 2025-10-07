"use client"

import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <header className="w-full border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded bg-orange-500" />
            <span className="text-xl font-semibold">FlavorPulse</span>
          </div>
          <nav className="hidden sm:flex items-center space-x-6 text-sm text-gray-600">
            <Link href="/landing" className="hover:text-gray-900">Home</Link>
            <Link href="/value-proposition" className="hover:text-gray-900">Why FlavorPulse</Link>
            <Link href="/recipes" className="hover:text-gray-900">Product</Link>
          </nav>
        </div>
      </header>

      <section className="flex-1">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            Profit-first restaurant operations, powered by live costs and AI.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            FlavorPulse helps restaurants track real-time ingredient costs, calculate recipe profitability,
            prevent waste, and forecast demand — all in one place.
          </p>

          <div className="mt-10 flex items-center justify-center gap-6">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-white font-medium shadow hover:bg-indigo-700"
            >
              Sign Up
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-6 py-3 text-gray-800 font-medium hover:bg-gray-50"
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
            <Link href="/questions" className="hover:text-gray-700">FAQ</Link>
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


