import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

/**
 * Plus Jakarta Sans font loaded with weights 400, 500, 600, 700, 800
 * per Section 3 Typography Spec.
 */
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NaijaResolve AI — Your rights. Your options. Your next step.",
  description:
    "NaijaResolve AI helps Nigerians understand their rights, ask legal questions in plain language, generate complaint letters, and find a lawyer when needed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="min-h-screen bg-warm text-navy font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

