import { CardRole } from './CardRole';
import { MaterialType } from './MaterialType';

/**
 * Value Object: a carta concreta que aparece no tabuleiro.
 *
 * Uma carta é identificada por (material, papel, variante). A variante existe
 * só para dar variedade visual dentro do mesmo papel — três resíduos de
 * plástico diferentes (garrafa PET, sacola, copo) continuam sendo "resíduo de
 * plástico" para efeito de pareamento. Isso é intencional: ensina que objetos
 * diferentes podem pertencer ao mesmo material.
 */
export type RecyclingCard = {
  /** Identificador estável, no formato `material:papel:variante`. */
  id: string;
  emoji: string;
  label: string;
  material: MaterialType;
  role: CardRole;
  variant: string;
};

const card = (
  material: MaterialType,
  role: CardRole,
  variant: string,
  emoji: string,
  label: string,
): RecyclingCard => ({
  id: `${material}:${role}:${variant}`,
  emoji,
  label,
  material,
  role,
  variant,
});

/**
 * Resíduos por material. Cada entrada é uma variante visual do papel `residuo`.
 */
const RESIDUE_CARDS: RecyclingCard[] = [
  card('plastico', 'residuo', 'garrafa-pet', '\u{1F9F4}', 'Garrafa PET'),
  card('plastico', 'residuo', 'sacola', '\u{1F6CD}\u{FE0F}', 'Sacola plástica'),
  card('plastico', 'residuo', 'copo', '\u{1F964}', 'Copo plástico'),

  card('papel', 'residuo', 'jornal', '\u{1F4F0}', 'Jornal'),
  card('papel', 'residuo', 'caixa', '\u{1F4E6}', 'Caixa de papelão'),
  card('papel', 'residuo', 'folha', '\u{1F4C4}', 'Folha de papel'),

  card('vidro', 'residuo', 'garrafa', '\u{1F376}', 'Garrafa de vidro'),
  card('vidro', 'residuo', 'pote', '\u{1FAD9}', 'Pote de vidro'),
  card('vidro', 'residuo', 'frasco', '\u{1F9EA}', 'Frasco de vidro'),

  card('metal', 'residuo', 'lata-alimento', '\u{1F96B}', 'Lata de alimento'),
  card('metal', 'residuo', 'lata-aluminio', '\u{1F37A}', 'Lata de alumínio'),
  card('metal', 'residuo', 'peca', '\u{1F529}', 'Peça metálica'),

  card('organico', 'residuo', 'casca-banana', '\u{1F34C}', 'Casca de banana'),
  card('organico', 'residuo', 'restos', '\u{1F34E}', 'Restos de fruta'),
  card('organico', 'residuo', 'folhas', '\u{1F96C}', 'Restos de verdura'),
];

/**
 * Lixeira e símbolo têm uma carta única por material — são o "destino certo"
 * e o "resultado" daquele material, então não faz sentido variar.
 */
const BIN_CARDS: RecyclingCard[] = [
  card('plastico', 'lixeira', 'padrao', '\u{1F7E5}', 'Lixeira vermelha'),
  card('papel', 'lixeira', 'padrao', '\u{1F7E6}', 'Lixeira azul'),
  card('vidro', 'lixeira', 'padrao', '\u{1F7E9}', 'Lixeira verde'),
  card('metal', 'lixeira', 'padrao', '\u{1F7E8}', 'Lixeira amarela'),
  card('organico', 'lixeira', 'padrao', '\u{1F7EB}', 'Lixeira marrom'),
];

const SYMBOL_CARDS: RecyclingCard[] = [
  card('plastico', 'simbolo', 'padrao', '\u{267B}\u{FE0F}', 'Plástico reciclado'),
  card('papel', 'simbolo', 'padrao', '\u{267B}\u{FE0F}', 'Papel reciclado'),
  card('vidro', 'simbolo', 'padrao', '\u{267B}\u{FE0F}', 'Vidro reciclado'),
  card('metal', 'simbolo', 'padrao', '\u{267B}\u{FE0F}', 'Metal reciclado'),
  card('organico', 'simbolo', 'padrao', '\u{267B}\u{FE0F}', 'Orgânico compostado'),
];

export const RECYCLING_CARDS: RecyclingCard[] = [
  ...RESIDUE_CARDS,
  ...BIN_CARDS,
  ...SYMBOL_CARDS,
];

const CARDS_BY_ID = new Map(RECYCLING_CARDS.map((entry) => [entry.id, entry]));

const CARDS_BY_MATERIAL_ROLE = RECYCLING_CARDS.reduce<Map<string, RecyclingCard[]>>(
  (index, entry) => {
    const key = `${entry.material}:${entry.role}`;
    index.set(key, [...(index.get(key) ?? []), entry]);

    return index;
  },
  new Map<string, RecyclingCard[]>(),
);

export const getCardById = (cardId: string): RecyclingCard | undefined =>
  CARDS_BY_ID.get(cardId);

export const getCardsFor = (material: MaterialType, role: CardRole): RecyclingCard[] =>
  CARDS_BY_MATERIAL_ROLE.get(`${material}:${role}`) ?? [];

/**
 * Escolhe uma variante de forma determinística a partir de um índice, para que
 * o mesmo tabuleiro gere sempre a mesma arte (importante para o embaralhar não
 * reescrever a tela inteira).
 */
export const getCardVariantAt = (
  material: MaterialType,
  role: CardRole,
  variantIndex: number,
): RecyclingCard => {
  const candidates = getCardsFor(material, role);
  const safeIndex = Math.abs(Math.floor(variantIndex)) % Math.max(1, candidates.length);

  return candidates[safeIndex] ?? candidates[0];
};
