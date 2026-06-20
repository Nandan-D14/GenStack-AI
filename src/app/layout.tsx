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
      <body>
        <HeroUIProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
