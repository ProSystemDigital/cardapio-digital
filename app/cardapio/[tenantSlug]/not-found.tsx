import Link from "next/link";
import styles from "./not-found.module.scss";

export default function TenantNotFound() {
  return (
    <main className={styles.container}>
      <p>Cardápio Digital</p>
      <h1>Estabelecimento não encontrado</h1>
      <span>Confira o endereço informado ou solicite o link correto ao estabelecimento.</span>
      <Link href="/cardapio/mesa-viva">Abrir cardápio demonstrativo</Link>
    </main>
  );
}
