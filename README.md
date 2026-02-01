# GPT Credits Chat Application

A full-stack Next.js application that enables users to register, purchase credits, and chat with GPT models using a credit-based system.

## Tech Stack

- **Frontend**: Next.js 14 (React) with TypeScript
- **Backend**: Next.js API Routes
- **Authentication & Database**: Supabase (Auth + Postgres + RLS)
- **Payment**: Stripe Checkout + Webhook
- **AI Models**: OpenAI API
- **Deployment**: Vercel

## Features

- ✅ User registration/login (Supabase Auth)
- ✅ Credit purchase system (Stripe)
- ✅ GPT chat functionality (OpenAI API)
- ✅ Token-based credit deduction
- ✅ Chat history and conversation management
- ✅ Transaction history
- ✅ Row Level Security (RLS) data protection
- ✅ Atomic credit operations (race condition prevention)

## Prerequisites

Before deploying, you need to set up accounts and obtain API keys:

### 1. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. In the SQL Editor, run the SQL from `supabase/schema.sql` to create tables
3. Get your project credentials:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon Key (found in Settings > API)
   - Service Role Key (found in Settings > API - **keep this secret!**)

### 2. Stripe Setup

1. Go to [Stripe](https://stripe.com) and create an account
2. Get your API keys from the Dashboard:
   - Publishable Key (starts with `pk_test_` or `pk_live_`)
   - Secret Key (starts with `sk_test_` or `sk_live_`)
3. Set up a Webhook:
   - Go to Developers > Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Select event: `checkout.session.completed`
   - Copy the Webhook Signing Secret (starts with `whsec_`)

### 3. OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an API key in the API Keys section
3. Copy the key (starts with `sk-`)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For production (Vercel)**, set these in Vercel's environment variables.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### Step 1: Push to GitHub

1. Initialize git repository:
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub

3. Push to GitHub:
```bash
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure environment variables in Vercel:
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.local`
   - **Important**: Update `NEXT_PUBLIC_APP_URL` to your Vercel domain (e.g., `https://your-app.vercel.app`)
5. Click "Deploy"

### Step 3: Update Stripe Webhook

1. After deployment, update your Stripe webhook URL:
   - Go to Stripe Dashboard > Webhooks
   - Edit your webhook endpoint
   - Update URL to: `https://your-app.vercel.app/api/stripe/webhook`
   - Save the new webhook secret and update it in Vercel environment variables

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/callback/      # Supabase auth callback
│   │   ├── chat/               # GPT chat API
│   │   ├── stripe/             # Stripe payment APIs
│   │   └── user/               # User-related APIs
│   ├── dashboard/              # Main application page
│   ├── layout.tsx
│   └── page.tsx                # Login page
├── components/
│   ├── ChatInterface.tsx       # Chat UI component
│   ├── CreditsDisplay.tsx      # Credits display
│   ├── DashboardClient.tsx     # Main dashboard
│   ├── LoginPage.tsx           # Login page
│   └── PurchaseCredits.tsx     # Purchase credits UI
├── lib/
│   ├── supabase/              # Supabase clients
│   ├── stripe.ts              # Stripe configuration
│   └── credits.ts             # Credit operations
└── supabase/
    └── schema.sql             # Database schema
```

## Architecture

### Credit System

- **Purchase**: User pays via Stripe → Webhook verifies → Credits added
- **Deduction**: GPT call → Calculate tokens → Atomically deduct credits
- **Rate**: 1 Credit = 1000 Tokens (configurable in `lib/stripe.ts`)

### Security

- OpenAI API key only used on backend
- Supabase RLS protects user data
- Stripe webhook signature verification
- Atomic credit operations prevent race conditions

### Data Flow

1. **Payment Flow**: User selects package → Stripe Checkout → Payment success → Webhook → Update credits
2. **Chat Flow**: User sends message → Check credits → Call OpenAI → Deduct credits → Save records

## Extensibility

The codebase is designed for easy extension:

- **New Models**: Add to `MODEL_PRICING` in `lib/stripe.ts`
- **New Packages**: Add to `CREDIT_PACKAGES` in `lib/stripe.ts`
- **Rate Limiting**: Can add middleware in API routes
- **Analytics**: Transaction and chat tables support analytics queries
- **Streaming**: Can extend chat API to support streaming responses

## Troubleshooting

### Webhook not working
- Verify webhook URL is correct in Stripe
- Check webhook secret matches in Vercel env vars
- Check Vercel function logs for errors

### Credits not updating
- Check Supabase RLS policies are correct
- Verify service role key has proper permissions
- Check transaction table for duplicate payment_intent_id

### OpenAI API errors
- Verify API key is correct
- Check API key has sufficient credits/quota
- Review OpenAI API status

## License

MIT
