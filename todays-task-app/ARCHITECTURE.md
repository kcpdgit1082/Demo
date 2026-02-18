# Architecture & Code Reference

## Project Structure

```
todays-task-app/
├── src/
│   ├── components/           # React components
│   │   ├── AuthForm.tsx     # Login/signup UI
│   │   ├── TaskList.tsx     # Main task display
│   │   ├── TaskItem.tsx     # Individual task card
│   │   └── TaskForm.tsx     # Create task form
│   ├── contexts/
│   │   └── AuthContext.tsx  # Auth state management
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client & types
│   │   └── encryption.ts    # Crypto utilities
│   ├── App.tsx              # Root component
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles
├── supabase-schema.sql      # Database DDL
├── .env                     # Environment config (not committed)
└── public/                  # Static assets
```

## Key Concepts

### 1. Authentication Flow

```
User signs up → Supabase creates auth.users entry
                ↓
User confirms email (optional)
                ↓
User signs in → Supabase returns session token
                ↓
Token stored in localStorage
                ↓
AuthContext provides user state to app
```

### 2. Data Encryption

**Encryption happens client-side:**

```typescript
// When creating a task
const email = user.email;  // e.g., "user@example.com"
const description = "Complete the API integration";

// Encrypt using user's email as key
const encrypted = encryptData(description, email);
// Result: "U2FsdGVkX1..." (base64 gibberish)

// Store in database
await supabase.from('tasks').insert({
  encrypted_data: encrypted,  // Stored encrypted
  // ... other fields
});
```

**Decryption on retrieval:**

```typescript
// Fetch from database
const { data } = await supabase.from('tasks').select('*');

// Decrypt using same email
const description = decryptData(data.encrypted_data, user.email);
// Result: "Complete the API integration" (readable)
```

### 3. Row Level Security (RLS)

RLS ensures users only access their own data:

```sql
-- Policy on tasks table
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);
```

This means:
- Every query automatically filters by `user_id`
- Database-level enforcement (can't be bypassed)
- Works even if you use direct database access

### 4. Component Hierarchy

```
App
 ├─ AuthProvider (context)
 │   └─ AppContent
 │       ├─ AuthForm (if not logged in)
 │       └─ TaskList (if logged in)
 │           ├─ TaskForm (when adding)
 │           └─ TaskItem (for each task)
 │               └─ Checklist items
```

## API Reference

### Authentication

```typescript
// Sign up
const { signUp } = useAuth();
await signUp('user@example.com', 'password123');

// Sign in
const { signIn } = useAuth();
await signIn('user@example.com', 'password123');

// Sign out
const { signOut } = useAuth();
await signOut();

// Get current user
const { user } = useAuth();
console.log(user.email);  // "user@example.com"
```

### Task Operations

**Create Task:**

```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert({
    user_id: user.id,
    title: 'Fix bug in login',
    jira_ticket_link: 'https://jira.example.com/PROJ-123',
    encrypted_data: encryptData('Bug description', user.email),
    status: 'pending',
    is_today: true,
  })
  .select()
  .single();
```

**Fetch Tasks:**

```typescript
const { data, error } = await supabase
  .from('tasks')
  .select('*, checklist_items(*)')  // Include related checklist items
  .eq('user_id', user.id)
  .eq('is_today', true)
  .order('created_at', { ascending: false });
```

**Update Task:**

```typescript
const { error } = await supabase
  .from('tasks')
  .update({ 
    status: 'completed',
    completed_at: new Date().toISOString()
  })
  .eq('id', taskId);
```

**Delete Task:**

```typescript
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId);
// Cascades to checklist_items automatically
```

### Checklist Operations

**Add Checklist Item:**

```typescript
const { error } = await supabase
  .from('checklist_items')
  .insert({
    task_id: taskId,
    encrypted_data: encryptData('Step 1: Do this', user.email),
    position: 0,
    completed: false,
  });
```

**Toggle Completion:**

```typescript
const { error } = await supabase
  .from('checklist_items')
  .update({ completed: !currentValue })
  .eq('id', itemId);
```

## Encryption Utilities

```typescript
// Encrypt a string
const encrypted = encryptData('sensitive text', 'password');

// Decrypt a string
const decrypted = decryptData(encrypted, 'password');

// Encrypt an object
const encrypted = encryptObject({ foo: 'bar' }, 'password');

// Decrypt to object
const obj = decryptObject<MyType>(encrypted, 'password');
```

## TypeScript Types

### Task Types

```typescript
interface Task {
  id: string;
  user_id: string;
  title: string;
  jira_ticket_link: string | null;
  encrypted_data: string;  // Encrypted description
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
  is_today: boolean;
  completed_at: string | null;
}

interface DecryptedTask extends Omit<Task, 'encrypted_data'> {
  description: string;  // Decrypted
  checklist: DecryptedChecklistItem[];
}
```

### Checklist Types

```typescript
interface ChecklistItem {
  id: string;
  task_id: string;
  encrypted_data: string;  // Encrypted text
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

interface DecryptedChecklistItem extends Omit<ChecklistItem, 'encrypted_data'> {
  text: string;  // Decrypted
}
```

## Common Patterns

### Loading States

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await someAsyncOperation();
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### Error Handling

```typescript
try {
  const { data, error } = await supabase.from('tasks').select('*');
  
  if (error) throw error;
  
  // Process data
} catch (err) {
  console.error('Database error:', err);
  alert('Failed to load tasks');
}
```

### Real-time Updates (Optional Enhancement)

To add real-time subscriptions:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('tasks-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        console.log('Task changed:', payload);
        fetchTasks();  // Refresh task list
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user.id]);
```

## Styling

### Tailwind Classes

Common patterns used in the app:

```typescript
// Container
className="max-w-4xl mx-auto px-4 py-8"

// Card
className="bg-white rounded-lg shadow-md p-6"

// Button (primary)
className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"

// Input
className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500"
```

### Custom Styling

To customize colors, edit `tailwind.config.js`:

```js
export default {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
      },
    },
  },
}
```

## Environment Variables

Required in `.env`:

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Access in code:

```typescript
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Testing Checklist

- [ ] Sign up with new email
- [ ] Confirm email (if enabled)
- [ ] Sign in with valid credentials
- [ ] Sign in with invalid credentials (should fail)
- [ ] Create task without checklist
- [ ] Create task with checklist
- [ ] Create task with Jira link
- [ ] Mark task as complete
- [ ] Mark checklist item as complete
- [ ] Delete task
- [ ] Sign out and sign back in (tasks persist)
- [ ] Create second account (can't see first account's tasks)
- [ ] Check database (encrypted_data is encrypted)
- [ ] Test with email confirmation disabled
- [ ] Test filters (Today, Pending, All)

## Performance Tips

1. **Minimize re-renders**: Use `useMemo` and `useCallback`
2. **Lazy loading**: Code-split large components
3. **Database indexes**: Already created on `user_id` and `status`
4. **Pagination**: Add limit/offset for large task lists
5. **Debounce**: Add debouncing to search/filter inputs

## Security Best Practices

1. **Never log sensitive data** in production
2. **Validate input** on both client and server
3. **Use HTTPS** in production (automatic with Vercel/Netlify)
4. **Rotate keys** if compromised
5. **Enable email confirmation** in production
6. **Set password requirements** in Supabase dashboard
7. **Monitor failed login attempts**

## Deployment

### Vercel

```bash
vercel --prod
```

### Netlify

```bash
netlify deploy --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

---

For questions or contributions, open an issue on GitHub!
