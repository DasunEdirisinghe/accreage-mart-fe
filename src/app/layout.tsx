import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Accreage Mart — AI-Powered Agricultural B2B Marketplace",
    template: "%s | Accreage Mart",
  },
  description:
    "Sri Lanka's AI-powered B2B marketplace connecting wholesale agricultural sellers with institutional buyers. Auctions, AI price forecasting and trusted trade.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
