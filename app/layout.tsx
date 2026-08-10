import "./globals.scss";
import "@fontsource/open-sauce-sans/latin-400.css";
import "@fontsource/open-sauce-sans/latin-600.css";
import "@fontsource/open-sauce-sans/latin-700.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

const description =
  "Cardápio digital responsivo para descobrir pratos, montar o carrinho e revisar o pedido.";

export const viewport: Viewport = {
  themeColor: "#10261d",
};

export const metadata: Metadata = {
  title: "Mesa Viva | Cardápio digital",
  description,
  applicationName: "Mesa Viva",
  icons: {
    icon: "/icons/favicon-96x96.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
