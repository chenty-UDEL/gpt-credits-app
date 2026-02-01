'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ChatInterface from './ChatInterface'
import CreditsDisplay from './CreditsDisplay'
import PurchaseCredits from './PurchaseCredits'

export default function DashboardClient() {
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    checkUser()
    fetchCredits()
    
    // Poll for credits updates
    const interval = setInterval(fetchCredits, 5000)
    return () => clearInterval(interval)
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    setUser(user)
    setLoading(false)
  }

  async function fetchCredits() {
    try {
      const response = await fetch('/api/user/credits')
      if (response.ok) {
        const data = await response.json()
        setCredits(data.credits)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">GPT Chat</h1>
            <div className="flex items-center gap-4">
              <CreditsDisplay credits={credits} />
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChatInterface onCreditsUpdate={fetchCredits} />
          </div>
          <div className="lg:col-span-1">
            <PurchaseCredits onPurchaseSuccess={fetchCredits} />
          </div>
        </div>
      </main>
    </div>
  )
}
