import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { PhiFogProvider } from "@/contexts/phi-fog-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orca - Orthodontic Practice Management",
  description: "Comprehensive orthodontic practice management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        <PhiFogProvider>
          {children}
          <Toaster richColors position="top-right" />
        </PhiFogProvider>
      </body>
    </html>
  );
}
