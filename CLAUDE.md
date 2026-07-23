# Idioma

Responda sempre em português do Brasil (pt-BR), independentemente do idioma
usado na mensagem do usuário. Comentários de código, nomes de variáveis e
identificadores seguem a convenção do código (geralmente inglês) — a
instrução de idioma vale para o texto conversacional dirigido ao usuário,
não para o código em si.

# Commits

Ao concluir uma feature ou uma correção, **faça o commit sem esperar que o
usuário peça**. Isso é uma autorização permanente e substitui o padrão de
"só commitar quando solicitado".

Formato da primeira linha:

```
feat: descrição curta no imperativo
fix: descrição curta no imperativo
```

Para trabalho que não é nem feature nem correção, use o prefixo mais próximo
do Conventional Commits — `docs:`, `refactor:`, `chore:`, `test:` — em vez de
forçar um `feat:`/`fix:` que não descreve o que aconteceu.

**Um commit por feature.** Não agrupe várias features num commit só (o
histórico antigo faz isso — ex.: "Add AI chat sidebar, custom HTML slide,
block animations..." —, mas não é o padrão daqui em diante). Se um trabalho
produziu uma feature e uma correção não relacionada, são dois commits. O
prefixo só tem utilidade quando o commit tem um assunto único.

Limites que continuam valendo:

- **`push` não está incluído nesta autorização.** Commit é local e
  reversível; push é externo. Só faça push quando o usuário pedir.
- Nunca use `--no-verify` nem pule hooks. Se um hook falhar, investigue a
  causa em vez de contornar.
- Commite apenas o que você mudou. Se houver alterações não relacionadas já
  presentes na árvore de trabalho, não as arraste para dentro do seu commit.
