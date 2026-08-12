# Mesa Viva — Cardápio Digital

Fundação de uma aplicação SaaS multitenant de cardápio digital, desenvolvida sobre o boilerplate técnico HKA FIELD em repositório totalmente isolado.

## Escopo atual

- identidade, modalidades e catálogo configuráveis por tenant;
- resolução pública do estabelecimento por `/cardapio/[tenantSlug]`;
- vitrine por categoria e busca por nome e descrição;
- carrinho local por linhas configuradas, com edição, quantidades e subtotal em centavos;
- seleção de modalidade e cotação local com mínimo, taxa e total;
- rascunho imutável e prévia textual copiável, sem envio externo;
- regras de domínio puras e testadas;
- horários, modalidades por produto, variações e adicionais demonstrativos;
- validação integral do catálogo antes da exposição;
- interface responsiva, acessível e instalável como PWA;
- fallback offline para indisponibilidade de navegação.
- especificação revisável de PostgreSQL com isolamento multitenant e rollback, ainda sem banco conectado.

O catálogo é demonstrativo. A fundação não envia pedidos, não coleta dados pessoais e não exige credenciais. WhatsApp será o primeiro canal de envio e o pagamento ocorrerá no atendimento ou entrega, mas essas capacidades ainda não estão implementadas.

## Limites arquiteturais

- `domain/`: contratos e regras independentes de interface e infraestrutura;
- `data/`: configuração demonstrativa substituível por fonte persistida futura;
- `data/catalog-repository.ts`: contrato e implementação temporária em memória;
- `app/`: apresentação Next.js e estado efêmero da experiência;
- `database/migrations/`: esquema SQL transacional e reversível, ainda não executado;
- `tests/unit/`: invariantes de tenant, catálogo, carrinho e estrutura persistente;
- `tests/visual/` e `tests/pwa/`: comportamento no navegador e operação offline.

Banco provisionado ou conectado, autenticação, autorização, painel administrativo, API, analytics, pagamento online e integrações externas estão fora desta fase.

Variações e adicionais podem ser selecionados em uma caixa de diálogo acessível. Antes da prévia, todas as linhas e valores são reconstruídos pelo catálogo atual. A mensagem pode ser copiada localmente, mas não abre WhatsApp, não solicita dados pessoais e não envia ou confirma um pedido.

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
