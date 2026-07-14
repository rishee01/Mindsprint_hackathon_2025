/**
 * Root Layout Component
 * Wraps all pages with common providers and styles
 */

import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'CivicSense - AI-Powered Civic Issue Reporter',
  description: 'Report and track civic issues in your city with AI-powered classification and community verification.',
  keywords: ['civic issues', 'pothole', 'garbage', 'city problems', 'report issue', 'civic sense'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <footer className="bg-gray-800 text-white py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0">
                    <p className="text-lg font-semibold">CivicSense</p>
                    <p className="text-sm text-gray-400">Making cities responsive, transparent, and safe.</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    © {new Date().getFullYear()} CivicSense. All rights reserved.
                  </div>
                </div>
              </div>
            </footer>
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
