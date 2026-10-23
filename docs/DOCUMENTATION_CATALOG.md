# Catálogo oficial da documentação — Cardápio Digital

| Documento | Papel | Estado |
| --- | --- | --- |
| `ENGINEERING_CHARTER.md` | Autoridade institucional de engenharia | Oficial |
| `docs/hka-field/HKA_FIELD_ENGINEERING_GUIDE.md` | Framework HKA FIELD | Oficial |
| `docs/standards/DEVELOPMENT_POLICY.md` | Política permanente de desenvolvimento | Oficial |
| `AGENTS.md` | Regras operacionais para agentes | Oficial |
| `README.md` | Produto, execução e validação | Atual |
| `docs/product/PRODUCT_DECISIONS.md` | D-001 a D-006 e requisitos de evolução | Aceito |
| `docs/hka-field/TECHNICAL_ROADMAP.md` | Evolução planejada do produto | Atual |
| `docs/architecture/adr/0001-isolamento-e-mvp-local.md` | Isolamento e escopo local | Aceito |
| `docs/architecture/adr/0002-fundacao-saas-multitenant.md` | Fundação multitenant e jornada inicial | Aceito |
| `docs/architecture/adr/0003-modelo-operacional-do-catalogo.md` | Horários, modalidades, preços e personalização | Aceito |
| `docs/architecture/adr/0004-carrinho-por-linhas-configuradas.md` | Personalização e cálculo autoritativo do carrinho | Aceito |
| `docs/architecture/adr/0005-cotacao-local-por-modalidade.md` | Modalidade, compatibilidade, mínimo, taxa e total | Aceito |
| `docs/architecture/adr/0006-rascunho-imutavel-e-previa-de-mensagem.md` | Revalidação, resumo imutável e prévia textual | Aceito |
| `docs/architecture/adr/0007-postgresql-e-isolamento-multitenant.md` | Persistência relacional, RLS e referências por tenant | Aceito |
| `docs/architecture/adr/0008-ferramentas-de-persistencia.md` | PostgreSQL local, pgAdmin 4, psql e Neon planejado | Aceito |
| `docs/architecture/adr/0009-repositorio-postgresql-de-catalogo.md` | Adaptador de leitura, seleção explícita e retorno à memória | Aceito |
| `docs/architecture/adr/0010-comandos-autorizados-e-auditoria-transacional.md` | Autorização negativa, concorrência e auditoria atômica | Aceito |
| `docs/architecture/adr/0011-identidade-e-autorizacao-derivada.md` | Principal técnico, memberships e permissões derivadas | Aceito |
| `docs/architecture/adr/0012-fronteira-de-autenticacao-e-vinculo-externo.md` | Sessão verificada e vínculo externo portável | Aceito |
| `docs/architecture/adr/0013-clerk-como-provedor-de-autenticacao.md` | Clerk, governança e estratégia de saída | Aceito com gates |
| `docs/architecture/adr/0014-memberships-derivadas-por-funcao-estreita.md` | Derivação de tenant e papel sem leitura direta do runtime | Aceito para gate local |
| `docs/architecture/adr/0015-catalogo-administrativo-somente-leitura.md` | Leitura administrativa pelo tenant derivado, sem mutações | Aceito para gate local |
| `docs/architecture/adr/0016-disponibilidade-administrativa-controlada.md` | Mutação mínima com autorização renovada, versão e auditoria | Aceito |
| `docs/architecture/adr/0017-preco-administrativo-controlado.md` | Edição monetária em centavos com autorização, versão e auditoria | Aceito |
| `docs/architecture/adr/0018-auditoria-administrativa-somente-leitura.md` | Consulta limitada da trilha do tenant derivado | Aceito |
| `docs/architecture/adr/0019-conteudo-administrativo-controlado.md` | Edição limitada de nome e descrição com auditoria | Aceito |
| `docs/architecture/adr/0020-categorias-administrativas-somente-leitura.md` | Revisão da estrutura de categorias do tenant derivado | Aceito |
| `docs/architecture/adr/0021-classificacao-administrativa-controlada.md` | Movimento de produto entre categorias existentes | Aceito |
| `docs/architecture/adr/0022-modalidades-por-produto-somente-leitura.md` | Revisão das modalidades operacionais por produto | Aceito |
| `docs/architecture/adr/0023-modalidades-por-produto-controladas.md` | Edição das modalidades existentes por produto | Aceito |
| `docs/architecture/adr/0024-configuracao-operacional-somente-leitura.md` | Revisão de horários e valores operacionais do tenant | Aceito |
| `docs/architecture/adr/0025-personalizacoes-por-produto-somente-leitura.md` | Revisão de variações e adicionais do produto | Aceito |
| `docs/architecture/adr/0026-perfil-do-estabelecimento-somente-leitura.md` | Revisão da identidade e dos canais operacionais do tenant | Aceito |
| `docs/architecture/adr/0027-fundacao-da-escrita-do-perfil-do-tenant.md` | Versionamento e auditoria próprios para futura escrita do perfil | Aceito |
| `docs/architecture/adr/0028-contrato-de-comando-do-perfil-do-tenant.md` | Validação e autorização portáveis da futura escrita do perfil | Aceito |
| `docs/architecture/adr/0029-adaptador-postgresql-do-perfil-do-tenant.md` | Escrita versionada e auditoria atômica do perfil | Aceito |
| `docs/architecture/adr/0030-habilitacao-persistente-do-perfil-do-tenant.md` | Migration e privilégio mínimo no banco persistente local | Aceito |
| `docs/architecture/adr/0031-composicao-autorizada-do-perfil-do-tenant.md` | Identidade e permissão renovadas antes do comando de perfil | Aceito |
| `docs/architecture/adr/0032-perfil-textual-do-tenant-controlado.md` | Edição de nome curto e slogan com versão e auditoria | Aceito |
| `docs/architecture/adr/0033-repositorio-de-auditoria-do-perfil.md` | Consulta limitada e sanitizada da trilha do perfil | Aceito |
| `docs/architecture/adr/0034-leitura-persistente-da-auditoria-do-perfil.md` | Privilégio mínimo de consulta no banco persistente local | Aceito |
| `docs/architecture/adr/0035-auditoria-administrativa-do-perfil.md` | Consulta autorizada e apresentação sanitizada do histórico do perfil | Aceito |
| `docs/architecture/adr/0036-fundacao-da-escrita-de-categorias.md` | Versionamento e auditoria próprios para futura escrita de categorias | Aceito |
| `docs/architecture/adr/0037-contrato-de-comando-de-categorias.md` | Validação e autorização portáteis da futura escrita de categorias | Aceito |
| `docs/architecture/adr/0038-adaptador-postgresql-de-categorias.md` | Escrita versionada e auditoria atômica de categorias no banco descartável | Aceito |
| `docs/architecture/adr/0039-habilitacao-persistente-de-categorias.md` | Migration e privilégio mínimo de categorias no banco persistente local | Aceito |
| `docs/architecture/adr/0040-composicao-autorizada-de-categorias.md` | Identidade e permissão renovadas antes do comando de categoria | Aceito |
| `docs/architecture/adr/0041-nome-e-ordem-de-categorias-controlados.md` | Formulários controlados para nome e ordem de categorias existentes | Aceito |
| `docs/architecture/adr/0042-repositorio-de-auditoria-de-categorias.md` | Consulta limitada e sanitizada da trilha de categorias | Aceito |
| `docs/architecture/adr/0043-leitura-persistente-da-auditoria-de-categorias.md` | Privilégio mínimo de consulta da auditoria de categorias | Aceito |
| `docs/architecture/adr/0044-auditoria-administrativa-de-categorias.md` | Consulta autorizada e apresentação sanitizada do histórico de categorias | Aceito |
| `docs/architecture/adr/0045-contrato-de-criacao-de-categorias.md` | Validação e autorização portáteis do cadastro de categorias | Aceito |
| `docs/architecture/adr/0046-persistencia-auditada-da-criacao-de-categorias.md` | Criação com identificadores derivados e auditoria atômica no banco descartável | Aceito |
| `docs/architecture/adr/0047-habilitacao-persistente-da-criacao-de-categorias.md` | Migration e privilégios mínimos de criação no banco persistente | Aceito |
| `docs/architecture/adr/0048-composicao-autorizada-da-criacao-de-categorias.md` | Identidade e permissão renovadas antes da criação | Aceito |
| `docs/architecture/adr/0049-cadastro-controlado-de-categorias.md` | Formulário confirmado e Server Action para criação | Aceito |
| `docs/architecture/adr/0050-contrato-de-ativacao-de-consumo-no-local.md` | Contrato restrito para habilitar `dine_in` sem exposição prematura | Aceito |
| `docs/architecture/adr/0051-persistencia-auditada-de-consumo-no-local.md` | Ativação atômica no tenant e produtos iniciais | Aceito |
| `docs/architecture/adr/0052-habilitacao-persistente-de-consumo-no-local.md` | Migration e privilégios mínimos sem ativação efetiva | Aceito |
| `docs/architecture/adr/0053-composicao-autorizada-de-consumo-no-local.md` | Identidade e permissão renovadas antes da ativação | Aceito |
| `docs/architecture/adr/0054-ativacao-controlada-de-consumo-no-local.md` | Seleção inicial confirmada e ativação atômica | Aceito para revisão humana |
| `docs/architecture/adr/0055-fundacao-de-imagens-do-catalogo.md` | Armazenamento planejado, normalização e metadados isolados de logo e produtos | Aceito para gate local |
| `docs/architecture/adr/0056-contrato-de-upload-de-imagens.md` | Validação portável, autorização derivada e compensação do upload | Aceito |
| `docs/architecture/adr/0057-processador-local-de-imagens.md` | Decodificação, recorte, remoção de metadados e normalização WebP no servidor | Aceito |
| `docs/architecture/adr/0058-adaptador-postgresql-de-imagens.md` | Persistência versionada e auditoria atômica dos metadados de imagem | Aceito para gate local |
| `docs/architecture/adr/0059-habilitacao-persistente-dos-metadados-de-imagem.md` | Migrations e privilégios mínimos de imagens no banco persistente local | Aceito para gate local persistente |
| `docs/architecture/adr/0060-adaptador-vercel-blob-de-imagens.md` | Objetos públicos WebP com chaves imutáveis e exclusão restrita | Aceito |
| `docs/architecture/adr/0061-composicao-operacional-do-upload-de-imagens.md` | Identidade, limites e adaptadores reais compostos somente no servidor | Aceito |
| `docs/architecture/adr/0062-interface-administrativa-de-imagens.md` | Seleção, prévia, recorte central de logo, confirmação e envio autorizado de imagens | Aceito |
| `docs/architecture/adr/0063-leitura-publica-de-imagens.md` | Projeção pública mínima e renderização acessível de logo e produtos | Aceito |
| `docs/architecture/adr/0064-limpeza-e-observabilidade-de-imagens.md` | Reconciliação conservadora, métricas agregadas e logs sanitizados de imagens | Aceito |
| `docs/architecture/adr/0065-gate-ponta-a-ponta-de-imagens.md` | Matriz integrada do fluxo administrativo, armazenamento, persistência e leitura pública de imagens | Aceito para revisão humana local |
| `docs/architecture/adr/0066-contrato-de-cadastro-de-produtos.md` | Entrada mínima, autorização e publicação segura do futuro cadastro de produtos | Aceito |
| `docs/architecture/adr/0067-configuracao-operacional-controlada.md` | Valores, contato comercial, pagamentos presenciais e horários com escrita autorizada | Aceito para gate local e revisão humana |
| `docs/architecture/adr/0068-distancia-maxima-de-entrega.md` | Alcance logístico em metros sem coleta de localização do cliente | Aceito para gate local e revisão humana |
| `docs/architecture/adr/0069-contrato-portatil-de-cobertura.md` | Endereço brasileiro, geocodificação e rota atrás de portas locais sem fornecedor | Aceito sem dados reais |
| `docs/architecture/adr/0070-composicao-local-de-cobertura.md` | Composição server-only com origem e rotas fictícias e bloqueio em produção | Aceito somente localmente |
| `docs/architecture/adr/0071-laboratorio-visual-de-cobertura.md` | Laboratório administrativo com cenários fictícios, sem coleta de endereço | Em revisão humana |
| `docs/architecture/adr/0072-origem-logistica-e-provedor-geografico.md` | Fundação RLS da origem e seleção provisória de Geoapify para sandbox | Ativação real bloqueada |
| `docs/architecture/adr/0073-cadastro-auditado-de-produtos.md` | Persistência, autorização, interface e privilégio mínimo para criar produtos indisponíveis | Aceito para gate local e revisão humana |
| `docs/architecture/adr/0074-imagem-coordenada-no-cadastro-de-produtos.md` | Upload opcional após criação segura e cards de produtos compactos por padrão | Em revisão humana |
| `docs/architecture/adr/0075-formulario-unificado-e-arquivamento-de-produtos.md` | Criação e edição no mesmo formulário e exclusão por arquivamento lógico auditado | Em gate local e revisão humana |
| `docs/architecture/adr/0076-arquivamento-seguro-de-categorias.md` | Menu de gestão e arquivamento lógico somente para categorias sem produtos | Em gate local e revisão humana |
| `docs/architecture/adr/0077-checkout-de-assinaturas-stripe.md` | Planos recorrentes e Checkout Stripe sem concessão de acesso pela página de retorno | Aceito para sandbox; ativação bloqueada |
| `docs/architecture/adr/0078-configuracoes-parciais-e-modalidades-padrao.md` | Salvamento independente das etapas operacionais e modalidades padrão por produto | Aceito para gate local e revisão humana |
| `docs/architecture/adr/0079-identificacao-controlada-de-mesas.md` | Configuração de mesas por tenant e seleção validada na prévia local | Aceito para gate local e revisão humana |
| `docs/governance/DELIVERY_LOCATION_PRIVACY_GATE.md` | Avaliação técnica LGPD, minimização, retenção e decisões humanas pendentes | Tratamento real bloqueado |
| `docs/governance/DATA_PROCESSING_ROLES.md` | Matriz de controlador, operadora e suboperadores por atividade | Modelo de produto aprovado |
| `docs/operations/DELIVERY_COVERAGE_ACTIVATION_CHECKLIST.md` | Contas, configurações e gates para ativar cobertura real | Checklist operacional |
| `docs/governance/RISK_REGISTER.md` | Riscos ativos | Atual |
| `docs/governance/DATA_INVENTORY.md` | Dados tratados na fundação | Atual |
| `docs/governance/PRIVACY_LGPD.md` | Limites de privacidade | Atual |
| `docs/engineering/DEPENDENCY_INVENTORY.md` | Dependências e verificações | Atual |
| `docs/operations/DEVELOPMENT_ENVIRONMENT.md` | Execução local | Aplicável |
| `docs/operations/DATABASE_MIGRATIONS.md` | Imutabilidade, transação e rollback de migrations | Em avaliação |
| `docs/operations/CATALOG_IMAGE_MAINTENANCE.md` | Simulação, exclusão confirmada, métricas e limites da manutenção de imagens | Aplicável |
| `docs/operations/CATALOG_IMAGE_E2E_GATE.md` | Evidências e comandos repetíveis do gate ponta a ponta de imagens | Aplicável |
| `docs/standards/CODING_STANDARDS.md` | Convenções de código | Em evolução |
| `docs/standards/SECURITY_POLICY.md` | Segurança institucional | Em evolução |
| `docs/security/AUTHORIZATION_MODEL.md` | Fronteira de confiança e matriz de permissões | Ativo |
| `docs/security/AUTHENTICATION_FOUNDATION.md` | Contrato portável de autenticação | Ativo |
| `docs/security/CLERK_GOVERNANCE.md` | Limites operacionais, privacidade e custo do Clerk | Ativo |

Documentos específicos da aplicação de origem não integram este catálogo nem o novo repositório.
