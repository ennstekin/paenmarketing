export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ChannelType = 'email' | 'sms' | 'meta_ads' | 'instagram'
export type ItemStatus = 'planned' | 'in_progress' | 'completed'
export type UserRole = 'admin' | 'editor' | 'viewer'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          description: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          role: UserRole
          resource: string
          action: string
          allowed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          role: UserRole
          resource: string
          action: string
          allowed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          role?: UserRole
          resource?: string
          action?: string
          allowed?: boolean
          created_at?: string
        }
      }
      marketing_items: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          channel: ChannelType
          status: ItemStatus
          scheduled_date: string | null
          scheduled_time: string | null
          actual_publish_date: string | null
          notes: string | null
          target_audience: string | null
          budget: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          channel: ChannelType
          status?: ItemStatus
          scheduled_date?: string | null
          scheduled_time?: string | null
          actual_publish_date?: string | null
          notes?: string | null
          target_audience?: string | null
          budget?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          channel?: ChannelType
          status?: ItemStatus
          scheduled_date?: string | null
          scheduled_time?: string | null
          actual_publish_date?: string | null
          notes?: string | null
          target_audience?: string | null
          budget?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          marketing_item_id: string
          name: string
          url: string
          file_type: string | null
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          marketing_item_id: string
          name: string
          url: string
          file_type?: string | null
          file_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          marketing_item_id?: string
          name?: string
          url?: string
          file_type?: string | null
          file_size?: number | null
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      item_tags: {
        Row: {
          marketing_item_id: string
          tag_id: string
        }
        Insert: {
          marketing_item_id: string
          tag_id: string
        }
        Update: {
          marketing_item_id?: string
          tag_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      channel_type: ChannelType
      item_status: ItemStatus
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type MarketingItem = Tables<'marketing_items'>
export type Profile = Tables<'profiles'>
export type Attachment = Tables<'attachments'>
export type Tag = Tables<'tags'>
export type ActivityLog = Tables<'activity_logs'>
export type Permission = Tables<'permissions'>
