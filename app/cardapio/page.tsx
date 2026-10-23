import Image from "next/image";
import Link from "next/link";
import { catalogRepository } from "../../data/catalog-repository.server";
import styles from "./catalog-directory.module.scss";

export const metadata = {
  title: "Estabelecimentos | Mesa Viva",
  description: "Consulte os cardápios dos estabelecimentos publicados na plataforma.",
};

export default async function CatalogDirectoryPage() {
  const slugs = await catalogRepository.listTenantSlugs();
  const catalogs = (await Promise.all(
    slugs.map((slug) => catalogRepository.findByTenantSlug(slug)),
  )).filter((catalog) => catalog !== null);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p>Cardápios publicados</p>
          <h1>Escolha um estabelecimento</h1>
          <span>São exibidos somente estabelecimentos cadastrados, publicados e não arquivados.</span>
        </div>
        <Link href="/login">Login</Link>
      </header>
      {catalogs.length > 0 ? (
        <ul className={styles.grid} aria-label="Estabelecimentos disponíveis">
          {catalogs.map(({ tenant, products }) => (
            <li key={tenant.id}>
              <Link href={`/cardapio/${tenant.slug}`}>
                <div className={styles.identity}>
                  <span className={styles.logo}>
                    {tenant.logo ? <Image alt={`Logo de ${tenant.shortName}`} fill sizes="64px" src={tenant.logo.publicUrl} /> : tenant.shortName}
                  </span>
                  <div><h2>{tenant.shortName}</h2><p>{tenant.tagline}</p></div>
                </div>
                <span className={styles.meta}>{products.filter((product) => product.isAvailable).length} produtos disponíveis</span>
                <strong>Ver cardápio</strong>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <section className={styles.empty} role="status"><h2>Nenhum estabelecimento publicado</h2><p>Novos cardápios aparecerão aqui depois da ativação.</p></section>
      )}
    </main>
  );
}
