# Mesa Viva — Cardápio Digital

Fundação de uma aplicação SaaS multitenant de cardápio digital, desenvolvida sobre o boilerplate técnico HKA FIELD em repositório totalmente isolado.

## Escopo atual

- identidade, modalidades e catálogo configuráveis por tenant;
- resolução pública do estabelecimento por `/cardapio/[tenantSlug]`;
- vitrine por categoria e busca por nome e descrição;
- carrinho local com quantidades e subtotal calculado em centavos;
- regras de domínio puras e testadas;
- interface responsiva, acessível e instalável como PWA;
- fallback offline para indisponibilidade de navegação.

O catálogo é demonstrativo. A fundação não envia pedidos, não coleta dados pessoais e não exige credenciais. WhatsApp será o primeiro canal de envio e o pagamento ocorrerá no atendimento ou entrega, mas essas capacidades ainda não estão implementadas.

## Limites arquiteturais

- `domain/`: contratos e regras independentes de interface e infraestrutura;
- `data/`: configuração demonstrativa substituível por fonte persistida futura;
- `data/catalog-repository.ts`: contrato e implementação temporária em memória;
- `app/`: apresentação Next.js e estado efêmero da experiência;
- `tests/unit/`: invariantes de tenant, catálogo e carrinho;
- `tests/visual/` e `tests/pwa/`: comportamento no navegador e operação offline.

Banco de dados, autenticação, autorização, painel administrativo, API, analytics, pagamento online e integrações externas estão fora desta fase.

Tenants demonstrativos:

- `/cardapio/mesa-viva`;
- `/cardapio/casa-do-porto`.

A raiz `/` redireciona para o primeiro catálogo. Slugs desconhecidos retornam uma página 404 própria.

## Tecnologias

- Next.js 16, React 19 e TypeScript;
- SCSS Modules;
- Serwist para PWA e fallback offline;
- Playwright para testes unitários e em navegador.

## Desenvolvimento

Requisitos: Node.js `^20.19.0`, `^22.13.0` ou `>=24`, e npm.

```bash
npm ci
npm run dev
```

Validação completa:

```bash
npm run test:unit
npm run lint
npm run typecheck
npm run test:visual
npm run build
npm run test:pwa:existing-build
```

Variáveis futuras devem ser documentadas em `.env.example` somente com placeholders. Arquivos `.env*`, credenciais e vínculos locais de hospedagem permanecem ignorados.

## Governança

O projeto segue a Carta da Engenharia, o HKA FIELD Engineering Guide e as políticas versionadas em `docs/`. As decisões D-001 a D-006 e seus limites estão em `docs/product/PRODUCT_DECISIONS.md` e no ADR 0002. Mudanças em persistência, dados pessoais, autenticação, pagamentos ou integrações exigem atualização prévia da arquitetura, governança e riscos.
