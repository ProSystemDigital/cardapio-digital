# Mesa Viva — Cardápio Digital

Aplicação web responsiva de cardápio digital, inicializada a partir do boilerplate técnico HKA FIELD em repositório totalmente isolado.

## Escopo atual

- vitrine de produtos por categoria;
- busca por nome e descrição;
- carrinho local com controle de quantidades e subtotal;
- interface responsiva, acessível e instalável como PWA;
- fallback offline para indisponibilidade de navegação.

O MVP não envia pedidos, não coleta dados pessoais e não exige credenciais. A ação “Continuar pedido” representa o limite da demonstração e será integrada somente após definição do canal de pedidos, tratamento de dados e critérios operacionais.

## Tecnologias

- Next.js 16, React 19 e TypeScript;
- SCSS Modules;
- Serwist para PWA e fallback offline;
- Playwright para validação em navegador.

## Desenvolvimento

Requisitos: Node.js `^20.19.0`, `^22.13.0` ou `>=24`, e npm.

```bash
npm ci
npm run dev
```

Validação completa:

```bash
npm run lint
npm run typecheck
npm run test:visual
npm run build
npm run test:pwa:existing-build
```

Variáveis futuras devem ser documentadas em `.env.example` somente com placeholders. Arquivos `.env*`, credenciais e vínculos locais de hospedagem permanecem ignorados.

## Governança

O projeto segue a Carta da Engenharia, o HKA FIELD Engineering Guide e as políticas versionadas em `docs/`. Mudanças em integrações, dados pessoais, autenticação, pagamentos ou entrega exigem atualização da arquitetura, do inventário de dados e do registro de riscos antes da implementação.
