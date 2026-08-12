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

Riscos P0 bloqueiam a capacidade relacionada até existir decisão e evidência de mitigação.
