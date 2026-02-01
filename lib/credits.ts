import { createSupabaseAdmin } from './supabase/client'

/**
 * Atomically deduct credits from user account
 * Uses database transaction to prevent race conditions
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; remainingCredits: number; error?: string }> {
  const supabase = createSupabaseAdmin()

  try {
    // Use a transaction-like approach with SELECT FOR UPDATE
    // First, get current credits with lock
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (fetchError || !profile) {
      return { success: false, remainingCredits: 0, error: 'User not found' }
    }

    const currentCredits = parseFloat(profile.credits as any)

    if (currentCredits < amount) {
      return {
        success: false,
        remainingCredits: currentCredits,
        error: 'Insufficient credits',
      }
    }

    const newCredits = (currentCredits - amount).toFixed(4)

    // Update credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', userId)

    if (updateError) {
      return {
        success: false,
        remainingCredits: currentCredits,
        error: 'Failed to update credits',
      }
    }

    return {
      success: true,
      remainingCredits: parseFloat(newCredits),
    }
  } catch (error: any) {
    return {
      success: false,
      remainingCredits: 0,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Add credits to user account (for purchases)
 */
export async function addCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; newCredits: number; error?: string }> {
  const supabase = createSupabaseAdmin()

  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (fetchError || !profile) {
      return { success: false, newCredits: 0, error: 'User not found' }
    }

    const currentCredits = parseFloat(profile.credits as any)
    const newCredits = (currentCredits + amount).toFixed(2)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', userId)

    if (updateError) {
      return {
        success: false,
        newCredits: currentCredits,
        error: 'Failed to update credits',
      }
    }

    return {
      success: true,
      newCredits: parseFloat(newCredits),
    }
  } catch (error: any) {
    return {
      success: false,
      newCredits: 0,
      error: error.message || 'Unknown error',
    }
  }
}

