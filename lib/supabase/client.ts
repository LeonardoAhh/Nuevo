import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// Tipos para las tablas de Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          display_name: string
          email: string
          bio: string | null
          website: string | null
          avatar_url: string | null
          job_title: string | null
          company: string | null
          location: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          display_name: string
          email: string
          bio?: string | null
          website?: string | null
          avatar_url?: string | null
          job_title?: string | null
          company?: string | null
          location?: string | null
          timezone: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          display_name?: string
          email?: string
          bio?: string | null
          website?: string | null
          avatar_url?: string | null
          job_title?: string | null
          company?: string | null
          location?: string | null
          timezone?: string
        }
      }
      skills: {
        Row: {
          id: string
          user_id: string
          skill_name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_name: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_name?: string
        }
      }
    }
  }
}