/**
 * Aleatoriedade determinística.
 *
 * Mapas de capítulo precisam ser sempre o mesmo tabuleiro: o jogador que
 * reabre o mapa 47 do capítulo 3 tem que reencontrar a mesma disposição de
 * peças. `Math.random` não serve para isso. Aqui ficam as duas primitivas que
 * transformam um id de texto em um gerador reproduzível.
 *
 * As duas funções são puras e não dependem de plataforma — rodam igual no
 * Hermes (Android/iOS), no JSC e no Node dos testes.
 */

/**
 * Hash FNV-1a de 32 bits.
 *
 * Escolhido por ser estável entre execuções e implementações (ao contrário de
 * qualquer hash que dependa de ordem de iteração de objeto) e por caber em
 * `Math.imul`, que o Hermes otimiza para inteiro de 32 bits.
 */
export const stableHash = (value: string): number => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
};

/**
 * Combina duas sementes sem perder entropia — usado para derivar sementes
 * independentes (tabuleiro, arte, variante de carta) do mesmo id de mapa.
 */
export const mixSeed = (seed: number, salt: number): number => {
  let mixed = (seed ^ Math.imul(salt + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35) >>> 0;

  return (mixed ^ (mixed >>> 16)) >>> 0;
};

/**
 * PRNG mulberry32: 32 bits de estado, distribuição uniforme suficiente para
 * embaralhar peças e escolher paletas. Retorna sempre a mesma sequência para a
 * mesma semente.
 */
export const createSeededRandom = (seed: number): (() => number) => {
  let state = (seed >>> 0) || 0x9e3779b9;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};
