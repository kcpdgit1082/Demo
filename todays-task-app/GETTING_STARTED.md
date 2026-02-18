# Getting Started with Today's Task App

This guide will walk you through setting up and running the Today's Task App from scratch.

## What You'll Build

A secure task management application with:
- User authentication (email/password)
- Encrypted task storage
- Jira ticket integration
- Checklist support for each task
- Row Level Security (RLS) in Supabase

## Prerequisites

Before you begin, make sure you have:
- ✅ Node.js 18 or higher installed
- ✅ npm or yarn package manager
- ✅ A Supabase account (free at https://supabase.com)
- ✅ A modern web browser

## Step 1: Verify Installation

Check that Node.js and npm are installed:

```bash
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

## Step 2: Install Dependencies

In the project directory, run:

```bash
npm install
```

This installs:
- React 19 + TypeScript
- Supabase JS client
- CryptoJS for encryption
- Tailwind CSS for styling
- React Router for navigation

## Step 3: Set Up Supabase Database

### 3.1 Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Project name**: `todays-tasks` (or your choice)
   - **Database password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Click "Create new project" and wait ~2 minutes for provisioning

### 3.2 Run the Database Schema

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click "New Query"
3. Open the `supabase-schema.sql` file from this project
4. Copy all the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

This creates:
- `tasks` table with encryption support
- `checklist_items` table for task steps
- Row Level Security (RLS) policies
- Automatic timestamp triggers

### 3.3 Verify Tables Were Created

1. Click **Table Editor** in the sidebar
2. You should see tables: `tasks` and `checklist_items`
3. Click on each table to verify the columns match the schema

### 3.4 Configure Authentication

1. Click **Authentication** → **Providers** in the sidebar
2. Make sure **Email** is enabled (should be by default)
3. Optional: Disable "Confirm email" if you want to skip email verification during development
   - Go to **Authentication** → **Email Templates**
   - Under **Email Settings**, you can toggle confirmation requirements

## Step 4: Get Your Supabase Credentials

1. Click the **⚙️ Settings** icon in the left sidebar
2. Click **API** under Project Settings
3. You'll see two important values:
   - **Project URL**: Something like `https://abcdefghijk.supabase.co`
   - **anon public** key: A long string starting with `eyJ...`
4. Keep this tab open—you'll need these values in the next step

## Step 5: Configure Environment Variables

1. In the project root, copy the example environment file:

```bash
cp .env.example .env
```

2. Open `.env` in your editor and replace the placeholder values:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi... (your actual key)
```

⚠️ **Important**: 
- Don't add quotes around the values
- Don't commit the `.env` file to git (it's already in `.gitignore`)
- Make sure the variable names start with `VITE_` (this is a Vite requirement)

## Step 6: Start the Development Server

```bash
npm run dev
```

You should see output like:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## Step 7: Test the Application

1. **Open the app**: Visit http://localhost:5173 in your browser
2. **Sign up**: 
   - Enter an email (use a real one if email confirmation is on)
   - Enter a password (minimum 6 characters)
   - Click "Sign up"
3. **Confirm email** (if enabled):
   - Check your email inbox
   - Click the confirmation link
   - Return to the app and sign in
4. **Create your first task**:
   - Click "+ Add New Task"
   - Fill in the task details
   - Add a Jira link (optional)
   - Add checklist items
   - Click "Create Task"
5. **Test encryption**:
   - Create a task with some text
   - Go to Supabase dashboard → Table Editor → tasks
   - Look at the `encrypted_data` column—it should be unreadable gibberish
   - Back in the app, the task displays normally (proving decryption works)
6. **Test RLS (Row Level Security)**:
   - Sign out and create a new account
   - You should NOT see tasks from the first account
   - This proves RLS is working correctly

## Troubleshooting

### "Module not found" errors

**Problem**: TypeScript complains about missing modules

**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Environment variables not loading

**Problem**: App shows "Missing Supabase environment variables"

**Solution**:
1. Make sure `.env` exists in the project root
2. Variable names must start with `VITE_`
3. Restart the dev server after changing `.env`
4. Check there are no quotes around values

### "Invalid API key" error

**Problem**: Can't connect to Supabase

**Solution**:
1. Double-check the `VITE_SUPABASE_ANON_KEY` in your `.env`
2. Make sure you copied the "anon public" key, not the "service_role" key
3. Verify the project URL matches your Supabase project

### Can't see tasks after creating them

**Problem**: Tasks don't appear in the list

**Solution**:
1. Check browser console for errors (F12 → Console tab)
2. In Supabase dashboard, go to Table Editor → tasks
3. Verify the task exists in the database
4. Check that the `user_id` matches your current user
5. Try refreshing the page

### Decryption errors

**Problem**: Tasks show "[Decryption failed]"

**Solution**:
- This happens if you changed your email or database
- Tasks are encrypted with the user's email as the key
- You can only decrypt tasks you created with the same email
- Delete and recreate tasks if needed

### Database errors

**Problem**: "permission denied" or "row level security" errors

**Solution**:
1. Verify you ran the complete `supabase-schema.sql`
2. In Supabase dashboard, go to Authentication → Policies
3. Make sure RLS is enabled on both `tasks` and `checklist_items` tables
4. Verify policies exist for SELECT, INSERT, UPDATE, DELETE

## Development Tips

### Hot Module Replacement (HMR)

The app uses Vite's HMR. Changes to `.tsx` files will update instantly without refreshing the page.

### Debugging

Open browser DevTools (F12):
- **Console**: See logs and errors
- **Network**: Inspect Supabase API calls
- **Application → Local Storage**: See auth tokens

### Database Inspection

Use Supabase dashboard:
- **Table Editor**: View raw data
- **SQL Editor**: Run custom queries
- **Authentication → Users**: See registered users
- **Logs**: View real-time database logs

### Useful Commands

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Check code quality
```

## Next Steps

Now that your app is running:

1. **Customize the UI**: Edit files in `src/components/`
2. **Add features**: See the main README for architecture details
3. **Deploy**: Use Vercel, Netlify, or any static host
4. **Backup your database**: Use Supabase's backup features

## Security Reminders

- ✅ Never commit `.env` to version control
- ✅ Use different Supabase projects for dev/staging/production
- ✅ Enable email confirmation in production
- ✅ Regularly backup your database
- ✅ Keep dependencies updated

## Getting Help

- Check the main [README.md](./README.md)
- Review [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- Visit [Supabase Docs](https://supabase.com/docs)
- Open an issue on GitHub

---

Happy task managing! 🎉
