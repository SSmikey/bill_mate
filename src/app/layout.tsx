import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/bootstrap-custom.scss";
import "./globals.css";
import BootstrapClient from './components/BootstrapClient';
import SessionWrapper from './components/SessionWrapper';
import ErrorBoundary from './components/ErrorBoundary';
import IconLoader from './components/IconLoader';
import { initializeDatabase } from '@/lib/mongodb';
import logger from '@/lib/logger';
import { initializeCronJobs } from '@/services/cronService';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bill Mate - ระบบจัดการค่าเช่าหอพัก",
    template: "%s | Bill Mate"
  },
  description: "ระบบจัดการค่าเช่า ค่าน้ำ ค่าไฟ และตรวจสอบการชำระเงินที่ทันสมัยและใช้งานง่าย",
  keywords: ["ค่าเช่าหอพัก", "ระบบจัดการหอพัก", "ค่าน้ำค่าไฟ", "บิลค่าเช่า", "ระบบชำระเงิน"],
  authors: [{ name: "Bill Mate Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#4361ee",
  colorScheme: "light",
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
    <html lang="th" className={inter.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className="antialiased"
        style={{ fontFamily: 'var(--font-family)' }}
      >
        <SessionWrapper>
          <IconLoader />
          <BootstrapClient />
          <ErrorBoundary>
            <div className="min-vh-100 d-flex flex-column">
              {children}
            </div>
          </ErrorBoundary>
        </SessionWrapper>
      </body>
    </html>
  );
}