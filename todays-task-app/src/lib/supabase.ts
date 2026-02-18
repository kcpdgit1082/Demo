import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface Task {
  id: string;
  user_id: string;
  title: string;
  jira_ticket_link: string | null;
  encrypted_data: string;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
  is_today: boolean;
  completed_at: string | null;
}

export interface ChecklistItem {
  id: string;
  task_id: string;
  encrypted_data: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

// Decrypted types (for use in the app)
export interface DecryptedTask extends Omit<Task, 'encrypted_data'> {
  description: string;
  checklist: DecryptedChecklistItem[];
}

export interface DecryptedChecklistItem extends Omit<ChecklistItem, 'encrypted_data'> {
  text: string;
}
