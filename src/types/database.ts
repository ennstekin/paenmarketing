export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ChannelType = string
export type ItemStatus = 'planned' | 'in_progress' | 'completed'
export type UserRole = 'admin' | 'editor' | 'viewer'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested'
export type NotificationType = 'mention' | 'comment' | 'assignment' | 'approval_request' | 'approval_response' | 'deadline' | 'status_change'
export type Priority = 'low' | 'normal' | 'high' | 'urgent'
export type ContentType = 'post' | 'story' | 'reel' | 'article' | 'newsletter' | 'ad'

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
          must_change_password: boolean
          temp_password_hint: string | null
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
          must_change_password?: boolean
          temp_password_hint?: string | null
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
          must_change_password?: boolean
          temp_password_hint?: string | null
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
          channels: ChannelType[]
          status: ItemStatus
          scheduled_date: string | null
          scheduled_time: string | null
          actual_publish_date: string | null
          notes: string | null
          url: string | null
          assigned_to: string | null
          assigned_at: string | null
          assigned_by: string | null
          priority: Priority
          content_type: ContentType | null
          deadline: string | null
          campaign_id: string | null
          checklist: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          channel?: ChannelType
          channels?: ChannelType[]
          status?: ItemStatus
          scheduled_date?: string | null
          scheduled_time?: string | null
          actual_publish_date?: string | null
          notes?: string | null
          url?: string | null
          assigned_to?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          priority?: Priority
          content_type?: ContentType | null
          deadline?: string | null
          campaign_id?: string | null
          checklist?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          channel?: ChannelType
          channels?: ChannelType[]
          status?: ItemStatus
          scheduled_date?: string | null
          scheduled_time?: string | null
          actual_publish_date?: string | null
          notes?: string | null
          url?: string | null
          assigned_to?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          priority?: Priority
          content_type?: ContentType | null
          deadline?: string | null
          campaign_id?: string | null
          checklist?: Json
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
      channels: {
        Row: {
          id: string
          name: string
          label: string
          color: string
          icon: string
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          label: string
          color: string
          icon?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          label?: string
          color?: string
          icon?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          marketing_item_id: string
          user_id: string | null
          parent_id: string | null
          content: string
          mentions: string[]
          is_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          marketing_item_id: string
          user_id?: string | null
          parent_id?: string | null
          content: string
          mentions?: string[]
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          marketing_item_id?: string
          user_id?: string | null
          parent_id?: string | null
          content?: string
          mentions?: string[]
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          message: string | null
          link: string | null
          metadata: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          message?: string | null
          link?: string | null
          metadata?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title?: string
          message?: string | null
          link?: string | null
          metadata?: Json
          is_read?: boolean
          created_at?: string
        }
      }
      approval_requests: {
        Row: {
          id: string
          marketing_item_id: string
          requester_id: string
          reviewer_id: string | null
          status: ApprovalStatus
          notes: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          marketing_item_id: string
          requester_id: string
          reviewer_id?: string | null
          status?: ApprovalStatus
          notes?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          marketing_item_id?: string
          requester_id?: string
          reviewer_id?: string | null
          status?: ApprovalStatus
          notes?: string | null
          reviewed_at?: string | null
          created_at?: string
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
export type Comment = Tables<'comments'>
export type Notification = Tables<'notifications'>
export type ApprovalRequest = Tables<'approval_requests'>

export interface Channel {
  id: string
  name: string
  label: string
  color: string
  icon: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}
