import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="min-h-screen bg-background text-foreground">{children}</div>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
