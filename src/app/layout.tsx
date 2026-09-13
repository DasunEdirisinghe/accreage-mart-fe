import type { Metadata } from "next";
// @ts-ignore
import "./globals.css";
import { CurrentUserProvider } from "@/components/providers/current-user-provider";
import { getCurrentUser } from "@/lib/current-user-info";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Accreage Mart, AI-Powered Agricultural B2B Marketplace",
    template: "%s | Accreage Mart",
  },
  description:
    "Sri Lanka's AI-powered B2B marketplace connecting wholesale agricultural sellers with institutional buyers. Auctions, AI price forecasting and trusted trade.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en">
      <body className="font-sans">
        <CurrentUserProvider initialUser={currentUser}>
          {children}
          <Toaster position="top-right" richColors />
        </CurrentUserProvider>
      </body>
    </html>
  );
}
