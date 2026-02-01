import { createSupabaseAdmin } from '@/lib/supabase/client'
import { stripe } from '@/lib/stripe'
import { addCredits } from '@/lib/credits'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    
    const userId = session.metadata?.userId
    const credits = parseFloat(session.metadata?.credits || '0')
    const paymentIntentId = session.payment_intent as string

    if (!userId || !credits) {
      console.error('Missing userId or credits in session metadata')
      return NextResponse.json({ error: 'Invalid session data' }, { status: 400 })
    }

    const supabase = createSupabaseAdmin()

    try {
      // Check if transaction already processed (idempotency)
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single()

      if (existingTransaction) {
        console.log(`Transaction ${paymentIntentId} already processed`)
        return NextResponse.json({ received: true, message: 'Already processed' })
      }

      // Add credits
      const result = await addCredits(userId, credits)

      if (!result.success) {
        throw new Error(result.error || 'Failed to add credits')
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'purchase',
          amount: credits,
          description: `Purchased ${credits} Credits`,
          stripe_payment_intent_id: paymentIntentId,
        })

      if (transactionError) {
        throw transactionError
      }

      console.log(`Successfully added ${credits} credits to user ${userId}`)
    } catch (error: any) {
      console.error('Error processing webhook:', error)
      return NextResponse.json(
        { error: 'Failed to process webhook' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}
