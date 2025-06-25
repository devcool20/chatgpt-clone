import { Metadata } from "next";
import { Toaster } from "sonner";
import { ClerkProvider } from '@clerk/nextjs';

import { Navbar } from "@/components/custom/navbar";
import { ThemeProvider } from "@/components/custom/theme-provider";
import { SidebarProvider, useSidebar } from "@/components/custom/history";
import MainContent from "@/components/custom/MainContent";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gemini.vercel.ai"),
  title: "Next.js Gemini Chatbot",
  description: "Next.js chatbot template using the AI SDK and Gemini.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <SidebarProvider>
        <html lang="en" suppressHydrationWarning>
          <body className="antialiased w-full h-full overflow-x-hidden">
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster position="top-center" />
              <Navbar />
              <MainContent>{children}</MainContent>
            </ThemeProvider>
          </body>
        </html>
      </SidebarProvider>
    </ClerkProvider>
  );
}
