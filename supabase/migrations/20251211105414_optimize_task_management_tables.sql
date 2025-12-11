/*
  # Optimize Task Management Tables

  1. Performance Improvements
    - Add covering index for foreign key on monthly_tasks.task_template_id
    - Remove unused index idx_monthly_tasks_user_id
    - Optimize RLS policies to use subqueries for auth functions

  2. Security Improvements
    - Replace direct auth.uid() calls with (select auth.uid()) subqueries
    - This improves performance at scale by caching the result
*/

-- Add index for foreign key relationship
CREATE INDEX IF NOT EXISTS idx_monthly_tasks_task_template_id 
ON monthly_tasks(task_template_id);

-- Drop unused index
DROP INDEX IF EXISTS idx_monthly_tasks_user_id;

-- Drop old RLS policies for task_templates
DROP POLICY IF EXISTS "Users can view own task templates" ON task_templates;
DROP POLICY IF EXISTS "Users can create own task templates" ON task_templates;
DROP POLICY IF EXISTS "Users can update own task templates" ON task_templates;
DROP POLICY IF EXISTS "Users can delete own task templates" ON task_templates;

-- Create optimized RLS policies for task_templates using subqueries
CREATE POLICY "Users can view own task templates"
  ON task_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = (select auth.uid()));

CREATE POLICY "Users can create own task templates"
  ON task_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = (select auth.uid()));

CREATE POLICY "Users can update own task templates"
  ON task_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = (select auth.uid()))
  WITH CHECK (auth.uid() = (select auth.uid()));

CREATE POLICY "Users can delete own task templates"
  ON task_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = (select auth.uid()));

-- Drop old RLS policies for monthly_tasks
DROP POLICY IF EXISTS "Users can view own monthly tasks" ON monthly_tasks;
DROP POLICY IF EXISTS "Users can create own monthly tasks" ON monthly_tasks;
DROP POLICY IF EXISTS "Users can update own monthly tasks" ON monthly_tasks;
DROP POLICY IF EXISTS "Users can delete own monthly tasks" ON monthly_tasks;

-- Create optimized RLS policies for monthly_tasks using subqueries
CREATE POLICY "Users can view own monthly tasks"
  ON monthly_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = (select auth.uid()));

CREATE POLICY "Users can create own monthly tasks"
  ON monthly_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = (select auth.uid()));

CREATE POLICY "Users can update own monthly tasks"
  ON monthly_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = (select auth.uid()))
  WITH CHECK (auth.uid() = (select auth.uid()));

CREATE POLICY "Users can delete own monthly tasks"
  ON monthly_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = (select auth.uid()));
