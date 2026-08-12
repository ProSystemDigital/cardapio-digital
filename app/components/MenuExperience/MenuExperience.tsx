"use client";

import { useCallback, useMemo, useState } from "react";
import { FaMinus, FaPen, FaPlus, FaSearch, FaShoppingBag, FaTimes, FaTrash } from "react-icons/fa";
import {
  ALL_CATEGORIES,
  filterProducts,
  type CategoryFilter,
} from "../../../domain/cart";
import type { FulfillmentMode, Product, TenantCatalog } from "../../../domain/catalog";
import {
  addOrMergeCartLine,
  changeLineQuantity,
  createCartLine,
  getLineItemCount,
  getLinesSubtotalInCents,
  replaceCartLine,
  type CartLine,
  type ProductSelection,
} from "../../../domain/order-cart";
import ProductCustomizer from "../ProductCustomizer/ProductCustomizer";
import styles from "./MenuExperience.module.scss";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fulfillmentLabels: Record<FulfillmentMode, string> = {
  dine_in: "mesa",
  pickup: "retirada",
  delivery: "entrega",
};

function formatPrice(priceInCents: number) {
  return currency.format(priceInCents / 100);
}

type CustomizationTarget = { product: Product; line?: CartLine };

export default function MenuExperience({ catalog }: Readonly<{ catalog: TenantCatalog }>) {
  const { tenant, categories, products } = catalog;
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [lines, setLines] = useState<readonly CartLine[]>([]);
  const [customization, setCustomization] = useState<CustomizationTarget | null>(null);
  const [cartError, setCartError] = useState("");

  const visibleProducts = useMemo(
    () => filterProducts(products, category, query),
    [category, products, query],
  );
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const categoryNames = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );
  const itemCount = getLineItemCount(lines);
  const subtotalInCents = getLinesSubtotalInCents(lines);

  const closeCustomizer = useCallback(() => setCustomization(null), []);

  const commitSelection = (selection: ProductSelection, editingLine?: CartLine) => {
    const result = createCartLine(catalog, selection, editingLine?.id ?? crypto.randomUUID());
    if (!result.ok) return result.errors;

    setLines((current) =>
      editingLine
        ? replaceCartLine(current, { ...result.line, quantity: editingLine.quantity })
        : addOrMergeCartLine(current, result.line),
    );
    setCustomization(null);
    setCartError("");
    return [];
  };

  const addProduct = (product: Product) => {
    if (product.variations?.length || product.addonGroups?.length) {
      setCustomization({ product });
      return;
    }

    const errors = commitSelection({
      tenantId: tenant.id,
      productId: product.id,
      addonIds: [],
    });
    setCartError(errors.join(" "));
  };

  const lineDetails = (line: CartLine, product: Product) => {
    const variation = product.variations?.find((item) => item.id === line.variationId)?.name;
    const addonNames = (product.addonGroups ?? []).flatMap((group) =>
      group.addons.filter((addon) => line.addonIds.includes(addon.id)).map((addon) => addon.name),
    );
    return [variation, ...addonNames].filter(Boolean).join(" · ");
  };

  return (
    <main>
      <header className={styles.header}>
        <a className={styles.brand} href="#inicio" aria-label={`${tenant.displayName}, início`}>
          <span className={styles.brandMark}>{tenant.shortName}</span>
          <span>{tenant.displayName}<small>{tenant.tagline}</small></span>
        </a>
        <div className={styles.status}><span /> Horários configurados</div>
        <button className={styles.cartButton} onClick={() => setCartOpen(true)} aria-label={`Abrir carrinho com ${itemCount} itens`}>
          <FaShoppingBag aria-hidden="true" /> Carrinho<span>{itemCount}</span>
        </button>
      </header>

      <section className={styles.hero} id="inicio">
        <div><p className={styles.eyebrow}>Sabor local · ingredientes frescos</p><h1>Seu próximo prato favorito está aqui.</h1><p>Escolha com calma, personalize seu pedido e deixe o resto com a nossa cozinha.</p></div>
        <aside><span>Tempo médio</span><strong>25–35 min</strong><small>{tenant.fulfillmentModes.map((mode) => fulfillmentLabels[mode]).join(" · ")}</small></aside>
      </section>

      <section className={styles.menuSection} aria-labelledby="menu-title">
        <div className={styles.menuHeading}>
          <div><p className={styles.eyebrow}>Feito hoje</p><h2 id="menu-title">Nosso cardápio</h2></div>
          <label className={styles.search}><FaSearch aria-hidden="true" /><span className={styles.srOnly}>Buscar no cardápio</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pratos..." /></label>
        </div>
        <div className={styles.categories} aria-label="Categorias">
          <button className={category === ALL_CATEGORIES ? styles.activeCategory : ""} onClick={() => setCategory(ALL_CATEGORIES)} aria-pressed={category === ALL_CATEGORIES}>Todos</button>
          {categories.map((item) => <button key={item.id} className={category === item.id ? styles.activeCategory : ""} onClick={() => setCategory(item.id)} aria-pressed={category === item.id}>{item.name}</button>)}
        </div>
        {visibleProducts.length ? (
          <div className={styles.grid}>
            {visibleProducts.map((product) => (
              <article className={styles.card} key={product.id}>
                <div className={styles.foodVisual} aria-hidden="true"><span>{product.emoji}</span>{product.tag ? <small>{product.tag}</small> : null}</div>
                <div className={styles.cardContent}>
                  <div><p>{categoryNames.get(product.categoryId)}</p><h3>{product.name}</h3></div>
                  <p className={styles.description}>{product.description}</p>
                  <div className={styles.cardFooter}><strong>{product.variations?.length ? "A partir de " : ""}{formatPrice(product.priceInCents)}</strong><button onClick={() => addProduct(product)} aria-label={`${product.variations?.length || product.addonGroups?.length ? "Personalizar" : "Adicionar"} ${product.name}`}><FaPlus aria-hidden="true" /> {product.variations?.length || product.addonGroups?.length ? "Personalizar" : "Adicionar"}</button></div>
                </div>
              </article>
            ))}
          </div>
        ) : <p className={styles.emptySearch}>Nenhum prato encontrado. Tente outra busca.</p>}
      </section>

      <footer className={styles.footer}><strong>{tenant.displayName}</strong><p>Cardápio demonstrativo · preços em reais</p><a href="#inicio">Voltar ao topo ↑</a></footer>

      {cartOpen ? <button className={styles.backdrop} onClick={() => setCartOpen(false)} aria-label="Fechar carrinho" /> : null}
      <aside className={`${styles.drawer} ${cartOpen ? styles.drawerOpen : ""}`} aria-label="Carrinho" aria-hidden={!cartOpen}>
        <div className={styles.drawerHeader}><div><p className={styles.eyebrow}>Seu pedido</p><h2>Carrinho</h2></div><button onClick={() => setCartOpen(false)} aria-label="Fechar carrinho"><FaTimes aria-hidden="true" /></button></div>
        <div className={styles.cartItems}>
          {lines.length ? lines.map((line) => {
            const product = productsById.get(line.productId);
            if (!product) return null;
            const details = lineDetails(line, product);
            return <div className={styles.cartItem} key={line.id}><span aria-hidden="true">{product.emoji}</span><div><strong>{product.name}</strong>{details ? <small>{details}</small> : null}<small>{formatPrice(line.unitPriceInCents)} cada</small><div className={styles.lineActions}>{product.variations?.length || product.addonGroups?.length ? <button onClick={() => setCustomization({ product, line })}><FaPen aria-hidden="true" /> Editar</button> : null}<button onClick={() => setLines((current) => changeLineQuantity(current, line.id, -line.quantity))}><FaTrash aria-hidden="true" /> Remover</button></div></div><div className={styles.quantity}><button onClick={() => setLines((current) => changeLineQuantity(current, line.id, -1))} aria-label={`Remover uma unidade de ${product.name}`}><FaMinus aria-hidden="true" /></button><span>{line.quantity}</span><button onClick={() => setLines((current) => changeLineQuantity(current, line.id, 1))} aria-label={`Adicionar uma unidade de ${product.name}`}><FaPlus aria-hidden="true" /></button></div></div>;
          }) : <div className={styles.emptyCart}><span>🛍️</span><h3>Seu carrinho está vazio</h3><p>Adicione um prato para começar o pedido.</p></div>}
          {cartError ? <p className={styles.cartError} role="alert">{cartError}</p> : null}
        </div>
        <div className={styles.summary}><div><span>Subtotal</span><strong>{formatPrice(subtotalInCents)}</strong></div><small>Pedido mínimo demonstrativo: {formatPrice(tenant.operations.minimumOrderInCents)}{tenant.operations.deliveryFeeInCents !== undefined ? ` · entrega: ${formatPrice(tenant.operations.deliveryFeeInCents)}` : ""}. Envio por WhatsApp será implementado em fase futura.</small><button disabled>Pedidos em breve</button></div>
      </aside>

      {customization ? <ProductCustomizer product={customization.product} initialSelection={customization.line} formatPrice={formatPrice} onCancel={closeCustomizer} onConfirm={(selection) => commitSelection(selection, customization.line)} /> : null}
    </main>
  );
}
