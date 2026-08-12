"use client";

import { useMemo, useState } from "react";
import { FaMinus, FaPlus, FaSearch, FaShoppingBag, FaTimes } from "react-icons/fa";
import {
  ALL_CATEGORIES,
  changeCartQuantity,
  filterProducts,
  getCartItemCount,
  getCartSubtotalInCents,
  type Cart,
  type CategoryFilter,
} from "../../../domain/cart";
import type { FulfillmentMode, TenantCatalog } from "../../../domain/catalog";
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

export default function MenuExperience({ catalog }: Readonly<{ catalog: TenantCatalog }>) {
  const { tenant, categories, products } = catalog;
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<Cart>({});

  const visibleProducts = useMemo(
    () => filterProducts(products, category, query),
    [category, products, query],
  );

  const cartItems = products.filter((product) => cart[product.id]);
  const itemCount = getCartItemCount(cart);
  const subtotalInCents = getCartSubtotalInCents(products, cart);
  const categoryNames = new Map<string, string>(
    categories.map((item) => [item.id, item.name]),
  );

  const changeQuantity = (id: string, change: number) => {
    setCart((current) => changeCartQuantity(current, id, change));
  };

  return (
    <main>
      <header className={styles.header}>
        <a className={styles.brand} href="#inicio" aria-label={`${tenant.displayName}, início`}>
          <span className={styles.brandMark}>{tenant.shortName}</span>
          <span>{tenant.displayName}<small>{tenant.tagline}</small></span>
        </a>
        <div className={styles.status}><span /> Aberto agora · até 22h30</div>
        <button className={styles.cartButton} onClick={() => setCartOpen(true)} aria-label={`Abrir carrinho com ${itemCount} itens`}>
          <FaShoppingBag aria-hidden="true" /> Carrinho
          <span>{itemCount}</span>
        </button>
      </header>

      <section className={styles.hero} id="inicio">
        <div>
          <p className={styles.eyebrow}>Sabor local · ingredientes frescos</p>
          <h1>Seu próximo prato favorito está aqui.</h1>
          <p>Escolha com calma, personalize seu pedido e deixe o resto com a nossa cozinha.</p>
        </div>
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
                <div className={styles.foodVisual} aria-hidden="true"><span>{product.emoji}</span>{product.tag && <small>{product.tag}</small>}</div>
                <div className={styles.cardContent}>
                  <div><p>{categoryNames.get(product.categoryId)}</p><h3>{product.name}</h3></div>
                  <p className={styles.description}>{product.description}</p>
                  <div className={styles.cardFooter}><strong>{formatPrice(product.priceInCents)}</strong><button onClick={() => changeQuantity(product.id, 1)} aria-label={`Adicionar ${product.name} ao carrinho`}><FaPlus aria-hidden="true" /> Adicionar</button></div>
                </div>
              </article>
            ))}
          </div>
        ) : <p className={styles.emptySearch}>Nenhum prato encontrado. Tente outra busca.</p>}
      </section>

      <footer className={styles.footer}><strong>{tenant.displayName}</strong><p>Cardápio demonstrativo · preços em reais</p><a href="#inicio">Voltar ao topo ↑</a></footer>

      {cartOpen && <button className={styles.backdrop} onClick={() => setCartOpen(false)} aria-label="Fechar carrinho" />}
      <aside className={`${styles.drawer} ${cartOpen ? styles.drawerOpen : ""}`} aria-label="Carrinho" aria-hidden={!cartOpen}>
        <div className={styles.drawerHeader}><div><p className={styles.eyebrow}>Seu pedido</p><h2>Carrinho</h2></div><button onClick={() => setCartOpen(false)} aria-label="Fechar carrinho"><FaTimes /></button></div>
        <div className={styles.cartItems}>
          {cartItems.length ? cartItems.map((product) => <div className={styles.cartItem} key={product.id}><span aria-hidden="true">{product.emoji}</span><div><strong>{product.name}</strong><small>{formatPrice(product.priceInCents)}</small></div><div className={styles.quantity}><button onClick={() => changeQuantity(product.id, -1)} aria-label={`Remover uma unidade de ${product.name}`}><FaMinus /></button><span>{cart[product.id]}</span><button onClick={() => changeQuantity(product.id, 1)} aria-label={`Adicionar uma unidade de ${product.name}`}><FaPlus /></button></div></div>) : <div className={styles.emptyCart}><span>🛍️</span><h3>Seu carrinho está vazio</h3><p>Adicione um prato para começar o pedido.</p></div>}
        </div>
        <div className={styles.summary}><div><span>Subtotal</span><strong>{formatPrice(subtotalInCents)}</strong></div><small>Envio por WhatsApp, taxas e atendimento serão implementados em fase futura.</small><button disabled>Pedidos em breve</button></div>
      </aside>
    </main>
  );
}
