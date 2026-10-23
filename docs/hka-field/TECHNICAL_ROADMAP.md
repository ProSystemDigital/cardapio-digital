# Roadmap técnico — Cardápio Digital

| Fase | Estado | Saída |
| --- | --- | --- |
| 0. Isolamento, governança e segurança | Concluída | Repositório isolado, documentação base, vulnerabilidade transitiva corrigida e riscos registrados. |
| 1. Fundação do domínio | Concluída | Contratos multitenant, resolução por slug, repositório em memória, catálogo externo à UI e testes de isolamento. |
| 1.2. Modelo operacional | Concluída | Horários, modalidades por produto, variações, adicionais, regras monetárias e validação integral. |
| 1.3. Personalização do item | Concluída | Modal acessível, carrinho por linhas, edição e preço recalculado pelo catálogo. |
| 1.4. Modalidade e cotação | Concluída | Mesa, retirada, entrega, compatibilidade, mínimo, taxa e total local. |
| 1.5. Rascunho e prévia | Concluída | Revalidação, resumo imutável, mensagem determinística e cópia local. |
| 2.0. Fundação da persistência | Concluída | ADR PostgreSQL, esquema relacional, isolamento RLS e rollback, ainda sem banco provisionado. |
| 2.1. Validação PostgreSQL local | Concluída | Papéis mínimos, RLS, isolamento, snapshots, limpeza e ciclo `up/down/up` comprovados. |
| 2.2. Repositório PostgreSQL | Concluída | Adaptador real validado localmente atrás do contrato atual, com configuração explícita e retorno seguro à memória. |
| 2.3. Escrita transacional do catálogo | Concluída | Gate real aprovado: preço e disponibilidade com ator autorizado, versão otimista e auditoria append-only. |
| 3.0. Identidade e autorização | Concluída | Gate real aprovado: principal técnico, memberships por tenant, papel de plataforma separado e matriz negativa por padrão. |
| 3.1. Fundação da autenticação | Concluída | Clerk aprovado; contrato portável, adaptador e vínculo PostgreSQL passaram no gate local, ainda sem conta ou sessão real. |
| 3.2. Autenticação Clerk controlada | Concluída | Instância de desenvolvimento restrita; login, proteção, logout e revogação reais aprovados, sem aceitar tenant ou papel externo. |
| 3.3. Vínculo autenticado ao principal interno | Concluída | Provisionamento persistente local e ciclo vínculo ativo, revogação, negação e reativação aprovados sem expor identificadores. |
| 3.4. Tenant e papel derivados | Concluída | Migration, função estreita e gate persistente aprovados; um tenant e papel `owner` foram derivados exclusivamente do PostgreSQL. |
| 3.5. Catálogo administrativo somente leitura | Concluída | Leitura pelo tenant derivado, permissão mínima persistente e interface sem mutações aprovadas no gate PostgreSQL e na revisão humana. |
| 3.6. Disponibilidade administrativa controlada | Concluída | Estado disponível/indisponível e opções de atendimento usam um único botão Salvar, autorização renovada, versão otimista, auditoria transacional e permissão PostgreSQL mínima. |
| 3.7. Preço administrativo controlado | Concluída | Edição monetária real aprovada com centavos, limite, autorização renovada, confirmação, versão otimista, auditoria e permissão mínima. |
| 3.8. Auditoria administrativa somente leitura | Concluída | Consulta limitada aprovada pelo tenant derivado, sem PII e sem capacidade de alterar ou excluir a trilha. |
| 3.9. Conteúdo administrativo controlado | Concluída | Edição limitada de nome e descrição aprovada com autorização renovada, versão otimista, auditoria e privilégio mínimo. |
| 3.10. Categorias administrativas somente leitura | Concluída | Nomes, ordem e quantidade de produtos por categoria aprovados pelo tenant derivado, sem nova mutação ou privilégio. |
| 3.11. Classificação administrativa controlada | Concluída | Movimento de produto para categoria existente aprovado com autorização renovada, versão, auditoria e privilégio mínimo. |
| 3.12. Modalidades por produto somente leitura | Concluída | Mesa, retirada e entrega aprovadas por produto a partir do tenant derivado, sem nova mutação ou privilégio. |
| 3.13. Modalidades por produto controladas | Concluída | Entrega, retirada e consumo no local permanecem seleção não vazia quando o produto está ativo; “Não disponível” as desmarca, bloqueia e substitui no resumo, persiste somente o estado geral e preserva internamente a última configuração válida para futura reativação. |
| 3.14. Configuração operacional somente leitura | Concluída | Horários, pedido mínimo e taxa de entrega aprovados pelo tenant derivado, sem nova mutação ou privilégio; breakpoint de 544 px retestado em dispositivo real. |
| 3.15. Personalizações por produto somente leitura | Concluída | Variações, adicionais, disponibilidade e limites aprovados pelo tenant derivado, sem nova mutação ou privilégio. |
| 3.16. Perfil do estabelecimento somente leitura | Concluída | Nome curto, slogan, canal, pagamento e modalidades aprovados pelo tenant derivado, sem integração, mutação ou novo privilégio. |
| 3.17. Fundação da escrita do perfil do tenant | Concluída | Versionamento otimista e auditoria própria aprovados no PostgreSQL descartável, ainda sem formulário ou privilégio de runtime. |
| 3.18. Contrato de comando do perfil do tenant | Concluída | Validação, autorização negativa e concorrência aprovadas atrás de repositório portável, sem Server Action, implementação PostgreSQL ou privilégio. |
| 3.19. Adaptador PostgreSQL do perfil do tenant | Concluída | Atualização versionada e auditoria atômica aprovadas no PostgreSQL descartável, sem banco persistente ou interface. |
| 3.20. Habilitação persistente do perfil do tenant | Concluída | Migration e concessão mínima aprovadas no banco local persistente, ainda sem Server Action ou formulário. |
| 3.21. Composição autorizada do perfil do tenant | Concluída | Identidade, membership e permissão específica aprovadas no servidor antes do comando, ainda sem Server Action ou formulário. |
| 3.22. Perfil textual do tenant controlado | Concluída | Nome da empresa e slogan usam limites visíveis de 20/30 caracteres, autorização renovada, versão e auditoria; o checkbox redundante foi removido sem alterar canal, pagamento ou modalidades. |
| 3.23. Repositório de auditoria do perfil | Concluída | Consulta recente, limitada e sem ator técnico aprovada no PostgreSQL descartável, ainda sem banco persistente ou interface. |
| 3.24. Leitura persistente da auditoria do perfil | Concluída | Concessão exclusiva de `SELECT` aprovada no banco local persistente, ainda sem composição ou interface. |
| 3.25. Auditoria administrativa do perfil | Concluída | Até 20 eventos sanitizados aprovados após `tenant.audit.read`, sem identidade técnica, consulta irrestrita ou mutação. |
| 3.26. Fundação da escrita de categorias | Concluída | Versionamento e auditoria próprios aprovados em `up/down/up`, com RLS e sem privilégio de runtime ou interface. |
| 3.27. Contrato de comando de categorias | Concluída | Validação e autorização portáteis aprovadas para nome e ordem, sem PostgreSQL, privilégio ou navegador. |
| 3.28. Adaptador PostgreSQL de categorias | Concluída | Atualização versionada e auditoria atômica aprovadas no banco descartável, sem privilégio persistente ou interface. |
| 3.29. Habilitação persistente de categorias | Concluída | Migration e privilégio mínimo aprovados no banco local persistente, ainda sem interface. |
| 3.30. Composição autorizada de categorias | Concluída | Identidade, membership e permissão específica aprovadas no servidor antes do comando, ainda sem Server Action ou formulário. |
| 3.31. Nome e ordem de categorias controlados | Concluída | Server Action e formulários independentes aprovados com confirmação, versão, auditoria e revisão humana responsiva. |
| 3.32. Repositório de auditoria de categorias | Concluída | Consulta recente, limitada e sanitizada aprovada no PostgreSQL descartável, ainda sem interface. |
| 3.33. Leitura persistente da auditoria de categorias | Concluída | Concessão exclusiva de `SELECT` aprovada no banco local persistente, sem ampliar escrita. |
| 3.34. Auditoria administrativa de categorias | Concluída | Até 20 eventos sanitizados aprovados após `tenant.audit.read`, sem identidade técnica, consulta irrestrita ou mutação. |
| 3.35. Contrato de criação de categorias | Concluída | Criação portátil aprovada por nome e ordem, sem ID ou slug do cliente; `dine_in` padronizado como “Consumo no local”. |
| 3.36. Persistência auditada da criação de categorias | Concluída | Migration e adaptador atômico aprovados no PostgreSQL descartável, sem privilégio persistente ou formulário. |
| 3.37. Habilitação persistente da criação de categorias | Concluída | Migration idempotente e `INSERT` mínimo aprovados no banco local persistente, ainda sem formulário. |
| 3.38. Composição autorizada da criação de categorias | Concluída | Identidade, membership e `catalog.category.create` renovados no servidor, ainda sem Server Action ou formulário. |
| 3.39. Cadastro controlado de categorias | Concluída | Server Action e formulário confirmado aprovados para nome e ordem, sem aceitar identificadores ou ciclo de vida do cliente. |
| 3.40. Contrato de ativação de Consumo no local | Concluída | Validação portátil restrita a `dine_in`, sem banco, privilégio, composição ou exposição pública. |
| 3.41. Persistência auditada de Consumo no local | Concluída | Ativação atômica no tenant com compatibilidade inicial explícita aprovada no PostgreSQL descartável. |
| 3.42. Habilitação persistente de Consumo no local | Concluída | Migration idempotente e privilégios mínimos aprovados no banco local, sem ativar a modalidade. |
| 3.43. Composição autorizada de Consumo no local | Concluída | Identidade, membership e permissão própria renovadas no servidor, ainda sem Server Action ou formulário. |
| 3.44. Ativação controlada de Consumo no local | Em revisão humana | Perfil resume logo, nome e slogan em um único card e mantém a edição textual recolhida; o upload permanece bloqueado até possuir armazenamento seguro. Operação reúne horários, valores, canal, pagamento e modalidades logísticas. |
| 3.45. Fundação de imagens do catálogo | Concluída | ADR, relações separadas para logo e produto, formato WebP normalizado, limites, RLS e rollback aprovados no gate PostgreSQL `up/down/up`; sem SDK, Blob provisionado, privilégio de runtime ou upload. |
| 3.46. Contrato de upload de imagens | Concluída | Origem, inspeção real, normalização, autorização `catalog.image.update` e compensação de falhas aprovadas atrás de portas, sem SDK ou infraestrutura externa. |
| 3.47. Processador local de imagens | Concluída | Sharp isolado no servidor decodifica JPEG/PNG/WebP, limita pixels, orienta, recorta, remove metadados, gera WebP e SHA-256; sem Blob, PostgreSQL ou interface. |
| 3.48. Adaptador PostgreSQL de imagens | Concluída | Criação/substituição versionada, RLS, chave anterior, auditoria atômica e ciclo `up/down/up` aprovados no banco descartável. |
| 3.49. Habilitação persistente dos metadados de imagem | Concluída | Ação administrativa aplicou 0011/0012 e concedeu somente SELECT/INSERT/UPDATE nos metadados e acesso append-only às auditorias no banco persistente local. |
| 3.50. Adaptador de armazenamento de objetos | Concluída | Store pública Vercel Blob provisionada em `iad1`; adaptador `server-only`, chaves UUID imutáveis e `put/delete` real aprovados sem objeto residual ou interface. |
| 3.51. Composição operacional do upload | Concluída | Composição `server-only` une identidade, autorização, Sharp, Blob e PostgreSQL com rate limit local limitado, abort de upload, timeouts SQL e compensação; sem entrada HTTP ou interface. |
| 3.52. Interface administrativa de imagens | Concluída | Upload real de logo aprovado após processamento, Blob, metadados e auditoria; formulário rederiva identidade/tenant, usa a submissão como intenção explícita, exige texto alternativo de produto e aplica recorte central automático à logo. |
| 3.53. Leitura pública de imagens | Concluída | Logo e produto persistentes foram aprovados no cardápio público real com validação de host/namespace, projeção mínima e fallback. |
| 3.54. Limpeza e observabilidade | Concluída | `dry_run` real confirmou 2 objetos/99.626 bytes integralmente referenciados e nenhuma exclusão; carência, confirmação dupla, limite e logs sanitizados protegem futuras reconciliações. |
| 3.55. Gate ponta a ponta de imagens | Concluída | Matriz integrada e revisão humana aprovadas: 127 testes unitários, 27 visuais, PWA, lint, tipos e build; `dry_run` confirmou 2 objetos/99.888 bytes integralmente referenciados, sem exclusão. |
| 3.56. Contrato de cadastro de produtos | Concluída | Comando portátil aceita conteúdo, preço, categoria, disponibilidade e modalidades; ID e slug são derivados, sem PostgreSQL, privilégio, imagem ou formulário. |
| 3.57. Configuração operacional controlada | Em gate local | Pedido mínimo, taxa, distância máxima em metros, contato comercial, pagamentos presenciais e horários semanais com versão, RLS, autorização derivada e auditoria sanitizada; sem geolocalização ou bloqueio por endereço. |
| 3.57.1. Contrato portátil de cobertura | Concluída | Endereço brasileiro mínimo, portas de geocodificação/rota, timeout e adaptadores locais fictícios aprovados sem coleta, persistência, SDK ou provedor. |
| 3.57.2. Composição local de cobertura | Concluída | Origem e rotas fictícias por tenant, composição server-only e teste ponta a ponta; fixtures falham fechadas em produção e não recebem dados reais. |
| 3.57.3. Laboratório visual de cobertura | Em revisão humana | Interface na etapa Operação usa somente rotas fictícias fixas, rederiva contexto no servidor, não coleta endereço e é removida do build de produção. |
| 3.57.4. Fundação da origem logística | Concluída sem dados reais | Migration reversível cria origem versionada, status de geocodificação, RLS forçada e auditoria sem conceder privilégio de runtime. |
| 3.57.5. Gate LGPD de localização | Engenharia concluída; decisão humana bloqueada | Finalidade, minimização, retenção técnica, riscos e salvaguardas documentados; controlador/encarregado/jurídico ainda devem aprovar hipótese, RIPD, aviso e retenção do pedido. |
| 3.57.6. Provedor e qualidade geográfica | Adaptador concluído; ativação bloqueada | Matriz oficial seleciona Geoapify provisoriamente para sandbox gratuito; adaptadores HTTP falham fechados sem chave. DPA, credencial, precisão regional e produção permanecem pendentes. |
| 3.57.7. Fundação da governança de privacidade | Concluída | Migration reversível define controlador, canal e retenção por tenant com RLS/auditoria; identidade profissional global permanece server-only e nenhum valor fictício é publicado. |
| 3.57.8. Contratos de privacidade e origem | Concluída | Proprietário define controlador/canal/retenção; proprietário ou gerente define origem pendente. Tenant, papel e coordenadas não são aceitos do navegador. |
| 3.57.9. Adaptadores PostgreSQL de privacidade e origem | Concluída | Criação/atualização otimista e auditoria sanitizada foram aprovadas em RLS, isolamento, snapshots e ciclo `up/down/up`; alterar endereço invalida coordenadas e retorna a origem para `pending`. |
| 3.57.10. Habilitação persistente da governança de entrega | Concluída | Ação idempotente aplicou 0015/0016 e concedeu acesso por colunas aos comandos de origem e privacidade, mantendo auditorias append-only e sem `DELETE`. |
| 3.57.11. Administração da governança de entrega | Concluída | Tenant autorizado define controlador, canal, retenção e origem logística; salvar a origem apenas a deixa pendente e não chama o provedor geográfico. |
| 3.57.12. Validação geográfica explícita da origem | Concluída | Server Action relê a origem sob RLS, chama Geoapify somente após intenção explícita e aplica timeout/confiança; revisão humana confirmou a origem persistida como validada. |
| 3.57.13. Separação das configurações administrativas | Em revisão humana | Sete etapas isolam Perfil, Atendimento, Financeiro, Logística, Privacidade, Categorias e Produtos; cada mutação operacional aceita somente campos do próprio domínio e relê o restante no servidor. |
| 3.58. Cadastro auditado de produtos | Concluída | Formulário e composição autorizada derivam tenant, ID e slug no servidor; categoria, disponibilidade e opções são confirmadas sob RLS e persistidas conforme a seleção, com privilégio mínimo. |
| 3.59. Imagem no cadastro e cards compactos | Em revisão humana | O arquivo opcional é validado antes da criação e sua imagem usa o fluxo autorizado existente. A disponibilidade selecionada é preservada e os cards mantêm somente informações essenciais. |
| 3.60. Formulário unificado e arquivamento de produtos | Em revisão humana | Criar e editar reutilizam uma única área acima da lista, com seleção de categoria consistente entre dispositivos; cards exibem ações no menu vertical de três pontos, acessível por hover, foco e clique. Criação e atualização persistem a disponibilidade escolhida e confirmam sucesso em notificação breve; excluir arquiva após confirmação. Migration e privilégio mínimo foram validados. |
| 3.61. Configurações independentes e modalidades padrão | Em gate local | Atendimento, Financeiro e Logística persistem somente sua seção; contas existentes e futuras recebem Retirada, Entrega e Na mesa, sem ativação duplicada na Logística. |
| 3.61. Gestão e arquivamento de categorias | Em gate local | Cards de categorias concentram editar e excluir no menu vertical; exclusão é arquivamento lógico exclusivo do Proprietário, bloqueado para categorias com produtos e protegido contra corrida com criação. Migration e concessão persistente aguardam validação local. |
| 3.62. Identificação controlada de mesas por ambiente | Em gate local | A etapa 8 Mesas permite ao assinante associar cada mesa a um ambiente; o cliente seleciona uma identificação publicada e isolada por tenant para gerar a prévia “Na mesa”, sem texto livre ou dados pessoais. |
| 2. Catálogo administrável | Planejada | Persistência, disponibilidade, identidade visual e operação por tenant. |
| 3. Identidade e administração | Planejada | Autenticação, proprietário, gerente, administrador da plataforma, autorização e auditoria. |
| 4. Jornada de pedido | Planejada | Mesa, retirada e entrega; resumo e envio por WhatsApp com regras de privacidade. |
| 5. Pagamentos e escala | Em integração sandbox | Produtos Essencial/Profissional, Checkout recorrente, webhook assinado e provisionamento idempotente implementados; operação local depende da migration `0020` e do segredo de webhook. Conciliação, risco e produção permanecem bloqueados. |

## Marcos da fundação da Fase 1

- D-001 a D-006 registradas em requisitos e ADR.
- Escopo de tenant explícito em categorias e produtos.
- Marca, modalidades, canal, pagamento e catálogo configuráveis em dados.
- Valores monetários representados em centavos.
- Regras puras de filtro, carrinho e subtotal cobertas por testes.
- Rota `/cardapio/[tenantSlug]` resolve dois tenants demonstrativos no servidor.
- Repositório em memória rejeita catálogos com referências fora do tenant.
- Tenant inexistente responde com estado 404 específico.
- Nenhum banco, autenticação ou integração externa introduzido.

## Próximas decisões

1. Decidir o provedor e o vínculo de identidade externa antes de implementar login.
2. Definir expiração, revogação e recuperação da sessão autenticada.
3. Definir retenção e consulta operacional da trilha de auditoria.
4. Detalhar exceções de horário, áreas e regras de entrega.
5. Modelar os dados pessoais mínimos por modalidade antes da coleta.
6. Definir contrato operacional do WhatsApp e critérios de confirmação do pedido.

Toda entrega executa testes unitários, lint, tipos, testes responsivos, build e teste PWA conforme aplicabilidade.
