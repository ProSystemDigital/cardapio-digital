# Registro de riscos — Cardápio Digital

| ID | Risco | Prioridade | Situação | Mitigação |
| --- | --- | --- | --- | --- |
| CD-01 | Integração futura de pedidos coletar dados sem governança definida | P0 | Aberto | Bloquear integração até revisar privacidade e inventário de dados. |
| CD-02 | Carrinho em memória criar expectativa de pedido concluído | P1 | Mitigado | Informar o limite do MVP e manter a continuidade sem integração externa. |
| CD-03 | Catálogo estático divergir de preço ou disponibilidade real | P1 | Aberto | Definir fonte de verdade e rotina operacional antes do uso comercial. |
| CD-04 | Regressão responsiva, acessível ou PWA | P1 | Mitigado | Lint, tipos, testes Playwright, build e teste offline no CI. |
| CD-05 | Reintrodução de credenciais ou vínculos do boilerplate | P0 | Mitigado | `.env*` e `.vercel` ignorados, template neutro e varredura antes do commit. |

Riscos P0 bloqueiam entrega da capacidade relacionada até existir decisão e evidência de mitigação.
