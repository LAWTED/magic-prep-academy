// import { ThemeSwitcher } from "@/components/theme-switcher";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { NotificationListener } from "@/components/NotificationListener";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Magic Prep Academy",
  description: "Learn magic with fun!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Magic Prep Academy",
    startupImage: [
      {
        url: "/splash/launch.png",
        media:
          "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  icons: {
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192" }],
  },
};

export function generateViewport(): Viewport {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
      { media: "(prefers-color-scheme: dark)", color: "#FFFFFF" },
    ],
  };
}

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <Toaster
        position="bottom-center"
        richColors
        className="safe-bottom"
        toastOptions={{
          className: "mb-16 safe-bottom",
        }}
      />
      <body className="bg-background text-foreground overscroll-y-contain">
        <NotificationListener />
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        > */}
        <main className="h-screen w-full flex flex-col items-center safe-top safe-bottom safe-left safe-right">
          {children}
        </main>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
