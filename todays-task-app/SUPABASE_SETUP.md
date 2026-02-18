# Supabase Setup Instructions

## Prerequisites
- A Supabase account (sign up at https://supabase.com)

## Setup Steps

### 1. Create a New Supabase Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details (name, database password, region)
4. Wait for the project to be provisioned

### 2. Run the Database Schema
1. In your Supabase project, navigate to the SQL Editor
2. Open the `supabase-schema.sql` file from this project
3. Copy and paste the entire content into the SQL Editor
4. Click "Run" to execute the schema

### 3. Enable Email Authentication
1. Go to Authentication → Providers in your Supabase dashboard
2. Make sure Email provider is enabled
3. Configure email templates if desired (optional)

### 4. Get Your Project Credentials
1. Go to Project Settings → API
2. Copy your project URL (VITE_SUPABASE_URL)
3. Copy your anon/public API key (VITE_SUPABASE_ANON_KEY)

### 5. Configure Environment Variables
1. Create a `.env` file in the root of this project
2. Add the following variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 6. Test the Setup
1. Run `npm run dev` to start the development server
2. Navigate to http://localhost:5173
3. Try signing up with a new account
4. Verify that you can create tasks

## Security Notes

- Tasks are encrypted using the user's email as the encryption key
- Row Level Security (RLS) is enabled to ensure users can only access their own data
- The encrypted_data field stores sensitive information (task details, checklist items)
- Make sure to never commit your `.env` file to version control
