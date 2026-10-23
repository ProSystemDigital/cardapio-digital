# ADR 0054 — Ativação controlada de Consumo no local

| Campo | Valor |
| --- | --- |
| Status | Aceito para revisão humana |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

Contrato, persistência, privilégio e composição foram aprovados. Falta uma entrada operacional que selecione produtos iniciais sem permitir ativação vazia ou contexto forjado.

## Decisão

- exibir o formulário somente enquanto `dine_in` não estiver habilitado no tenant;
- passar ao componente cliente somente ID e nome público dos produtos;
- aceitar no formulário somente produtos e confirmação consciente;
- derivar modalidade, identidade, tenant, membership e papel no servidor;
- exigir de 1 a 200 produtos únicos e válidos;
- revalidar `/admin` após a transação e substituir o formulário pelo estado habilitado;
- recusar de forma segura uma ativação concorrente ou repetida;
- persistir o evento na auditoria do perfil sem carregar a trilha na tela operacional.

## Consequências

A ativação ocorre uma única vez e nunca deixa o tenant sem produto compatível. Produtos não selecionados continuam disponíveis para configuração posterior pelo formulário individual já existente.

## Reversão

Remover Server Action e formulário. A desativação de uma modalidade já persistida não faz parte desta fase e exigirá decisão própria.

## Evidência automatizada

Em 2026-08-16, 96 testes unitários, lint, tipos e build de produção foram aprovados. Também passaram 27 testes visuais em mobile, tablet e desktop e o teste PWA de registro do service worker e fallback offline.

## Ajuste após revisão humana

A revisão visual identificou mistura entre as configurações dos produtos e ausência de uma entrada visível para cadastro. A interface passou a separar cada produto em grupos recolhíveis de conteúdo, preço, organização e personalizações; também passou a informar explicitamente que cadastro e imagens ainda dependem de uma fase própria. “Modalidades do produto” foi renomeado para “Modalidades de logística”, sem alterar contratos ou persistência.

Uma segunda revisão encontrou compressão dos formulários e rolagem excessiva porque o painel desktop ainda estava limitado a `34rem`. O painel passou a usar largura própria de desktop, composição em duas colunas a partir de `60rem` e container queries nos editores: controles internos só formam duas colunas quando o próprio grupo possui ao menos `44rem`. As auditorias receberam rolagem interna limitada para reduzir a extensão da página sem remover eventos.

Uma terceira revisão priorizou somente informações operacionais: as três trilhas deixaram de ser consultadas e apresentadas em `/admin`, mas continuam preservadas no PostgreSQL e nos repositórios autorizados. Categorias passaram a ocupar três colunas no desktop e uma no mobile. O perfil passou a reservar uma área explícita para logo, ainda sem upload até a fase de armazenamento seguro de imagens.

Uma quarta revisão removeu o formulário de criação de categoria permanentemente aberto. Um acionador compacto cria sob demanda um card de rascunho com salvar e cancelar; após sucesso, o card fecha e pode ser aberto novamente. Edição e salvamento permanecem nos cards persistidos. Exclusão continua ausente porque exige regras próprias para vínculos de produtos, autorização e auditoria.

Uma quinta revisão separou o painel em quatro etapas exclusivas: Perfil, Operação, Categorias e Produtos. A navegação mantém somente uma área operacional visível por vez, sem fundir os Server Actions existentes. Personalizações foram retiradas do painel administrativo por não possuírem ainda um fluxo editável suficientemente claro; os dados e a experiência pública permanecem preservados.

Uma sexta revisão moveu as modalidades habilitadas e a ativação de Consumo no local de Perfil para Operação. Perfil passou a concentrar identidade e marca; Operação passou a reunir horários, valores e logística. A mudança é exclusivamente de composição visual e não altera comando, autorização, auditoria ou persistência.

Uma sétima revisão moveu também canal planejado e pagamento de Perfil para Operação. Perfil ficou restrito a logo, nome curto e slogan; Operação passou a concentrar regras, canais e meios da jornada comercial, ainda somente leitura quando não existe comando autorizado.

Uma oitava revisão separou a superfície administrativa em duas rotas. `/admin` passou a apresentar somente indicadores operacionais derivados do catálogo já autorizado, pendências objetivas e atalhos; não apresenta pedidos, faturamento ou métricas sem domínio persistido. `/admin/configuracoes` recebeu Perfil, Operação, Categorias e Produtos, com a etapa ativa representada por `?secao=` e fallback seguro para Perfil. As duas rotas renovam autenticação, identidade e membership no servidor, e as mutações revalidam ambas sem aceitar contexto de autorização pela URL.
