# Bill Mate - Admin Setup Documentation

## Admin Credentials

The following admin user has been created for the Bill Mate application:

- **Email:** `admin@billmate.com`
- **Password:** `admin123`
- **Name:** System Administrator
- **Role:** admin

## Login Instructions

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/login
   ```

3. Enter the admin credentials above to login.

## Admin Features

Once logged in as admin, you can access:

- **Dashboard** (`/admin/dashboard`) - Overview of the system
- **Room Management** (`/admin/rooms`) - Add, edit, and delete rooms
- **Tenant Management** (`/admin/users`) - Manage tenant accounts
- **Bill Management** (`/admin/bills`) - Create and manage utility bills
- **Payment Verification** (`/admin/payments`) - Verify tenant payments

## Security Notes

⚠️ **Important:** 
- Change the default admin password after first login
- Keep these credentials secure
- Do not share admin credentials with unauthorized personnel

## Database Setup

The admin user was created using the `npm run create-admin` command, which:
1. Connects to the MongoDB database using the connection string in `.env.local`
2. Creates an admin user with the credentials above
3. Hashes the password using bcryptjs

## Recreating Admin User

If you need to recreate the admin user:

1. Delete the existing admin user from the database, or
2. Run the script again (it will detect existing admin and show credentials)

The script is located at: `scripts/init-db.js`

## Environment Configuration

The application uses the following environment variables (stored in `.env.local`):

- `MONGODB_URI` - MongoDB connection string
- `NEXTAUTH_URL` - NextAuth URL (usually http://localhost:3000)
- `NEXTAUTH_SECRET` - Secret for NextAuth session encryption
- `EMAIL_USER` - Gmail address for notifications (optional)
- `EMAIL_PASS` - Gmail app password for notifications (optional)