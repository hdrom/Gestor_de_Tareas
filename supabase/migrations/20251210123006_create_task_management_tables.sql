/*
  # Task Management System

  1. New Tables
    - `task_templates`
      - `id` (uuid, primary key) - Unique identifier
      - `title` (text) - Task description (e.g., "Pagar Teléfono")
      - `category` (text) - Task classifier (e.g., "Pago", "Recordatorio")
      - `user_id` (uuid) - Owner of the template
      - `created_at` (timestamptz) - Creation timestamp
      
    - `monthly_tasks`
      - `id` (uuid, primary key) - Unique identifier
      - `task_template_id` (uuid, nullable) - Reference to template if created from one
      - `title` (text) - Task description
      - `category` (text) - Task classifier
      - `month` (integer) - Month number (1-12)
      - `year` (integer) - Year
      - `completed` (boolean) - Completion status
      - `notes` (text) - Additional notes (max 50 characters)
      - `user_id` (uuid) - Owner of the task
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on both tables
    - Users can only view and manage their own tasks
    - Policies for SELECT, INSERT, UPDATE, DELETE operations
*/

-- Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create monthly_tasks table
CREATE TABLE IF NOT EXISTS monthly_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_template_id uuid REFERENCES task_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  category text NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  completed boolean DEFAULT false,
  notes text DEFAULT '',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for task_templates
CREATE POLICY "Users can view own task templates"
  ON task_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own task templates"
  ON task_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task templates"
  ON task_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own task templates"
  ON task_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for monthly_tasks
CREATE POLICY "Users can view own monthly tasks"
  ON monthly_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own monthly tasks"
  ON monthly_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly tasks"
  ON monthly_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly tasks"
  ON monthly_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON task_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_tasks_user_id ON monthly_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_tasks_month_year ON monthly_tasks(month, year);
