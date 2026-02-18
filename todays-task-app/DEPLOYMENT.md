# Deployment Guide for Vercel

## 🚀 Quick Deploy to Vercel

### Prerequisites
- A Vercel account (free at https://vercel.com)
- Your Supabase project set up (see SUPABASE_SETUP.md)

## Step-by-Step Deployment

### 1. Prepare Your Project

Make sure all dependencies are properly listed in `package.json`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.47.10",
    "crypto-js": "^4.2.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@types/crypto-js": "^4.2.2",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    // ... other dev dependencies
  }
}
```

### 2. Test Build Locally

Before deploying, test the build locally:

```bash
npm install
npm run build
```

If the build fails, fix any errors before deploying.

### 3. Commit Your Code

```bash
git add .
git commit -m "Add Today's Task App"
git push origin main
```

**Important**: Make sure `.env` is in `.gitignore` and NOT committed!

### 4. Deploy to Vercel

#### Option A: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Option B: Via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Vite configuration

### 5. Configure Environment Variables

In Vercel dashboard:

1. Go to your project → Settings → Environment Variables
2. Add these variables:
   - `VITE_SUPABASE_URL` = `your_supabase_url`
   - `VITE_SUPABASE_ANON_KEY` = `your_supabase_anon_key`
3. Make sure to add them for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### 6. Redeploy

After adding environment variables:

1. Go to Deployments tab
2. Click the three dots (•••) on the latest deployment
3. Click "Redeploy"
4. Check "Use existing Build Cache" is OFF
5. Click "Redeploy"

## Build Configuration

Vercel should auto-detect these settings, but verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Common Deployment Issues & Fixes

### Issue 1: Module Not Found Errors

```
Cannot find module '@supabase/supabase-js'
Cannot find module 'crypto-js'
```

**Fix**:
1. Verify `package.json` has all dependencies listed (not just in devDependencies)
2. Clear Vercel build cache
3. Redeploy

### Issue 2: TypeScript Errors

```
Parameter '_event' implicitly has an 'any' type.
```

**Fix**: The code has already been updated with explicit types. Make sure to push the latest changes:

```typescript
// In AuthContext.tsx - should look like this:
supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
  // ...
});
```

### Issue 3: Environment Variables Not Working

**Symptoms**: App loads but can't connect to Supabase

**Fix**:
1. Variables must start with `VITE_` prefix
2. Add them in Vercel dashboard (not in code)
3. Redeploy after adding variables

### Issue 4: Build Timeout

**Fix**:
1. Check for circular dependencies
2. Remove unused large dependencies
3. Use Vercel Pro for increased build time

## Vercel Configuration File

Create `vercel.json` in your project root (optional):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "env": {
    "VITE_SUPABASE_URL": "@vite-supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@vite-supabase-anon-key"
  }
}
```

Then add the secrets via CLI:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## Post-Deployment Checklist

After successful deployment:

- [ ] Visit your deployed URL
- [ ] Test user registration
- [ ] Test user login
- [ ] Create a test task
- [ ] Verify encryption (check Supabase dashboard)
- [ ] Test RLS (create second account, verify data isolation)
- [ ] Check browser console for errors
- [ ] Test on mobile device

## Custom Domain (Optional)

To add a custom domain:

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed
4. Wait for DNS propagation (up to 48 hours)

## Monitoring

Vercel provides:
- Real-time logs
- Analytics
- Error tracking
- Performance insights

Access them from your project dashboard.

## Updating Your App

To deploy updates:

```bash
git add .
git commit -m "Update features"
git push origin main
```

Vercel will automatically rebuild and deploy.

## Rollback

If a deployment has issues:

1. Go to Deployments tab
2. Find a previous working deployment
3. Click "•••" → "Promote to Production"

## Alternative: Deploy to Netlify

If you prefer Netlify:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

Configure environment variables in Netlify dashboard at:
Site Settings → Environment Variables

## Cost

- Vercel Free Tier:
  - Unlimited personal projects
  - 100GB bandwidth/month
  - Serverless Functions included

- Supabase Free Tier:
  - 500MB database
  - 1GB file storage
  - 50,000 monthly active users

Both are sufficient for personal use and small teams.

## Support

If deployment fails:
1. Check Vercel build logs
2. Test build locally (`npm run build`)
3. Verify all dependencies in package.json
4. Check environment variables
5. Clear cache and redeploy

## Security Notes for Production

1. **Enable Email Confirmation** in Supabase (Authentication → Email Templates)
2. **Set up proper CORS** in Supabase (Authentication → URL Configuration)
3. **Add your Vercel domain** to Supabase allowed redirect URLs
4. **Enable rate limiting** in Supabase dashboard
5. **Monitor failed login attempts**

## Supabase Production Settings

In Supabase dashboard:

1. **Authentication → URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: Add your Vercel domain

2. **Database → Connection Pooling**:
   - Enable if you expect high traffic

3. **Database → Backups**:
   - Enable automatic backups

## Performance Optimization

For better performance on Vercel:

1. **Enable Caching**: Add cache headers in `vite.config.ts`
2. **Code Splitting**: Already handled by Vite
3. **Image Optimization**: Use Vercel Image Optimization
4. **CDN**: Automatically provided by Vercel

---

🎉 Your app should now be live! Share your deployment URL and start managing tasks!
