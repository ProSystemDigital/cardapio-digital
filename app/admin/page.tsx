import { auth } from "@clerk/nextjs/server";
import {
  resolveCurrentIdentity,
  resolveCurrentTenantAccess,
} from "../../data/authentication.server";
import { loadDerivedTenantCatalog } from "../../data/admin-catalog.server";
import { loadAuthorizedCatalogAudit } from "../../data/admin-catalog-audit.server";
import { SignOutButton } from "./sign-out-button";
import { AvailabilityForm } from "./availability-form";
import { PriceForm } from "./price-form";
import { ContentForm } from "./content-form";
import styles from "./admin.module.scss";

export default async function AdminPage() {
  await auth.protect();
  const identity = await resolveCurrentIdentity();

  if (identity.kind === "denied") {
    return (
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="admin-title">
          <p className={styles.eyebrow}>Ambiente administrativo</p>
          <h1 className={styles.title} id="admin-title">Acesso interno indisponível</h1>
          <p className={styles.description}>
            A sessão foi autenticada, mas não possui um vínculo interno ativo.
            Nenhum tenant ou papel foi concedido.
          </p>
          <p className={styles.deniedStatus} role="status">
            Solicite ao administrador da plataforma a ativação do acesso.
          </p>
          <div className={styles.actions}><SignOutButton /></div>
        </section>
      </main>
    );
  }

  const tenantAccess = await resolveCurrentTenantAccess(identity.identity);
  if (tenantAccess.length !== 1) {
    return (
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="admin-title">
          <p className={styles.eyebrow}>Ambiente administrativo</p>
          <h1 className={styles.title} id="admin-title">Tenant administrativo indisponível</h1>
          <p className={styles.description}>
            A identidade interna está ativa, mas não possui exatamente uma membership
            de tenant disponível para este gate controlado.
          </p>
          <p className={styles.deniedStatus} role="status">
            Nenhum acesso ao catálogo foi concedido.
          </p>
          <div className={styles.actions}><SignOutButton /></div>
        </section>
      </main>
    );
  }

  const roleLabel = tenantAccess[0].role === "owner" ? "Proprietário" : "Gerente";
  const tenantId = tenantAccess[0].tenantId;
  const [catalog, auditEvents] = tenantId
    ? await Promise.all([
        loadDerivedTenantCatalog(tenantId),
        loadAuthorizedCatalogAudit(identity.identity, tenantId),
      ])
    : [null, null];

  if (!catalog || !auditEvents) {
    return (
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="admin-title">
          <p className={styles.eyebrow}>Ambiente administrativo</p>
          <h1 className={styles.title} id="admin-title">Catálogo administrativo indisponível</h1>
          <p className={styles.description}>
            O acesso interno foi derivado, mas o catálogo correspondente não pôde ser
            carregado com segurança.
          </p>
          <p className={styles.deniedStatus} role="status">
            Nenhuma operação foi disponibilizada.
          </p>
          <div className={styles.actions}><SignOutButton /></div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="admin-title">
        <p className={styles.eyebrow}>Ambiente administrativo</p>
        <h1 className={styles.title} id="admin-title">Acesso administrativo derivado</h1>
        <p className={styles.description}>
          A sessão Clerk foi vinculada a um principal ativo e a membership foi derivada
          exclusivamente do PostgreSQL.
        </p>
        <p className={styles.status} role="status">
          Tenant autorizado: 1. Papel interno: {roleLabel}. Nenhum claim externo foi aceito.
        </p>
        <section className={styles.catalog} aria-labelledby="catalog-title">
          <div className={styles.catalogHeader}>
            <div>
              <p className={styles.eyebrow}>Mutação controlada</p>
              <h2 className={styles.catalogTitle} id="catalog-title">
                {catalog.tenant.displayName}
              </h2>
            </div>
            <span className={styles.catalogCount}>{catalog.products.length} produtos</span>
          </div>
          <ul className={styles.productList}>
            {catalog.products.map((product) => (
              <li className={styles.productItem} key={product.id}>
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
                <div className={styles.productMeta}>
                  <span>{product.isAvailable ? "Disponível" : "Indisponível"}</span>
                  <strong>
                    {(product.priceInCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </strong>
                </div>
                <AvailabilityForm
                  productId={product.id}
                  version={product.version}
                  isAvailable={product.isAvailable}
                />
                <PriceForm
                  productId={product.id}
                  version={product.version}
                  priceInCents={product.priceInCents}
                />
                <ContentForm
                  productId={product.id}
                  version={product.version}
                  name={product.name}
                  description={product.description}
                />
              </li>
            ))}
          </ul>
          <p className={styles.readOnlyNotice}>
            Disponibilidade, preço e conteúdo possuem confirmações independentes. Demais dados permanecem bloqueados.
          </p>
        </section>
        <section className={styles.audit} aria-labelledby="audit-title">
          <div className={styles.catalogHeader}>
            <div>
              <p className={styles.eyebrow}>Somente leitura</p>
              <h2 className={styles.catalogTitle} id="audit-title">Alterações recentes</h2>
            </div>
            <span className={styles.catalogCount}>{auditEvents.length} eventos</span>
          </div>
          {auditEvents.length > 0 ? (
            <ol className={styles.auditList}>
              {auditEvents.map((event) => (
                <li className={styles.auditItem} key={event.id}>
                  <div className={styles.auditHeading}>
                    <strong>{event.productName}</strong>
                    <time dateTime={event.occurredAt.toISOString()}>
                      {event.occurredAt.toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Sao_Paulo",
                      })}
                    </time>
                  </div>
                  <p>
                    {event.priceInCents !== undefined
                      ? `Preço definido como ${(event.priceInCents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}.`
                      : null}
                    {event.isAvailable !== undefined
                      ? ` Disponibilidade definida como ${event.isAvailable ? "disponível" : "indisponível"}.`
                      : null}
                    {event.name !== undefined ? ` Nome definido como “${event.name}”.` : null}
                    {event.description !== undefined ? " Descrição pública atualizada." : null}
                  </p>
                  <span>Papel responsável: {event.actorRole === "owner" ? "Proprietário" : "Gerente"}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.readOnlyNotice}>Nenhuma alteração de catálogo registrada.</p>
          )}
          <p className={styles.readOnlyNotice}>
            A trilha não exibe identidade externa e não pode ser alterada ou excluída por esta interface.
          </p>
        </section>
        <div className={styles.actions}><SignOutButton /></div>
      </section>
    </main>
  );
}
