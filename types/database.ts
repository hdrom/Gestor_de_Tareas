export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      task_templates: {
        Row: {
          id: string;
          title: string;
          category: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      monthly_tasks: {
        Row: {
          id: string;
          task_template_id: string | null;
          title: string;
          category: string;
          month: number;
          year: number;
          completed: boolean;
          notes: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_template_id?: string | null;
          title: string;
          category: string;
          month: number;
          year: number;
          completed?: boolean;
          notes?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_template_id?: string | null;
          title?: string;
          category?: string;
          month?: number;
          year?: number;
          completed?: boolean;
          notes?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
}
