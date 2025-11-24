import type { Metadata } from "next";
import { Inter } from "next/font/google";
import 'bootstrap/dist/css/bootstrap.min.css';
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
        {/* Google Fonts - Sarabun */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Noto+Sans+Thai:wght@100..900&family=Sarabun:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap"
          rel="stylesheet"
        />

        {/* Bootstrap Icons */}
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