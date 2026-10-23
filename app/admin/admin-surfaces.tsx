import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import {
  resolveCurrentIdentity,
  resolveCurrentTenantAccess,
} from "../../data/authentication.server";
import { loadDerivedTenantCatalog } from "../../data/admin-catalog.server";
import { SignOutButton } from "./sign-out-button";
import { TenantProfileForm } from "./tenant-profile-form";
import { CategoryManagementForm } from "./category-management-form";
import { CategoryManagementWorkspace } from "./category-management-workspace";
import { CategoryCreationForm } from "./category-creation-form";
import { AdminConfigurationSteps } from "./admin-configuration-steps";
import { ImageUploadForm } from "./image-upload-form";
import { DeliveryCoveragePreview } from "./delivery-coverage-preview";
import { TenantAttendanceForm, TenantFinanceForm, TenantLogisticsForm, TenantTablesForm } from "./tenant-operation-section-forms";
import { TenantPrivacyForm } from "./tenant-privacy-form";
import { DeliveryOriginForm } from "./delivery-origin-form";
import { ProductCreationForm } from "./product-creation-form";
import { ProductCardEditor } from "./product-card-editor";
import { ProductManagementWorkspace } from "./product-management-workspace";
import { loadDeliveryGovernance } from "../../data/admin-delivery-governance.server";
import styles from "./admin.module.scss";

const fulfillmentModeLabels = {
  dine_in: "Na mesa",
  pickup: "Retirada",
  delivery: "Entrega",
} as const;

function AdminPrimaryNavigation({ current }: { current: "dashboard" | "settings" }) {
  return (
    <nav
      aria-label="Navegação administrativa"
      className={`${styles.adminNavigation} ${current === "settings" ? styles.adminNavigationWithoutDivider : ""}`}
    >
      <Link aria-current={current === "dashboard" ? "page" : undefined} href="/admin">
        Painel
      </Link>
      <Link aria-current={current === "settings" ? "page" : undefined} href="/admin/configuracoes">
        Configurações
      </Link>
    </nav>
  );
}

export default async function AdminDashboardPage() {
  await auth.protect();
  const identity = await resolveCurrentIdentity();

  if (identity.kind === "denied") {
    return (
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="admin-title">
          <h1 className={styles.title} id="admin-title">Assinatura necessária</h1>
          <p className={styles.description}>Sua conta está autenticada, mas ainda não possui uma assinatura ativa vinculada a um estabelecimento.</p>
          <p className={styles.deniedStatus} role="status">Escolha um plano e conclua o pagamento para liberar a configuração.</p>
          <div className={styles.actions}><Link href="/planos">Ver planos</Link><SignOutButton /></div>
        </section>
      </main>
    );
  }

  const tenantAccess = await resolveCurrentTenantAccess(identity.identity);
  if (tenantAccess.length !== 1) {
    return (
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="admin-title">
          <h1 className={styles.title} id="admin-title">Tenant administrativo indisponível</h1>
          <p className={styles.deniedStatus} role="status">Nenhum acesso ao catálogo foi concedido.</p>
          <div className={styles.actions}><SignOutButton /></div>
        </section>
      </main>
    );
  }

  const tenantId = tenantAccess[0].tenantId;
  const catalog = tenantId ? await loadDerivedTenantCatalog(tenantId) : null;
  if (!catalog) {
    return (
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="admin-title">
          <h1 className={styles.title} id="admin-title">Painel Administrativo</h1>
          <p className={styles.deniedStatus} role="status">O catálogo não pôde ser carregado com segurança.</p>
          <div className={styles.actions}><SignOutButton /></div>
        </section>
      </main>
    );
  }

  let availableProducts = 0;
  let productsWithoutImage = 0;
  const populatedCategoryIds = new Set<string>();
  for (const product of catalog.products) {
    if (product.isAvailable) availableProducts += 1;
    if (!product.image) productsWithoutImage += 1;
    populatedCategoryIds.add(product.categoryId);
  }
  const unavailableProducts = catalog.products.length - availableProducts;
  let emptyCategories = 0;
  for (const category of catalog.categories) {
    if (!populatedCategoryIds.has(category.id)) emptyCategories += 1;
  }
  const alerts = [
    ...(!catalog.tenant.logo ? [{ label: "Adicione a logo do estabelecimento.", section: "profile" }] : []),
    ...(productsWithoutImage > 0 ? [{
      label: `${productsWithoutImage} ${productsWithoutImage === 1 ? "produto sem imagem" : "produtos sem imagem"}.`,
      section: "products",
    }] : []),
    ...(emptyCategories > 0 ? [{
      label: `${emptyCategories} ${emptyCategories === 1 ? "categoria sem produtos" : "categorias sem produtos"}.`,
      section: "categories",
    }] : []),
    ...(unavailableProducts > 0 ? [{
      label: `${unavailableProducts} ${unavailableProducts === 1 ? "produto indisponível" : "produtos indisponíveis"}.`,
      section: "products",
    }] : []),
  ];

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="admin-title">
        <AdminPrimaryNavigation current="dashboard" />
        <header className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.title} id="admin-title">Painel Administrativo</h1>
            <p className={styles.description}>Visão atual de {catalog.tenant.shortName}.</p>
          </div>
          <Link className={styles.secondaryButton} href={`/cardapio/${catalog.tenant.slug}`} target="_blank">
            Ver cardápio
          </Link>
        </header>

        <section aria-labelledby="catalog-summary-title" className={styles.dashboardSection}>
          <h2 id="catalog-summary-title">Resumo do catálogo</h2>
          <dl className={styles.dashboardMetrics}>
            <div><dt>Produtos disponíveis</dt><dd>{availableProducts}</dd></div>
            <div><dt>Produtos indisponíveis</dt><dd>{unavailableProducts}</dd></div>
            <div><dt>Produtos sem imagem</dt><dd>{productsWithoutImage}</dd></div>
            <div><dt>Categorias vazias</dt><dd>{emptyCategories}</dd></div>
          </dl>
        </section>

        <section aria-labelledby="attention-title" className={styles.dashboardSection}>
          <div className={styles.dashboardSectionHeader}>
            <h2 id="attention-title">Itens que precisam de atenção</h2>
            <Link href="/admin/configuracoes">Abrir configurações</Link>
          </div>
          {alerts.length > 0 ? (
            <ul className={styles.dashboardAlerts}>
              {alerts.map((alert) => (
                <li key={`${alert.section}-${alert.label}`}>
                  <span>{alert.label}</span>
                  <Link href={`/admin/configuracoes?secao=${alert.section}`}>Resolver</Link>
                </li>
              ))}
            </ul>
          ) : <p className={styles.dashboardReady}>O catálogo não possui pendências identificáveis nesta fase.</p>}
        </section>

        <section aria-labelledby="logistics-title" className={styles.dashboardSection}>
          <h2 id="logistics-title">Logística habilitada</h2>
          <ul className={styles.dashboardModes}>
            {catalog.tenant.fulfillmentModes.map((mode) => <li key={mode}>{fulfillmentModeLabels[mode]}</li>)}
          </ul>
        </section>
        <div className={styles.actions}><SignOutButton /></div>
      </section>
    </main>
  );
}

export async function AdminConfigurationsPage({
  activeStep = "profile",
}: {
  activeStep?: import("./admin-configuration-steps").AdminConfigurationStepId;
}) {
  await auth.protect();
  const identity = await resolveCurrentIdentity();

  if (identity.kind === "denied") {
    return (
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="admin-title">
          <h1 className={styles.title} id="admin-title">Assinatura necessária</h1>
          <p className={styles.description}>
            Sua conta está autenticada, mas ainda não possui uma assinatura ativa
            vinculada a um estabelecimento.
          </p>
          <p className={styles.deniedStatus} role="status">
            Escolha um plano e conclua o pagamento para liberar a configuração.
          </p>
          <div className={styles.actions}><Link href="/planos">Ver planos</Link><SignOutButton /></div>
        </section>
      </main>
    );
  }

  const tenantAccess = await resolveCurrentTenantAccess(identity.identity);
  if (tenantAccess.length !== 1) {
    return (
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="admin-title">
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

  const tenantId = tenantAccess[0].tenantId;
  const [catalog, deliveryGovernance] = tenantId ? await Promise.all([
    loadDerivedTenantCatalog(tenantId),
    loadDeliveryGovernance(tenantId),
  ]) : [null, null];

  if (!catalog) {
    return (
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="admin-title">
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

  const productCountByCategory = new Map<string, number>();
  for (const product of catalog.products) {
    productCountByCategory.set(
      product.categoryId,
      (productCountByCategory.get(product.categoryId) ?? 0) + 1,
    );
  }
  const categoryOptions = catalog.categories.map(({ id, name }) => ({ id, name }));
  const categoryNameById = new Map(categoryOptions.map(({ id, name }) => [id, name]));

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-label="Painel de configurações">
        <AdminPrimaryNavigation current="settings" />
        <section className={styles.catalog} aria-label="Configurações do estabelecimento e catálogo">
          <AdminConfigurationSteps activeStep={activeStep}>
          <section className={styles.tenantProfileSummary} aria-labelledby="tenant-profile-title">
            <div className={styles.categoryHeader}>
              <div>
                <h3 id="tenant-profile-title">Perfil do estabelecimento</h3>
              </div>
            </div>
            <aside className={styles.profileLogoCapability} aria-label="Identidade do estabelecimento">
              <div className={styles.profileLogoPlaceholder}>
                {catalog.tenant.logo ? (
                  <Image
                    alt={`Logo de ${catalog.tenant.shortName}`}
                    fill
                    sizes="64px"
                    src={catalog.tenant.logo.publicUrl}
                  />
                ) : <span aria-hidden="true">Logo</span>}
              </div>
              <div>
                <strong>{catalog.tenant.shortName}</strong>
                <p>{catalog.tenant.tagline}</p>
              </div>
              <span>{catalog.tenant.logo ? "Logo cadastrada" : "Logo pendente"}</span>
            </aside>
            <details className={styles.profileEditorGroup}>
              <summary>Editar perfil</summary>
              <div className={styles.profileEditorBody}>
                <ImageUploadForm
                  currentUrl={catalog.tenant.logo?.publicUrl}
                  expectedVersion={catalog.tenant.logo?.version ?? null}
                  target="tenant_logo"
                />
                <TenantProfileForm
                  version={catalog.tenant.version}
                  shortName={catalog.tenant.shortName}
                  tagline={catalog.tenant.tagline}
                />
              </div>
            </details>
          </section>
          <section className={styles.operationsSummary} aria-labelledby="attendance-title">
            <h2 className={styles.configurationSectionTitle} id="attendance-title">Atendimento</h2>
            <TenantAttendanceForm businessHours={catalog.tenant.operations.businessHours} version={catalog.tenant.operations.version ?? 1} whatsappNumber={catalog.tenant.operations.whatsappNumber} />
          </section>
          <section className={styles.operationsSummary} aria-labelledby="finance-title">
            <h2 className={styles.configurationSectionTitle} id="finance-title">Financeiro</h2>
            <TenantFinanceForm minimumOrderInCents={catalog.tenant.operations.minimumOrderInCents} paymentMethods={catalog.tenant.operations.paymentMethods ?? []} version={catalog.tenant.operations.version ?? 1} />
          </section>
          <section className={styles.operationsSummary} aria-labelledby="logistics-title">
            <h2 className={styles.configurationSectionTitle} id="logistics-title">Logística</h2>
            <TenantLogisticsForm deliveryFeeInCents={catalog.tenant.operations.deliveryFeeInCents ?? 0} maximumDeliveryDistanceInMeters={catalog.tenant.operations.maximumDeliveryDistanceInMeters ?? 10000} version={catalog.tenant.operations.version ?? 1} />
            <DeliveryOriginForm origin={deliveryGovernance?.origin ?? null} />
            {process.env.NODE_ENV !== "production" && process.env.DELIVERY_COVERAGE_PROVIDER !== "disabled"
              ? <DeliveryCoveragePreview
                  key={`${catalog.tenant.operations.version ?? 1}-${catalog.tenant.operations.maximumDeliveryDistanceInMeters ?? 10000}`}
                  maximumDistanceInMeters={catalog.tenant.operations.maximumDeliveryDistanceInMeters ?? 10000}
                />
              : null}
          </section>
          <section className={styles.operationsSummary} aria-labelledby="privacy-title">
            <h2 className={styles.configurationSectionTitle} id="privacy-title">Privacidade</h2>
            <TenantPrivacyForm privacy={deliveryGovernance?.privacy ?? null} />
          </section>
          <section className={styles.categorySummary} aria-labelledby="category-title">
            <div className={styles.categoryHeader}>
              <div>
                <h3 id="category-title">Categorias</h3>
              </div>
              <span className={styles.catalogCount}>{catalog.categories.length} categorias</span>
            </div>
            <CategoryManagementWorkspace>
            <CategoryCreationForm />
            <ol className={styles.categoryList}>
              {catalog.categories.map((category, index) => {
                const productCount = productCountByCategory.get(category.id) ?? 0;
                return <CategoryManagementForm
                  categoryId={category.id}
                  index={index}
                  key={category.id}
                  name={category.name}
                  sortOrder={category.sortOrder}
                  version={category.version}
                  productCount={productCount}
                />;
              })}
            </ol>
            </CategoryManagementWorkspace>
          </section>
          <section className={styles.productManagement} aria-labelledby="products-title">
            <div className={styles.categoryHeader}>
              <div>
                <h3 id="products-title">Gestão de Produtos</h3>
              </div>
              <span className={styles.catalogCount}>{catalog.products.length} produtos</span>
            </div>
            <ProductManagementWorkspace>
              <ProductCreationForm
                categories={categoryOptions}
                tenantModes={catalog.tenant.fulfillmentModes}
              />
          <ul className={styles.productList}>
            {catalog.products.map((product) => (
              <li className={styles.productItem} key={product.id}>
                <div className={styles.productOverview}>
                  <div className={styles.productImagePlaceholder}>
                    {product.image ? (
                      <Image
                        alt={product.image.altText ?? product.name}
                        fill
                        sizes="80px"
                        src={product.image.publicUrl}
                      />
                    ) : (
                      <>
                        <span aria-hidden="true">Imagem</span>
                        <small>Não cadastrada</small>
                      </>
                    )}
                  </div>
                  <div className={styles.productIdentity}>
                    <h4>{product.name}</h4>
                    <p>{product.description}</p>
                  </div>
                  <div className={styles.productMeta}>
                    <span>Preço</span>
                    <strong>
                      {(product.priceInCents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </strong>
                  </div>
                </div>
                <div className={styles.productCategory} aria-label="Categoria do produto">
                  <strong>Categoria</strong>
                  <span>{categoryNameById.get(product.categoryId) ?? "Categoria indisponível"}</span>
                </div>
                <div className={styles.fulfillmentModes} aria-label="Disponibilidade do produto">
                  <strong>{product.isAvailable ? "Disponível para" : "Status"}</strong>
                  <ul>
                    {product.isAvailable
                      ? product.fulfillmentModes.map((mode) => (
                          <li key={mode}>{fulfillmentModeLabels[mode]}</li>
                        ))
                      : <li>Não disponível</li>}
                  </ul>
                </div>
                <ProductCardEditor
                  product={{
                    id: product.id, version: product.version, name: product.name,
                    description: product.description, priceInCents: product.priceInCents,
                    categoryId: product.categoryId, isAvailable: product.isAvailable,
                    fulfillmentModes: product.fulfillmentModes,
                    imageVersion: product.image?.version ?? null,
                  }}
                />
              </li>
            ))}
          </ul>
            </ProductManagementWorkspace>
          </section>
          <section className={styles.operationsSummary} aria-labelledby="tables-title">
            <h2 className={styles.configurationSectionTitle} id="tables-title">Mesas</h2>
            <p>Organize as identificações conforme os ambientes do estabelecimento.</p>
            <TenantTablesForm diningTables={catalog.tenant.operations.diningTables} version={catalog.tenant.operations.version ?? 1} />
          </section>
          </AdminConfigurationSteps>
        </section>
        <div className={styles.actions}><SignOutButton /></div>
      </section>
    </main>
  );
}
