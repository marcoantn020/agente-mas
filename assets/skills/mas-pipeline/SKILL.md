---
name: mas-pipeline
description: Versão leve do unac-pipeline com 3 agents — refiner (refinamento + card Jira + contexto), dev (implementa + testa + git stage) e qa (analisa o stage). Dev e QA iteram até concordarem; a entrega fica em git stage, sem commit. Use quando o usuário pedir "/mas-pipeline", "pipeline leve", ou levar um item do pedido até código pronto em stage com menos custo que o unac-pipeline.
---

# MAS Pipeline

Você é o **orquestrador** do `mas`. Fluxo:

```
refiner (card Jira + contexto) ──► Gate do usuário ──► dev ⇄ qa ──► entrega em git stage (dev e qa de acordo)
```

> **🛑 SUBAGENT-STOP:** se você foi invocado como subagent, pule este skill.

## Checklist (TodoWrite)

1. Intake — `item-id` + pedido literal
2. Refinamento — `mas-refiner`
3. Gate — usuário aprova o card
4. Implementação — `mas-dev` (mode: implement)
5. Análise — `mas-qa`
6. Loop dev ⇄ qa até APPROVED (máx. 3 iterações de QA)
7. Fechamento

## Regras centrais

- **Serial**: um agent por vez.
- **Prompts self-contained**: cole o texto do card e dos critérios no prompt — não mande "leia o arquivo X".
- **Nunca commitar**: o resultado final é `git diff --cached`. Commit/PR é decisão do usuário.
- **Um gate humano só** (card). Depois disso, o loop roda sozinho até concordar ou estourar o limite.
- Status `BLOCKED` → mostre ao usuário e pergunte como seguir. `NEEDS_CONTEXT` → forneça o que falta e re-dispatch.

## Fase 0 — Intake
- Extraia `item-id` do pedido (ex.: `CONNECT-123`). Se não houver, pergunte ao usuário.
- Confirme que está num repositório git (`git rev-parse --is-inside-work-tree`). Se houver alterações já em stage que não são do item, avise o usuário antes de seguir.
- Guarde o pedido literal.

## Fase 1 — Refinamento
```
Agent(
  subagent_type: "mas-refiner",
  description: "Refine + card {item-id}",
  prompt: """
    item-id: {item-id}
    Pedido do usuário (literal):
    <<<
    {pedido}
    >>>
    {feedback: <ajustes do usuário, se for re-rodada>}
  """
)
```
Guarde `card`, `acceptance-criteria` e `files-to-touch` do retorno.

## Gate — Aprovação do card
Mostre o card ao usuário (completo, com campos `[PREENCHER]` destacados) e pergunte:
> "Card pronto em `.unac/{item-id}/{item-id}_card.md`. Posso implementar ou quer ajustar?"

Ajustes → re-dispatch do refiner com `feedback`. Aprovado → Fase 2.
Releia o card do arquivo após aprovação (o usuário pode ter editado) e use essa versão nos prompts seguintes.

## Fase 2 — Implementação
```
Agent(
  subagent_type: "mas-dev",
  description: "Implement {item-id}",
  prompt: """
    item-id: {item-id}
    mode: implement
    Card completo:
    <<<
    {conteúdo de .unac/{item-id}/{item-id}_card.md}
    >>>
    Critérios de aceitação:
    {lista numerada}
  """
)
```

## Fase 3 — Análise
```
Agent(
  subagent_type: "mas-qa",
  description: "QA {item-id} iter {n}",
  prompt: """
    item-id: {item-id}
    iteration: {n}
    Card completo:
    <<<
    {card}
    >>>
    Critérios de aceitação:
    {lista numerada}
    Resumo do dev:
    {staged-files, tests.command, summary}
    Issues da rodada anterior: {blocking-issues anteriores ou "n/a"}
  """
)
```

## Fase 4 — Loop dev ⇄ qa
- `verdict: APPROVED` → Fase 5.
- `verdict: CHANGES_REQUESTED` e iteração < 3 → dispatch `mas-dev` com `mode: fix`, colando o card, os critérios e o `blocking-issues` do QA. Depois, nova Fase 3 com `iteration + 1`.
- Iteração 3 sem APPROVED → pare e apresente ao usuário os issues pendentes (do report) para decidir.

## Fase 5 — Fechamento
- Rode `git diff --cached --stat` e mostre ao usuário.
- Resumo: card, arquivos em stage, testes, iterações, sugestões 🟡 não aplicadas.
- Artefatos: `.unac/{item-id}/{item-id}_card.md` e `.unac/{item-id}/{item-id}_qa_report.md`.
- Sugira o próximo passo (`/commits`, PR) — sem executar.

## Red flags

- ❌ Rodar dev e qa em paralelo
- ❌ Commitar ou dar push
- ❌ Pular o gate do card
- ❌ Aceitar APPROVED do QA sem `checks.build: passed` e todos os critérios atendidos
- ❌ Passar de 3 iterações sem falar com o usuário
