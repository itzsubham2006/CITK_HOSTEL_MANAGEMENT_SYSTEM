export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'student' | 'admin' | 'warden'
export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved'
export type ComplaintCategory =
  | 'Electricity'
  | 'Water'
  | 'Cleanliness'
  | 'Food'
  | 'Furniture'
  | 'Internet'
  | 'Security'
  | 'Bathroom'
  | 'Other'
export type HostelName = 'SNM' | 'SJ' | 'JD' | 'BJ' | 'Bakhungri' | 'Gambari'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          hostel: HostelName | null
          room_no: string | null
          role: UserRole
          profile_pic_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          hostel?: HostelName | null
          room_no?: string | null
          role?: UserRole
          profile_pic_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          hostel?: HostelName | null
          room_no?: string | null
          role?: UserRole
          profile_pic_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      complaints: {
        Row: {
          id: number
          user_id: string
          hostel: HostelName
          category: ComplaintCategory
          description: string
          status: ComplaintStatus
          image_url: string | null
          upvotes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          hostel: HostelName
          category: ComplaintCategory
          description: string
          status?: ComplaintStatus
          image_url?: string | null
          upvotes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          hostel?: HostelName
          category?: ComplaintCategory
          description?: string
          status?: ComplaintStatus
          image_url?: string | null
          upvotes?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      complaint_upvotes: {
        Row: {
          id: number
          user_id: string
          complaint_id: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          complaint_id: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          complaint_id?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_upvotes_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      announcements: {
        Row: {
          id: number
          author_id: string | null
          title: string
          message: string
          hostel: HostelName | null
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          author_id?: string | null
          title: string
          message: string
          hostel?: HostelName | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          author_id?: string | null
          title?: string
          message?: string
          hostel?: HostelName | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: number
          user_id: string
          message: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          message: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          message?: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      hostel_diaries: {
        Row: {
          id: number
          user_id: string
          image_url: string
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          image_url: string
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          image_url?: string
          caption?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_diaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      diary_likes: {
        Row: {
          id: number
          user_id: string
          diary_id: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          diary_id: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          diary_id?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_likes_diary_id_fkey"
            columns: ["diary_id"]
            isOneToOne: false
            referencedRelation: "hostel_diaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      diary_comments: {
        Row: {
          id: number
          user_id: string
          diary_id: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          diary_id: number
          comment: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          diary_id?: number
          comment?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_comments_diary_id_fkey"
            columns: ["diary_id"]
            isOneToOne: false
            referencedRelation: "hostel_diaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback: {
        Row: {
          id: number
          user_id: string | null
          username: string
          email: string
          feedback: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          username: string
          email: string
          feedback: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          username?: string
          email?: string
          feedback?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      anti_ragging_reports: {
        Row: {
          id: number
          full_name: string
          email: string
          mobile: string
          college: string
          year: string
          complaint: string
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          full_name: string
          email: string
          mobile: string
          college: string
          year: string
          complaint: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          full_name?: string
          email?: string
          mobile?: string
          college?: string
          year?: string
          complaint?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          id: number
          email: string
          otp_code: string
          expires_at: string
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: number
          email: string
          otp_code: string
          expires_at: string
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          email?: string
          otp_code?: string
          expires_at?: string
          verified?: boolean
          created_at?: string
        }
        Relationships: []
      }
      admin_emails: {
        Row: {
          id: number
          email: string
          added_by: string | null
          created_at: string
        }
        Insert: {
          id?: number
          email: string
          added_by?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          email?: string
          added_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_emails_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      warden_emails: {
        Row: {
          id: number
          email: string
          added_by: string | null
          created_at: string
        }
        Insert: {
          id?: number
          email: string
          added_by?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          email?: string
          added_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warden_emails_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      complaint_status: ComplaintStatus
      complaint_category: ComplaintCategory
      hostel_name: HostelName
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
