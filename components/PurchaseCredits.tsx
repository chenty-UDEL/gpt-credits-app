'use client'

import { useState } from 'react'
import { CREDIT_PACKAGES } from '@/lib/stripe'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PurchaseCreditsProps {
  onPurchaseSuccess: () => void
}

export default function PurchaseCredits({ onPurchaseSuccess }: PurchaseCreditsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handlePurchase(packageType: keyof typeof CREDIT_PACKAGES) {
    setLoading(packageType)
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageType }),
      })

      const { sessionId, url, error } = await response.json()

      if (error) {
        alert(`Error: ${error}`)
        return
      }

      if (url) {
        window.location.href = url
      } else if (sessionId) {
        const stripe = await stripePromise
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId })
        }
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      alert('Purchase failed, please try again')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Purchase Credits</h2>
      <div className="space-y-3">
        {Object.entries(CREDIT_PACKAGES).map(([key, pkg]) => (
          <button
            key={key}
            onClick={() => handlePurchase(key as keyof typeof CREDIT_PACKAGES)}
            disabled={loading !== null}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === key ? (
              'Processing...'
            ) : (
              <>
                {pkg.name} - {pkg.credits} Credits
                <span className="block text-sm opacity-90">
                  ${pkg.price}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Credits will be automatically added to your account after payment
      </p>
    </div>
  )
}
