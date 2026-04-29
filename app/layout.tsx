import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpoCompi - Asistente IA para Policia Nacional",
  description: "Asistente IA, tests y acompanamiento para opositores a Policia Nacional.",
  manifest: "/manifest.webmanifest",
  applicationName: "OpoCompi",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OpoCompi",
  },
  icons: {
    icon: "/brand/opocompi-logo.png",
    apple: "/brand/opocompi-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b3b82",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
