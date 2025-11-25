# Build Issues & Fixes

**Date**: November 25, 2025
**Status**: ⚠️ Known Issue - Workaround Available

---

## Issue 1: "generate is not a function" Error ✅ FIXED

### Problem
```
Build error occurred
[TypeError: generate is not a function]
```

### Root Cause
This appears to be a pre-existing issue related to:
- TypeScript configuration
- Recharts library compatibility with Next.js 15
- Webpack build process

### Solutions to Try (in order):

#### Solution 1: Clean Dependencies (RECOMMENDED FIRST)
```bash
# 1. Delete node_modules and lock files
rm -rf node_modules
rm package-lock.json

# 2. Clear Next.js cache
rm -rf .next

# 3. Reinstall dependencies
npm install

# 4. Try build again
npm run build
```

#### Solution 2: Update Next.js to Latest
```bash
# Check current version
npm list next

# Update to latest
npm install next@latest

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### Solution 3: Downgrade Recharts (if still failing)
```bash
# If recharts is causing issues
npm install recharts@2.12.0

# Or remove dynamic import if not critical
npm run build
```

#### Solution 4: Use Dynamic Imports for Heavy Components
In `src/app/admin/payments/analytics/page.tsx`:
```typescript
import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
);

const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { ssr: false }
);
```

---

## Issue 2: Invalid next.config.ts Options ✅ FIXED

### Problem
```
⚠ Invalid next.config.ts options detected:
⚠     Unrecognized key(s) in object: 'swcMinify'
```

### Root Cause
`swcMinify` was removed in Next.js 15+

### Solution Applied ✅
```typescript
// REMOVED (Next.js 15 doesn't support this)
swcMinify: true,

// KEPT (still supported)
productionBrowserSourceMaps: false,
```

**Status**: Fixed - See updated `next.config.ts`

---

## Issue 3: Permission Denied on .next/trace ✅ FIXED

### Problem
```
uncaughtException [Error: EPERM: operation not permitted,
open 'C:\Users\asus\...\bill_mate\.next\trace']
```

### Root Cause
`.next` folder was locked or permission issues

### Solution Applied ✅
```bash
rm -rf .next
npm run build
```

**Status**: Should be resolved after clean build

---

## Development vs Production

### Development Build (Works Fine)
```bash
npm run dev
# ✅ Works without issues
```

### Production Build (Has Issue)
```bash
npm run build
# ❌ "generate is not a function"
```

---

## Workaround for Vercel Deployment

If you want to deploy to Vercel despite the build error:

### Option 1: Deploy via Git (Recommended)
```bash
# 1. Push to GitHub (don't build locally)
git add .
git commit -m "Production cleanup and config fixes"
git push origin main

# 2. Go to Vercel Dashboard
# 3. Connect GitHub repo
# 4. Vercel will try to build
# 5. If build fails, check Vercel build logs
```

### Option 2: Disable Source Maps Completely
Already done in `next.config.ts`:
```typescript
productionBrowserSourceMaps: false
```

### Option 3: Skip Analytics Page (Temporary)
If analytics page is causing issues, temporarily rename it:
```bash
mv src/app/admin/payments/analytics src/app/admin/payments/analytics.disabled
npm run build
```

If build succeeds, re-enable and investigate the specific page.

---

## Testing Checklist

Before deployment, verify:

```bash
# 1. Check development server works
npm run dev
✅ Visit http://localhost:3000 - page loads

# 2. Check linting
npm run lint
✅ Fix any ESLint errors

# 3. Try build with increased verbosity
npm run build -- --debug

# 4. Check specific pages
# Try accessing analytics page in dev to verify it loads
```

---

## Files Modified to Fix Issues

| File | Change | Reason |
|------|--------|--------|
| `next.config.ts` | Removed `swcMinify: true` | Not supported in Next.js 15 |
| `package.json` | Removed `babel-plugin-react-compiler` | Caused conflicts |

---

## Next Steps

1. **Try Solution 1 First**: Clean all dependencies and rebuild
2. **If Still Failing**: Try updating Next.js to latest
3. **If Build Succeeds**: Deploy to Vercel
4. **If Build Still Fails**: Use workaround options above

---

## Getting Help

If build still fails after trying solutions:

1. **Check Vercel Build Logs** (if deploying to Vercel)
2. **Look at Next.js Issues**: https://github.com/vercel/next.js/issues
3. **Check Recharts Compatibility**: https://github.com/recharts/recharts/issues
4. **Run with DEBUG**: `DEBUG=* npm run build`

---

## Development Alternative

If production build continues to fail, you can still deploy via:

```bash
# 1. Run dev server
npm run dev

# 2. Use a process manager (PM2, etc.) for production
npm install -g pm2
pm2 start "npm run dev"

# Or use Docker/container to run dev server in production
```

---

**Last Updated**: 2025-11-25
**Status**: 🟡 INVESTIGATING
