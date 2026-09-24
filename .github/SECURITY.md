# Política de segurança

TrincaMania é um jogo offline de coleta seletiva (ODS 12). Ele não tem
servidor, não tem conta de usuário e não envia dados para lugar nenhum: todo o
progresso do jogador fica em `AsyncStorage`, no próprio aparelho.

Isso reduz bastante a superfície, mas não a zera. O que ainda importa aqui:

- credencial que vaze no repositório — `EXPO_TOKEN`, keystore de assinatura
  Android, chave de serviço da Play Store;
- dependência comprometida na cadeia do npm, que entraria no APK publicado;
- adulteração do save local que dê vantagem ou corrompa o progresso de quem
  joga.

## Versões cobertas

O jogo ainda não foi publicado. Até a `v1.0.0` sair na Play Store, só a branch
padrão (`develop`) recebe correção.

| Versão            | Cobertura           |
| ----------------- | ------------------- |
| `develop` (atual) | ✅                  |
| Pré-`v1.0.0`      | ❌ sem retrocorreção |

## Como relatar

**Não abra issue pública para vulnerabilidade.** O backlog deste repositório é
público e uma issue aberta é uma divulgação.

Use o canal privado do GitHub: aba **Security** → **Report a vulnerability**
(_private vulnerability reporting_). O relato chega só para quem mantém o
repositório e vira um advisory privado, com espaço para discutir a correção
antes de qualquer publicação.

Se o botão não aparecer, é porque o recurso ainda não foi habilitado em
Settings → Advanced Security → Private vulnerability reporting; abra uma issue
pública dizendo apenas _"preciso de um canal privado"_, sem detalhe técnico,
que o canal é ligado e o relato segue por lá.

Ao relatar, ajuda muito incluir: o que dá para fazer com a falha, o passo a
passo mínimo para reproduzir, e a versão ou o commit onde você viu.

## O que esperar

- **Confirmação de recebimento:** até 5 dias corridos.
- **Diagnóstico inicial** (é falha mesmo? qual o alcance?): até 15 dias.
- **Correção:** conforme a gravidade. Nada com prazo prometido — este é um
  projeto de uma pessoa só, e prometer SLA que não se cumpre é pior que não
  prometer.

A divulgação é coordenada: o advisory é publicado depois que a correção estiver
disponível, com crédito a quem relatou, salvo se você preferir anonimato.

## O que já é automatizado

Estas verificações rodam sozinhas e estão descritas em
`.github/workflows/seguranca.yml`:

| Verificação                     | Quando                                  |
| ------------------------------- | --------------------------------------- |
| CodeQL (`security-and-quality`) | todo push, todo PR, e semanalmente       |
| `gitleaks` no histórico inteiro | todo push, todo PR, e semanalmente       |
| Livro-razão de advisories npm   | todo push, todo PR, e semanalmente       |
| `dependency-review`             | em PR, barra dependência nova com falha alta |
| Dependabot (npm e actions)      | semanalmente, agrupado por tipo          |

O livro-razão (`scripts/auditoria-baseline.json`) existe porque a cadeia do
Expo tem vulnerabilidades conhecidas sem correção disponível. Ele reprova
advisory **novo** e reprova entrada que sumiu — a dívida tem que encolher de
verdade, e não pode crescer em silêncio.
