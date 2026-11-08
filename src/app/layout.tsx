import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forever Tracker',
  description: 'Level progress for our WoW Forever group',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
