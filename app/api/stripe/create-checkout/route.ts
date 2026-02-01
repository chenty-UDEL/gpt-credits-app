import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { stripe, CREDIT_PACKAGES } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packageType } = await request.json()
    
    if (!packageType || !(packageType in CREDIT_PACKAGES)) {
      return NextResponse.json({ error: 'Invalid package type' }, { status: 400 })
    }

    const packageInfo = CREDIT_PACKAGES[packageType as keyof typeof CREDIT_PACKAGES]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${packageInfo.name} - ${packageInfo.credits} Credits`,
              description: `Purchase ${packageInfo.credits} Credits`,
            },
            unit_amount: Math.round(packageInfo.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/dashboard?success=true`,
      cancel_url: `${appUrl}/dashboard?canceled=true`,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        credits: packageInfo.credits.toString(),
        packageType,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
