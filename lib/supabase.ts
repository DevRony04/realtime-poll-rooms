import { createClient } from '@supabase/supabase-js'

// Supabase client for client-side operations
// Uses the anon key which respects Row Level Security (RLS) policies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Supabase client for server-side operations (optional)
// Uses the service role key which bypasses RLS - use with caution!
// Only use this in API routes or server components where you need admin access
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null

// Type definitions for your database schema (optional but recommended)
// You can generate these automatically with: npx supabase gen types typescript --project-id your-project-id
export type Database = {
    public: {
        Tables: {
            Poll: {
                Row: {
                    id: string
                    question: string
                    createdAt: string
                    updatedAt: string
                    expiresAt: string | null
                }
                Insert: {
                    id?: string
                    question: string
                    createdAt?: string
                    updatedAt?: string
                    expiresAt?: string | null
                }
                Update: {
                    id?: string
                    question?: string
                    createdAt?: string
                    updatedAt?: string
                    expiresAt?: string | null
                }
            }
            Option: {
                Row: {
                    id: string
                    text: string
                    pollId: string
                    position: number
                }
                Insert: {
                    id?: string
                    text: string
                    pollId: string
                    position: number
                }
                Update: {
                    id?: string
                    text?: string
                    pollId?: string
                    position?: number
                }
            }
            Vote: {
                Row: {
                    id: string
                    pollId: string
                    optionId: string
                    ipAddress: string | null
                    fingerprint: string | null
                    userAgent: string | null
                    createdAt: string
                }
                Insert: {
                    id?: string
                    pollId: string
                    optionId: string
                    ipAddress?: string | null
                    fingerprint?: string | null
                    userAgent?: string | null
                    createdAt?: string
                }
                Update: {
                    id?: string
                    pollId?: string
                    optionId?: string
                    ipAddress?: string | null
                    fingerprint?: string | null
                    userAgent?: string | null
                    createdAt?: string
                }
            }
        }
    }
}
