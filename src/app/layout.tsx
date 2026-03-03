import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Meal Macro Planner",
  description: "AI-powered meal and macro planning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
