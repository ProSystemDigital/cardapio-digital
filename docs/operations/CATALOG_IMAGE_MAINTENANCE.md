# Manutenção de imagens do catálogo

## Simulação segura

Com PostgreSQL e `.env.local` ativos:

```powershell
npm run images:reconcile
```

O comando somente lista objetos, consulta referências e imprime uma linha JSON agregada. `orphanCandidates` e `orphanCandidateBytes` indicam objetos sem referência que já ultrapassaram 24 horas. `youngUnreferencedObjects` permanece protegido pela carência. `invalidNamespaceObjects` nunca é removido automaticamente.

## Exclusão confirmada

A exclusão no Blob é irreversível. Revise primeiro a simulação. Somente depois, com autorização operacional explícita, execute:

```powershell
npm run images:reconcile -- --apply --confirm-delete-orphans
```

O limite padrão é 100. Um limite menor pode ser informado com `--max-delete=10`; valores acima de 500 são recusados. Falhas individuais permanecem para a próxima execução e tornam o processo malsucedido.

## Observabilidade e custo

Os eventos `catalog_image_reconciliation_completed`, `catalog_image_reconciliation_failed`, `catalog_image_reconciliation_delete_failed`, `catalog_image_upload_failed` e `catalog_image_previous_object_cleanup_pending` podem ser filtrados nos logs. Eles não contêm URLs, chaves, tenant, identidade ou mensagem bruta.

Use `listedObjects`, `listedBytes`, `listOperations`, `deleteOperations`, `deletedObjects` e `deletedBytes` como consumo técnico. O valor financeiro oficial deve ser consultado no painel do Vercel Blob, pois preços e franquias podem mudar.

Agendamento e alertas externos não estão ativos nesta fase; a execução é manual e controlada.

## Baseline local

Em 2026-08-18, o primeiro `dry_run` real registrou 2 objetos, 99.626 bytes e uma operação de listagem. Os 2 objetos estavam referenciados; não havia candidato órfão, objeto jovem sem referência, namespace inválido ou falha. Nenhuma exclusão foi executada.

Em 2026-08-21, o gate ponta a ponta repetiu o `dry_run`: 2 objetos, 99.888 bytes e 2 referências válidas. Não havia órfão, objeto jovem sem referência, namespace inválido, falha ou exclusão.
