# Ambiente de Desenvolvimento Local

| Campo | Definicao |
| --- | --- |
| Proprietario | Engenharia da ProSystem Digital |
| Estado | Operacional |
| Plataforma principal | Windows |
| Porta de desenvolvimento | Selecao padrao do Next.js, preferencialmente `3000` |

## Inicializacao padrao

Execute uma unica vez, na raiz do repositorio:

```bash
npm run dev
```

O script versionado preserva a selecao oficial de porta do Next.js. Em um
ambiente livre, o terminal exibe `http://localhost:3000` como endereco local e
o endereco IPv4 da maquina na porta `3000` como endereco de rede. Se a porta
estiver ocupada, o framework pode selecionar a proxima porta disponivel; antes
de manter duas instancias, investigue o processo que ocupa a porta preferencial.

As portas `3100` e `3200` sao isoladas para as suites Playwright visual e PWA.
Elas nao alteram a porta padrao do ambiente de desenvolvimento.

## Diagnostico no Windows

Identifique primeiro o PID que esta ouvindo na porta `3000` e confirme sua
linha de comando. Nao encerre um processo apenas pelo numero da porta.

### PowerShell

```powershell
$connection = Get-NetTCPConnection -LocalPort 3000 -State Listen
$connection | Select-Object LocalAddress, LocalPort, OwningProcess
Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" |
  Select-Object ProcessId, ParentProcessId, CommandLine
```

Depois de confirmar que o processo pertence a este repositorio:

```powershell
taskkill.exe /PID <PID> /T /F
```

### Prompt de Comando (CMD)

```bat
netstat -ano | findstr :3000
wmic process where processid=<PID> get ProcessId,ParentProcessId,CommandLine
taskkill /PID <PID> /T /F
```

O `wmic` pode nao estar disponivel em versoes recentes do Windows. Nesse caso,
use o PowerShell para inspecionar a linha de comando.

### Git Bash

O MSYS2 pode converter argumentos iniciados por `/` em caminhos. Desabilite a
conversao somente para a chamada do utilitario nativo do Windows:

```bash
MSYS_NO_PATHCONV=1 taskkill.exe /PID <PID> /T /F
```

Como alternativa:

```bash
cmd.exe /c "taskkill /PID <PID> /T /F"
```

## Instancias duplicadas

O Next.js mantem um lock em `.next/dev/lock` para impedir dois servidores de
desenvolvimento no mesmo projeto. Uma mensagem sobre lock normalmente indica
uma instancia ativa ou uma arvore de processos que ainda nao terminou. Confirme
os processos e finalize a arvore legitima antes de executar `npm run dev`
novamente. Nao remova o lock enquanto houver um processo Next.js ativo.

## Verificacao

Depois de iniciar o servidor:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

Confirme que existe um unico listener, que `http://localhost:3000` responde e
que o endereco `Network` exibido pelo Next.js esta acessivel a partir de outro
dispositivo autorizado na mesma rede.
