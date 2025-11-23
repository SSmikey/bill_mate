import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import BootstrapClient from './components/BootstrapClient';
import SessionProvider from './components/SessionProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeDatabase } from '@/lib/mongodb';
import logger from '@/lib/logger';
import { initializeCronJobs } from '@/services/cronService';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bill Mate - ระบบจัดการค่าเช่าหอพัก",
  description: "ระบบจัดการค่าเช่า ค่าน้ำ ค่าไฟ และตรวจสอบการชำระเงิน",
};

// Initialize database on app startup
let dbInitialized = false;

async function initializeApp() {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      
      // Initialize cron jobs after database is ready
      initializeCronJobs();
      logger.info('Cron jobs initialized on app startup', 'AppInitialization');
      
      dbInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize database', error as Error, 'AppInitialization');
      // In production, you might want to show an error page
      // For now, we'll let the app continue and handle DB errors individually
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize database when layout renders
  initializeApp().catch((error) => {
    logger.error('Failed to initialize app', error as Error, 'AppInitialization');
  });
  
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <BootstrapClient />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </SessionProvider>
      </body>
    </html>
  );
}