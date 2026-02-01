import Stripe from 'stripe'

// Initialize Stripe client without explicit API version (uses default)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Credit packages configuration (USD)
export const CREDIT_PACKAGES = {
  small: { credits: 1000, price: 9.99, name: 'Starter' },
  medium: { credits: 5000, price: 39.99, name: 'Professional' },
  large: { credits: 15000, price: 99.99, name: 'Enterprise' },
} as const

// Token to credit conversion rate
// 1 credit = 1000 tokens (adjustable)
export const TOKENS_PER_CREDIT = 1000

// Model-specific pricing (can be extended)
export const MODEL_PRICING = {
  'gpt-3.5-turbo': { inputMultiplier: 1.0, outputMultiplier: 1.0 },
  'gpt-4': { inputMultiplier: 15.0, outputMultiplier: 30.0 },
  'gpt-4-turbo': { inputMultiplier: 10.0, outputMultiplier: 30.0 },
} as const

export function calculateCreditsFromTokens(
  inputTokens: number,
  outputTokens: number,
  model: keyof typeof MODEL_PRICING = 'gpt-3.5-turbo'
): number {
  const pricing = MODEL_PRICING[model]
  const inputCredits = (inputTokens / TOKENS_PER_CREDIT) * pricing.inputMultiplier
  const outputCredits = (outputTokens / TOKENS_PER_CREDIT) * pricing.outputMultiplier
  return inputCredits + outputCredits
}
