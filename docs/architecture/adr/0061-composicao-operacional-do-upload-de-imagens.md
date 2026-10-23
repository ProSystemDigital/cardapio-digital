# ADR 0061 — Composição operacional do upload de imagens

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-18 |
| Decisores | Produto e Engenharia |

## Contexto

Processador, armazenamento e persistência estavam aprovados separadamente. Era necessário compor o fluxo no servidor preservando a ordem de autorização, normalização, armazenamento e persistência, além de limitar duração, frequência e efeitos de falhas antes de criar qualquer entrada do navegador.

## Decisão

- criar composição `server-only` sem Server Action ou Route Handler;
- renovar identidade, membership e `catalog.image.update` antes do comando de domínio;
- usar Sharp, Vercel Blob e PostgreSQL somente atrás das portas aprovadas;
- falhar fechado quando `DATABASE_URL` ou `BLOB_READ_WRITE_TOKEN` estiver ausente;
- limitar uploads a cinco por principal e tenant em janela local de dez minutos;
- limitar a memória do rate limiter a 500 chaves;
- abortar `put` no SDK Blob após 15 segundos;
- limitar conexão PostgreSQL a cinco segundos, statement a sete e consulta a oito;
- preservar as compensações já aprovadas: excluir objeto novo se a persistência falhar e sinalizar limpeza pendente se o objeto anterior não puder ser removido.

## Limite operacional

O rate limiter é deliberadamente local ao processo porque ainda não existe endpoint público. Antes de exposição em múltiplas instâncias, ele deverá ser substituído ou complementado por controle distribuído/plataforma. A interface permanece bloqueada até esse gate.

## Consequências

Todos os adaptadores reais possuem agora uma composição única e fechada no servidor, sem ampliar a superfície HTTP. Nenhum upload administrativo foi habilitado nesta fase.

## Reversão

Remover a composição e o rate limiter. Os adaptadores e contratos independentes permanecem válidos e nenhuma migration precisa ser revertida.
