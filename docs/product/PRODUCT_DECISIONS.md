# Decisões de produto — Cardápio Digital

| ID | Decisão | Critério de aceite nesta fundação |
| --- | --- | --- |
| D-001 | Produto SaaS multitenant | Toda entidade de catálogo pertence explicitamente a um tenant; a rota resolve o catálogo por slug e rejeita dados fora do escopo. |
| D-002 | Pedido enviado inicialmente por WhatsApp | Canal registrado no perfil do tenant, sem integração ou coleta de contato nesta fase. |
| D-003 | Mesa, retirada, entrega ou combinação configurável | Modalidades são configuração do tenant; endereço, taxas e horários ficam adiados. |
| D-004 | Pagamento no atendimento/entrega | Fundação representa pagamento na realização; pagamento online fica fora do escopo atual. |
| D-005 | Identidade e catálogo configuráveis | Marca, categorias, produtos, preços e disponibilidade não ficam definidos no componente visual. |
| D-006 | Proprietário, gerente e administrador da plataforma | Papéis são contratos de domínio; autenticação, autorização e auditoria ficam adiadas. |

## Escopo autorizado

Esta entrega contém documentação, domínio TypeScript, dados demonstrativos e testes. Não contém banco de dados, autenticação, painel administrativo, API, analytics, pagamento online ou integração com WhatsApp.

A demonstração pública usa `/cardapio/[tenantSlug]`. O slug identifica o estabelecimento na URL, mas não é credencial nem mecanismo de autorização.

## Requisitos da próxima etapa

- Toda consulta persistida deverá exigir contexto de tenant e negar acesso sem escopo.
- O proprietário e o gerente operarão somente tenants autorizados; o administrador da plataforma terá funções explicitamente delimitadas e auditadas.
- A jornada de mesa deverá definir identificação da mesa; entrega deverá definir endereço, área, taxa e horário; retirada deverá definir janela e identificação do cliente.
- O envio por WhatsApp deverá apresentar resumo e consentimento do cliente, sem afirmar confirmação ou aceite automático pelo estabelecimento.
- Pagamento online exigirá ADR, análise de fornecedor, segurança, privacidade e conciliação antes da implementação.

## Fase 1.2 — Modelo operacional do catálogo

- Preços, pedido mínimo, taxas, variações e adicionais usam centavos inteiros.
- Cada produto declara as modalidades em que pode ser atendido, sempre como subconjunto das modalidades do tenant.
- Horários semanais são configuráveis, mas “aberto agora” dependerá de regras futuras para fuso, feriados e exceções.
- Grupos de adicionais declaram limites mínimo e máximo verificáveis.
- Catálogos inconsistentes são rejeitados antes de serem entregues à interface.
- Seleção de personalizações e cálculo de pedido personalizado permanecem adiados para uma jornada de UX própria.

## Fase 1.3 — Jornada de personalização

- Produtos simples são adicionados diretamente; produtos configuráveis abrem uma caixa de diálogo.
- Variações obrigatórias, limites de adicionais e indisponibilidade são validados no domínio.
- A interface envia somente IDs; o preço unitário é recalculado pelo catálogo.
- Configurações iguais acumulam quantidade e configurações diferentes permanecem em linhas distintas.
- Linhas podem ser editadas, removidas e ter sua quantidade alterada.
- O subtotal considera preço unitário configurado e quantidade, ainda sem taxas ou pagamento.
- A caixa de diálogo oferece foco inicial, ciclo de foco, fechamento por `Escape` e retorno ao acionador.

## Fase 1.4 — Modalidade e cotação local

- O cliente escolhe somente entre modalidades habilitadas pelo tenant.
- Uma troca incompatível é rejeitada e informa os produtos responsáveis.
- Subtotal, taxa de entrega, total e valor faltante para o mínimo são calculados em centavos.
- Taxa é aplicada somente à entrega e nunca é recebida da interface.
- A cotação se atualiza a cada mudança nas linhas ou na modalidade.
- Mesa não solicita número; retirada não solicita identificação; entrega não solicita endereço.
- Mesmo uma cotação válida não habilita envio, persistência ou confirmação do pedido.

## Fase 1.5 — Rascunho e prévia da mensagem

- O rascunho é criado somente após reconstruir linhas e recalcular a cotação pelo catálogo atual.
- Preço alterado é atualizado; indisponibilidade, isolamento inválido ou mínimo não atingido bloqueiam a prévia.
- O resumo contém estabelecimento, modalidade, itens, personalizações, subtotal, taxa e total.
- A mensagem é determinística e não expõe IDs internos nem solicita dados pessoais.
- A interface identifica permanentemente “Prévia — pedido não enviado”.
- Copiar exige ação do usuário e uma falha de clipboard não fecha nem apaga a prévia.
- Não existe link para WhatsApp, navegação externa, API, webhook ou persistência.

## Fase 2.0 — Fundação da persistência

- PostgreSQL é a tecnologia escolhida para avaliação da persistência relacional.
- Entidades pertencentes ao estabelecimento carregam tenant e não admitem referências cruzadas.
- RLS nega leitura e escrita quando o backend não estabelece um contexto válido de tenant.
- Pedidos preservam nomes e preços como snapshots, sem antecipar dados pessoais.
- Migrations possuem avanço e reversão transacionais e permanecem imutáveis depois de aplicadas.
- Nesta etapa não há banco provisionado, conexão, credencial, autenticação, API ou execução remota.

## Fase 2.1 — Ferramentas e validação local

- pgAdmin 4 é a interface humana padrão para administração e inspeção.
- `psql` executa migrations e testes de forma reproduzível.
- PostgreSQL 18 local hospeda somente o banco descartável de validação.
- Neon Postgres Console é a escolha para o futuro ambiente remoto, ainda sem conexão ou credencial.
- O gate deve comprovar negação sem tenant, isolamento entre dois tenants, bloqueio de referências cruzadas, snapshots e `up/down/up`.

## Fase 2.2 — Repositório PostgreSQL de catálogo

- A interface continua dependendo do contrato `CatalogRepository`, não do driver ou de SQL.
- Memória permanece a fonte padrão; PostgreSQL exige seleção e URL explícitas no servidor.
- Configuração PostgreSQL inválida não pode cair silenciosamente no catálogo demonstrativo.
- Toda leitura persistida ocorre em transação somente leitura e com contexto local de tenant.
- O agregado reconstruído passa pelas mesmas validações do catálogo em memória.
- Fixture e banco são locais, fictícios e descartáveis; Neon e escrita administrativa continuam adiados.
