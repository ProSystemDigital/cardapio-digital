import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sem conexão | Mesa Viva",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main>
      <section aria-labelledby="offline-title">
        <h1 id="offline-title">Você está sem conexão</h1>
        <p>Não foi possível carregar o cardápio agora. Verifique sua conexão e tente novamente.</p>
        <Link href="/">Tentar voltar ao início</Link>
      </section>
    </main>
  );
}
