import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthStatus } from "@/components/AuthStatus";
import { QueryProvider } from "@/components/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lions Score Tracker",
  description: "Track scores and manage your Lions team",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <header className="bg-white shadow">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-600">Lions Score Tracker</h1>
              <AuthStatus />
            </nav>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
