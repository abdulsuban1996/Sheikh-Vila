import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});

export const metadata: Metadata = {
  title: "শেখ ভিলা",
  description: "পারিবারিক ম্যানেজমেন্ট",
  robots: { index: false, follow: false },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "শেখ ভিলা", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#064e3b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={hind.variable}>
      <body className="font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
