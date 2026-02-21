import type { Metadata } from "next";
import { Figtree, Inter } from "next/font/google";
import "./globals.css";
import "@vibe/core/tokens";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
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
        className={`${figtree.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
