export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          credits?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'purchase' | 'usage' | 'refund'
          amount: number
          description: string | null
          stripe_payment_intent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'purchase' | 'usage' | 'refund'
          amount: number
          description?: string | null
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'purchase' | 'usage' | 'refund'
          amount?: number
          description?: string | null
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          tokens_used: number
          credits_cost: number
          conversation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          tokens_used?: number
          credits_cost?: number
          conversation_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'user' | 'assistant'
          content?: string
          tokens_used?: number
          credits_cost?: number
          conversation_id?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

