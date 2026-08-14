import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CARÈNE — Créateur de lieux de vie | Construction & Rénovation, Drôme · Ardèche",
  description:
    "Depuis 1979, Carène conçoit et construit des lieux de vie durables, performants et porteurs de sens. Construction et rénovation en Drôme, Ardèche et quart sud-est : maisons, villas, extensions, projets atypiques.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0f0d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
