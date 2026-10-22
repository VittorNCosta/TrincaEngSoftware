import type { PowerUpType } from '../../types/game';
type MissionPresentationSection = 'daily' | 'weekly';
type DailyCheckInDay = number;
type Locale = 'pt-BR' | 'en-US' | 'es-ES';

/**
 * Identificadores estáveis para automação black-box de Camada 3 (Maestro).
 *
 * Regra de entrada: um alvo só ganha `testID` quando o rótulo de acessibilidade **não serve** como
 * seletor — porque muda com o estado (contadores, "bloqueado", "LIBERANDO..."), porque se repete na
 * tela, ou porque o alvo não tem rótulo próprio. Onde o rótulo já é estável e único
 * (`Pausar jogo`, `Sair para o mapa`, `Reiniciar fase`), o E2E usa o rótulo e nada é adicionado.
 *
 * `testID` **não substitui** `accessibilityLabel`/`accessibilityRole`/`accessibilityState`: é
 * metadado adicional, invisível para o usuário e sem efeito em layout, hitbox ou z-order.
 *
 * Os segmentos dinâmicos usam identidade de domínio (`PowerUpType`, `level.id`, seção de missão)
 * — nunca índice de array, ordem visual, coordenada ou texto localizado. O id de instância de
 * missão (`mission-v1:<seed>:<slot>`) gira com o dia, então não vira seletor: a coleta é um
 * seletor fixo e o flow age sobre a próxima recompensa disponível.
 */

export type E2ETabKey = 'map' | 'shop' | 'missions' | 'profile';

/** Seletores fixos, sem segmento dinâmico. */
export const E2E_SELECTORS = {
  /** Recompensa cosmética e sua miniatura, sem controle interativo próprio. */
  candyFinalReward: 'candy-final-reward',
  candyTrayPreview: 'candy-tray-preview',
  /** Dica variável de Receita/Jogadas, sem rótulo próprio ou controle interativo. */
  candyObjectiveCoachmark: 'candy-objective-coachmark',
  /** A mensagem muda por mob; backdrop e X da ajuda compartilham rótulo. */
  candyMobCoachmark: 'candy-mob-coachmark',
  candyMobHelpOutside: 'candy-mob-help-outside',
  candyMobHelpClose: 'candy-mob-help-close',
  /** Resultado e bandeja final: o conteúdo varia com a causa e as peças da derrota. */
  defeatSummary: 'defeat-summary',
  defeatTray: 'defeat-tray',
  /** Fechar o check-in diário. O backdrop e o X compartilham o mesmo rótulo. */
  dailyCheckInDismiss: 'daily-check-in.dismiss',
  dailyCheckInModal: 'daily-check-in-modal',
  dailyCheckInHeader: 'daily-check-in-header',
  dailyCheckInContent: 'daily-check-in-content',
  dailyCheckInJourney: 'daily-check-in-journey',
  dailyCheckInActions: 'daily-check-in-actions',
  dailyCheckInClaim: 'daily-check-in-claim',
  bossPanel: 'boss-panel',
  /** Não é único por elemento: marca todo CTA de coleta pronto. Ver nota do módulo. */
  missionsClaimCta: 'missions.claim',
  missionsUnlockCta: 'missions.unlock-cta',
  profilePowersEntry: 'profile.powers',
  shopSafeContent: 'shop-safe-content',
  shopHeader: 'shop-header',
  shopBack: 'shop-back',
  shopContent: 'shop-content',
  shopMerchant: 'shop-merchant',
  shopOffers: 'shop-offers',
  shopTrayPlus: 'shop-tray-plus',
  shopTrayMax: 'shop-tray-max',
  settingsDevModeToggle: 'settings.dev-mode-toggle',
  settingsPhaseQaPicker: 'settings.phase-qa-picker',
  settingsQaRevealTrigger: 'settings.qa-reveal-trigger',
  tutorialMysteryCta: 'tutorial.mystery-cta',
  tutorialPrimaryCta: 'tutorial.primary-cta',
} as const;

export type E2ESelector = (typeof E2E_SELECTORS)[keyof typeof E2E_SELECTORS];

/** Aba da navegação inferior. A label muda com bloqueio e badge de recompensa. */
export const navTabTestId = (tab: E2ETabKey) => `nav.${tab}`;

export const languageOptionTestId = (locale: Locale) =>
  `settings.language.${locale}`;

/** Nó de fase no mapa. A label carrega a contagem de estrelas, que muda com o progresso. */
export const mapLevelTestId = (levelId: string) => `map.level.${levelId}`;

/** Dia do ciclo de check-in. O estado e a recompensa mudam sem trocar sua identidade. */
export const dailyCheckInDayTestId = (day: DailyCheckInDay) =>
  `daily-check-in.day-${day}`;

/** Cartão de produto da loja. A label carrega a quantidade em inventário. */
export const shopProductTestId = (power: PowerUpType) =>
  `shop.product.${power}`;

/** CTA de compra da loja. A label carrega preço e quantidade. */
export const shopBuyTestId = (power: PowerUpType) => `shop.buy.${power}`;

export const shopSelectTestId = (power: PowerUpType) => `shop.select.${power}`;
export const shopPriceTestId = (power: PowerUpType) => `shop.price.${power}`;
export const shopFeedbackTestId = (power: PowerUpType) =>
  `shop.feedback.${power}`;

/** Botão "Como usar" de cada poder em Perfil › Poderes. A label carrega o título do produto. */
export const powersTutorialTestId = (power: PowerUpType) =>
  `powers.tutorial.${power}`;

/** Aba de missões. A label carrega a contagem de missões prontas. */
export const missionsTabTestId = (section: MissionPresentationSection) =>
  `missions.tab.${section}`;

/** Poder na gaveta durante a partida. A label carrega o texto de disponibilidade. */
export const gamePowerTestId = (power: PowerUpType) => `game.power.${power}`;
