# Gate ponta a ponta de imagens do catálogo

## História verificada

O proprietário seleciona e enquadra uma imagem em `/admin`; o servidor rederiva identidade, tenant e permissão, normaliza a origem, armazena um WebP imutável, persiste metadados e auditoria sob RLS e projeta somente a referência pública aprovada no cardápio do mesmo tenant.

## Matriz de aceite

| Fronteira | Evidência | Estado em 2026-08-21 |
| --- | --- | --- |
| Seleção, prévia e confirmação | revisão humana de logo e produto; Object URL revogada; confirmação independente | Aprovada |
| Recorte da logo | posição central fixa na prévia e no Sharp, sem configuração manual | Aprovada |
| Cliente → servidor | formulário não envia ator, papel ou tenant; Server Action limita arquivo e campos | Aprovada |
| Autorização | sessão, vínculo, membership e permissão são renovados antes do processamento | Aprovada |
| Processamento | JPEG/PNG/WebP reais são decodificados, orientados, recortados e convertidos sem EXIF/XMP | Aprovada |
| Armazenamento | objeto WebP usa chave imutável, namespace restrito, timeout e compensação | Aprovada |
| Persistência | metadado versionado e auditoria são atômicos sob RLS; conflito não sobrescreve | Aprovada |
| Isolamento e rollback | PostgreSQL descartável confirmou RLS, snapshots e `up/down/up`; compensações possuem testes | Aprovada |
| Leitura pública | perfil e produto exibem imagem persistente sem chave, hash, versão ou identidade técnica | Aprovada |
| Responsividade | 27 cenários passaram em 390×844, 768×1024 e 1440×900 | Aprovada |
| Offline | service worker e fallback PWA passaram; upload continua naturalmente dependente de rede | Aprovada |
| Limpeza | `dry_run` encontrou 2/2 objetos referenciados e não realizou exclusão | Aprovada |

## Comandos repetíveis

```powershell
npm run test:unit
npm run lint
npm run typecheck
npm run build
npm run test:visual:existing-build
npm run test:pwa:existing-build
npm run images:reconcile
```

O teste PostgreSQL completo permanece no executor `scripts/database/test-local-postgres.ps1` e deve ser repetido quando houver migration, mudança de privilégio ou adaptador SQL. Este gate não introduziu nenhuma dessas alterações.

## Limites preservados

- `images:reconcile` deve permanecer em `dry_run`; exclusão exige autorização operacional própria;
- o gate local não comprova backup/restauração, rate limit distribuído, alertas ou comportamento multi-região;
- produção administrativa permanece condicionada aos gates de identidade, infraestrutura e operação já registrados.
