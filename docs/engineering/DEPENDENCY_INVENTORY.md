# Inventário de dependências — Cardápio Digital

| Pacote | Papel |
| --- | --- |
| `next@16.4.3` e React 19 | Aplicação e interface; patch do Next atualizado após advisories críticos de execução remota e envenenamento de cache |
| TypeScript | Tipagem estática e contratos do domínio |
| SCSS | Estilos modulares |
| React Icons | Ícones acessíveis da interface |
| `@serwist/next@9.5.13` e `serwist@9.5.13` | Service worker e fallback offline; patch inclui cadeia Browserslist corrigida |
| Playwright | Testes unitários, responsivos e PWA |
| ESLint | Análise estática |
| `pg` | Driver PostgreSQL usado somente pelo repositório de servidor selecionado explicitamente |
| `@types/pg` | Tipagem de desenvolvimento do driver PostgreSQL |
| `@clerk/nextjs` | Adaptador de autenticação para Next.js, sem autoridade sobre papéis ou tenants |
| `sharp@0.35.5` | Processamento de imagens somente no servidor: decodificação, orientação, recorte, remoção de metadados e saída WebP; patch corrige vulnerabilidades das bibliotecas nativas de imagem |
| `@vercel/blob@2.8.0` | Armazenamento público dos WebP normalizados, isolado em adaptador `server-only` atrás de porta própria |
| `stripe@23.0.0` | Cliente oficial server-only para Stripe Billing e Checkout no sandbox; não concede acesso administrativo |

O projeto não usa ORM, biblioteca de carrinho, estado global, e-mail, analytics ou pagamentos. Playwright foi reutilizado para os testes unitários e de integração. O driver `pg` foi introduzido apenas quando a execução PostgreSQL real passou a integrar o escopo aprovado. Clerk foi aprovado para validar sessões, permanecendo isolado atrás do contrato portável. Sharp tornou-se dependência direta somente após a aprovação do contrato de imagens; permanece atrás de uma porta e não recebe caminhos de arquivo.

Os overrides de `postcss` e `sharp` são preservados e atualizados no baseline validado. `nanoid@3.3.18` corrige o advisory `GHSA-2v37-7h3g-55p8`. `js-yaml@4.3.2` corrige os advisories da cadeia de desenvolvimento do ESLint sem promover uma atualização major da toolchain. O lockfile também fixa versões corrigidas de `brace-expansion`, `source-map-js` e `undici`. Todos os overrides devem ser reavaliados em uma atualização coordenada das dependências diretas.

Verificações: `npm audit`, `npm audit --omit=dev`, `npm run test:unit`, `npm run lint`, `npm run typecheck`, `npm run test:visual`, `npm run build` e `npm run test:pwa:existing-build`.
