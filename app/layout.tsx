import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kana Dojo — Hiragana Practice",
  description: "Build speed and accuracy by transcribing one hiragana word at a time.",
  openGraph: {
    title: "Kana Dojo — One word. Full focus.",
    description: "Build hiragana speed and accuracy with adaptive romaji practice.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Kana Dojo hiragana practice" }],
  },
  twitter: { card: "summary_large_image", title: "Kana Dojo", description: "One word. Full focus.", images: ["/og.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
