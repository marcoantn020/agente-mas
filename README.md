# mas-pipeline

Pipeline leve para [Claude Code](https://claude.com/claude-code): leva um item do pedido até código implementado, testado e revisado, deixando tudo em **git stage** (sem commit).

```
mas-refiner (card Jira + contexto) ──► você aprova ──► mas-dev ⇄ mas-qa ──► código em stage
```

| Agent | Papel |
|---|---|
| `mas-refiner` | Pesquisa o código, gera o card Jira (HU / Task / Bug) e o contexto técnico |
| `mas-dev` | Implementa o card com testes, roda build/lint/testes e faz `git add` |
| `mas-qa` | Analisa o stage, roda os testes, confere cada critério e revisa o código |

Dev e QA iteram até o QA aprovar (máximo de 3 rodadas). Ninguém faz commit nem push.

## Instalação

```bash
npx mas-pipeline            # instala em ~/.claude
npx mas-pipeline --local    # instala em ./.claude do projeto atual
```

Skills de apoio recomendadas (`jira-card-maker`, `clean-code`, `testing-patterns`, `code-review`):

```bash
npx unac-agents --target=claude-code --scope=global
```

## Uso

Reinicie o Claude Code e, dentro do repositório:

```
/mas-pipeline CONNECT-123 <descrição do que precisa>
```

Artefatos ficam em `.mas/{item-id}/`: `{item-id}_card.md` e `{item-id}_qa_report.md`.

## Licença

MIT
