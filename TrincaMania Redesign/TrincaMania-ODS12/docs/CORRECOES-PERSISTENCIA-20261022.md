# Correção A01 e cobertura A13 — persistência de capítulos

Data: 2026-10-22. Base do simulador: `6ee3ad3c0abcd84b496dac9e34e3f2ae16ab0597`.

## Defeito corrigido

O handler gravava estrelas e só depois moedas. Se a segunda gravação falhasse, a próxima execução calculava recompensa incremental zero a partir das estrelas já salvas. O prêmio desaparecia permanentemente.

## Protocolo implementado

`src/storage/chapterCompletionTransaction.ts` coordena uma fila por proprietário de persistência. Usa o mesmo `keyValueStorage` dos dois saves, inclusive seus adaptadores de sessão de visitante e namespace de testes web.

1. Persiste intenção em `@trinca-mania/chapter-transaction-v1`, contendo mapa, estrelas anteriores e estrelas obtidas.
2. Persiste moedas e recibo de operação juntos na chave existente da campanha. O identificador determinístico inclui mapa e transição de estrelas; repetir a operação não concede outro prêmio.
3. Mescla as estrelas do capítulo na chave existente e separada dos capítulos.
4. Limpa a intenção gravando `null`. Se essa limpeza falhar, a próxima recuperação repete os passos com o recibo já salvo e não duplica moedas.

O boot deve chamar `recoverProgress()` antes de habilitar o jogo. Uma nova conclusão também recupera qualquer intenção anterior antes de iniciar outra. O handler usa `commitChapterCompletion(mapId, stars)`; não calcula o prêmio a partir de duas gravações independentes. A integração do App foi aplicada pelo agente responsável pela interface. O boot recupera primeiro a transação e só depois carrega os demais domínios, evitando reaplicar leituras anteriores a um reset recuperado.

O adaptador pode falhar antes de uma escrita ou depois de persistir sem confirmar: ambos os casos são recuperáveis. Uma escrita recusada antes da intenção não é uma vitória confirmada; a interface informa a falha e permite nova tentativa. Dados de intenção inválidos causam erro explícito, sem descarte silencioso.

`resetProgress()` invalida a geração imediatamente e entra na mesma fila. Persiste intenção de reset antes de limpar carteira e capítulos. Depois da carteira e dos capítulos, aguarda `resetOtherDomains()` antes de limpar a intenção: check-in, missões, desafio diário, vidas, bandeja, resgate mágico e os três tutoriais. O callback usa `Promise.allSettled` e rejeita se qualquer domínio falhar. Se houver interrupção entre quaisquer limpezas, o boot termina o reset; não ressuscita a recompensa anterior. Se a primeira escrita do reset falhar antes de persistir, o reset não foi aceito e precisa ser solicitado novamente.

A fila de `commitChapterProgress` passou a respeitar a mesma geração da campanha. As escritas de campanha/capítulos continuam passando pelos callbacks do hook; o coordenador só grava diretamente sua própria intenção. Vidas continuam sob seu proprietário: conclusões não as alteram; reset invoca a API existente de vidas pelo callback, sem gravação direta da chave pelo coordenador.

Recibos de capítulos deixam de ser descartados pelo limite genérico de 512 recibos. Isso impede que outras fontes de recompensas removam o recibo enquanto uma intenção aguarda recuperação. O espaço cresce com as transições de estrelas dos mapas, e o reset elimina os recibos junto do progresso.

## Validação executada

Com Node 22.23.2 e dependências locais, sem instalação/rebuild próprio:

```sh
node --test tests/browserStorageLease.test.cjs tests/chapterCompletionTransaction.test.cjs tests/persistenceHookTransaction.test.cjs tests/chapterProgress.test.cjs
```

**Resultado direcionado final: 70/70 passaram em 4,85 segundos.**

- 48 novos testes do coordenador: falhas antes/depois de cada uma das quatro escritas com e sem reload, repetição, concorrência de conclusões, melhoria de estrelas, reset em cada escrita, invalidação de operação em andamento e enfileirada, recibo após 600 outras operações, corrupção de journal, isolamento de adaptadores e as dez fronteiras/final dos capítulos. Inclui falha antes/depois de cada uma das nove operações secundárias de um callback de reset equivalente, seguido de reload; este teste valida o protocolo do callback, não os nove serializadores reais do App.
- 2 novos testes do hook usando os serializadores reais com AsyncStorage em memória: falha de carteira seguida de mutação independente e recuperação; escrita de capítulo em andamento/enfileirada seguida de reset.
- 5 novos testes da exclusão de abas: consumidores da mesma instância, disputa, liberação e retry, API ausente, escrita em andamento e fechamento durante aquisição. Usam um LockManager determinístico; a integração da API real no browser é verificada separadamente.
- 15 testes existentes de capítulos: separação de campanha, desbloqueio, monotonicidade, cadeia de 1000 mapas e fronteiras.

Os testes de injeção usam um armazenamento determinístico para posicionar falhas exatamente. Não simulam uma queda física do sistema operacional. O teste do hook usa hooks React mínimos, sem renderizador; valida callbacks, filas, serialização e refs. A integração visual/browser é validada pelo responsável por App/E2E.

Uma execução preliminar de typecheck ocorreu durante instalação concorrente e encontrou `Cannot find module 'expo'` em `index.ts`; uma tentativa preliminar do teste de App ocorreu enquanto `webHostBridge` ainda estava sendo criado por outro agente. Esses resultados são intermediários, não falhas atribuídas à transação. A validação final integrada deve usar os arquivos/dependências estabilizados.

## Limites e próximos testes

- O protocolo pressupõe gravação atômica de cada chave pelo adaptador, como a API de armazenamento utilizada. Não promete reparar JSON de carteira já corrompido externamente.
- O adaptador web persistente agora exige uma concessão exclusiva da Web Locks API durante toda a sessão. A segunda aba falha antes de ler/gravar e orienta fechar a primeira e tentar novamente. A mesma instância do adaptador compartilha a concessão entre seus consumidores. `pagehide` espera gravações iniciadas antes de liberar; restauração por BFCache recarrega para não usar snapshots antigos. Sem suporte à API/contexto seguro, o modo persistente não abre: orienta usar navegador atualizado/HTTPS ou Demonstração. Native e modos feira/dev não usam esse lock. Código antigo sem esse protocolo não participa da exclusão: duas versões diferentes abertas simultaneamente não são coordenadas.
- Testes browser devem confirmar UI de erro/retry, reload após falha e reset durante salvamento na exportação final, inclusive isolamento do modo visitante. Os testes de domínio não comprovam comportamento visual/native.
- No modo Demonstração/dev, storage e journal são intencionalmente apenas da sessão em memória; reload descarta tudo. A garantia de recuperação após reload aplica-se a native e ao modo web persistente.
- Os 1000 mapas não foram todos rejogados por browser nesta alteração. A cobertura de fronteiras testa recuperação/desbloqueio; simulações de tabuleiro e auditoria anterior são evidências distintas.

## Ordenação dos domínios auxiliares no reset

`trayBoostStorage` agora serializa a operação completa de leitura, normalização e gravação, incluindo compras, bônus, consumo e reset. Um refresh iniciado antes do reset termina antes dele e não pode restaurar espaços antigos depois. As operações internas não entram novamente na fila, evitando deadlock. Falhas de gravação propagam; o tratamento de JSON inválido não captura mais erros de armazenamento nem apaga um estado válido por esse motivo.

`magicTripleRescueStorage` serializa leitura, gravação e reset na mesma fila própria. O reset aguarda gravações já iniciadas; a leitura enfileirada depois observa o estado inicial. Ambas as filas continuam funcionando após rejeições, permitindo que a recuperação do journal repita os resets.

Validação adicional executada: `node --test tests/resetStorageOrdering.test.cjs tests/trayBoostStorage.test.cjs tests/magicTripleRescue.test.cjs`, **18/18 testes aprovados** (1,69 s), incluindo seis testes novos com operações bloqueadas, concorrência e falhas. ESLint dos três arquivos alterados passou. Essa ordenação cobre chamadas já iniciadas: consumidores ainda precisam respeitar os bloqueios de interface e as guardas de geração para não iniciar operações antigas depois do reset. Não torna uma compra de espaço e o débito da carteira uma transação entre domínios.
