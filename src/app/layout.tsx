import type { Metadata } from "next";
import { Alexandria, Inter } from "next/font/google";
import "./globals.css";
import "@vibe/core/tokens";

const alexandria = Alexandria({
  subsets: ["latin"],
  variable: "--font-alexandria",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Task Orchestrator",
  description: "Enterprise Task Management for Departments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${alexandria.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
