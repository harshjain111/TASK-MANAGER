import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/shared/service-worker-register';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Flowdesk',
  description: 'Task, chat, and recognition hub for the whole org.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Flowdesk',
  },
};

export const viewport = {
  // sRGB of --primary, oklch(0.55 0.18 264) in app/globals.css. PWA metadata
  // cannot read a CSS variable, so keep this in sync if the token changes.
  themeColor: '#3969d9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
