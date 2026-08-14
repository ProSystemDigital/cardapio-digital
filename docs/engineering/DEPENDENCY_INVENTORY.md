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

O projeto não usa ORM, biblioteca de carrinho, estado global, e-mail, analytics ou pagamentos. Playwright foi reutilizado para os testes unitários e de integração. O driver `pg` foi introduzido apenas quando a execução PostgreSQL real passou a integrar o escopo aprovado. Clerk foi aprovado para validar sessões, permanecendo isolado atrás do contrato portável.

Os overrides de `postcss` e `sharp` são preservados do baseline validado. `nanoid@3.3.18` corrige o advisory `GHSA-2v37-7h3g-55p8`, após a versão corretiva anterior passar a integrar a faixa afetada. `js-yaml@4.3.1` corrige o advisory `GHSA-5p4m-2wfm-xmqj` detectado na cadeia de desenvolvimento do ESLint sem promover uma atualização major da toolchain. Todos os overrides devem ser reavaliados em uma atualização coordenada das dependências diretas.

Verificações: `npm audit`, `npm audit --omit=dev`, `npm run test:unit`, `npm run lint`, `npm run typecheck`, `npm run test:visual`, `npm run build` e `npm run test:pwa:existing-build`.
