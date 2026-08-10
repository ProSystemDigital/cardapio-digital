"use client";

import { useMemo, useState } from "react";
import { FaMinus, FaPlus, FaSearch, FaShoppingBag, FaTimes } from "react-icons/fa";
import styles from "./MenuExperience.module.scss";

type Product = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  emoji: string;
  tag?: string;
};

const categories = ["Todos", "Entradas", "Principais", "Bebidas", "Sobremesas"];

const products: Product[] = [
  { id: 1, name: "Burrata da casa", description: "Tomates assados, pesto de manjericão e pão de fermentação natural.", category: "Entradas", price: 38, emoji: "🍅", tag: "Mais pedido" },
  { id: 2, name: "Croqueta de costela", description: "Quatro unidades, aioli defumado e picles artesanal.", category: "Entradas", price: 32, emoji: "🥟" },
  { id: 3, name: "Nhoque verde", description: "Massa de espinafre, fonduta de queijo e castanha crocante.", category: "Principais", price: 56, emoji: "🍝", tag: "Vegetariano" },
  { id: 4, name: "Frango na brasa", description: "Sobrecoxa desossada, purê rústico e molho de ervas.", category: "Principais", price: 52, emoji: "🍗" },
  { id: 5, name: "Burger Mesa Viva", description: "Blend 160g, queijo, cebola tostada e maionese da casa.", category: "Principais", price: 44, emoji: "🍔", tag: "Favorito" },
  { id: 6, name: "Limonada de capim-santo", description: "Limão, capim-santo e pouco açúcar. 400 ml.", category: "Bebidas", price: 14, emoji: "🍋" },
  { id: 7, name: "Chá mate cítrico", description: "Mate da casa, laranja e hortelã. 400 ml.", category: "Bebidas", price: 13, emoji: "🧋" },
  { id: 8, name: "Pudim de cumaru", description: "Pudim cremoso, caramelo salgado e cumaru.", category: "Sobremesas", price: 24, emoji: "🍮", tag: "Novo" },
];

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function MenuExperience() {
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<Record<number, number>>({});

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => {
      const matchesCategory = category === "Todos" || product.category === category;
      const matchesQuery = !normalizedQuery || `${product.name} ${product.description}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const cartItems = products.filter((product) => cart[product.id]);
  const itemCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const subtotal = cartItems.reduce((total, product) => total + product.price * cart[product.id], 0);

  const changeQuantity = (id: number, change: number) => {
    setCart((current) => {
      const quantity = Math.max(0, (current[id] ?? 0) + change);
      const next = { ...current, [id]: quantity };
      if (!quantity) delete next[id];
      return next;
    });
  };

  return (
    <main>
      <header className={styles.header}>
        <a className={styles.brand} href="#inicio" aria-label="Mesa Viva, início">
          <span className={styles.brandMark}>MV</span>
          <span>Mesa Viva<small>cozinha de verdade</small></span>
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
        <aside><span>Tempo médio</span><strong>25–35 min</strong><small>Retirada ou consumo no local</small></aside>
      </section>

      <section className={styles.menuSection} aria-labelledby="menu-title">
        <div className={styles.menuHeading}>
          <div><p className={styles.eyebrow}>Feito hoje</p><h2 id="menu-title">Nosso cardápio</h2></div>
          <label className={styles.search}><FaSearch aria-hidden="true" /><span className={styles.srOnly}>Buscar no cardápio</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pratos..." /></label>
        </div>
        <div className={styles.categories} aria-label="Categorias">
          {categories.map((item) => <button key={item} className={category === item ? styles.activeCategory : ""} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}
        </div>
        {visibleProducts.length ? (
          <div className={styles.grid}>
            {visibleProducts.map((product) => (
              <article className={styles.card} key={product.id}>
                <div className={styles.foodVisual} aria-hidden="true"><span>{product.emoji}</span>{product.tag && <small>{product.tag}</small>}</div>
                <div className={styles.cardContent}>
                  <div><p>{product.category}</p><h3>{product.name}</h3></div>
                  <p className={styles.description}>{product.description}</p>
                  <div className={styles.cardFooter}><strong>{currency.format(product.price)}</strong><button onClick={() => changeQuantity(product.id, 1)} aria-label={`Adicionar ${product.name} ao carrinho`}><FaPlus aria-hidden="true" /> Adicionar</button></div>
                </div>
              </article>
            ))}
          </div>
        ) : <p className={styles.emptySearch}>Nenhum prato encontrado. Tente outra busca.</p>}
      </section>

      <footer className={styles.footer}><strong>Mesa Viva</strong><p>Cardápio demonstrativo · preços em reais</p><a href="#inicio">Voltar ao topo ↑</a></footer>

      {cartOpen && <button className={styles.backdrop} onClick={() => setCartOpen(false)} aria-label="Fechar carrinho" />}
      <aside className={`${styles.drawer} ${cartOpen ? styles.drawerOpen : ""}`} aria-label="Carrinho" aria-hidden={!cartOpen}>
        <div className={styles.drawerHeader}><div><p className={styles.eyebrow}>Seu pedido</p><h2>Carrinho</h2></div><button onClick={() => setCartOpen(false)} aria-label="Fechar carrinho"><FaTimes /></button></div>
        <div className={styles.cartItems}>
          {cartItems.length ? cartItems.map((product) => <div className={styles.cartItem} key={product.id}><span aria-hidden="true">{product.emoji}</span><div><strong>{product.name}</strong><small>{currency.format(product.price)}</small></div><div className={styles.quantity}><button onClick={() => changeQuantity(product.id, -1)} aria-label={`Remover uma unidade de ${product.name}`}><FaMinus /></button><span>{cart[product.id]}</span><button onClick={() => changeQuantity(product.id, 1)} aria-label={`Adicionar uma unidade de ${product.name}`}><FaPlus /></button></div></div>) : <div className={styles.emptyCart}><span>🛍️</span><h3>Seu carrinho está vazio</h3><p>Adicione um prato para começar o pedido.</p></div>}
        </div>
        <div className={styles.summary}><div><span>Subtotal</span><strong>{currency.format(subtotal)}</strong></div><small>Taxas e forma de entrega serão definidas na próxima etapa.</small><button disabled={!itemCount}>Continuar pedido</button></div>
      </aside>
    </main>
  );
}
