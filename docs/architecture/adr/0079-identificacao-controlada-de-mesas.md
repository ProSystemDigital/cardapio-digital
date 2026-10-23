# ADR 0079 — Identificação controlada de mesas

| Campo | Valor |
| --- | --- |
| Status | Aceito para gate local e revisão humana |
| Data | 2026-10-23 |
| Decisores | Produto e Engenharia |

## Contexto

A modalidade `dine_in` precisa identificar onde o cliente será atendido sem exigir ida ao balcão. Aceitar um texto livre do cliente permitiria mesas inexistentes, erros operacionais e mistura entre estabelecimentos.

## Decisão

- apresentar `dine_in` como “Na mesa”;
- oferecer a etapa administrativa independente “8 Mesas”;
- permitir que proprietário ou gerente configure até 100 identificações no formato `Ambiente | Mesa`, com ambiente de até 40 e mesa de até 30 caracteres;
- armazenar e publicar o rótulo composto `Ambiente · Mesa`, preservando rótulos legados sem ambiente como pertencentes ao “Ambiente principal”;
- publicar somente as identificações do tenant junto ao catálogo;
- exigir que o cliente selecione uma identificação publicada antes da prévia;
- reconstruir e validar a seleção contra o catálogo atual, sem aceitar tenant ou mesa externa;
- incluir a mesa na prévia local sem coletar nome, telefone ou outro dado pessoal.

## Consequências

A separação por ambiente reduz ambiguidades em estabelecimentos com salão, varanda, área externa ou outros espaços e mantém isolamento por tenant. O formato composto reutiliza a coluna existente e evita nova migração. A fundação atual ainda produz somente uma prévia local; transmissão, confirmação, ocupação, QR Code e vínculo com pedidos persistidos permanecem fora desta decisão.

## Reversão

Remover o seletor e o contrato de mesa e executar o rollback `0022_dining_tables.down.sql`. O rollback remove as identificações configuradas e exige confirmação operacional prévia.
