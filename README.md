# pontua. — Ranking de membros

MVP para um grupo de 16 pessoas, com catálogo de tarefas, registro de entregas, conferência por outra pessoa, ranking mensal e histórico de meses fechados. O primeiro mês começa no modo de teste.

## O que está implementado

- Acesso individual pela identidade do ChatGPT Sites. O primeiro acesso cria a conta administradora; as demais contas precisam ser cadastradas pelo e-mail antes do primeiro login.
- Perfis membro, coordenação e administrador, com autorização no servidor. Ninguém pode aprovar o próprio registro.
- Tarefas com dificuldade fixa (5, 15 ou 30 pontos), comprovante, limite de repetição, trabalho em grupo e versões com vigência futura.
- Registro, reenvio, aprovação, devolução, rejeição, contestação única e auditoria.
- Comprovantes em link HTTPS, confirmação ou arquivo privado PDF/imagem no R2 (até 10 MB).
- Ranking mensal com pontos aprovados e pendentes separados, mês de teste, prazo de validação e congelamento.

## Preparação

O projeto usa o starter Vinext do Sites, D1 para registros e R2 para arquivos. Após instalar dependências:

```sh
npm ci
npm run db:generate
npm run dev
```

As migrações geradas precisam ser conferidas e publicadas antes de usar o banco hospedado. No desenvolvimento local, aplique as migrações ao D1 local conforme as instruções do starter Sites. A configuração de hospedagem está em `.openai/hosting.json`.

## Regras que exigem decisão do grupo

Antes de transformar o mês de teste em disputa oficial, defina coordenação com pelo menos duas pessoas, prêmio, regra final de empate, prazo de validação, início do mês de teste e política de retenção/anonimização dos dados. O sistema usa provisoriamente 50% dos pontos para o responsável de uma entrega em grupo e divide o restante igualmente. O ranking usa pontos em tarefas difíceis como segundo critério visual, mas o prêmio em caso de empate continua sujeito à decisão do grupo.

O site criado está privado para o proprietário. O acesso dos 16 membros depende de uma política de acesso adequada no Sites e do cadastro dos e-mails. Nenhum dado real de membros foi inserido.

## Limites conhecidos

O registro de atividades do mês encerra quando a coordenação inicia a validação. A política de retenção e as rotinas de backup devem ser definidas antes de dados reais entrarem no sistema. Alertas automáticos de pendências acima de três dias e detecção ampla de fragmentação de entregas ainda dependem da revisão humana da coordenação.
