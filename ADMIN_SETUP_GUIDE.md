# Admin User Setup Guide

**Date**: November 25, 2025
**Status**: ✅ SECURE - No hardcoded credentials

---

## Overview

Script `scripts/init-db.js` ใช้สำหรับสร้าง admin user สำหรับ first-time setup

ตอนนี้ script นี้**ไม่มี hardcoded credentials** - มันอ่านจาก `.env.local` เท่านั้น

---

## Prerequisites

### 1. Environment Variables Set ✅

ต้อง set ค่าเหล่านี้ใน `.env.local`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/billmate?retryWrites=true&w=majority
MONGODB_DB=billmate

ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-strong-password
ADMIN_NAME=Admin Name
ADMIN_PHONE=+66812345678
```

### 2. MongoDB Connected ✅

- Ensure MongoDB Atlas is accessible
- IP whitelist includes your machine IP
- Database credentials are correct

### 3. node_modules Installed ✅

```bash
npm install
```

---

## How to Use

### Step 1: Configure Environment

```bash
# Copy and edit .env.local
cp .env.local .env.local.backup  # Backup first
nano .env.local  # or your editor
```

**Required admin variables:**
```env
# Admin setup credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=choose-a-strong-password
ADMIN_NAME=Your Admin Name
ADMIN_PHONE=+66812345678

# Database credentials
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/billmate
MONGODB_DB=billmate
```

### Step 2: Run Script

```bash
# Run the initialization script
npm run create-admin
```

### Step 3: Verify Output

Success output:
```
Connected to MongoDB
✅ Admin user created successfully!
===============================
Admin credentials have been set from environment variables
Role: admin
===============================
Check your .env.local file for the actual credentials

You can now login at: http://localhost:3000/login
Start the development server with: npm run dev
Disconnected from MongoDB
```

### Step 4: Login

```bash
# Start dev server
npm run dev

# Visit http://localhost:3000/login
# Login with:
# Email: admin@yourdomain.com
# Password: (from ADMIN_PASSWORD in .env.local)
```

---

## Security Features

### ✅ No Hardcoded Credentials
- Script reads from `.env.local` only
- No default fallback values
- Requires explicit environment setup

### ✅ Environment Variable Validation
```javascript
if (!adminData.email || !adminData.password || !adminData.name) {
  throw new Error('Missing required admin credentials...');
}
```

### ✅ Error Handling
- Clear error messages if env vars missing
- Checks if admin already exists
- Safe database connection

---

## Common Issues & Solutions

### Issue 1: MONGODB_URI not set

**Error:**
```
MONGODB_URI is not set in environment variables.
Please check your .env.local file.
```

**Solution:**
```bash
# Add to .env.local:
MONGODB_URI=mongodb+srv://your-user:your-password@cluster.mongodb.net/billmate
```

### Issue 2: Admin already exists

**Output:**
```
✅ Admin user already exists!
Admin credentials are configured in .env.local file
```

**Solution:**
This is not an error - admin already created. You can login.

### Issue 3: Connection refused

**Error:**
```
Error: connect ECONNREFUSED
```

**Solution:**
- Check MongoDB Atlas IP whitelist
- Add your IP: Go to MongoDB Atlas → Network Access → Add IP
- Or add `0.0.0.0/0` for anywhere (dev only!)

### Issue 4: Authentication failed

**Error:**
```
MongoServerError: authentication failed
```

**Solution:**
- Check MONGODB_URI is correct
- Verify username/password in connection string
- Check special characters are URL-encoded

---

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | Database connection | `mongodb+srv://user:pass@cluster.mongodb.net/billmate` |
| `MONGODB_DB` | Database name | `billmate` |
| `ADMIN_EMAIL` | Admin login email | `admin@yourdomain.com` |
| `ADMIN_PASSWORD` | Admin password | `YourStrongPassword123!` |
| `ADMIN_NAME` | Admin display name | `Admin Name` |
| `ADMIN_PHONE` | Admin phone (optional) | `+66812345678` |

---

## What Script Does

```javascript
1. Load environment variables from .env.local
2. Connect to MongoDB using MONGODB_URI
3. Check if admin already exists
4. If not exists:
   - Hash password with bcryptjs (10 salt rounds)
   - Create admin user in database
   - Display success message
5. Disconnect from database
```

---

## Security Best Practices

### ✅ DO:
- Keep `.env.local` private (in .gitignore)
- Use strong passwords (12+ characters, mixed case, numbers, symbols)
- Store `.env.local` securely
- Rotate credentials regularly
- Use different passwords for each environment

### ❌ DON'T:
- Commit `.env.local` to Git
- Use default passwords
- Share `.env.local` files
- Hardcode credentials in code
- Use same password everywhere

---

## Post-Setup Checklist

After creating admin user:

- [ ] Can login with admin email/password
- [ ] Dashboard loads
- [ ] Can navigate to pages
- [ ] Can create/manage users
- [ ] Can manage rooms
- [ ] Can view payments

---

## Production Deployment

### When Deploying to Vercel:

1. **Don't run this script on Vercel**
   - Run it locally first
   - Create admin user locally
   - Then deploy

2. **Set environment variables in Vercel:**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add the same ADMIN_* and MONGODB_* variables
   - (Script won't run on Vercel, but env vars needed for API)

3. **Optional: API endpoint for admin creation**
   - If needed, use `/api/init-admin` endpoint instead
   - POST with admin credentials
   - Only works once per deployment

---

## API Alternative (for Production)

If you want to create admin via API instead:

```bash
# Instead of script, use HTTP request:
curl -X POST https://your-app.vercel.app/api/init-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "your-strong-password",
    "name": "Admin Name",
    "phone": "+66812345678"
  }'
```

---

## Support

If issues arise:

1. Check `.env.local` is correct
2. Check MongoDB credentials work
3. Check network access to MongoDB
4. Review error message carefully
5. Check BUILD_FIXES.md for build issues

---

## Summary

**Before**: Script had hardcoded MongoDB credentials (security risk)
**After**: Script reads from `.env.local` (secure, no hardcoded values)

**To use:**
```bash
# 1. Set up .env.local with admin credentials
# 2. Run: npm run create-admin
# 3. Login with admin email/password
```

---

**Last Updated**: November 25, 2025
**Security Status**: ✅ SECURE
**Credentials**: 🔐 Environment-based only
