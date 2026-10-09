import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "ToolHub.pk — Free Online Tools", template: "%s | ToolHub.pk" },
  description: "27+ free online tools: PDF merge/split/compress, image resize/compress/convert, calculators, QR generator, JSON formatter and more. Fast, private, no sign-up.",
  keywords: ["free online tools", "pdf tools", "image tools", "calculators pakistan", "qr generator"],
  openGraph: { title: "ToolHub.pk — Free Online Tools", description: "Fast, private, no sign-up. مفت آن لائن ٹولز", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <head>
        {/* Google AdSense: paste your verification + ad script tag here, e.g.
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossOrigin="anonymous"></script> */}
      </head>
      <body className="flex min-h-full flex-col bg-ink font-sans text-cream">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
