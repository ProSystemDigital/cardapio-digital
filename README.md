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
- adaptador PostgreSQL de leitura selecionável no servidor, com memória como padrão seguro.
- serviço interno de escrita para preço e disponibilidade, com autorização, versão e auditoria atômica.
- autorização derivada de principal e membership persistida no PostgreSQL;
- contrato portável de sessão verificada e vínculo externo pseudônimo;
- adaptador Clerk isolado para os caminhos administrativos, sem aceitar tenant ou papel externo;
- entrada administrativa mínima em `/admin/sign-in`, com login, logout e revogação validados em desenvolvimento, ainda sem acesso ao catálogo.
- rota `/admin` conectada ao resolvedor interno em modo de negação, sem provisionar automaticamente principal, tenant ou papel.
- membership administrativa derivada por função PostgreSQL estreita, ainda sem comandos de catálogo expostos.
- catálogo administrativo somente leitura carregado pelo tenant derivado, sem controles de edição.

O catálogo é demonstrativo. A fundação não envia pedidos, não coleta dados pessoais e não exige credenciais. WhatsApp será o primeiro canal de envio e o pagamento ocorrerá no atendimento ou entrega, mas essas capacidades ainda não estão implementadas.

## Limites arquiteturais

- `domain/`: contratos e regras independentes de interface e infraestrutura;
- `data/`: configuração demonstrativa substituível por fonte persistida futura;
- `data/catalog-repository.ts`: contrato e implementação temporária em memória;
- `data/postgres-catalog-repository.ts`: implementação PostgreSQL somente de servidor;
- `application/catalog-administration-service.ts`: autorização e validação dos comandos internos;
- `application/authorization-service.ts`: matriz e derivação de acesso por principal;
- `application/authenticated-identity-service.ts`: reduz sessão externa verificada a `principalId` interno;
- `data/clerk-authentication-session-gateway.ts`: traduz uma sessão Clerk verificada para o contrato portável;
- `data/postgres-external-identity-link-repository.ts`: resolve o vínculo pseudônimo para o UUID interno por função SQL estreita;
- `data/authentication.server.ts`: compõe Clerk e PostgreSQL exclusivamente no servidor;
- `application/authorized-catalog-administration-service.ts`: composição segura entre identidade e escrita;
- `data/postgres-catalog-command-repository.ts`: escrita transacional PostgreSQL;
- `app/`: apresentação Next.js e estado efêmero da experiência;
- `database/migrations/`: esquema SQL transacional e reversível, ainda não executado;
- `tests/unit/`: invariantes de tenant, catálogo, carrinho e estrutura persistente;
- `tests/visual/` e `tests/pwa/`: comportamento no navegador e operação offline.

Banco remoto provisionado, painel administrativo de catálogo, API administrativa, analytics, pagamento online e integrações externas estão fora desta fase.
Não existe superfície externa para os comandos administrativos: a autenticação atual comprova somente a identidade e não concede acesso ao catálogo.

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

A validação PostgreSQL usa um banco local descartável e o executor documentado em `docs/operations/DATABASE_MIGRATIONS.md`. pgAdmin 4 é a interface administrativa escolhida; Neon permanece apenas como provedor remoto planejado, sem conexão nesta fase.

O vínculo administrativo real de desenvolvimento usa um banco persistente separado e o executor `scripts/database/manage-local-admin-link.ps1`. Ele solicita a senha administrativa de forma oculta, aceita somente Clerk Development e grava a credencial aleatória do runtime apenas no `.env.local` ignorado.

Sem variáveis, a aplicação continua usando o catálogo em memória. A seleção PostgreSQL exige `CATALOG_REPOSITORY=postgres` e `DATABASE_URL` somente no ambiente do servidor. Nunca versione a URL real.

## Governança

O projeto segue a Carta da Engenharia, o HKA FIELD Engineering Guide e as políticas versionadas em `docs/`. As decisões D-001 a D-006 e seus limites estão em `docs/product/PRODUCT_DECISIONS.md` e no ADR 0002. Mudanças em persistência, dados pessoais, autenticação, pagamentos ou integrações exigem atualização prévia da arquitetura, governança e riscos.
