import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ombra-rho.vercel.app"),
  title: "CARÈNE — Créateur de lieux de vie | Construction & Rénovation, Drôme · Ardèche",
  description:
    "Depuis 1979, Carène conçoit et construit des lieux de vie durables, performants et porteurs de sens. Construction et rénovation en Drôme, Ardèche et quart sud-est : maisons, villas, extensions, projets atypiques.",
  openGraph: {
    title: "CARÈNE — Créateur de lieux de vie",
    description:
      "Vivez la naissance d'une maison Carène, de l'esquisse à la remise des clés — Drôme, Ardèche, quart sud-est. Depuis 1979.",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Maison contemporaine réalisée par Carène" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.jpg"],
  },
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
