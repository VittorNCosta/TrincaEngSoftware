/**
 * Value Object: papel da carta dentro do ciclo da reciclagem.
 *
 * O ciclo que o jogador aprende é sempre o mesmo:
 *
 *   resíduo  →  lixeira correta  →  reciclagem
 *
 * Uma trinca só fecha quando o jogador reúne os três papéis do MESMO material.
 * É essa regra que carrega o conteúdo do ODS 12: não basta reconhecer o
 * objeto, é preciso saber onde descartar e o que acontece depois.
 */
export type CardRole = 'residuo' | 'lixeira' | 'simbolo';

export type CardRoleDefinition = {
  id: CardRole;
  label: string;
  /** Posição no ciclo (1, 2, 3) — usada para ordenar a bandeja e o tutorial. */
  step: 1 | 2 | 3;
  shortLabel: string;
};

export const CARD_ROLES: Record<CardRole, CardRoleDefinition> = {
  residuo: {
    id: 'residuo',
    label: 'Resíduo descartado',
    step: 1,
    shortLabel: 'Resíduo',
  },
  lixeira: {
    id: 'lixeira',
    label: 'Lixeira da coleta seletiva',
    step: 2,
    shortLabel: 'Lixeira',
  },
  simbolo: {
    id: 'simbolo',
    label: 'Reciclagem concluída',
    step: 3,
    shortLabel: 'Reciclagem',
  },
};

/** Ordem canônica do ciclo. A trinca é exatamente este conjunto. */
export const CARD_ROLE_CYCLE: CardRole[] = ['residuo', 'lixeira', 'simbolo'];

export const TRIPLE_SIZE = CARD_ROLE_CYCLE.length;

export const isCardRole = (value: string): value is CardRole =>
  CARD_ROLE_CYCLE.includes(value as CardRole);

export const getCardRole = (role: CardRole): CardRoleDefinition =>
  CARD_ROLES[role];

export const compareRolesByCycleStep = (
  firstRole: CardRole,
  secondRole: CardRole,
) => CARD_ROLES[firstRole].step - CARD_ROLES[secondRole].step;
