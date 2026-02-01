import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { calculateCreditsFromTokens } from '@/lib/stripe'
import { deductCredits } from '@/lib/credits'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const DEFAULT_MODEL = 'gpt-3.5-turbo'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationId, model = DEFAULT_MODEL } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    // Check user credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    const currentCredits = parseFloat(profile.credits as any)
    
    // Get chat history if conversationId exists
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
    let finalConversationId = conversationId
    
    if (conversationId) {
      const { data: history } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      
      if (history) {
        messages = history.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }))
      }
    } else {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({ user_id: user.id })
        .select()
        .single()
      
      if (!convError && newConversation) {
        finalConversationId = newConversation.id
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message })

    // Call OpenAI API
    let completion: OpenAI.Chat.Completions.ChatCompletion
    try {
      completion = await openai.chat.completions.create({
        model: model as string,
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      })
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)
      return NextResponse.json(
        { error: openaiError.message || 'Failed to call OpenAI API' },
        { status: 500 }
      )
    }

    const assistantMessage = completion.choices[0]?.message?.content || ''
    const inputTokens = completion.usage?.prompt_tokens || 0
    const outputTokens = completion.usage?.completion_tokens || 0
    const totalTokens = completion.usage?.total_tokens || 0
    
    const creditsCost = calculateCreditsFromTokens(
      inputTokens,
      outputTokens,
      model as keyof typeof import('@/lib/stripe').MODEL_PRICING
    )

    // Check if user has enough credits
    if (creditsCost > currentCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits.' },
        { status: 402 }
      )
    }

    // Deduct credits atomically
    const deductResult = await deductCredits(user.id, creditsCost)

    if (!deductResult.success) {
      return NextResponse.json(
        { error: deductResult.error || 'Failed to deduct credits' },
        { status: 500 }
      )
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'user',
      content: message,
      tokens_used: 0,
      credits_cost: 0,
      conversation_id: finalConversationId,
      model: model as string,
    })

    // Save assistant reply
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'assistant',
      content: assistantMessage,
      tokens_used: totalTokens,
      credits_cost: creditsCost,
      conversation_id: finalConversationId,
      model: model as string,
    })

    // Update conversation updated_at
    if (finalConversationId) {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', finalConversationId)
    }

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'usage',
      amount: -creditsCost,
      description: `Used ${totalTokens} tokens (${creditsCost.toFixed(4)} credits) - ${model}`,
    })

    return NextResponse.json({
      message: assistantMessage,
      conversationId: finalConversationId,
      tokensUsed: totalTokens,
      inputTokens,
      outputTokens,
      creditsCost,
      remainingCredits: deductResult.remainingCredits,
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Chat request failed' },
      { status: 500 }
    )
  }
}
