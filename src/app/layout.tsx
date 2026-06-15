import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";

import { Providers } from "@/app/providers";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata = {
  title: "VibeForge | AI Spotify Playlist Generator",
  description:
    "VibeForge helps you create AI-powered Spotify playlists, explore recently played tracks, and manage your music library with a calm, modern dashboard.",
  keywords: [
    "VibeForge",
    "Spotify playlist generator",
    "AI playlist generator",
    "Spotify dashboard",
    "music discovery app",
    "playlist manager",
  ],
  authors: [{ name: "Wesley Poth" }],
  creator: "Wesley Poth",
  openGraph: {
    title: "VibeForge | AI Spotify Playlist Generator",
    description:
      "Create AI-powered Spotify playlists, explore recent listens, and manage your music library.",
    type: "website",
    url: "https://vibeforge-music.vercel.app/",
    siteName: "VibeForge",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}