import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Register telemetry on the server-side only
import { register } from './lib/telemetry'

// Ensure the register function is only called once during initialization on the server
if (typeof window === 'undefined') {
	register()
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'make real starter',
	description: 'draw a website and make it real',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className={inter.className}>{children}</body>
		</html>
	)
}
