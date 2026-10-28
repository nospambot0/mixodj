import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Reelroom — Your cinema, everywhere",
  description: "A mobile-first movie library for direct video links, search, and continue watching.",
  applicationName: "Reelroom",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Reelroom" }
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b0c10" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}