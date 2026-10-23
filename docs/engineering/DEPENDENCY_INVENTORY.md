# Inventário de dependências — Cardápio Digital

| Pacote | Papel |
| --- | --- |
| Next.js e React | Aplicação e interface |
| TypeScript | Tipagem estática e contratos do domínio |
| SCSS | Estilos modulares |
| React Icons | Ícones acessíveis da interface |
| Serwist | Service worker e fallback offline |
| Playwright | Testes unitários, responsivos e PWA |
| ESLint | Análise estática |
| `pg` | Driver PostgreSQL usado somente pelo repositório de servidor selecionado explicitamente |
| `@types/pg` | Tipagem de desenvolvimento do driver PostgreSQL |
| `@clerk/nextjs` | Adaptador de autenticação para Next.js, sem autoridade sobre papéis ou tenants |
| `sharp@0.35.3` | Processamento de imagens somente no servidor: decodificação, orientação, recorte, remoção de metadados e saída WebP |
| `@vercel/blob@2.8.0` | Armazenamento público dos WebP normalizados, isolado em adaptador `server-only` atrás de porta própria |
| `stripe@23.0.0` | Cliente oficial server-only para Stripe Billing e Checkout no sandbox; não concede acesso administrativo |

O projeto não usa ORM, biblioteca de carrinho, estado global, e-mail, analytics ou pagamentos. Playwright foi reutilizado para os testes unitários e de integração. O driver `pg` foi introduzido apenas quando a execução PostgreSQL real passou a integrar o escopo aprovado. Clerk foi aprovado para validar sessões, permanecendo isolado atrás do contrato portável. Sharp tornou-se dependência direta somente após a aprovação do contrato de imagens; permanece atrás de uma porta e não recebe caminhos de arquivo.

Os overrides de `postcss` e `sharp` são preservados do baseline validado. `nanoid@3.3.18` corrige o advisory `GHSA-2v37-7h3g-55p8`, após a versão corretiva anterior passar a integrar a faixa afetada. `js-yaml@4.3.1` corrige o advisory `GHSA-5p4m-2wfm-xmqj` detectado na cadeia de desenvolvimento do ESLint sem promover uma atualização major da toolchain. Todos os overrides devem ser reavaliados em uma atualização coordenada das dependências diretas.

Verificações: `npm audit`, `npm audit --omit=dev`, `npm run test:unit`, `npm run lint`, `npm run typecheck`, `npm run test:visual`, `npm run build` e `npm run test:pwa:existing-build`.
