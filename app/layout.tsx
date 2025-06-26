import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'; // Add this import statement
const inter = Inter({ subsets: ['latin'] })
import "./globals.css"
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Tag Generator",
  description: "Auto-generates meaningful tags for agricultural form fields using advanced NLP techniques",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Next.js</title>
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
        <div className="min-h-screen bg-background text-foreground">{children}</div>
      </body>
    </html>
  )
}
