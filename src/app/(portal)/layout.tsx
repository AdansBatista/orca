import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Orca Patient Portal',
    template: '%s | Orca Portal',
  },
  description: 'Access your orthodontic appointments, messages, and treatment progress',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Orca Portal',
  },
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0c0c' },
  ],
  viewportFit: 'cover',
};

export default function PortalRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Service Worker registration script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('SW registered:', registration.scope);
                }).catch(function(error) {
                  console.log('SW registration failed:', error);
                });
              });
            }
          `,
        }}
      />
      {children}
    </>
  );
}
