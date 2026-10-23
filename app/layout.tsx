import "./globals.scss";
import "@fontsource/open-sauce-sans/latin-400.css";
import "@fontsource/open-sauce-sans/latin-600.css";
import "@fontsource/open-sauce-sans/latin-700.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
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
  const showDevelopmentNavigation = process.env.NODE_ENV === "development";

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body suppressHydrationWarning>
        {showDevelopmentNavigation ? (
          <nav aria-label="Navegação de desenvolvimento" className="development-navigation">
            <span>Ambiente de desenvolvimento</span>
            <Link href="/">Cardápio</Link>
            <Link href="/login">Primeiro acesso</Link>
            <Link href="/admin/sign-in">Login administrativo</Link>
            <Link href="/admin">Painel</Link>
            <Link href="/admin/configuracoes">Configurações</Link>
          </nav>
        ) : null}
        {children}
      </body>
    </html>
  );
}
