import './globals.css'
import type { Metadata } from 'next'
// Removed Inter import from next/font/google as we are using Google Fonts CSS import
import AppLayout from '@/components/layout/AppLayout' // Import the new layout

export const metadata: Metadata = {
  title: 'BizAssist',
  description: 'AI-powered business assistance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* Body no longer needs a specific font class here as it's handled in globals.css and AppLayout */}
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
