import type { Metadata } from 'next';
import { ClinicFooter } from '@/components/ClinicFooter';
import './globals.css';

export const metadata: Metadata = {
  title: 'Orca Autoclave Monitor',
  description: 'Autoclave monitoring and label printing for orthodontic clinics',
  icons: {
    icon: '/icon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <ClinicFooter />
      </body>
    </html>
  );
}
