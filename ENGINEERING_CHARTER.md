# Carta da Engenharia da ProSystem Digital

| Campo | Definição |
| --- | --- |
| Status | Oficial |
| Natureza | Documento fundador da Engenharia |
| Aplicação | Todos os projetos e iniciativas de engenharia da ProSystem Digital |
| Proprietário | Direção e Engenharia da ProSystem Digital |
| Versão | 1.0 |
| Última revisão | 2026-07-31 |
| Próxima revisão | 2027-01-31 ou diante de mudança institucional |

## 1. Propósito

Esta Carta estabelece a identidade, o mandato e a governança superior da
Engenharia da ProSystem Digital. Ela orienta como a organização transforma
necessidades em soluções digitais responsáveis e conecta o framework, as
políticas, os padrões, as decisões e os documentos técnicos oficiais.

A Carta não prescreve tecnologias, processos detalhados ou a arquitetura de um
produto. Essas responsabilidades pertencem aos documentos subordinados e às
decisões de cada projeto.

## 2. Identidade da Engenharia

### Missão

Construir e evoluir soluções digitais úteis, seguras, sustentáveis e
verificáveis, convertendo conhecimento e necessidades reais em resultados com
qualidade técnica.

### Visão

Estabelecer uma engenharia reconhecida pela consistência entre estratégia,
arquitetura, execução e operação, capaz de reutilizar conhecimento sem impedir
decisões proporcionais ao contexto de cada projeto.

### Propósito

Criar valor duradouro por meio de software bem compreendido, decisões
rastreáveis e evolução responsável.

### Valores

- **Responsabilidade:** toda decisão técnica possui impacto, proprietário e
  consequência.
- **Clareza:** requisitos, limites, riscos e evidências devem ser
  compreensíveis.
- **Simplicidade:** a solução deve conter somente a complexidade necessária.
- **Qualidade:** correção, manutenção, acessibilidade e operação fazem parte da
  entrega.
- **Segurança e privacidade:** proteção deve existir desde a concepção.
- **Aprendizado:** evidências, incidentes e revisões alimentam a evolução.
- **Colaboração:** conhecimento relevante deve ser compartilhado e
  institucionalizado.

## 3. Filosofia de Engenharia

A ProSystem Digital entende engenharia de software como a disciplina de tomar
decisões responsáveis sob restrições técnicas, humanas e de negócio. Produzir
código é parte desse trabalho, não sua totalidade.

Qualidade e velocidade não são objetivos opostos quando o escopo é claro e os
controles são proporcionais ao risco. Simplicidade reduz custo e exposição;
inovação é adotada quando oferece benefício verificável; segurança limita
riscos inaceitáveis; evolução contínua evita que decisões corretas em um
momento se tornem permanentes sem revisão.

Nenhuma ferramenta, tendência ou automação substitui compreensão do problema,
responsabilidade técnica e evidência de validação.

## 4. Papel do HKA FIELD

O [HKA FIELD Engineering Guide](docs/hka-field/HKA_FIELD_ENGINEERING_GUIDE.md)
é o Framework Oficial de Engenharia da ProSystem Digital. Ele traduz esta
Carta em dimensões, princípios, ciclo de vida, controles e critérios de
entrega aplicáveis aos projetos.

A Carta define identidade e autoridade institucional. O HKA FIELD define como
essa identidade orienta a engenharia. Políticas, padrões e decisões
especializam o framework sem substituí-lo.

## 5. Hierarquia documental

```text
ENGINEERING_CHARTER
  ↓
HKA FIELD Engineering Guide
  ↓
Development Policy e políticas institucionais
  ↓
AGENTS
  ↓
Documentation Catalog
  ↓
Technical Roadmap, padrões e governança
  ↓
Architecture Decision Records
  ↓
Documentação operacional e projeto
  ↓
Evidências históricas
```

O [Catálogo Oficial](docs/DOCUMENTATION_CATALOG.md) registra localização,
proprietário, estado e ciclo de vida. O
[`AGENTS.md`](AGENTS.md) converte a hierarquia em instruções operacionais para
agentes de inteligência artificial.

Em caso de conflito, prevalece o documento de nível superior, salvo exigência
legal, regulatória ou contratual mais restritiva. Conflitos identificados não
devem ser resolvidos silenciosamente: exigem registro, responsável e correção
dos documentos afetados.

## 6. Governança da Engenharia

Decisões técnicas devem ser proporcionais ao impacto e baseadas em requisitos,
alternativas, riscos e evidências. Decisões duradouras de arquitetura devem ser
registradas em ADR. Prioridades e evolução pertencem ao roadmap; riscos devem
ser mantidos no registro oficial; regras permanentes pertencem às políticas e
aos padrões correspondentes.

Um novo padrão somente se torna institucional quando:

1. resolve uma necessidade recorrente e demonstrável;
2. é compatível com esta Carta e com o HKA FIELD;
3. possui escopo, proprietário e impacto conhecidos;
4. foi validado em contexto representativo;
5. está registrado na fonte documental adequada;
6. possui regra de revisão, exceção e eventual descontinuação.

Projetos podem adotar decisões específicas quando seu contexto exigir, desde
que não contradigam princípios superiores e que a exceção seja explícita.
Consistência entre projetos significa compartilhar princípios, contratos e
critérios úteis, não impor uniformidade sem benefício.

## 7. Responsabilidades

- **Direção e Produto:** definem objetivos, prioridades e aceitação de riscos
  de negócio.
- **Arquitetura e Engenharia:** definem soluções, registram decisões e
  respondem pela qualidade técnica.
- **Segurança e Privacidade:** avaliam controles, dados, conformidade e riscos.
- **Operação e Plataforma:** sustentam entrega, observabilidade, recuperação e
  continuidade.
- **Responsáveis documentais:** mantêm fontes oficiais atuais, relacionadas e
  rastreáveis.

Uma pessoa pode exercer mais de um papel, mas as perspectivas não devem ser
omitidas quando aplicáveis.

## 8. Inteligência Artificial

Agentes de IA apoiam descoberta, análise, implementação, testes, documentação
e revisão. A responsabilidade por decisões, autorização, entrega e impacto
permanece humana.

Todo agente deve:

- respeitar esta Carta e toda a hierarquia documental aplicável;
- compreender contexto e evidências antes de modificar;
- operar com o menor acesso e escopo necessários;
- preservar segurança, privacidade, autoria e licenciamento;
- submeter decisões críticas à validação técnica humana;
- informar limitações, hipóteses e verificações não executadas.

O uso operacional de agentes é regido pelo [`AGENTS.md`](AGENTS.md) e pelas
políticas aplicáveis.

## 9. Evolução contínua

Documentação, código, decisões e evidências são ativos estratégicos. A
Engenharia deve revisar periodicamente padrões, dependências, riscos, métricas
e procedimentos, preservando o histórico necessário para compreender por que
uma decisão foi tomada.

Mudanças institucionais devem ser versionadas, justificadas e propagadas aos
documentos subordinados. Documentos obsoletos devem ser atualizados,
substituídos ou arquivados de forma explícita, nunca abandonados como se ainda
representassem o estado vigente.

Esta Carta deve permanecer estável. Sua evolução exige revisão conjunta da
Direção e da Engenharia e deve preservar a identidade institucional da
ProSystem Digital.
