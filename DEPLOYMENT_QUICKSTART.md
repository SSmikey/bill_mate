# Bill Mate - Vercel Deployment Quick Start

**⏱ Time to Deploy**: ~15 minutes
**📋 Pre-requisites**: Vercel account, GitHub account, MongoDB Atlas account

---

## Step 1: Prepare Environment (2 min)

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Fill in YOUR actual values:
# - NEXTAUTH_URL=https://your-vercel-app.vercel.app
# - NEXTAUTH_SECRET=<run: openssl rand -base64 32>
# - MONGODB_URI=<your MongoDB connection string>
# - EMAIL credentials
# - Any other optional variables
```

---

## Step 2: Commit & Push (3 min)

```bash
# 1. Commit cleanup work
git add .
git commit -m "Production cleanup: console removal, code org, env config"

# 2. Push to GitHub
git push origin fix-bug/deploy

# 3. Create Pull Request on GitHub
# (or merge if you're deploying from main)
```

---

## Step 3: Deploy to Vercel (10 min)

### Option A: Via Vercel Dashboard (Recommended for First-Time)

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Configure project:
   - **Framework**: Next.js
   - **Root Directory**: `./` (or leave default)
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add all variables from `.env.local`
   - Make sure you add:
     ```
     NEXTAUTH_URL = https://your-app.vercel.app
     NEXTAUTH_INTERNAL_URL = https://your-app.vercel.app
     NEXTAUTH_SECRET = (your generated secret)
     MONGODB_URI = (your MongoDB connection)
     NODE_ENV = production
     PROTOCOL = https
     ```
   - Click "Deploy"

### Option B: Via Vercel CLI (Faster for Updates)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
# Follow prompts to add environment variables

# 4. Monitor logs
vercel logs --prod
```

---

## Step 4: Verify Deployment (2 min)

```bash
# Check your Vercel dashboard for:
✅ Build completed successfully
✅ Deployment is live
✅ Environment variables are set
✅ HTTPS certificate is active

# Then test in browser:
✅ https://your-app.vercel.app/ loads
✅ Login page appears
✅ Can log in as admin (if you set up admin user)
```

---

## Quick Environment Variables Reference

```env
# REQUIRED
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_INTERNAL_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/billmate
MONGODB_DB=billmate

# REQUIRED (Email)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
CONTACT_EMAIL=admin@yourdomain.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# OPTIONAL
USE_CLOUD_STORAGE=false
NODE_ENV=production
PROTOCOL=https
```

---

## Troubleshooting

### ❌ Build fails with "generate is not a function"
This is a pre-existing TypeScript issue. See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md#build-troubleshooting) for solutions.

### ❌ Environment variables not found
- Go to Vercel Dashboard → Project Settings → Environment Variables
- Verify all variables are added
- Redeploy: Click "Redeploy" on latest deployment

### ❌ Database connection fails
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist allows Vercel IPs
- Check `.0/0` is added to IP Whitelist (or specific Vercel IPs)

### ❌ Email sending fails
- Verify email credentials are correct
- Check "Less Secure Apps" is enabled (for Gmail)
- Try generating a new App Password for Gmail

### ❌ Login not working
- Verify `NEXTAUTH_URL` matches your Vercel domain exactly
- Check `NEXTAUTH_SECRET` is set and consistent
- Check database connection works
- Verify user exists in database

---

## Post-Deployment Checklist

Run this checklist after seeing "✅ Live" in Vercel:

```
[ ] Visit your deployed URL - page loads
[ ] Login page appears and is styled correctly
[ ] Try logging in with admin account
[ ] Dashboard loads after login
[ ] Check that static assets load (CSS, images)
[ ] Test one API call (e.g., fetch users)
[ ] Check Vercel logs for any errors
[ ] Verify HTTPS is enforced (no http://)
```

---

## Rollback (If Needed)

In Vercel Dashboard:
1. Go to "Deployments" tab
2. Find the previous working deployment
3. Click "..." menu → "Promote to Production"

---

## Next Steps

After successful deployment:

1. **Set up Monitoring**
   - Error tracking: Sentry or Vercel Analytics
   - Logs: Vercel provides logs in dashboard

2. **Configure Domain**
   - Go to Vercel Project Settings → Domains
   - Add your custom domain
   - Update DNS records per Vercel instructions

3. **Set up Admin User**
   ```bash
   curl -X POST https://your-app.vercel.app/api/init-admin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@yourdomain.com",
       "password": "change-this-strong-password",
       "name": "Admin Name",
       "phone": "081234567890"
     }'
   ```

4. **Test Features**
   - Create a test room
   - Create test bills
   - Test payment slip upload
   - Verify email notifications

---

## Help & Support

- 📖 Full guide: [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
- 📋 Cleanup details: [CLEANUP_SUMMARY.md](./CLEANUP_SUMMARY.md)
- 🔗 Vercel Docs: https://vercel.com/docs
- 🐛 Issues: Check Vercel logs and error tracking

---

**Status**: ✅ Ready to Deploy
**Last Updated**: November 25, 2025
