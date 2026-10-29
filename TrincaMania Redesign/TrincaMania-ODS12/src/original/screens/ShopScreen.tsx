import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  ImageBackground,
  StyleSheet,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg } from '../messages';
import { useBottomNavClearance } from '../components/BottomNavBar';
import { GameIcon } from '../components/GameIcon';
import { ForestFrame } from '../components/ForestFrame';
import { PowerIcon } from '../components/PowerIcon';
import { RewardAssetIcon } from '../components/RewardAssetIcon';
import { RAVI_SHOP_ASSETS, SHOP_ASSETS } from '../data/shopAssets';
import { LivesState, formatLifeTimer } from '../../storage/livesStorage';
import {
  colors,
  fontSizes,
  forestPolish,
  radii,
  shadows,
  spacing,
  touchTargets,
} from '../styles/theme';
import { PowerUpType, ProgressState, WorldId } from '../../types/game';
import {
  shopFeedbackTestId,
  shopPriceTestId,
  shopProductTestId,
  shopSelectTestId,
} from '../utils/e2eSelectors';
import {
  getShopLayout,
  getShopProducts,
  getShopReaction,
  requestShopPurchase,
  SHOP_REACTION_DURATION_MS,
  ShopPurchaseCallback,
  ShopPurchaseLock,
} from '../utils/shopPresentation';
import { playShopBuySound } from '../../utils/sounds';
type ShopScreenProps = {
  backTitle?: string;
  progress: ProgressState;
  worldId?: WorldId;
  onBack: () => void;
  onPurchasePowerUp: ShopPurchaseCallback;
  livesState: LivesState;
  timeUntilNextLifeMs: number;
  reserveBottomNavSpace?: boolean;
  isActive?: boolean;
};
export function ShopScreen({
  backTitle = 'Voltar',
  progress,
  onBack,
  onPurchasePowerUp,
  livesState,
  timeUntilNextLifeMs,
  reserveBottomNavSpace = false,
  isActive = true,
}: ShopScreenProps) {
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomNavClearance = useBottomNavClearance();
  const bottomClearance = reserveBottomNavSpace
    ? bottomNavClearance
    : insets.bottom;
  const [contentWidth, setContentWidth] = useState(0);
  const layout = getShopLayout(contentWidth, fontScale);
  const products = getShopProducts(progress, () => true);
  const [selectedPower, setSelectedPower] = useState<PowerUpType | null>(null);
  const [reaction, setReaction] = useState(() => getShopReaction('entry'));
  const [pendingPower, setPendingPower] = useState<PowerUpType | null>(null);
  const purchaseLock = useRef<ShopPurchaseLock>({ pending: null });
  const lifetime = useRef({ active: false, generation: 0 });
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    const currentLifetime = lifetime.current;
    currentLifetime.active = isActive;
    lifetime.current.generation += 1;
    setSelectedPower(null);
    setPendingPower(purchaseLock.current.pending);
    setReaction(getShopReaction('entry'));
    if (isActive) scrollRef.current?.scrollTo({ y: 0, animated: false });
    return () => {
      currentLifetime.active = false;
      currentLifetime.generation += 1;
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
    };
  }, [isActive]);
  const selectProduct = (power: PowerUpType) => {
    if (!lifetime.current.active || purchaseLock.current.pending) return;
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    setSelectedPower(power);
    setReaction(getShopReaction('select', power));
  };
  const buyProduct = async (power: PowerUpType) => {
    if (!lifetime.current.active || purchaseLock.current.pending) return;
    selectProduct(power);
    const generation = lifetime.current.generation;
    const purchase = requestShopPurchase(
      purchaseLock.current,
      power,
      progress.coins,
      onPurchasePowerUp,
    );
    setPendingPower(purchaseLock.current.pending);
    const result = await purchase;
    if (!lifetime.current.active) return;
    setPendingPower(purchaseLock.current.pending);
    if (generation !== lifetime.current.generation) return;
    if (result.status === 'busy') return;
    setReaction(
      getShopReaction(
        result.status,
        power,
        result.status === 'insufficient' ? result.shortfall : 0,
      ),
    );
    if (result.status === 'purchased') playShopBuySound();
    reactionTimer.current = setTimeout(() => {
      if (
        !lifetime.current.active ||
        generation !== lifetime.current.generation
      )
        return;
      setReaction(getShopReaction('entry'));
      setSelectedPower(null);
    }, SHOP_REACTION_DURATION_MS);
  };
  const stackedOffers = layout.offerColumns === 1;
  const raviArtWidth = layout.merchantWidth * 1.3;
  const handleContentLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setContentWidth((current) =>
      Math.abs(current - nextWidth) < 0.5 ? current : nextWidth,
    );
  };
  if (!isActive) return null;
  const wallet = (
    <View
      style={[styles.wallet, layout.stackHeader ? styles.walletStacked : null]}
    >
      <View
        accessible
        accessibilityLabel={msg('{param1} moedas', {
          param1: String(progress.coins),
        })}
        style={[styles.balance, styles.balanceCoin]}
      >
        <RewardAssetIcon name="coin" size={26} />
        <View>
          <Text style={styles.walletLabel}>{msg('SEU SALDO')}</Text>
          <Text testID="shop-coins" style={styles.coins}>
            {progress.coins}
          </Text>
        </View>
      </View>
      <View
        accessible
        accessibilityLabel={msg('{param1} de {param2} vidas{param3}', {
          param1: String(livesState.currentLives),
          param2: String(livesState.maxLives),
          param3: String(
            livesState.currentLives < livesState.maxLives
              ? msg(', próxima vida em ') + formatLifeTimer(timeUntilNextLifeMs)
              : '',
          ),
        })}
        style={styles.balance}
      >
        <GameIcon name="heart" size={16} tone="pink" variant="plain" />
        <Text style={styles.lives}>
          {livesState.currentLives}/{livesState.maxLives}
          {livesState.currentLives < livesState.maxLives
            ? ` · ${formatLifeTimer(timeUntilNextLifeMs)}`
            : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={SHOP_ASSETS.background}
      resizeMode="cover"
      style={styles.background}
    >
      <LinearGradient
        colors={[
          'rgba(255, 244, 211, 0.12)',
          'rgba(41, 60, 20, 0.16)',
          'rgba(44, 28, 16, 0.55)',
        ]}
        locations={[0, 0.6, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.safeContent,
          {
            paddingTop: insets.top,
            paddingBottom: bottomClearance,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
        testID="shop-safe-content"
      >
        <View style={styles.market}>
          <View style={styles.header} testID="shop-header">
            <ForestFrame />
            <View style={styles.headerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={backTitle}
                onPress={onBack}
                style={({ pressed }) => [
                  styles.back,
                  pressed ? styles.pressed : null,
                ]}
                testID="shop-back"
              >
                <GameIcon name="back" size={22} tone="gold" variant="plain" />
              </Pressable>
              <View style={styles.headerTitle}>
                <Text style={styles.eyebrow}>{msg('MERCADO DO RAVI')}</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  {msg('LOJA')}
                </Text>
              </View>
              {!layout.stackHeader ? wallet : null}
            </View>
            {layout.stackHeader ? wallet : null}
          </View>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            overScrollMode="never"
            style={styles.contentScroll}
            testID="shop-content"
          >
            <View style={styles.content}>
              <LinearGradient
                colors={['#FFF4D8', '#F6DC9D', '#D9B779']}
                style={[
                  styles.merchant,
                  layout.stackMerchant ? styles.merchantStacked : null,
                ]}
                testID="shop-merchant"
              >
                <View
                  pointerEvents="none"
                  style={[
                    styles.raviWindow,
                    {
                      width: layout.merchantWidth,
                      height: layout.merchantHeight,
                    },
                  ]}
                >
                  <Image
                    accessible={false}
                    source={RAVI_SHOP_ASSETS[reaction.expression]}
                    resizeMode="contain"
                    style={{ width: raviArtWidth, height: raviArtWidth / 0.75 }}
                  />
                </View>
                <View
                  style={[
                    styles.speechSign,
                    layout.stackMerchant ? styles.speechSignStacked : null,
                  ]}
                >
                  {!layout.stackMerchant ? (
                    <View pointerEvents="none" style={styles.speechNotch} />
                  ) : null}
                  <Text style={styles.speechEyebrow}>
                    {msg('O MERCADO DO RAVI')}
                  </Text>
                  <Text style={styles.merchantTitle}>
                    {msg('Equipe sua próxima aventura')}
                  </Text>
                  <Text
                    accessibilityLiveRegion={
                      reaction.feedbackTone ? 'none' : 'polite'
                    }
                    style={styles.speech}
                  >
                    {reaction.message}
                  </Text>
                </View>
              </LinearGradient>

              <View style={styles.offerSection} testID="shop-offers">
                <View style={styles.sectionHeading}>
                  <Text accessibilityRole="header" style={styles.sectionTitle}>
                    {msg('Poderes')}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {msg('Ajuda para usar na hora certa')}
                  </Text>
                </View>
                <View
                  onLayout={handleContentLayout}
                  style={[
                    styles.products,
                    stackedOffers ? styles.productsStacked : null,
                  ]}
                >
                  {[...products].reverse().map((product) => {
                    const selected = selectedPower === product.power;
                    const pending = pendingPower !== null;
                    const shortfall = Math.max(
                      0,
                      product.price - progress.coins,
                    );
                    const featured = product.power === 'hint' && !stackedOffers;
                    return (
                      <View
                        key={product.power}
                        style={[
                          styles.offerCard,
                          {
                            width: featured
                              ? '100%'
                              : layout.offerWidth || '100%',
                          },
                          featured ? styles.offerCardFeatured : null,
                          selected ? styles.offerCardSelected : null,
                        ]}
                        testID={shopProductTestId(product.power)}
                      >
                        {featured ? (
                          <View
                            pointerEvents="none"
                            style={styles.featuredEdge}
                          />
                        ) : null}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={msg(
                            '{param1}. {param2} {param3} moedas. Você possui {param4}. {param5}',
                            {
                              param1: String(product.title),
                              param2: String(product.description),
                              param3: String(product.price),
                              param4: String(product.quantity),
                              param5: String(
                                !product.unlocked
                                  ? msg(
                                      'Bloqueado. Avance na campanha para liberar.',
                                    )
                                  : shortfall > 0
                                    ? msg('Faltam {param1} moedas.', {
                                        param1: String(shortfall),
                                      })
                                    : msg('Disponível para comprar.'),
                              ),
                            },
                          )}
                          accessibilityHint={msg(
                            'Selecionar mercadoria e ouvir Ravi',
                          )}
                          accessibilityState={{ selected, disabled: pending }}
                          disabled={pending}
                          onPress={() => selectProduct(product.power)}
                          style={[
                            styles.offerMain,
                            stackedOffers || featured
                              ? styles.offerMainHorizontal
                              : null,
                          ]}
                          testID={shopSelectTestId(product.power)}
                        >
                          <View
                            accessible={false}
                            importantForAccessibility="no-hide-descendants"
                            style={[
                              styles.productArtwork,
                              {
                                width: layout.productSize,
                                height: layout.productSize,
                              },
                            ]}
                          >
                            {selected ? (
                              <Image
                                source={SHOP_ASSETS.glow}
                                resizeMode="contain"
                                style={StyleSheet.absoluteFill}
                              />
                            ) : null}
                            <PowerIcon
                              name={product.power}
                              size={Math.min(
                                72,
                                Math.round(layout.productSize * 0.8),
                              )}
                            />
                            {selected && !pending && reaction.showPlusOne ? (
                              <Text style={styles.plusOne}>+1</Text>
                            ) : null}
                          </View>
                          <View
                            style={[
                              styles.offerCopy,
                              stackedOffers || featured
                                ? styles.offerCopyHorizontal
                                : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.productName,
                                featured ? styles.featuredCopy : null,
                              ]}
                            >
                              {product.title}
                            </Text>
                            <Text
                              style={[
                                styles.productDescription,
                                featured ? styles.featuredCopy : null,
                              ]}
                            >
                              {product.description}
                            </Text>
                            <Text
                              style={[
                                styles.quantity,
                                product.quantity === 0
                                  ? styles.quantityEmpty
                                  : null,
                              ]}
                            >
                              {msg('Você tem: ')}
                              <Text testID={`shop-stock-${product.power}`}>
                                {product.quantity}
                              </Text>
                            </Text>
                          </View>
                        </Pressable>
                        <View style={styles.offerFooter}>
                          <View
                            style={[
                              styles.checkout,
                              stackedOffers || featured
                                ? styles.checkoutHorizontal
                                : null,
                            ]}
                          >
                            <View
                              accessible
                              accessibilityLabel={msg('{param1} moedas', {
                                param1: String(product.price),
                              })}
                              style={[
                                styles.pricePill,
                                shortfall > 0
                                  ? styles.pricePillShortfall
                                  : null,
                                stackedOffers || featured
                                  ? styles.checkoutCell
                                  : null,
                              ]}
                              testID={shopPriceTestId(product.power)}
                            >
                              <RewardAssetIcon name="coin" size={24} />
                              <Text style={styles.price}>{product.price}</Text>
                            </View>
                            {shortfall === 0 ||
                            !product.unlocked ||
                            pendingPower === product.power ? (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={msg(
                                  'Comprar {param1} por {param2} moedas. Você possui {param3}. {param4}',
                                  {
                                    param1: String(product.title),
                                    param2: String(product.price),
                                    param3: String(product.quantity),
                                    param4: String(
                                      !product.unlocked
                                        ? msg(
                                            'Bloqueado. Avance na campanha para liberar.',
                                          )
                                        : shortfall > 0
                                          ? msg('Faltam {param1} moedas.', {
                                              param1: String(shortfall),
                                            })
                                          : msg('Disponível.'),
                                    ),
                                  },
                                )}
                                accessibilityState={{
                                  disabled: pending || !product.unlocked,
                                  busy: pendingPower === product.power,
                                }}
                                disabled={pending || !product.unlocked}
                                onPress={() => {
                                  void buyProduct(product.power);
                                }}
                                style={({ pressed }) => [
                                  styles.buy,
                                  { minHeight: layout.buyTargetHeight },
                                  stackedOffers || featured
                                    ? [
                                        styles.checkoutCell,
                                        styles.checkoutAction,
                                      ]
                                    : null,
                                  pending || !product.unlocked
                                    ? styles.disabled
                                    : null,
                                  pressed ? styles.pressed : null,
                                ]}
                                testID={`shop-buy-${product.power}`}
                              >
                                <View
                                  pointerEvents="none"
                                  style={styles.buttonHighlight}
                                />
                                <Text
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.8}
                                  numberOfLines={1}
                                  style={styles.buyLabel}
                                >
                                  {!product.unlocked
                                    ? msg('BLOQUEADO')
                                    : pendingPower === product.power
                                      ? msg('AGUARDE…')
                                      : msg('COMPRAR')}
                                </Text>
                              </Pressable>
                            ) : null}
                          </View>
                          {selected && !pending && reaction.feedbackTone ? (
                            <Text
                              accessibilityLiveRegion="polite"
                              style={[
                                styles.purchaseFeedback,
                                reaction.expression === 'insufficient'
                                  ? styles.purchaseShortfall
                                  : reaction.feedbackTone === 'error'
                                    ? styles.purchaseError
                                    : null,
                              ]}
                              testID={shopFeedbackTestId(product.power)}
                            >
                              {reaction.message}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.profileFoliage },
  safeContent: { flex: 1 },
  market: { alignSelf: 'center', flex: 1, maxWidth: 480, width: '100%' },
  header: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    flexShrink: 0,
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: {
    minWidth: touchTargets.minimum,
    minHeight: touchTargets.minimum,
    backgroundColor: forestPolish.cream,
    borderColor: forestPolish.bark,
    borderBottomWidth: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: colors.gold,
    fontSize: fontSizes.sm,
    fontWeight: '800',
  },
  title: {
    color: forestPolish.cream,
    fontSize: 28,
    fontWeight: '900',
    textShadowColor: forestPolish.woodDark,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  wallet: { alignItems: 'flex-end', flexShrink: 1, gap: 3, maxWidth: '42%' },
  walletStacked: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
  },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: spacing.xs,
    backgroundColor: colors.creamLight,
    borderColor: forestPolish.gold,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  balanceCoin: {
    backgroundColor: '#FFF4D5',
    borderColor: '#E9B94D',
    borderWidth: 2,
  },
  walletLabel: {
    color: forestPolish.wood,
    fontSize: fontSizes.caption,
    fontWeight: '900',
  },
  coins: {
    color: forestPolish.woodDark,
    flexShrink: 1,
    fontSize: fontSizes.lg,
    fontWeight: '900',
  },
  lives: {
    color: forestPolish.woodDark,
    flexShrink: 1,
    fontSize: fontSizes.sm,
    fontWeight: '800',
  },
  contentScroll: { flex: 1, minHeight: 0 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  content: { gap: spacing.lg },
  merchant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderColor: forestPolish.bark,
    borderBottomColor: forestPolish.wood,
    borderBottomWidth: 4,
    borderRadius: radii.menuCard,
    borderWidth: 2,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    ...shadows.card,
  },
  merchantStacked: { flexDirection: 'column', gap: spacing.sm },
  raviWindow: { overflow: 'hidden' },
  speechSign: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
    backgroundColor: 'rgba(255, 248, 232, 0.9)',
    borderColor: '#DEC38C',
    borderRadius: radii.menuControl,
    borderWidth: 1,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    position: 'relative',
  },
  speechSignStacked: { flex: 0, width: '100%' },
  speechNotch: {
    backgroundColor: '#FFF8E8',
    borderBottomColor: '#DEC38C',
    borderBottomWidth: 1,
    borderLeftColor: '#DEC38C',
    borderLeftWidth: 1,
    height: 10,
    left: -6,
    position: 'absolute',
    top: 20,
    transform: [{ rotate: '45deg' }],
    width: 10,
  },
  speechEyebrow: {
    color: forestPolish.moss,
    fontSize: fontSizes.caption,
    fontWeight: '900',
    letterSpacing: 1,
  },
  merchantTitle: {
    color: forestPolish.woodDark,
    fontSize: fontSizes.lg,
    fontWeight: '900',
  },
  speech: {
    color: forestPolish.wood,
    fontWeight: '800',
    fontSize: fontSizes.sm,
  },
  offerSection: { gap: spacing.md, paddingHorizontal: spacing.xs + 2 },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    backgroundColor: forestPolish.wood,
    borderColor: forestPolish.bark,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.creamLight,
    fontSize: fontSizes.md,
    fontWeight: '900',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  sectionSubtitle: {
    color: forestPolish.woodDark,
    backgroundColor: 'rgba(255, 248, 232, 0.94)',
    borderRadius: radii.pill,
    flexShrink: 1,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  traySectionSubtitle: {
    backgroundColor: 'transparent',
    color: forestPolish.wood,
  },
  products: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  productsStacked: { flexDirection: 'column' },
  offerCard: {
    backgroundColor: colors.creamLight,
    borderColor: forestPolish.bark,
    borderBottomColor: forestPolish.wood,
    borderBottomWidth: 4,
    borderRadius: radii.menuCard,
    borderWidth: 2,
    overflow: 'hidden',
    ...shadows.menuCard,
  },
  offerCardSelected: { borderColor: forestPolish.leaf },
  offerCardFeatured: { backgroundColor: '#FFF2D4', borderColor: '#D8A348' },
  featuredEdge: {
    backgroundColor: forestPolish.gold,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  offerMain: { alignItems: 'center', flex: 1, gap: spacing.sm, padding: 10 },
  // Keep intrinsic height: flex: 0 alone collapses the row to its padding on web.
  offerMainHorizontal: {
    flexDirection: 'row',
    flex: 0,
    flexBasis: 'auto',
    flexShrink: 0,
  },
  productArtwork: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF2D6',
    borderColor: '#BDD392',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  offerCopy: { alignSelf: 'stretch', gap: spacing.xs },
  offerCopyHorizontal: { alignSelf: 'center', flex: 1, minWidth: 0 },
  featuredCopy: { textAlign: 'left' },
  productName: {
    textAlign: 'center',
    color: forestPolish.woodDark,
    fontWeight: '900',
    fontSize: fontSizes.lg,
  },
  quantity: {
    color: forestPolish.moss,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  quantityEmpty: { color: forestPolish.wood },
  productDescription: {
    color: forestPolish.wood,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  offerFooter: {
    borderTopColor: '#E5D2A7',
    borderTopWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  checkout: { gap: spacing.sm },
  checkoutHorizontal: { alignItems: 'center', flexDirection: 'row' },
  checkoutCell: { flex: 1, minWidth: 0 },
  checkoutAction: { flexGrow: 1.2 },
  pricePill: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8A4',
    borderColor: '#D7A84B',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  pricePillShortfall: { backgroundColor: colors.warningSoft },
  price: {
    color: forestPolish.woodDark,
    flexShrink: 1,
    fontSize: fontSizes.xl,
    fontWeight: '900',
  },
  buy: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#257D4D',
    borderColor: forestPolish.leaf,
    borderBottomColor: forestPolish.woodDark,
    borderBottomWidth: 4,
    borderWidth: 1,
    borderRadius: radii.button,
    overflow: 'hidden',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  buttonHighlight: {
    position: 'absolute',
    left: spacing.xs,
    right: spacing.xs,
    top: spacing.xs,
    height: '35%',
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    opacity: 0.3,
  },
  buyLabel: {
    color: forestPolish.cream,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
  },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
  plusOne: {
    position: 'absolute',
    top: 0,
    right: 0,
    color: colors.successDark,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    fontSize: fontSizes.lg,
    fontWeight: '900',
  },
  purchaseFeedback: {
    color: colors.successDark,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  purchaseError: { color: colors.dangerDark },
  purchaseShortfall: {
    backgroundColor: colors.warningSoft,
    borderRadius: radii.sm,
    color: forestPolish.woodDark,
    padding: spacing.xs,
  },
  traySection: {
    gap: spacing.sm,
    backgroundColor: '#FFF3D2',
    borderColor: forestPolish.bark,
    borderBottomColor: forestPolish.wood,
    borderBottomWidth: 4,
    borderRadius: radii.menuCard,
    borderWidth: 2,
    padding: spacing.sm,
    ...shadows.card,
  },
  capacityLabel: {
    alignSelf: 'flex-start',
    color: forestPolish.moss,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    paddingHorizontal: spacing.xs,
  },
  traySlotPreview: {
    alignSelf: 'center',
    backgroundColor: '#87502C',
    borderRadius: radii.menuControl,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    padding: 5,
    width: '100%',
  },
  trayPreviewSlot: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: 'rgba(7, 24, 32, 0.26)',
    borderColor: 'rgba(255, 248, 232, 0.34)',
    borderRadius: radii.sm,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    maxWidth: 36,
  },
  trayPreviewSlotActive: {
    backgroundColor: '#FFE7A6',
    borderBottomColor: '#C9922F',
    borderBottomWidth: 2,
    borderColor: '#FFF5D3',
  },
  trayProducts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  secondary: {
    padding: spacing.sm,
    gap: spacing.sm,
    borderColor: '#9CBC77',
    borderBottomColor: forestPolish.moss,
    borderBottomWidth: 4,
    borderWidth: 2,
    borderRadius: radii.menuCard,
    justifyContent: 'space-between',
  },
  secondaryMax: {
    borderColor: '#D8A348',
    borderBottomColor: forestPolish.wood,
  },
  extraTray: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  extraTrayStacked: { flexDirection: 'column' },
  extraTrayImage: { width: 76, height: 76 },
  extraTrayCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  extraTrayCopyStacked: { flex: 0, width: '100%' },
  trayTierTag: {
    color: forestPolish.moss,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'center',
  },
  trayTierTagMax: { color: colors.goldDark },
  extraTrayTitle: {
    fontSize: fontSizes.lg,
    color: forestPolish.woodDark,
    fontWeight: '900',
    textAlign: 'center',
  },
  trayBenefit: {
    fontSize: fontSizes.sm,
    color: forestPolish.wood,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryText: {
    fontSize: fontSizes.sm,
    color: forestPolish.wood,
    textAlign: 'center',
  },
  activeTierStatus: {
    alignSelf: 'center',
    backgroundColor: '#E8F3DD',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  activeTierText: {
    color: colors.successDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
  },
  trayPurchaseRow: { gap: spacing.sm },
  bonusStatus: {
    color: forestPolish.moss,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  trayDetails: { gap: spacing.sm },
  trayBadge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.cream,
    borderRadius: radii.menuControl,
    padding: spacing.sm,
  },
  trayBadgeActive: { backgroundColor: colors.successSoft },
  trayStatus: {
    color: colors.goldDark,
    flexShrink: 1,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  trayStatusActive: { color: colors.successDark },
});
