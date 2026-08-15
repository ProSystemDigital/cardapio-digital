# Registro de riscos — Cardápio Digital

| ID | Risco | Prioridade | Situação | Mitigação |
| --- | --- | --- | --- | --- |
| CD-01 | Integração futura de pedidos coletar dados sem governança definida | P0 | Aberto | Bloquear integração até revisar privacidade e inventário de dados. |
| CD-02 | Carrinho em memória criar expectativa de pedido concluído | P1 | Mitigado | Desabilitar a continuidade e informar que o envio será implementado posteriormente. |
| CD-03 | Catálogo demonstrativo divergir de preço ou disponibilidade real | P1 | Aberto | Definir fonte de verdade e rotina operacional antes do uso comercial. |
| CD-04 | Regressão responsiva, acessível ou PWA | P1 | Mitigado | Testes unitários e Playwright, lint, tipos, build e teste offline no CI. |
| CD-05 | Reintrodução de credenciais ou vínculos do boilerplate | P0 | Mitigado | `.env*` e `.vercel` ignorados, template neutro e varredura antes do commit. |
| CD-06 | Consulta ou mutação expor dados entre tenants | P0 | Parcialmente mitigado | Repositório em memória valida escopo e testes cobrem acesso cruzado; persistência continua bloqueada até existir autorização negativa por padrão. |
| CD-07 | Abertura/envio no WhatsApp ser interpretado como pedido confirmado | P1 | Aberto | Definir estados e confirmação humana; não confirmar pedido automaticamente. |
| CD-08 | Pagamento online ampliar escopo regulatório e operacional sem controles | P0 | Aberto | Exigir ADR, fornecedor avaliado, conciliação, privacidade e segurança antes da integração. |
| CD-09 | Horário semanal indicar abertura incorreta em feriados, fusos ou exceções | P1 | Aberto | Não calcular “aberto agora” até modelar fuso, exceções e intervalos operacionais. |
| CD-10 | Personalização gerar preço ou combinação inválida | P1 | Mitigado no carrinho local | Recalcular pelo catálogo e testar pertencimento, disponibilidade, limites, edição e subtotal; repetir validação no checkout futuro. |
| CD-11 | Linha ficar desatualizada após mudança do catálogo | P1 | Aberto | Revalidar e recalcular todas as linhas no servidor antes da futura confirmação do pedido. |
| CD-12 | Modalidade incompatível ou taxa incorreta produzir total enganoso | P1 | Mitigado na cotação local | Rejeitar troca incompatível e derivar mínimo/taxa do tenant; repetir cálculo no servidor no checkout futuro. |
| CD-13 | Cotação local ser interpretada como pedido confirmado | P1 | Mitigado | Identificar a cotação como demonstrativa e manter envio desabilitado. |
| CD-14 | Prévia usar preço ou disponibilidade desatualizados | P1 | Mitigado localmente | Reconstruir linhas e recalcular cotação antes da prévia; repetir obrigatoriamente no backend futuro. |
| CD-15 | Cópia da mensagem ser interpretada como envio ou confirmação | P1 | Parcialmente mitigado | Exibir aviso permanente, não abrir WhatsApp e não declarar confirmação; contrato operacional ainda pendente. |
| CD-16 | Persistência permitir leitura ou referência entre tenants | P0 | Mitigado localmente | `tenant_id`, chaves compostas e RLS forçada foram comprovados com dois tenants no PostgreSQL local; repetir o gate no ambiente provisionado. |
| CD-17 | Migration irreversível causar perda ou indisponibilidade | P0 | Parcialmente mitigado | O ciclo transacional `up/down/up` foi comprovado sem tabelas residuais; backup e restauração continuam obrigatórios antes do primeiro ambiente persistente. |
| CD-18 | Runtime privilegiado contornar RLS | P0 | Mitigado no gate local | Papel descartável foi criado sem login, superusuário ou `BYPASSRLS`; reproduzir papéis separados no futuro provisionamento. |
| CD-19 | Credencial administrativa local vazar em arquivo, argumento ou histórico | P0 | Mitigado no gate local | Senha foi solicitada de forma oculta, mantida somente na sessão e removida no `finally`; Neon permanece desconectado. |
| CD-20 | Falha no PostgreSQL servir silenciosamente catálogo demonstrativo incorreto | P1 | Mitigado por desenho | Memória é padrão explícito; seleção PostgreSQL incompleta ou falha de consulta lança erro e não aciona fallback implícito. |
| CD-21 | Descoberta por slug contornar isolamento e expor catálogo | P0 | Mitigado localmente | Funções retornam apenas UUID/slugs públicos; leitura integral com tenant foi comprovada usando papel sem `BYPASSRLS`. Repetir no ambiente provisionado. |
| CD-22 | Escrita concorrente sobrescrever preço ou disponibilidade | P1 | Mitigado localmente | `expectedVersion`, incremento atômico e rejeição de comando obsoleto foram comprovados no PostgreSQL local. |
| CD-23 | Mutação ocorrer sem evidência ou auditoria ser adulterada | P0 | Mitigado localmente | Produto e evento foram persistidos na mesma transação; runtime possui somente leitura e inserção na trilha. Repetir no ambiente provisionado. |
| CD-24 | Contexto de ator forjado conceder escrita indevida | P0 | Parcialmente mitigado | Sessão e vínculo são resolvidos no servidor; manter comandos sem superfície HTTP/UI até tenant e permissão serem derivados no fluxo real. |
| CD-25 | Papel ou tenant fornecido pelo cliente elevar privilégios | P0 | Mitigado no contrato local | A entrada contém somente `principalId`; membership e papel foram derivados no PostgreSQL antes do comando. Sessão real continua bloqueada até validação do provedor. |
| CD-26 | Administrador da plataforma obter acesso implícito a tenants | P0 | Mitigado localmente | Papel e matriz separados foram comprovados no gate; suporte futuro exige concessão temporária explícita e auditada. |
| CD-27 | Membership revogada continuar autorizando ações | P0 | Parcialmente mitigado | Membership/principal são consultados a cada operação; logout e revogação Clerk foram comprovados, mas o gate real de membership ainda está pendente. |
| CD-28 | Claims externos concederem papel ou tenant indevido | P0 | Mitigado no contrato | A autenticação retorna somente `principalId`; autorização continua derivada das tabelas internas. |
| CD-29 | Sessão expirada ou identidade sem vínculo obter acesso | P0 | Parcialmente mitigado | Logout e revogação reais foram comprovados; a rota nega ausência de banco ou vínculo sem expor identificadores. Falta comprovar o vínculo real no PostgreSQL local. |
| CD-30 | Subject externo pseudônimo ser persistido sem governança | P0 | Mitigado localmente | Finalidade, campos mínimos, revogação e acesso estreito foram registrados e comprovados no PostgreSQL; dados reais continuam bloqueados até o gate Clerk. |
| CD-31 | Dependência do Clerk impedir migração futura | P1 | Mitigado por desenho | Adaptador isolado, UUID interno estável, exportação prevista e estratégia de saída no ADR 0013. |
| CD-32 | Transferência internacional ocorrer sem avaliação LGPD | P0 | Bloqueado para dados reais | Clerk informa infraestrutura nos EUA; conta com dados reais depende de revisão humana do DPA, subprocessadores e base aplicável. |
| CD-33 | Produção operar sem MFA por limitação do plano | P0 | Bloqueado | Hobby serve apenas ao desenvolvimento; produção administrativa exige Pro com MFA ou decisão substituta equivalente. |

Riscos P0 bloqueiam a capacidade relacionada até existir decisão e evidência de mitigação.
