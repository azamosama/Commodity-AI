"use client"

import { useState } from "react"

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold">Sign Up</h1>
        <p className="mt-2 text-gray-600">Tell us about your business and we'll get you set up.</p>

        {!submitted ? (
          <form
            name="flavorpulse-signup"
            method="POST"
            data-netlify="true"
            className="mt-8 grid grid-cols-1 gap-5"
            onSubmit={() => setSubmitted(true)}
          >
            <input type="hidden" name="form-name" value="flavorpulse-signup" />

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
              <label className="block text-sm font-medium text-gray-700">Anything else?</label>
              <textarea name="notes" rows={4} className="mt-1 w-full rounded border px-3 py-2" />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-white font-medium shadow hover:bg-indigo-700"
            >
              Submit
            </button>

            <p className="text-xs text-gray-500">This form is processed by Netlify Forms. Notifications can be set to forward to info@flavorpulse.net.</p>
          </form>
        ) : (
          <div className="mt-10 rounded border p-6 bg-green-50 text-green-800">
            Thanks! We'll reach out shortly.
          </div>
        )}
      </div>
    </main>
  )
}


