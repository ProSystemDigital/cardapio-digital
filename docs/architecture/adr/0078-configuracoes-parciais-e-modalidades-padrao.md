# ADR 0078 — Configurações parciais e modalidades padrão

| Campo | Valor |
| --- | --- |
| Status | Aceito para gate local e revisão humana |
| Data | 2026-10-23 |
| Decisores | Produto e Engenharia |

## Contexto

O onboarding pago cria um tenant operacionalmente incompleto, sem contato, horários ou meios de pagamento definidos. Atendimento, Financeiro e Logística são formulários independentes, mas o comando anterior validava todos os campos ao salvar qualquer seção. Isso produzia um bloqueio circular: nenhuma primeira seção podia ser persistida. A ativação separada de “Consumo no local” também repetia uma decisão que passa a pertencer à disponibilidade de cada produto.

## Decisão

- usar comandos discriminados para Atendimento, Financeiro e Logística;
- validar e persistir somente os campos enviados pela seção, mantendo autorização renovada, versão otimista, transação e auditoria;
- não sobrescrever campos de outra seção;
- disponibilizar `pickup`, `delivery` e `dine_in` para todos os tenants existentes e futuros;
- registrar quais modalidades foram adicionadas pelo backfill para permitir rollback somente enquanto nenhum produto as utilizar;
- configurar cada produto com “Não disponível”, “Retirada”, “Entrega” e “Na mesa”;
- remover da Logística a ativação duplicada de produtos para consumo no local;
- manter a geocodificação separada do salvamento do endereço e apresentar o estado pendente como informação, não como erro.

## Consequências

Cada etapa pode ser concluída em qualquer ordem sem inventar dados para campos ainda vazios. A versão global de `tenant_operations` continua detectando concorrência entre seções. Modalidades selecionadas em produtos permanecem limitadas às modalidades habilitadas no tenant, agora padronizadas pelo onboarding e pelo backfill.

## Reversão

Remover os comandos parciais e restaurar o comando agregado somente após garantir defaults válidos para todos os tenants. A migration `0021` recusa rollback quando uma modalidade adicionada já estiver vinculada a produto; nesse caso, é necessária migração compensatória consciente.
