# Mesa Viva — Cardápio Digital

Fundação de uma aplicação SaaS multitenant de cardápio digital, desenvolvida sobre o boilerplate técnico HKA FIELD em repositório totalmente isolado.

## Escopo atual

- identidade, modalidades e catálogo configuráveis por tenant;
- diretório público em `/cardapio` e resolução de cada estabelecimento por `/cardapio/[tenantSlug]`;
- vitrine por categoria e busca por nome e descrição;
- carrinho local por linhas configuradas, com edição, quantidades e subtotal em centavos;
- seleção de modalidade e cotação local com mínimo, taxa e total;
- etapa administrativa 8 Mesas, com identificação por ambiente e seleção obrigatória para atendimento “Na mesa”;
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
- mutação administrativa limitada à disponibilidade, com autorização renovada, confirmação, versão otimista e auditoria transacional em gate local.
- edição administrativa de preço em centavos, separada da disponibilidade e ainda em gate local.
- consulta administrativa limitada da auditoria do tenant, somente leitura e sem identidade externa.
- edição administrativa limitada ao nome e à descrição pública do produto, com confirmação, versão otimista e auditoria.
- revisão administrativa somente leitura das categorias, sua ordem e quantidade de produtos.
- classificação administrativa de produtos em categorias existentes, com isolamento, versão e auditoria.
- seleção administrativa das modalidades existentes do tenant por produto, sem conjunto vazio e com auditoria atômica.
- revisão administrativa somente leitura de pedido mínimo, taxa de entrega e horários semanais.
- revisão administrativa somente leitura de variações, adicionais e limites de seleção por produto.
- revisão administrativa somente leitura do perfil, canal planejado, pagamento e modalidades do estabelecimento.
- fundação reversível para futura escrita do perfil do tenant, com versão otimista e auditoria própria ainda sem privilégio de runtime.
- contrato portável para futura edição de nome curto e slogan, ainda sem adaptador PostgreSQL ou interface.
- adaptador PostgreSQL do perfil preparado para gate descartável, ainda desconectado do banco persistente e da interface.
- composição `server-only` do perfil com identidade, membership e permissão específica derivadas novamente antes da escrita.
- edição administrativa independente de nome curto e slogan, com confirmação, versão otimista e auditoria transacional.
- repositório limitado e sanitizado para futura consulta da auditoria do perfil, ainda desconectado da interface e do banco persistente.
- concessão persistente isolada de leitura da auditoria do perfil, ainda sem composição ou interface.
- consulta administrativa limitada das alterações do perfil, sem UUID do ator ou identidade externa.
- revisão administrativa somente leitura das modalidades habilitadas por produto.
- cadastro administrativo de categorias com permissão própria, contexto interno derivado, confirmação e auditoria atômica.
- contrato portável para futura ativação de “Consumo no local”, ainda sem alterar o tenant persistente ou produtos.
- composição `server-only` de “Consumo no local” com modalidade, identidade e papel derivados, ainda sem ativação pela interface.
- ativação administrativa confirmada de “Consumo no local” com produtos iniciais obrigatórios e auditoria atômica.
- adaptador PostgreSQL de metadados de imagem aprovado no banco descartável e habilitação persistente preparada com privilégios mínimos, ainda sem armazenamento de objetos ou interface.
- armazenamento Vercel Blob público isolado atrás de porta de servidor, com chaves imutáveis e exclusão restrita, ainda sem composição ou interface de upload.
- composição operacional `server-only` de imagens com autorização renovada, limites de frequência e tempo e compensação de falhas, ainda sem entrada HTTP ou interface.
- interface administrativa local para logo e imagens de produtos com prévia, texto alternativo e processamento seguro;
- leitura pública de imagens pelo tenant com URL/namespace revalidados, metadados internos omitidos e fallback acessível.
- reconciliação manual de imagens em simulação por padrão, com carência, confirmação dupla para exclusão e métricas agregadas de armazenamento.
- gate ponta a ponta local de imagens documentado, cobrindo autorização, processamento, Blob, PostgreSQL, leitura pública, responsividade, PWA e reconciliação sem exclusão.
- formulário administrativo único para criar e editar produtos, com ID/slug derivados, disponibilidade selecionada persistida, atualização relacional atômica, imagem opcional coordenada e exclusão por arquivamento lógico auditado.
- painel administrativo somente leitura em `/admin`, com indicadores e pendências derivados do catálogo autorizado; configurações de Perfil, Operação, Categorias e Produtos separadas em `/admin/configuracoes` e endereçáveis por seção.
- configuração operacional versionada de pedido mínimo, taxa e distância máxima de entrega, WhatsApp comercial, pagamentos presenciais e horários de segunda a domingo, com autorização renovada e auditoria que não replica o contato; distância ainda não bloqueia pedidos nem coleta localização.

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
As superfícies de comando são Server Actions internas e separadas para disponibilidade, preço, conteúdo e classificação. Todas derivam novamente identidade, tenant e papel no servidor; demais mutações continuam bloqueadas.

Variações e adicionais podem ser selecionados em uma caixa de diálogo acessível. Antes da prévia, todas as linhas e valores são reconstruídos pelo catálogo atual. A mensagem pode ser copiada localmente, mas não abre WhatsApp, não solicita dados pessoais e não envia ou confirma um pedido.

Rotas demonstrativas originais:

- `/cardapio/mesa-viva`;
- `/cardapio/casa-do-porto`.

A raiz `/` redireciona para o diretório de cardápios. Slugs desconhecidos retornam uma página 404 própria.
No ambiente persistente atual, os atalhos consultam o primeiro slug publicado no
PostgreSQL. A rota histórica `/cardapio/mesa-viva` redireciona para esse tenant
quando ele for o único catálogo persistido, preservando links locais anteriores.

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

No ambiente de desenvolvimento, uma barra local de navegação expõe os
atalhos para o cardápio demonstrativo, primeiro acesso, login administrativo,
painel e configurações. Ela não
é incluída em produção e não altera os controles de autenticação,
vínculo interno, membership ou autorização das rotas administrativas.

A rota pública `/login` separa explicitamente os perfis: clientes continuam
para o cardápio sem conta nesta fase; assinantes convidados seguem para o login
administrativo protegido. Clientes não recebem atalhos para painel ou
configurações.

A rota `/planos` apresenta os planos mensais Essencial (R$ 150) e Profissional
(R$ 250). O cadastro usa Clerk e o checkout recorrente usa Stripe sandbox. A
página de retorno não concede tenant ou papel. A ativação usa webhook assinado
e persistência idempotente; no ambiente local, exige aplicar a migration `0020`
e configurar `STRIPE_WEBHOOK_SECRET`. A produção continua bloqueada pelos gates
de risco, conciliação e cadastro legal/fiscal.

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
