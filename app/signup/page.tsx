"use client"

import * as React from "react"
import Link from "next/link"

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <header className="w-full border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-center">
          <div className="flex items-center space-x-3">
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

      <section className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center py-16">
          <h1 className="text-3xl font-bold">Get in Touch</h1>
          <p className="mt-3 text-gray-600">
            We’re currently onboarding new partners via email. Please contact us and we’ll set up your account.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:info@flavorpulse.net"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-8 py-3 text-white font-medium shadow hover:bg-indigo-700 transition-colors"
            >
              Email us: info@flavorpulse.net
            </a>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-8 py-3 text-gray-800 font-medium hover:bg-gray-50 transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}


