# Inventário técnico de dados — Cardápio Digital

| Campo | Valor |
| --- | --- |
| Revisão | 2026-08-22 |
| Escopo | Fundação multitenant demonstrativa e especificação local do esquema persistente |
| Classificação | Catálogo público com contato comercial; sem dados de clientes |

Os dois catálogos demonstrativos contêm identificador técnico e slug do tenant, identidade fictícia, modalidades, horários semanais, pedido mínimo, taxa demonstrativa, categorias, produtos, preços, disponibilidade, variações, adicionais e rótulos públicos de mesas. O slug é usado somente para resolver a rota pública. Esses dados são operacionais e fictícios, sem identificação pessoal. O carrinho mantém em memória IDs técnicos de tenant, produto, variação, adicionais e linha, quantidade, preço recalculado, modalidade escolhida e, para atendimento na mesa, o rótulo selecionado na lista do estabelecimento; subtotal, taxa, mínimo e total são derivados. O rascunho local contém uma referência efêmera, nomes públicos do catálogo, eventual rótulo da mesa e esses valores recalculados. Tudo é descartado ao recarregar a aba. A cópia ocorre somente para o clipboard após ação do usuário. Não há conta de cliente, formulário de pedido, analytics, cookies próprios, pagamento, endereço, integração de entrega ou envio de pedido.

Os identificadores e papéis de domínio representam contratos futuros, não pessoas cadastradas. Antes de persistir tenants, usuários, clientes ou pedidos, este inventário deverá registrar campos, finalidade, base legal, origem, compartilhamento, retenção, descarte e controles de acesso.

O envio por WhatsApp e as modalidades de retirada/entrega permanecem bloqueados até a definição dos dados mínimos e da governança aplicável.

As Fases 3.57.1–3.57.2 definem tipos, adaptadores e composição server-only para cobertura. Os testes usam origem, endereços, coordenadas e rotas fictícios, descartados com o processo; nenhuma interface coleta endereço, nenhuma localização é persistida ou enviada a terceiros e o resultado omite coordenadas. A composição local é bloqueada em produção. Dados reais continuam bloqueados até decisão de finalidade, base legal, transparência, retenção, fornecedor e segurança.

A Fase 3.57.3 acrescenta somente uma interface administrativa local com dois identificadores de cenário (`near` e `far`). O navegador não envia endereço, CEP, coordenada ou tenant; o servidor resolve fixtures e contexto autorizado. O laboratório não é renderizado nem executado em produção.

A migration 0015 define a futura origem logística por tenant: rótulo, endereço brasileiro, coordenadas opcionais, status de geocodificação, versão e data de atualização. A tabela permanece vazia e sem privilégio de runtime. Como um estabelecimento pode funcionar em residência, esses campos recebem RLS forçada e devem ser tratados como potencial dado pessoal. A auditoria futura deve registrar somente campos alterados/status, nunca copiar endereço ou coordenadas.

O adaptador Geoapify está inativo sem credencial e não recebe dados reais nesta fase. Quando autorizado, a simulação de cobertura deverá manter endereço e coordenadas somente durante a requisição; persistência pertence exclusivamente ao futuro pedido confirmado e à sua política própria de retenção.

A configuração operacional passa a armazenar um número de WhatsApp informado pelo administrador para publicação como contato comercial do estabelecimento. Não é coletado do cliente e não é copiado para a auditoria. Como o contato de empresário individual pode identificar pessoa natural, o tenant controlador deve assegurar finalidade comercial, transparência, base aplicável, atualização e remoção antes do uso em produção. A integração e o envio de pedidos continuam bloqueados.

## Esquema persistente em avaliação

A migration local especifica tenants, identidade visual, operação, horários, catálogo, rótulos públicos de mesas e snapshots de itens de pedido. Os rótulos configurados não identificam clientes nem registram ocupação. O esquema continua excluindo deliberadamente nome e contato do cliente, endereço, vínculo persistente entre cliente e mesa, dados de pagamento e identificadores governamentais. A inclusão de qualquer desses campos exige atualização prévia deste inventário e decisão de privacidade, finalidade, retenção e acesso.

O teste do repositório PostgreSQL acrescenta uma fixture local fictícia com tenant, horário, categoria, produto, variação e adicional. O banco é descartado ao final do gate. Não há dado pessoal, conexão Neon ou retenção do conteúdo de teste.

A fundação de escrita registra na auditoria UUID técnico do ator, papel, ação, tipo e UUID da entidade, campos operacionais alterados e instante UTC. Não contém identidade civil ou contato. Retenção, exportação e eventual correlação operacional com a conta autenticada permanecem bloqueadas até decisão de governança própria.

A consulta administrativa local mostra somente nome atual do produto, instante, papel interno e mudanças conhecidas de preço ou disponibilidade dos 20 eventos mais recentes. UUID do ator, vínculo externo e dados do Clerk não são enviados ao navegador. Retenção, paginação e exportação continuam sem implementação.

A Fase 3.9 permite editar nome e descrição públicos e registra os novos textos na auditoria append-only. Esses campos são conteúdo operacional do catálogo e não devem conter nomes de clientes, contatos ou outros dados pessoais. A interface limita nome a 120 e descrição a 500 caracteres; retenção e descarte da auditoria continuam pendentes de decisão própria.

A Fase 3.11 altera somente a referência técnica da categoria do produto. A auditoria apresentada registra o nome público da categoria de destino e omite seu UUID; nenhum dado pessoal é acrescentado.

A Fase 3.13 altera somente modalidades operacionais públicas do produto. A auditoria registra seus rótulos públicos, sem UUID, identidade externa, contato ou dado pessoal adicional.

A Fase 3.41 prepara a ativação descartável de “Consumo no local” no tenant e em produtos explicitamente selecionados. A auditoria do tenant registra apenas o rótulo e a quantidade inicial; as trilhas dos produtos registram o rótulo público. Nenhum dado pessoal ou endereço é introduzido.

A Fase 3.17 especifica uma trilha separada para futuras alterações do perfil do tenant. Ela contém UUID técnico do ator, papel, campos operacionais alterados e instante UTC, sem identidade externa, contato ou dado pessoal; nenhum privilégio de runtime ou evento real é introduzido nesta fase.

A Fase 3.26 especifica uma trilha separada para futuras alterações de categorias. Ela contém UUIDs técnicos do tenant, categoria e ator, papel, campos operacionais alterados e instante UTC, sem identidade externa, contato ou dado pessoal; nenhum privilégio de runtime ou evento real é introduzido nesta fase.

A Fase 3.31 permite alterar somente o nome público e a ordem operacional de categorias existentes. A auditoria registra esses valores, papel interno e instante; a interface pública não recebe versões, UUID de ator ou identidade externa.

A Fase 3.0 acrescenta principals, memberships e papéis de plataforma representados somente por UUID, estado, papel, versões e timestamps. Não há subject de fornecedor, nome, e-mail, telefone, senha, token ou cookie. O futuro vínculo com identidade externa exigirá atualização deste inventário antes da coleta.

A Fase 3.1 especifica a persistência de `issuer` e `subject` pseudônimos, estado do vínculo e timestamps, exclusivamente para resolver o `principalId`. O gate usa valores fictícios e banco descartável; ainda não existe coleta real. A aplicação não copia nome, e-mail, telefone, senha, token ou organização do Clerk. Exclusão/revogação acompanhará o encerramento do acesso, ressalvada eventual evidência de auditoria com retenção própria.

A Fase 3.2 passou a usar uma conta real somente na instância Clerk de desenvolvimento restrita. O fornecedor processa os dados cadastrais necessários ao login, mas a aplicação recebe a sessão verificada e não copia perfil, e-mail, telefone, senha ou token para o PostgreSQL. A Fase 3.3 conecta a rota ao resolvedor interno em modo de negação; nenhum `issuer` ou `subject` real será persistido antes do gate humano de provisionamento local.
A Fase 3.45 especifica metadados públicos de imagem do catálogo: tenant e produto técnicos, provedor, chave opaca, URL HTTPS, tipo WebP, dimensões, tamanho, hash SHA-256, versão e timestamps; produtos também possuem texto alternativo público. Binários, nomes originais, EXIF, credenciais e arquivos de origem não são armazenados no PostgreSQL. Nenhum upload ou dado real é coletado nesta fase.

A Fase 3.50 provisiona uma store pública Vercel Blob em `iad1` para armazenar exclusivamente os WebP normalizados de logo e produtos. As chaves contêm somente UUIDs técnicos de tenant, produto e objeto; não incluem nome original, identidade externa ou dado de cliente. Um objeto técnico sem dado pessoal foi criado e excluído no gate. O token permanece secreto e fora do navegador.

A Fase 3.52 habilita administradores autorizados a selecionar logo e imagens públicas de produtos. O arquivo de origem permanece apenas durante o processamento, não tem nome persistido e é convertido para WebP sem metadados. Texto alternativo de produto é conteúdo público do catálogo. A interface não deve ser usada para imagens de clientes, documentos, contatos ou qualquer conteúdo sem autorização de uso.

A Fase 3.53 expõe no cardápio somente a URL pública da logo e, para produtos, URL e texto alternativo. Chave do objeto, versão, hash, dimensões, identidade do ator e credencial continuam restritos ao servidor. A leitura ocorre sob o tenant derivado pelo slug e recusa referências fora do namespace e host aprovados.

A Fase 3.54 processa temporariamente chaves técnicas, datas e tamanhos retornados pelo Blob para compará-los às referências PostgreSQL. Logs persistem somente contagens, bytes, modo, operações e tipo genérico de erro; não registram chave, URL, tenant, ator, token ou mensagem bruta. Nenhum dado pessoal novo é coletado.

A integração Stripe sandbox cria um identificador técnico pseudônimo de onboarding antes do checkout. O Stripe processa dados cadastrais e de pagamento diretamente em sua interface hospedada. A aplicação persiste somente os identificadores técnicos de Customer, Subscription e Checkout Session, o estado da assinatura e referências de auditoria; não persiste cartão ou dados bancários. A página de retorno não concede acesso: o provisionamento depende exclusivamente de webhook assinado e idempotente.

A Fase 3.62 permite ao estabelecimento configurar até 100 rótulos públicos compostos por ambiente (até 40 caracteres) e mesa (até 30), na etapa 8 Mesas. O cliente escolhe somente um valor da lista do tenant, agrupado por ambiente e mantido de forma efêmera no navegador e no rascunho local; texto livre, identidade do cliente, ocupação, histórico e pedido persistente não são coletados. A auditoria administrativa registra os rótulos operacionais alterados, que não devem conter nomes de pessoas, contatos ou outros dados pessoais.
