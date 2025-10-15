"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <header className="w-full border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            {/* Flavor Pulse Logo */}
            <Link 
              href="/landing"
              onClick={(e) => {
                if (!submitted) {
                  const confirmed = window.confirm('You are leaving the sign up form, changes will not be saved.');
                  if (!confirmed) {
                    e.preventDefault();
                  }
                }
              }}
            >
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
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold">Sign Up</h1>
          <p className="mt-2 text-gray-600">Tell us about your business and we'll get you set up.</p>

        {!submitted ? (
          <form
            className="mt-8 grid grid-cols-1 gap-5"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              
              // Get form data
              const company = formData.get('company') as string;
              const name = formData.get('name') as string;
              const email = formData.get('email') as string;
              const phone = formData.get('phone') as string;
              const locations = formData.get('locations') as string;
              const referrer = formData.get('referrer') as string;
              const restaurant_type = formData.get('restaurant_type') as string;
              const notes = formData.get('notes') as string;
              
              try {
                // Submit to API
                const response = await fetch('/api/signup', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    company,
                    name,
                    email,
                    phone,
                    locations,
                    referrer,
                    restaurant_type,
                    notes,
                  }),
                });

                if (response.ok) {
                  setSubmitted(true);
                } else {
                  alert('There was an error submitting your form. Please try again.');
                }
              } catch (error) {
                console.error('Error submitting form:', error);
                alert('There was an error submitting your form. Please try again.');
              }
            }}
          >

            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input name="company" required className="mt-1 w-full rounded border px-3 py-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                <input name="name" required className="mt-1 w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="email" type="email" required className="mt-1 w-full rounded border px-3 py-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input name="phone" type="tel" className="mt-1 w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Locations</label>
                <input name="locations" type="number" min={1} className="mt-1 w-full rounded border px-3 py-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">How did you hear about us?</label>
                <select name="referrer" className="mt-1 w-full rounded border px-3 py-2">
                  <option>Google</option>
                  <option>Referral</option>
                  <option>Social Media</option>
                  <option>Event/Conference</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type of Restaurant</label>
                <select name="restaurant_type" className="mt-1 w-full rounded border px-3 py-2">
                  <option>Fast Casual</option>
                  <option>Fine Dining</option>
                  <option>Casual Dining</option>
                  <option>Quick Service</option>
                  <option>Cafe/Bakery</option>
                  <option>Food Truck</option>
                  <option>Catering</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Anything else?</label>
              <textarea name="notes" rows={4} className="mt-1 w-full rounded border px-3 py-2" />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-white font-medium shadow hover:bg-indigo-700"
            >
              Submit
            </button>
          </form>
        ) : (
          <div className="mt-10 rounded border p-6 bg-green-50 text-green-800">
            Thanks! We'll reach out shortly.
          </div>
        )}
        </div>
      </section>
    </main>
  )
}


