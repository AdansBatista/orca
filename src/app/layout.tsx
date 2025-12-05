import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { PhiFogProvider } from "@/contexts/phi-fog-context";
import { ChairSidebarProvider } from "@/contexts/chair-sidebar-context";
import { SessionProvider } from "@/components/providers";
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
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PhiFogProvider>
              <ChairSidebarProvider>
                {children}
              </ChairSidebarProvider>
              <Toaster richColors position="top-right" />
            </PhiFogProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
