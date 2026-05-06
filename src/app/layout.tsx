import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ritual PFP Maker — Ritualize Your Profile',
  description: 'Brand your profile picture with the official Ritual logo. Join the community and spread the ritual across Discord and X.',
  openGraph: {
    title: 'Ritual PFP Maker',
    description: 'Ritualize your profile picture with the official Ritual logo.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ritual PFP Maker',
    description: 'Brand your PFP with the official Ritual logo.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
