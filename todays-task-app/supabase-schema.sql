-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  jira_ticket_link TEXT,
  encrypted_data TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_today BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  encrypted_data TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_is_today ON tasks(is_today);
CREATE INDEX idx_checklist_items_task_id ON checklist_items(task_id);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks table
-- Users can only see their own tasks
CREATE POLICY "Users can view own tasks" 
  ON tasks FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own tasks
CREATE POLICY "Users can insert own tasks" 
  ON tasks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks" 
  ON tasks FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own tasks
CREATE POLICY "Users can delete own tasks" 
  ON tasks FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for checklist_items table
-- Users can view checklist items for their own tasks
CREATE POLICY "Users can view own checklist items" 
  ON checklist_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = checklist_items.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Users can insert checklist items for their own tasks
CREATE POLICY "Users can insert own checklist items" 
  ON checklist_items FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = checklist_items.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Users can update checklist items for their own tasks
CREATE POLICY "Users can update own checklist items" 
  ON checklist_items FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = checklist_items.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Users can delete checklist items for their own tasks
CREATE POLICY "Users can delete own checklist items" 
  ON checklist_items FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = checklist_items.task_id 
      AND tasks.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at 
  BEFORE UPDATE ON checklist_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
