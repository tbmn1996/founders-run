import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Founder's Run — VCM Startup-Simulation",
  description:
    "Gründe in 3 Minuten dein Startup. Jede Entscheidung zählt. Welcher Founder-Typ bist du?",
  icons: {
    icon: "/logos/vcm-transparent.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#141414",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="dark">
      <body className="bg-mesh">{children}</body>
    </html>
  );
}
