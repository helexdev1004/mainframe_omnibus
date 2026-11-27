import type { Metadata, Viewport } from "next";
import { Newsreader, Wix_Madefor_Display } from "next/font/google";
import "./globals.css";

const wix = Wix_Madefor_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-wix",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "mainframe — You write the questions, we do the fieldwork",
  description:
    "Gain valuable consumer insights across multiple markets through the mainframe omnibus platform. 1,000 nationally representative interviews per market.",
};

export const viewport: Viewport = {
  themeColor: "#0d0d0e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${wix.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
