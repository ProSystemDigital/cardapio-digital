# Inventário de dependências — Cardápio Digital

| Pacote | Papel |
| --- | --- |
| Next.js e React | Aplicação e interface |
| TypeScript | Tipagem estática |
| SCSS | Estilos modulares |
| React Icons | Ícones acessíveis da interface |
| Serwist | Service worker e fallback offline |
| Playwright | Testes responsivos e PWA |
| ESLint | Análise estática |

O projeto não usa biblioteca de carrinho, estado global, e-mail, banco de dados, analytics ou pagamentos. Os overrides de `postcss` e `sharp` são preservados do baseline validado. O override `nanoid@3.3.17` corrige o advisory `GHSA-2v37-7h3g-55p8` herdado da cadeia Next/PostCSS. Todos devem ser revisados em atualização coordenada do Next.js.

Verificações: `npm audit --omit=dev`, `npm run lint`, `npm run typecheck`, `npm run test:visual`, `npm run build` e `npm run test:pwa:existing-build`.
