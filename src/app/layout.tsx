import type { Metadata } from "next";
import { HeroUIProvider } from "@heroui/react";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenStack AI — From blank page to boardroom deck",
  description: "AI-powered presentation workspace. Turn ideas, docs, and notes into polished decks instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <HeroUIProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
