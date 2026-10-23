import Link from "next/link";
import styles from "./login.module.scss";

export const metadata = {
  title: "Acesso | Mesa Viva",
  description: "Escolha o acesso adequado para cliente ou assinante da plataforma.",
};

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="access-title">
        <p className={styles.eyebrow}>Primeiro acesso</p>
        <h1 id="access-title">Como você deseja acessar?</h1>
        <p className={styles.intro}>
          O acesso do cliente e a administração do estabelecimento possuem finalidades e
          permissões diferentes.
        </p>
        <div className={styles.options}>
          <article>
            <p>Cliente</p>
            <h2>Consultar o cardápio</h2>
            <p>Nenhuma conta é necessária nesta fase. O cardápio não concede acesso ao painel.</p>
            <Link href="/cardapio">Ver estabelecimentos</Link>
          </article>
          <article>
            <p>Assinante</p>
            <h2>Administrar o estabelecimento</h2>
            <p>Acesso restrito a usuários convidados, vinculados e autorizados.</p>
            <Link href="/admin/sign-in">Entrar como assinante</Link>
          </article>
        </div>
        <div className={styles.plansAction}>
          <div>
            <strong>Quer publicar e administrar seu estabelecimento?</strong>
            <span>Conheça as opções previstas para assinantes.</span>
          </div>
          <Link href="/planos">Ver planos</Link>
        </div>
      </section>
    </main>
  );
}
