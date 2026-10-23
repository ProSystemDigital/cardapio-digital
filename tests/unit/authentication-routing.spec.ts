import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

test("proxy inicializa Clerk somente nas rotas que consultam autenticação", () => {
  const proxy = read("proxy.ts");
  expect(proxy).toContain("clerkMiddleware()");
  expect(proxy).not.toContain("createRouteMatcher");
  expect(proxy).not.toContain("auth.protect()");
  expect(proxy).toContain('"/admin/:path*"');
  expect(proxy).toContain('"/planos/:path*"');
  expect(proxy).toContain('"/assinatura/:path*"');
});

test("layout raiz tolera somente atributos injetados no html e body antes da hidratação", () => {
  const layout = read("app/layout.tsx");
  expect(layout).toContain('<html lang="pt-BR" suppressHydrationWarning>');
  expect(layout).toContain("<body suppressHydrationWarning>");
});

test("navegação de desenvolvimento revela rotas sem contornar autenticação", () => {
  const layout = read("app/layout.tsx");
  const globals = read("app/globals.scss");
  const menuStyles = read("app/components/MenuExperience/MenuExperience.module.scss");
  expect(layout).toContain('process.env.NODE_ENV === "development"');
  expect(layout).toContain('aria-label="Navegação de desenvolvimento"');
  expect(layout).toContain('href="/"');
  expect(layout).toContain('href="/login"');
  expect(layout).toContain('href="/admin/sign-in"');
  expect(layout).toContain('href="/admin"');
  expect(layout).toContain('href="/admin/configuracoes"');
  expect(layout).not.toMatch(/auth\.protect\(\).*development|development.*auth\.protect\(\)/s);
  expect(globals).toMatch(/\.development-navigation\s*\{[\s\S]*?z-index:\s*25;/);
  expect(menuStyles).toMatch(/\.backdrop\s*\{[^}]*z-index:30;/);
  expect(menuStyles).toMatch(/\.drawer\s*\{[^}]*z-index:40;/);
});

test("primeiro acesso separa cliente de assinante sem conceder acesso administrativo", () => {
  const accessPage = read("app/login/page.tsx");
  const plansPage = read("app/planos/page.tsx");
  const menu = read("app/components/MenuExperience/MenuExperience.tsx");
  const adminSignIn = read("app/admin/sign-in/[[...sign-in]]/page.tsx");
  expect(menu).toContain('href="/login"');
  expect(accessPage).toContain("Nenhuma conta é necessária nesta fase");
  expect(accessPage).toContain('href="/cardapio"');
  expect(accessPage).toContain('href="/admin/sign-in"');
  expect(accessPage).toContain('href="/planos"');
  expect(accessPage).not.toContain('href="/admin"');
  expect(accessPage).not.toContain('href="/admin/configuracoes"');
  expect(adminSignIn).toContain("Assinante ou administrador");
  expect(adminSignIn).toContain("Clientes do estabelecimento não precisam entrar");
  expect(plansPage).toContain('price: "R$ 150"');
  expect(plansPage).toContain('price: "R$ 250"');
  expect(plansPage).toContain("O painel só é liberado após confirmação da assinatura");
  expect(plansPage).toContain("Cadastrar e assinar");
  expect(accessPage).toContain('href="/admin/sign-in"');
  expect(plansPage).toContain('href="/admin/sign-in"');
});

test("login administrativo não redireciona silenciosamente uma sessão ativa", () => {
  const signInPage = read("app/admin/sign-in/[[...sign-in]]/page.tsx");
  const gate = read("app/admin/sign-in/admin-sign-in-gate.tsx");
  const signOut = read("app/admin/sign-out-button.tsx");
  expect(signInPage).toContain("<AdminSignInGate />");
  expect(gate).toContain("useAuth()");
  expect(gate).toContain("useUser()");
  expect(gate).toContain("if (!isLoaded || (isSignedIn && !isUserLoaded))");
  expect(gate).toContain("if (!isSignedIn)");
  expect(gate).toContain("user?.primaryEmailAddress?.emailAddress");
  expect(gate).toContain("Conta atual");
  expect(gate).not.toContain("<SignedOut>");
  expect(gate).not.toContain("<SignedIn>");
  expect(gate).toContain("Uma conta administrativa já está conectada");
  expect(gate).toContain('label="Entrar com outra conta"');
  expect(gate).toContain('href="/admin"');
  expect(signOut).toContain("redirectUrl");
});

test("diretório público lista catálogos publicados sem expor o painel", () => {
  const directory = read("app/cardapio/page.tsx");
  const home = read("app/page.tsx");
  expect(home).toContain('redirect("/cardapio")');
  expect(directory).toContain("catalogRepository.listTenantSlugs()");
  expect(directory).toContain("catalogRepository.findByTenantSlug(slug)");
  expect(directory).toContain("product.isAvailable");
  expect(directory).toContain('href={`/cardapio/${tenant.slug}`}');
  expect(directory).toContain("<h2>{tenant.shortName}</h2>");
  expect(directory).not.toContain("<h2>{tenant.displayName}</h2>");
  expect(directory).not.toContain('href="/admin"');
  expect(directory).not.toContain('href="/admin/configuracoes"');
});

test("identidade pública mantém nome de até duas linhas no mobile", () => {
  const styles = read("app/components/MenuExperience/MenuExperience.module.scss");
  expect(styles).toContain(".brand>span:last-child{display:-webkit-box");
  expect(styles).toContain("overflow-wrap:anywhere");
  expect(styles).toContain("-webkit-line-clamp:2");
  expect(styles).not.toContain(".brand>span:last-child{display:none}");
});

test("carrinho apresenta a imagem cadastrada do produto com fallback visual", () => {
  const experience = read("app/components/MenuExperience/MenuExperience.tsx");
  const styles = read("app/components/MenuExperience/MenuExperience.module.scss");
  expect(experience).toContain("product.image ? <Image");
  expect(experience).toContain("src={product.image.publicUrl}");
  expect(experience).toContain(": <span aria-hidden=\"true\">{product.emoji}</span>");
  expect(experience).toContain("styles.cartItemImage");
  expect(styles).toContain(".cartItemImage img { object-fit:cover; }");
});

test("mutações administrativas invalidam também o cardápio público", () => {
  const actions = read("app/admin/actions.ts");
  expect(actions).toContain('revalidatePath("/admin")');
  expect(actions).toContain('revalidatePath("/admin/configuracoes")');
  expect(actions).toContain('revalidatePath("/cardapio/[tenantSlug]", "page")');
});

test("página administrativa exige autenticação sem consumir papéis externos", () => {
  const page = read("app/admin/admin-surfaces.tsx");
  const signIn = read("app/admin/sign-in/[[...sign-in]]/page.tsx");
  const signInGate = read("app/admin/sign-in/admin-sign-in-gate.tsx");
  expect(page).toContain("await auth.protect()");
  expect(page).toContain("await resolveCurrentIdentity()");
  expect(page).toContain("await resolveCurrentTenantAccess(identity.identity)");
  expect(page).toContain('identity.kind === "denied"');
  expect(page).toContain("tenantAccess.length !== 1");
  expect(page).toContain("loadDerivedTenantCatalog(tenantId)");
  expect(page).toContain("<ProductCardEditor");
  expect(page).toContain('aria-labelledby="products-title"');
  expect(page).toContain("<ProductCreationForm");
  expect(page).toContain("categories={categoryOptions}");
  expect(page).toContain("tenantModes={catalog.tenant.fulfillmentModes}");
  expect(page).toContain("<ProductCardEditor");
  expect(page).toContain("<span>Preço</span>");
  expect(page).toContain("productCountByCategory");
  expect(page).toContain('aria-label="Categoria do produto"');
  expect(page).toContain("categoryNameById.get(product.categoryId)");
  expect(page).toContain("catalog.categories.map");
  expect(page).not.toMatch(/catalog\.categories\.(slice|filter)\(/);
  expect(page).toContain("<CategoryManagementForm");
  expect(page).toContain("<CategoryCreationForm");
  expect(page).toContain("version={category.version}");
  expect(page).toContain("productCount={productCount}");
  expect(page).toContain("index={index}");
  expect(read("app/admin/category-management-form.tsx")).toContain("return <li>");
  expect(page).toContain("fulfillmentModeLabels");
  expect(page).toContain('dine_in: "Na mesa"');
  expect(page).toContain("product.fulfillmentModes.map");
  expect(page).toContain('aria-label="Disponibilidade do produto"');
  expect(page).toContain('product.isAvailable ? "Disponível para" : "Status"');
  expect(page).toContain(": <li>Não disponível</li>");
  expect(page).toContain('aria-labelledby="attendance-title"');
  expect(page).toContain('aria-labelledby="finance-title"');
  expect(page).toContain('aria-labelledby="logistics-title"');
  expect(page).toContain('aria-labelledby="privacy-title"');
  expect(page).toContain("catalog.tenant.operations.minimumOrderInCents");
  expect(page).toContain("catalog.tenant.operations.deliveryFeeInCents");
  expect(page).toContain("<TenantAttendanceForm");
  expect(page).toContain("<TenantFinanceForm");
  expect(page).toContain("<TenantLogisticsForm");
  expect(page).toContain("businessHours={catalog.tenant.operations.businessHours}");
  expect(page).toContain("paymentMethods={catalog.tenant.operations.paymentMethods ?? []}");
  expect(page).not.toMatch(/Personalizações configuradas|product\.variations|product\.addonGroups|formatPriceDelta/);
  expect(page).toContain("<AdminConfigurationSteps activeStep={activeStep}>");
  expect(page).toContain('aria-labelledby="tenant-profile-title"');
  expect(page).toContain("catalog.tenant.shortName");
  expect(page).toContain("catalog.tenant.tagline");
  expect(page).toContain("catalog.tenant.fulfillmentModes.map");
  expect(page).toContain('aria-label="Identidade do estabelecimento"');
  expect(page).toContain("<summary>Editar perfil</summary>");
  expect(page).toContain("<ImageUploadForm");
  expect(page).toContain("catalog.tenant.logo?.version");
  expect(page).toContain("product.image?.version");
  expect(page).toContain("<TenantProfileForm");
  expect(page).not.toContain("<DineInActivationForm");
  expect(page).not.toContain('fulfillmentModes.includes("dine_in")');
  expect(page).toContain("version={catalog.tenant.version}");
  expect(page).not.toMatch(/loadAuthorized(?:Catalog|TenantProfile|Category)Audit/);
  expect(page).not.toMatch(/category-audit-title|profile-audit-title|audit-title/);
  expect(page).not.toMatch(/searchParams|params\s*:/);
  expect(page).not.toMatch(/userId|orgId|orgRole|permission/);
  expect(signIn).toContain("<AdminSignInGate />");
  expect(signInGate).toContain('fallbackRedirectUrl="/admin"');
});

test("formulários administrativos não criam colunas horizontais no breakpoint móvel", () => {
  const styles = read("app/admin/admin.module.scss");
  expect(styles).toMatch(/\.panel\s*\{[\s\S]*?width:\s*min\(100%, 76rem\);/);
  expect(styles).toMatch(/\.editorGroupBody\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
  expect(styles).toMatch(/@container \(min-width: 44rem\)[\s\S]*?\.editorGroupBody\s*\{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
  expect(styles).toMatch(/@media \(min-width: 48rem\)[\s\S]*?\.tenantProfileForm\s*\{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
  expect(styles).toMatch(/\.tenantProfileForm\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
  expect(styles).toMatch(/@media \(min-width: 60rem\)[\s\S]*?\.catalog\s*\{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
  expect(styles).toMatch(/@media \(min-width: 60rem\)[\s\S]*?\.categoryList\s*\{[\s\S]*?repeat\(3, minmax\(0, 1fr\)\)/);
  expect(styles).toMatch(/@media \(min-width: 60rem\)[\s\S]*?\.categoryList li\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  expect(styles).toMatch(/@media \(max-width: 34rem\)[\s\S]*?\.productOverview\s*\{[\s\S]*?grid-template-columns:\s*4\.5rem minmax\(0, 1fr\);/);
  expect(styles).toMatch(/@media \(max-width: 34rem\)[\s\S]*?\.editorGroupBody\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
  expect(styles).toMatch(/\.logisticsValueFields\s*\{[\s\S]*?repeat\(2, minmax\(0, 18rem\)\)/);
  expect(styles).toMatch(/@media \(max-width: 620px\)[\s\S]*?\.logisticsValueFields\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
  expect(styles).toMatch(
    /\.fulfillmentModesForm\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?flex:\s*none;/,
  );
  expect(styles).toMatch(/\.categoryManagementForm\s*\{[\s\S]*?width:\s*100%;[\s\S]*?grid-template-columns:\s*1fr;/);
  expect(styles).toMatch(/\.moneyInput input:focus\s*\{[\s\S]*?outline:\s*none;/);
  expect(styles).toMatch(/\.moneyInput:focus-within\s*\{[\s\S]*?border-color:\s*#174b36;/);
  expect(styles).not.toMatch(/\.moneyInput:focus-within\s*\{[^}]*outline:/);
  expect(styles).toMatch(/\.dineInProductOptions\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
});

test("configuração de produto separa categoria e disponibilidade sem linguagem logística ambígua", () => {
  const page = read("app/admin/admin-surfaces.tsx");
  const form = read("app/admin/fulfillment-modes-form.tsx");
  expect(page).toContain("Disponível para");
  expect(read("app/admin/product-creation-form.tsx")).toContain("Disponibilidade do Produto");
  expect(form).not.toContain("Opções do produto");
  expect(form).toContain('fieldset aria-label="Disponibilidade do Produto"');
  expect(form).not.toContain("Modalidades de logística");
  expect(form).not.toContain("modalidade de logística");
});

test("painel administrativo separa oito etapas e mantém apenas uma visível", () => {
  const workspace = read("app/admin/admin-configuration-steps.tsx");
  const route = read("app/admin/configuracoes/page.tsx");
  expect(workspace).toContain('label: "Perfil"');
  expect(workspace).toContain('label: "Atendimento"');
  expect(workspace).toContain('label: "Financeiro"');
  expect(workspace).toContain('label: "Logística"');
  expect(workspace).toContain('label: "Privacidade"');
  expect(workspace).toContain('label: "Categorias"');
  expect(workspace).toContain('label: "Produtos"');
  expect(workspace).toContain('label: "Mesas"');
  expect(workspace).toContain('aria-label="Etapas de configuração"');
  expect(workspace).toContain('hidden={activeStep !== step.id}');
  expect(workspace).toContain('aria-current={active ? "step" : undefined}');
  expect(workspace).toContain('href={`/admin/configuracoes?secao=${step.id}`}');
  expect(route).toContain("validSections.has");
  expect(route).toContain('searchParams: Promise<{ secao?: string | string[] }>');
  expect(workspace).not.toContain("description:");
  expect(workspace).not.toContain("<small>");
});

test("contador total de produtos aparece somente na etapa Produtos", () => {
  const page = read("app/admin/admin-surfaces.tsx");
  expect(page.match(/catalog\.products\.length\} produtos/g)).toHaveLength(1);
  const productsStart = page.indexOf('aria-labelledby="products-title"');
  expect(page.indexOf("catalog.products.length} produtos")).toBeGreaterThan(productsStart);
});

test("gestão de produtos usa confirmação breve e remove instruções redundantes", () => {
  const page = read("app/admin/admin-surfaces.tsx");
  const workspace = read("app/admin/product-management-workspace.tsx");
  expect(page).toContain('<h3 id="products-title">Gestão de Produtos</h3>');
  expect(page).not.toContain("Gestão do catálogo");
  expect(page).not.toContain("Localize um produto e abra somente o grupo");
  expect(page).not.toContain("Conteúdo, preço, categoria e disponibilidade são atualizados");
  expect(workspace).toContain("Produto salvo com sucesso!");
  expect(workspace).toContain('aria-live="polite"');
  expect(workspace).toContain("window.setTimeout");
});

test("espaço administrativo mantém a marca no perfil sem títulos redundantes", () => {
  const page = read("app/admin/admin-surfaces.tsx");
  const workspaceStart = page.indexOf('aria-label="Configurações do estabelecimento e catálogo"');
  const profileStart = page.indexOf('aria-labelledby="tenant-profile-title"');
  expect(page).not.toContain(">Estabelecimento e catálogo<");
  expect(page).not.toContain(">Configuração operacional<");
  expect(page.slice(workspaceStart, profileStart)).not.toContain("catalog.tenant.displayName");
  expect(page.slice(profileStart)).toContain("catalog.tenant.shortName");
});

test("painel principal usa somente indicadores derivados do catálogo autorizado", () => {
  const page = read("app/admin/admin-surfaces.tsx");

  expect(page).toContain("export default async function AdminDashboardPage");
  expect(page).toContain("availableProducts");
  expect(page).toContain("productsWithoutImage");
  expect(page).toContain("emptyCategories");
  expect(page).toContain('href="/admin/configuracoes"');
  expect(page).toContain('href={`/cardapio/${catalog.tenant.slug}`}');
  expect(page).not.toMatch(/faturamento|receita|pedidos recebidos/i);
});

test("área administrativa omite legendas técnicas sem remover controles internos", () => {
  const page = read("app/admin/admin-surfaces.tsx");
  const actions = read("app/admin/actions.ts");
  const uploadForm = read("app/admin/image-upload-form.tsx");

  expect(page).not.toContain("A sessão Clerk foi vinculada");
  expect(page).not.toContain("Tenant autorizado:");
  expect(page).not.toContain("Mutação controlada");
  expect(page).not.toContain("Tenant derivado");
  expect(page).not.toContain("Ambiente administrativo");
  expect(page).toContain('id="admin-title">Painel Administrativo</h1>');
  expect(actions).not.toContain("Perfil atualizado e auditado.");
  expect(actions).toContain("await auth.protect()");
  expect(uploadForm).toContain("JPEG, PNG ou WebP, até 5 MB.");
  expect(uploadForm).not.toContain("O servidor recorta e converte para WebP.");
});

test("logística não repete a ativação de modalidades configuradas por produto", () => {
  const page = read("app/admin/admin-surfaces.tsx");
  const profileStart = page.indexOf('aria-labelledby="tenant-profile-title"');
  const logisticsPanelStart = page.indexOf('aria-labelledby="logistics-title"');
  const categoriesStart = page.indexOf('aria-labelledby="category-title"');
  expect(profileStart).toBeGreaterThan(-1);
  expect(page.slice(profileStart, logisticsPanelStart)).not.toContain("Modalidades de logística");
  expect(page.slice(logisticsPanelStart, categoriesStart)).not.toContain("Modalidades de logística habilitadas");
  expect(page.slice(logisticsPanelStart, categoriesStart)).not.toContain("Na mesa está habilitado para este estabelecimento");
  expect(page.slice(logisticsPanelStart, categoriesStart)).not.toContain("<DineInActivationForm");
  expect(page.slice(profileStart, logisticsPanelStart)).not.toContain("TenantLogisticsForm");
  expect(page.slice(logisticsPanelStart, categoriesStart)).toContain("TenantLogisticsForm");
});

test("configuração operacional deriva autorização e limita campos no servidor", () => {
  const actions = read("app/admin/actions.ts");
  const form = read("app/admin/tenant-operation-section-forms.tsx");
  const composition = read("data/admin-tenant-operations-command.server.ts");
  const authorization = read("application/authorized-tenant-operations-administration-service.ts");

  expect(actions).toContain("export async function updateTenantAttendance");
  expect(actions).toContain("export async function updateTenantFinance");
  expect(actions).toContain("export async function updateTenantLogistics");
  expect(actions).toContain("export async function updateTenantTables");
  expect(actions).toContain("await auth.protect()");
  expect(actions).toContain("updateDerivedTenantOperations");
  expect(actions).not.toMatch(/formData\.get\(["'](?:tenantId|role|actorId)/);
  expect(form).toContain("Pedido mínimo");
  expect(form).toContain("WhatsApp para pedidos");
  expect(form).not.toContain("Espaços, parênteses e hífen são ajustados automaticamente");
  expect(form).not.toContain("Formato: +55 (DDD) 9XXXX-XXXX");
  expect(form).toContain("Pagamento online será tratado em uma fase futura.");
  expect(form).toContain("Segunda-feira");
  expect(form).toContain("Domingo");
  const attendance = form.slice(form.indexOf("export function TenantAttendanceForm"), form.indexOf("export function TenantFinanceForm"));
  const finance = form.slice(form.indexOf("export function TenantFinanceForm"), form.indexOf("export function TenantLogisticsForm"));
  const logistics = form.slice(form.indexOf("export function TenantLogisticsForm"));
  expect(attendance).toContain('name="whatsappNumber"');
  expect(attendance).not.toMatch(/minimumOrder|deliveryFee|paymentMethods/);
  expect(finance).toContain('name="minimumOrder"');
  expect(finance).toContain('name="paymentMethods"');
  expect(finance).not.toMatch(/whatsappNumber|deliveryFee|maximumDeliveryDistance/);
  expect(logistics).toContain('name="deliveryFee"');
  expect(logistics).toContain('name="maximumDeliveryDistance"');
  expect(logistics).not.toMatch(/whatsappNumber|minimumOrder|paymentMethods/);
  expect(form).toContain("export function TenantTablesForm");
  expect(form).toContain('name="diningTables"');
  expect(form).toContain("Ambiente | Mesa");
  expect(composition).toMatch(/^import "server-only";/);
  expect(authorization).toContain('"tenant.operations.update"');
});

test("resolução real falha fechada sem banco ou vínculo", () => {
  const composition = read("data/authentication.server.ts");
  expect(composition).toMatch(/^import "server-only";/);
  expect(composition).toContain("if (!databaseUrl) return null");
  expect(composition).toContain('return { kind: "denied" }');
  expect(composition).not.toMatch(/userId|orgId|orgRole|tenantIds/);
});

test("saída encerra explicitamente a sessão ativa e informa falhas", () => {
  const signOut = read("app/admin/sign-out-button.tsx");
  expect(signOut).toContain("useAuth()");
  expect(signOut).toContain("useClerk()");
  expect(signOut).toContain('redirectUrl = "/login"');
  expect(signOut).toContain("signOut({ sessionId, redirectUrl })");
  expect(signOut).toContain('role="alert"');
});

test("provisionamento local não imprime identidade ou credencial", () => {
  const executor = read("scripts/database/manage-local-admin-link.mjs");
  const wrapper = read("scripts/database/manage-local-admin-link.ps1");
  expect(wrapper).toContain('Read-Host "Senha local do PostgreSQL" -AsSecureString');
  expect(wrapper).toContain("Remove-Item Env:\\CARDAPIO_DB_ADMIN_PASSWORD");
  expect(executor).toContain("users.length !== 1");
  expect(executor).toContain("[identity.issuer, identity.subject, principalId]");
  expect(executor).toContain("async function resolveRequiredDevelopmentIdentity()");
  expect(executor).toContain("await provision(await resolveRequiredDevelopmentIdentity())");
  expect(executor).not.toContain("const identity = await resolveSingleDevelopmentIdentity(environment);");
  expect(executor).not.toMatch(/console\.log\([^)]*(issuer|subject|password|databaseUrl)/i);
  expect(executor).toContain('mode: 0o600');
  expect(executor).toContain('action === "enablecatalogread"');
  expect(executor).toContain('action === "enablecatalogavailabilitywrite"');
  expect(executor).toContain('action === "enablecatalogpricewrite"');
  expect(executor).toContain('action === "enablecatalogauditread"');
  expect(executor).toContain('action === "enablecatalogcontentwrite"');
  expect(executor).toContain('action === "enablecatalogcategoryassignmentwrite"');
  expect(executor).toContain('action === "enabletenantprofilewrite"');
  expect(executor).toContain('action === "enabletenantprofileauditread"');
  expect(executor).toContain('action === "enablecategorywrite"');
  expect(executor).toContain('action === "enablecategoryauditread"');
  expect(executor).toContain('action === "enablecategorycreation"');
  expect(executor).toContain('action === "enableproductcreation"');
  expect(executor).toContain('action === "enabletenantfulfillmentactivation"');
  expect(executor).toContain('action === "enablecatalogimagemetadatawrite"');
  expect(executor).toContain('action === "enabledeliverygovernancewrite"');
  expect(executor).toContain("0007_tenant_profile_writes.up.sql");
  expect(executor).toContain("0008_category_writes.up.sql");
  expect(executor).toContain("0009_category_creation.up.sql");
  expect(executor).toContain("0010_tenant_fulfillment_activation.up.sql");
  expect(executor).toContain("0011_catalog_image_metadata.up.sql");
  expect(executor).toContain("0012_catalog_image_audit_actions.up.sql");
  expect(executor).toContain("GRANT SELECT, INSERT, UPDATE ON TABLE tenant_profile_images, product_catalog_images");
  expect(executor).toContain("REVOKE DELETE ON TABLE tenant_profile_images, product_catalog_images");
  expect(executor).toContain("GRANT SELECT, INSERT ON TABLE tenant_profile_audit_events, catalog_audit_events");
  expect(executor).toContain("0015_tenant_delivery_origin.up.sql");
  expect(executor).toContain("0016_tenant_privacy_settings.up.sql");
  expect(executor).toContain("0017_product_creation.up.sql");
  expect(executor).toContain("GRANT INSERT (tenant_id, id, category_id, slug, name, description, base_price_in_cents, is_available) ON products");
  expect(executor).toContain("GRANT INSERT (tenant_id, label, postal_code, street, number, complement, neighborhood, city, state) ON tenant_delivery_origins");
  expect(executor).toContain("GRANT UPDATE (controller_legal_name, privacy_email, order_address_retention_days, version, updated_at) ON tenant_privacy_settings");
  expect(executor).toContain("REVOKE UPDATE, DELETE ON tenant_delivery_origin_audit_events, tenant_privacy_audit_events");
  expect(executor).toContain("UPDATE (short_name, tagline, version, updated_at)");
  expect(executor).toContain("INSERT ON TABLE tenant_profile_audit_events");
  expect(executor).toContain("SELECT ON TABLE tenant_profile_audit_events");
  expect(executor).toContain("UPDATE (name, sort_order, version, updated_at)");
  expect(executor).toContain("INSERT ON TABLE category_audit_events");
  expect(executor).toContain("SELECT ON TABLE category_audit_events");
  expect(executor).toContain("INSERT ON TABLE categories");
  expect(executor).toContain("INSERT ON TABLE tenant_fulfillment_modes");
  expect(executor).toContain("INSERT ON TABLE product_fulfillment_modes");
  expect(executor).toContain("UPDATE (version, updated_at) ON TABLE products");
  expect(executor).toContain('action === "enablecatalogfulfillmentmodeswrite"');
  expect(executor).toContain("GRANT SELECT ON TABLE");
  expect(executor).toContain("GRANT UPDATE (is_available, version, updated_at)");
  expect(executor).toContain("GRANT UPDATE (base_price_in_cents, version, updated_at)");
  expect(executor).toContain("GRANT UPDATE (name, description, version, updated_at)");
  expect(executor).toContain("GRANT UPDATE (category_id, version, updated_at)");
  expect(executor).toContain("GRANT INSERT, DELETE ON TABLE product_fulfillment_modes");
  expect(executor).toContain("Categoria de validação");
  expect(executor).toContain("GRANT INSERT ON TABLE catalog_audit_events");
  expect(executor).not.toContain("GRANT UPDATE (is_available, base_price_in_cents");
  expect(executor).not.toMatch(/GRANT\s+(INSERT|UPDATE|DELETE).*readableTables/i);
});

test("auditoria administrativa é autorizada, limitada e não expõe ator técnico", () => {
  const page = read("app/admin/admin-surfaces.tsx");
  const composition = read("data/admin-catalog-audit.server.ts");
  const repository = read("data/postgres-catalog-audit-repository.ts");
  expect(composition).toContain('authorizeTenant(identity, tenantId, "tenant.audit.read")');
  expect(composition).toContain("AUDIT_EVENT_LIMIT = 20");
  expect(repository).toContain("BEGIN READ ONLY");
  expect(repository).toContain("set_config('app.tenant_id'");
  expect(repository).toContain("LIMIT $2");
  expect(page).not.toMatch(/actorId|issuer|subject|userId/);
  expect(page).not.toMatch(/searchParams|params\s*:/);
  const profileComposition = read("data/admin-tenant-profile-audit.server.ts");
  const profileRepository = read("data/postgres-tenant-profile-audit-repository.ts");
  expect(profileComposition).toMatch(/^import "server-only";/);
  expect(profileComposition).toContain('authorizeTenant(identity, tenantId, "tenant.audit.read")');
  expect(profileComposition).toContain("PROFILE_AUDIT_LIMIT = 20");
  expect(profileRepository).not.toContain("actor_id");
});

test("composição operacional de imagens permanece server-only e recebe entrada autorizada", () => {
  const composition = read("data/admin-catalog-image-command.server.ts");
  const actions = read("app/admin/actions.ts");
  const form = read("app/admin/image-upload-form.tsx");
  expect(composition).toMatch(/^import "server-only";/);
  expect(composition).toContain("AuthorizedCatalogImageAdministrationService");
  expect(composition).toContain("SharpCatalogImageProcessor");
  expect(composition).toContain("createVercelBlobCatalogImageStorage");
  expect(composition).toContain("PostgresCatalogImageMetadataRepository");
  expect(composition).toContain("CatalogImageUploadRateLimiter");
  expect(composition).toContain("query_timeout: 8_000");
  expect(composition).toContain("statement_timeout: 7_000");
  expect(composition).toContain("BLOB_READ_WRITE_TOKEN");
  expect(actions).toContain("uploadDerivedCatalogImage");
  expect(actions).not.toMatch(/formData\.get\(["'](?:tenantId|role|actorId)/);
  expect(form).toContain('accept="image/jpeg,image/png,image/webp"');
  expect(form).not.toContain('name="confirmed"');
  expect(form).toContain('{currentUrl ? "Adicionar imagem" : "Selecionar imagem"}');
  expect(form).toContain('pending ? "Processando…" : "Salvar imagem"');
  expect(form).toContain('name="altText"');
  expect(form).toContain("URL.revokeObjectURL");
});

test("disponibilidade e opções de atendimento são salvas juntas com contexto derivado", () => {
  const action = read("app/admin/actions.ts");
  const form = read("app/admin/fulfillment-modes-form.tsx");
  const styles = read("app/admin/admin.module.scss");
  expect(action).toContain("await auth.protect()");
  expect(action).toContain("await resolveCurrentIdentity()");
  expect(action).toContain("await resolveCurrentTenantAccess(identity.identity)");
  expect(action).toContain("access.length !== 1");
  expect(action).not.toMatch(/formData\.get\(["'](?:tenantId|role|actorId)/);
  expect(form).not.toContain('name="confirmed"');
  expect(form).toContain('name="expectedVersion"');
  expect(form).toContain('name="unavailable"');
  expect(form).toContain("Não disponível");
  const cardEditor = read("app/admin/product-card-editor.tsx");
  const managementForm = read("app/admin/product-creation-form.tsx");
  expect(cardEditor).toContain("beginEdit(product)");
  expect(cardEditor).toContain(">⋮</summary>");
  expect(cardEditor).not.toContain("window.confirm");
  expect(managementForm).not.toContain("Excluir produto");
  expect(cardEditor).toContain('value="archive"');
  expect(cardEditor).toContain("styles.productActionsMenu");
  expect(cardEditor).toContain("onMouseEnter={() => setMenuOpen(true)}");
  expect(cardEditor).toContain("if (!menuPinned) setMenuOpen(false)");
  expect(cardEditor).toContain("setMenuPinned((pinned)");
  expect(cardEditor).toContain('event.key === "Escape"');
  expect(styles).toContain(".productActionsMenuItems");
  expect(styles).toContain("top: 100%");
  expect(styles).toContain(".productActionsMenu[open]");
  expect(styles).toContain("z-index: 30");
  expect(styles).toContain(".categoryCardEditor");
  expect(styles).toContain("flex: none");
  expect(styles).toContain(".categoryIdentity span");
  expect(styles).toContain("overflow-wrap: anywhere");
  expect(styles).toContain("padding: 0.85rem");
  expect(styles).toContain("align-self: start");
  expect(styles).toContain(".confirmationDialogActions");
  expect(styles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  expect(cardEditor).not.toContain("<ProductManagementForm");
  expect(form).toContain("Salvar opções");
  expect(form).toContain('name="fulfillmentModes"');
  expect(form).toContain("checked={!unavailable && modes.includes(mode)}");
  expect(form).toContain("disabled={unavailable}");
  expect(form).toContain("if (event.currentTarget.checked) setModes([])");
  expect(action).toContain("await updateDerivedProductAvailabilityOptions");
  expect(action).toContain("...(isAvailable ? { fulfillmentModes } : {})");
});

test("edição de preço converte reais em centavos e não aceita contexto de autorização", () => {
  const action = read("app/admin/actions.ts");
  const form = read("app/admin/price-form.tsx");
  expect(action).toContain("parsePriceInCents");
  expect(action).toContain("MAX_PRODUCT_PRICE_IN_CENTS");
  expect(action).toContain("await updateDerivedProductPrice");
  expect(action).not.toMatch(/formData\.get\(["'](?:tenantId|role|actorId)/);
  expect(form).toContain('inputMode="decimal"');
  expect(form).toContain('name="confirmed" required');
  expect(form).toContain('name="expectedVersion"');
});

test("edição de conteúdo limita campos e renova autorização no servidor", () => {
  const action = read("app/admin/actions.ts");
  const form = read("app/admin/content-form.tsx");
  expect(action).toContain("await updateDerivedProductContent");
  expect(action).toContain("MAX_PRODUCT_NAME_LENGTH");
  expect(action).toContain("MAX_PRODUCT_DESCRIPTION_LENGTH");
  expect(action).not.toMatch(/formData\.get\(["'](?:tenantId|role|actorId)/);
  expect(form).toContain('maxLength={120}');
  expect(form).toContain('maxLength={500}');
  expect(form).toContain('name="confirmed" required');
  expect(form).toContain('name="expectedVersion"');
});

test("classificação de produto aceita somente categoria técnica e contexto derivado", () => {
  const action = read("app/admin/actions.ts");
  const form = read("app/admin/category-form.tsx");
  const repository = read("data/postgres-catalog-command-repository.ts");
  expect(action).toContain("await updateDerivedProductCategory");
  expect(action).not.toMatch(/formData\.get\(["'](?:tenantId|role|actorId)/);
  expect(form).toContain('name="categoryId" required');
  expect(form).toContain('name="confirmed" required');
  expect(repository).toContain("FROM categories WHERE tenant_id = $1 AND id = $2");
  expect(repository).toContain("categoryName");
});

test("modalidades do produto exibem todas as opções e usam contexto derivado", () => {
  const page = read("app/admin/admin-surfaces.tsx");
  const action = read("app/admin/actions.ts");
  const form = read("app/admin/fulfillment-modes-form.tsx");
  const repository = read("data/postgres-catalog-command-repository.ts");
  expect(page).toContain("tenantModes={catalog.tenant.fulfillmentModes}");
  expect(action).toContain("await updateDerivedProductAvailabilityOptions");
  expect(action).toContain('formData.getAll("fulfillmentModes")');
  expect(action).not.toMatch(/formData\.get\(["'](?:tenantId|role|actorId)/);
  expect(form).toContain('<fieldset aria-label="Disponibilidade do Produto">');
  expect(form).toContain('name="fulfillmentModes"');
  expect(form).toContain('const modeOrder: readonly FulfillmentMode[] = ["pickup", "delivery", "dine_in"]');
  expect(form).toContain("{modeOrder.map((mode) => (");
  expect(form).toContain('dine_in: "Na mesa"');
  expect(form).not.toContain('name="confirmed"');
  expect(repository).toContain("FROM tenant_fulfillment_modes WHERE tenant_id = $1");
  expect(repository).toContain("ANY($2::text[])");
  expect(repository).toContain("unnest($3::text[])");
  expect(repository).not.toContain("fulfillment_mode[]");
  expect(repository).toContain("DELETE FROM product_fulfillment_modes");
});

test("edição do perfil deriva contexto e não aceita tenant ou ator do formulário", () => {
  const actions = read("app/admin/actions.ts");
  const form = read("app/admin/tenant-profile-form.tsx");
  const composition = read("data/admin-tenant-profile-command.server.ts");
  expect(actions).toContain("export async function updateTenantProfile");
  expect(actions).toContain("await auth.protect()");
  expect(actions).toContain("const context = await resolveMutationContext()");
  expect(actions).toContain("updateDerivedTenantProfile({");
  expect(actions).toContain("tenantId: context.tenantId");
  expect(form).toContain('name="expectedVersion"');
  expect(form).toContain('name="shortName"');
  expect(form).toContain('name="tagline"');
  expect(form).toContain("Nome da Empresa");
  expect(form).toContain("MAX_TENANT_SHORT_NAME_LENGTH");
  expect(form).toContain("MAX_TENANT_TAGLINE_LENGTH");
  expect(form).not.toContain('name="confirmed"');
  expect(form).not.toMatch(/name="(?:tenantId|actorId|role)"/);
  expect(composition).toMatch(/^import "server-only";/);
  expect(composition).toContain("AuthorizedTenantProfileAdministrationService");
});

test("composição de categorias permanece no servidor e não aceita ator externo", () => {
  const composition = read("data/admin-category-command.server.ts");
  expect(composition).toContain('import "server-only"');
  expect(composition).toContain("updateDerivedCategory");
  expect(composition).toContain("AuthorizedCategoryAdministrationService");
  expect(composition).not.toMatch(/actor(Id|Role)?\s*:/);
});

test("composição de criação de categorias permanece no servidor sem contexto externo", () => {
  const composition = read("data/admin-category-creation.server.ts");
  expect(composition).toContain('import "server-only"');
  expect(composition).toContain("createDerivedCategory");
  expect(composition).toContain("AuthorizedCategoryCreationService");
  expect(composition).toContain("PostgresCategoryCreationRepository");
  expect(composition).not.toMatch(/actor(Id|Role)?\s*:/);
  expect(composition).not.toMatch(/categoryId|slug/);
});

test("cadastro de produto deriva contexto, persiste disponibilidade e limita os campos", () => {
  const actions = read("app/admin/actions.ts");
  const form = read("app/admin/product-creation-form.tsx");
  const styles = read("app/admin/admin.module.scss");
  const composition = read("data/admin-product-creation.server.ts");
  const repository = read("data/postgres-product-creation-repository.ts");
  const createAction = actions.slice(
    actions.indexOf("export async function createProductManagement"),
    actions.indexOf("export async function updateProductManagement"),
  );
  expect(actions).toContain("export async function createProductManagement");
  expect(actions).toContain("createDerivedProduct({");
  expect(createAction).toContain("uploadDerivedCatalogImage({");
  expect(createAction.indexOf("createDerivedProduct({")).toBeLessThan(createAction.indexOf("uploadDerivedCatalogImage({"));
  expect(createAction).toContain('target: { kind: "product", productId }');
  expect(createAction).toContain('expectedVersion: null');
  expect(createAction).toContain('recordCatalogImageOperationalFailure(error, "product")');
  expect(createAction).toContain("Produto criado com a disponibilidade selecionada. A imagem não foi salva");
  expect(createAction).not.toMatch(/formData\.get\(["'](?:tenantId|productId|slug|isAvailable|role|actorId)/);
  expect(form).toContain("Adicionar produto");
  expect(form).toContain('name="name"');
  expect(form).toContain('name="price"');
  expect(form).toContain('name="categoryId"');
  expect(form).toContain('aria-haspopup="listbox"');
  expect(form).toContain('role="listbox"');
  expect(form).toContain('role="option"');
  expect(form).not.toContain("<select");
  expect(form).toContain("styles.customSelectChevron");
  expect(styles).toContain("scrollbar-width: none");
  expect(styles).toContain(".customSelectOptions::-webkit-scrollbar");
  expect(styles).toContain("-webkit-tap-highlight-color: transparent");
  expect(styles).toContain("@media (hover: hover) and (pointer: fine)");
  expect(styles).toContain(".productCreationFields > *");
  expect(styles).toContain("font-size: 0.85rem");
  expect(form).toContain('name="fulfillmentModes"');
  expect(form).toContain('accept="image/jpeg,image/png,image/webp"');
  expect(form).toContain('name="image"');
  expect(form).toContain('type="file"');
  expect(form).toContain("Disponibilidade do Produto");
  expect(form).not.toContain("Opções do produto");
  expect(form).toContain("Não disponível");
  expect(form).toContain("if (event.currentTarget.checked) setSelectedModes([])");
  expect(form).toContain("setUnavailable(nextModes.length === 0)");
  expect(form).toContain("updateProductManagement");
  expect(form).toContain("Salvar alterações");
  expect(form).toContain("Salvar Produto");
  expect(form.indexOf("Salvar Produto")).toBeLessThan(form.lastIndexOf("Cancelar"));
  expect(form).toContain("styles.productFormActions");
  expect(form).not.toContain("Preencha os dados e escolha onde o produto ficará disponível.");
  expect(form).not.toContain("Atualize os dados necessários e salve em uma única operação.");
  expect(form).not.toContain("Excluir produto");
  expect(form).not.toContain("Confirmo a exclusão deste produto.");
  expect(read("app/admin/product-card-editor.tsx")).toContain('role="alertdialog"');
  expect(read("app/admin/product-card-editor.tsx")).toContain("Excluir produto?");
  expect(read("app/admin/product-card-editor.tsx")).not.toContain("window.confirm");
  expect(composition).toMatch(/^import "server-only";/);
  expect(composition).toContain("AuthorizedProductCreationService");
  expect(repository).toContain("randomUUID()");
  expect(repository).toContain("VALUES ($1, $2, $3, $4, $5, $6, $7, $8)");
  expect(repository).toContain("command.isAvailable");
  expect(repository).toContain("'product.created'");
});

test("composição de Na mesa permanece no servidor e deriva a modalidade", () => {
  const composition = read("data/admin-tenant-fulfillment-command.server.ts");
  expect(composition).toContain('import "server-only"');
  expect(composition).toContain("enableDerivedDineIn");
  expect(composition).toContain("AuthorizedTenantFulfillmentAdministrationService");
  expect(composition).toContain("PostgresTenantFulfillmentCommandRepository");
  expect(composition).toContain('mode: "dine_in"');
  expect(composition).not.toMatch(/actor(Id|Role)?\s*:/);
});

test("ativação de Na mesa aceita somente produtos e confirmação do formulário", () => {
  const actions = read("app/admin/actions.ts");
  const form = read("app/admin/dine-in-activation-form.tsx");
  expect(actions).toContain("export async function activateDineIn");
  expect(actions).toContain("await auth.protect()");
  expect(actions).toContain("enableDerivedDineIn({");
  expect(actions).toContain("tenantId: context.tenantId");
  expect(form).toContain('name="productIds"');
  expect(form).toContain('name="confirmed"');
  expect(form).not.toMatch(/name="(?:tenantId|actorId|role|mode)"/);
});

test("criação de categoria deriva contexto no servidor e não aceita identificadores", () => {
  const actions = read("app/admin/actions.ts");
  const form = read("app/admin/category-creation-form.tsx");
  const styles = read("app/admin/admin.module.scss");
  expect(actions).toContain("export async function createCategoryManagement");
  expect(actions).toContain("await auth.protect()");
  expect(actions).toContain("createDerivedCategory({");
  expect(actions).toContain("tenantId: context.tenantId");
  expect(form).toContain('name="name"');
  expect(form).toContain('name="sortOrder"');
  expect(form).toContain('name="confirmed"');
  expect(form).toContain("Adicionar categoria");
  expect(form).toContain('aria-controls="new-category-card"');
  expect(form).toContain("Cancelar");
  expect(form).toContain("styles.categoryCreationConfirmation");
  expect(form).toContain("Confirmo a criação desta categoria.");
  expect(form).not.toContain("com o nome e a ordem informados");
  expect(styles).toContain("margin: 1rem 0 0");
  expect(styles).toContain("justify-content: space-between");
  expect(styles).toMatch(/\.categoryCreationActions\s*\{[\s\S]*?justify-content:\s*space-between/);
  expect(styles).toContain("padding-right: 2.75rem");
  expect(form.indexOf("Criar categoria")).toBeLessThan(form.lastIndexOf("Cancelar"));
  expect(form).toContain("if (isOpen)");
  expect(form).not.toMatch(/name="(?:tenantId|actorId|role|categoryId|slug)"/);
  expect(form).not.toContain("Excluir");
});

test("edição de categoria deriva tenant e ator novamente no servidor", () => {
  const actions = read("app/admin/actions.ts");
  const form = read("app/admin/category-management-form.tsx");
  const page = read("app/admin/admin-surfaces.tsx");
  const styles = read("app/admin/admin.module.scss");
  expect(actions).toContain("updateCategoryManagement");
  expect(actions).toContain("archiveDerivedCategory");
  expect(actions).toContain('hasPostgresErrorCode(error, "42501")');
  expect(actions).toContain("O arquivamento de categorias ainda não foi habilitado no banco local.");
  expect(page).toContain("productCount={productCount}");
  expect(read("app/admin/category-management-form.tsx")).toContain(">⋮</summary>");
  expect(read("app/admin/category-management-form.tsx")).toContain('value="archive"');
  expect(read("app/admin/category-management-form.tsx")).toContain('role="alertdialog"');
  expect(read("app/admin/category-management-form.tsx")).not.toContain("window.confirm");
  expect(read("app/admin/category-management-form.tsx")).toContain("styles.confirmationDialogButton");
  expect(read("app/admin/category-management-form.tsx")).toContain("styles.dangerMenuItem");
  expect(read("app/admin/category-management-form.tsx")).toContain("Categoria vinculada a produtos");
  expect(read("app/admin/category-management-form.tsx")).toContain("productCount === 0 ? <form");
  expect(read("app/admin/category-management-form.tsx")).toContain("styles.categoryCreationConfirmation");
  expect(read("app/admin/category-management-form.tsx")).toContain("Confirmo a atualização desta categoria.");
  expect(styles).toMatch(/\.categoryManagementForm \.categoryCreationActions\s*\{[\s\S]*?justify-content:\s*space-between/);
  expect(styles).toMatch(/\.categoryCardEditor:has\(\.categoryManagementForm\)\s*\{[\s\S]*?width:\s*100%/);
  expect(read("app/admin/category-management-form.tsx")).toContain('nextState.status === "success"');
  expect(read("app/admin/category-management-form.tsx")).toContain("setEditing(false)");
  expect(read("app/admin/category-management-form.tsx")).toContain("setArchived(true)");
  expect(read("app/admin/category-management-form.tsx")).toContain("router.refresh()");
  expect(read("app/admin/category-management-workspace.tsx")).toContain("CategoryManagementWorkspace");
  expect(read("app/admin/category-management-form.tsx")).toContain("useCategoryNotification");
  expect(read("app/admin/category-management-form.tsx")).toContain('"Categoria atualizada"');
  expect(actions).toContain("resolveMutationContext()");
  expect(actions).toContain("updateDerivedCategory({");
  expect(form).toContain('name="categoryId"');
  expect(form).toContain('name="expectedVersion"');
  expect(form).toContain('name="confirmed"');
  expect(form).not.toMatch(/tenantId|actorId|actorRole/);
});

test("auditoria de categorias é limitada e não seleciona ator técnico", () => {
  const repository = read("data/postgres-category-audit-repository.ts");
  expect(repository).toContain("limit > 20");
  expect(repository).toContain("BEGIN READ ONLY");
  expect(repository).toContain("set_config('app.tenant_id'");
  expect(repository).toContain("LIMIT $2");
  expect(repository).not.toContain("actor_id");
});

test("auditoria administrativa de categorias renova autorização e fixa limite", () => {
  const composition = read("data/admin-category-audit.server.ts");
  expect(composition).toContain('import "server-only"');
  expect(composition).toContain('authorizeTenant(identity, tenantId, "tenant.audit.read")');
  expect(composition).toContain("CATEGORY_AUDIT_LIMIT = 20");
  expect(composition).not.toContain("actor_id");
});

test("laboratório de cobertura usa somente cenários fictícios e contexto derivado", () => {
  const actions = read("app/admin/actions.ts");
  const form = read("app/admin/delivery-coverage-preview.tsx");
  const composition = read("data/delivery-coverage.server.ts");
  expect(composition).toContain('import "server-only"');
  expect(composition).toContain('process.env.NODE_ENV === "production"');
  expect(actions).toContain("export async function testLocalDeliveryCoverage");
  expect(actions).toContain("resolveMutationContext()");
  expect(actions).toContain("loadDerivedTenantCatalog(context.tenantId)");
  expect(actions).toContain("LOCAL_COVERAGE_NEAR_ADDRESS");
  expect(actions).toContain("LOCAL_COVERAGE_FAR_ADDRESS");
  expect(form).toContain('name="scenario"');
  expect(form).toContain("Limite atual:");
  expect(form).toContain("maximumDistanceInMeters");
  expect(read("app/admin/admin-surfaces.tsx")).toContain('key={`${catalog.tenant.operations.version');
  expect(form).not.toMatch(/name="(?:tenantId|address|postalCode|street|number|city|state)"/);
});

test("governança de entrega deriva tenant no servidor e não envia origem ao provedor ao salvar", () => {
  const actions = read("app/admin/actions.ts");
  const forms = read("app/admin/delivery-origin-form.tsx") + read("app/admin/tenant-privacy-form.tsx");
  const composition = read("data/admin-delivery-governance-command.server.ts");
  const query = read("data/admin-delivery-governance.server.ts");
  expect(composition).toMatch(/^import "server-only";/);
  expect(query).toMatch(/^import "server-only";/);
  expect(actions).toContain("resolveMutationContext()");
  expect(actions).toContain("saveDerivedTenantPrivacy");
  expect(actions).toContain("saveDerivedDeliveryOrigin");
  expect(forms).not.toMatch(/name=["']tenantId|name=["']actor/i);
  expect(forms).toContain("O endereço é salvo primeiro. A validação geográfica só ocorre quando você solicitar abaixo.");
  expect(forms).toContain("aguardando validação");
  expect(composition).not.toContain("Geoapify");
  expect(query).not.toContain("latitude, longitude");
});

test("validação geográfica relê a origem no servidor e audita sem coordenadas", () => {
  const actions = read("app/admin/actions.ts");
  const composition = read("data/admin-delivery-origin-validation.server.ts");
  const repository = read("data/postgres-delivery-origin-geocoding-repository.ts");
  expect(actions).toContain("validateDerivedDeliveryOrigin");
  expect(composition).toContain("repository.find(input.tenantId)");
  expect(composition).toContain("process.env.GEOAPIFY_API_KEY");
  expect(composition).toContain("controller.abort()");
  expect(repository).toContain("tenant.delivery_origin.geocoded");
  expect(repository).toContain('provider: "geoapify"');
  expect(repository).not.toMatch(/JSON\.stringify\([^)]*(latitude|longitude|postalCode|street)/);
});
