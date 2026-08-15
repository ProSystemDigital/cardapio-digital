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
| `docs/governance/RISK_REGISTER.md` | Riscos ativos | Atual |
| `docs/governance/DATA_INVENTORY.md` | Dados tratados na fundação | Atual |
| `docs/governance/PRIVACY_LGPD.md` | Limites de privacidade | Atual |
| `docs/engineering/DEPENDENCY_INVENTORY.md` | Dependências e verificações | Atual |
| `docs/operations/DEVELOPMENT_ENVIRONMENT.md` | Execução local | Aplicável |
| `docs/operations/DATABASE_MIGRATIONS.md` | Imutabilidade, transação e rollback de migrations | Em avaliação |
| `docs/standards/CODING_STANDARDS.md` | Convenções de código | Em evolução |
| `docs/standards/SECURITY_POLICY.md` | Segurança institucional | Em evolução |
| `docs/security/AUTHORIZATION_MODEL.md` | Fronteira de confiança e matriz de permissões | Ativo |
| `docs/security/AUTHENTICATION_FOUNDATION.md` | Contrato portável de autenticação | Ativo |
| `docs/security/CLERK_GOVERNANCE.md` | Limites operacionais, privacidade e custo do Clerk | Ativo |

Documentos específicos da aplicação de origem não integram este catálogo nem o novo repositório.
