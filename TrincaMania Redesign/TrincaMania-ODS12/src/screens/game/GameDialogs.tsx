import type { Dispatch, RefObject, SetStateAction } from 'react';
import { Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameIcon } from '../../components/GameIcon';
import { PowerIcon } from '../../components/PowerIcon';
import { PrimaryButton } from '../../components/PrimaryButton';
import { POWER_UP_UI } from '../../data/powerUps';
import type { PowerUpType } from '../../types/game';
import {
  PRACTICAL_TUTORIAL_POPUPS,
  type PracticalTutorialPopupStep,
} from './practicalTutorial';
import { styles } from './styles';

type GameDialogsProps = {
  practicalTutorialPopupStep: PracticalTutorialPopupStep | undefined;
  advancePracticalTutorialPopup: () => void;
  isMagicTripleRescueVisible: boolean;
  dismissMagicTripleRescue: () => void;
  useFreeMagicTripleRescue: () => Promise<void>;
  isBonusSlotConfirmVisible: boolean;
  isBonusSlotProcessingRef: RefObject<boolean>;
  setIsBonusSlotConfirmVisible: Dispatch<SetStateAction<boolean>>;
  isBonusSlotProcessing: boolean;
  confirmBonusTraySlot: () => Promise<void>;
  pendingPowerPurchase: PowerUpType | undefined;
  isPowerPurchaseProcessingRef: RefObject<boolean>;
  setPendingPowerPurchase: Dispatch<SetStateAction<PowerUpType | undefined>>;
  pendingPowerPurchaseCost: number;
  coins: number;
  pendingPowerUnavailableMessage: string | undefined;
  pendingPowerHasEnoughCoins: boolean;
  isPowerPurchaseProcessing: boolean;
  pendingPowerCanUseImmediately: boolean;
  confirmPendingPowerPurchase: () => Promise<void>;
};

export function GameDialogs({
  practicalTutorialPopupStep,
  advancePracticalTutorialPopup,
  isMagicTripleRescueVisible,
  dismissMagicTripleRescue,
  useFreeMagicTripleRescue,
  isBonusSlotConfirmVisible,
  isBonusSlotProcessingRef,
  setIsBonusSlotConfirmVisible,
  isBonusSlotProcessing,
  confirmBonusTraySlot,
  pendingPowerPurchase,
  isPowerPurchaseProcessingRef,
  setPendingPowerPurchase,
  pendingPowerPurchaseCost,
  coins,
  pendingPowerUnavailableMessage,
  pendingPowerHasEnoughCoins,
  isPowerPurchaseProcessing,
  pendingPowerCanUseImmediately,
  confirmPendingPowerPurchase,
}: GameDialogsProps) {
  return (
    <>
      <Modal
        animationType="fade"
        transparent
        visible={practicalTutorialPopupStep !== undefined}
        onRequestClose={() => undefined}
      >
        <SafeAreaView
          edges={['top', 'bottom', 'left', 'right']}
          style={styles.modalOverlay}
        >
          <View style={styles.practicalModalCard}>
            {practicalTutorialPopupStep ? (
              <>
                <Text style={styles.practicalModalTitle}>
                  {PRACTICAL_TUTORIAL_POPUPS[practicalTutorialPopupStep].title}
                </Text>
                <Text style={styles.practicalModalText}>
                  {PRACTICAL_TUTORIAL_POPUPS[practicalTutorialPopupStep].text}
                </Text>
                <PrimaryButton
                  // O rótulo muda a cada passo ("Começar", "Entendi",
                  // "Continuar", "Jogar"), então texto não serve de
                  // endereço: o id é o mesmo botão nos quatro.
                  testID="tutorial-pratico-avancar"
                  title={
                    PRACTICAL_TUTORIAL_POPUPS[practicalTutorialPopupStep].button
                  }
                  onPress={advancePracticalTutorialPopup}
                />
              </>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={isMagicTripleRescueVisible}
        onRequestClose={dismissMagicTripleRescue}
      >
        <SafeAreaView
          edges={['top', 'bottom', 'left', 'right']}
          style={styles.modalOverlay}
        >
          <View style={styles.rescueModalCard}>
            <GameIcon name="powers" size={46} tone="purple" />
            <Text style={styles.purchaseModalTitle}>Quase sem espaço!</Text>
            <Text style={styles.purchaseModalText}>
              A Trinca Mágica forma uma trinca possível automaticamente.
            </Text>
            <Text style={styles.rescueModalHint}>
              Use uma vez grátis para salvar sua bandeja.
            </Text>
            <View style={styles.purchaseModalActions}>
              <PrimaryButton
                size="small"
                title="Depois"
                variant="secondary"
                onPress={dismissMagicTripleRescue}
              />
              <PrimaryButton
                size="small"
                title="Usar grátis"
                onPress={useFreeMagicTripleRescue}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      <Modal
        animationType="fade"
        statusBarTranslucent
        transparent
        visible={isBonusSlotConfirmVisible}
        onRequestClose={() => {
          if (!isBonusSlotProcessingRef.current) {
            setIsBonusSlotConfirmVisible(false);
          }
        }}
      >
        <SafeAreaView
          edges={['top', 'bottom', 'left', 'right']}
          style={styles.modalOverlay}
        >
          <View style={styles.bonusPurchaseModalCard}>
            <View style={styles.bonusModalIcon}>
              <GameIcon name="bonus" size={34} tone="green" />
            </View>
            <Text style={styles.purchaseModalTitle}>Liberar espaço bônus?</Text>
            <Text style={styles.purchaseModalText}>
              Ganhe um sétimo espaço na bandeja e jogue com mais segurança.
            </Text>
            <View style={styles.bonusBenefitPill}>
              <Text style={styles.bonusBenefitText}>+1 ESPAÇO · 30 MIN</Text>
            </View>
            <View style={styles.purchaseModalActions}>
              <PrimaryButton
                disabled={isBonusSlotProcessing}
                size="small"
                title="Cancelar"
                variant="secondary"
                onPress={() => setIsBonusSlotConfirmVisible(false)}
              />
              <PrimaryButton
                disabled={isBonusSlotProcessing}
                size="small"
                title={isBonusSlotProcessing ? 'Liberando…' : 'Liberar grátis'}
                onPress={confirmBonusTraySlot}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      <Modal
        animationType="fade"
        statusBarTranslucent
        transparent
        visible={pendingPowerPurchase !== undefined}
        onRequestClose={() => {
          if (!isPowerPurchaseProcessingRef.current) {
            setPendingPowerPurchase(undefined);
          }
        }}
      >
        <SafeAreaView
          edges={['top', 'bottom', 'left', 'right']}
          style={styles.modalOverlay}
        >
          <View style={styles.powerPurchaseModalCard}>
            {pendingPowerPurchase ? (
              <>
                <View style={styles.powerPurchaseIcon}>
                  <PowerIcon name={pendingPowerPurchase} size={38} />
                </View>
                <Text style={styles.purchaseModalTitle}>
                  {POWER_UP_UI[pendingPowerPurchase].label}
                </Text>
                <Text style={styles.purchaseModalText}>
                  {POWER_UP_UI[pendingPowerPurchase].description}
                </Text>
                <View style={styles.powerPriceRow}>
                  <GameIcon name="coin" size={20} tone="gold" />
                  <Text style={styles.powerPriceText}>
                    {pendingPowerPurchaseCost}
                  </Text>
                  <Text style={styles.powerBalanceText}>Saldo: {coins}</Text>
                </View>
                {pendingPowerUnavailableMessage ? (
                  <Text style={styles.powerPurchaseCondition}>
                    {pendingPowerUnavailableMessage} A compra ficará no
                    inventário.
                  </Text>
                ) : (
                  <Text style={styles.powerPurchaseConditionReady}>
                    Pronto para comprar e usar nesta jogada.
                  </Text>
                )}
                {!pendingPowerHasEnoughCoins ? (
                  <Text style={styles.powerPurchaseInsufficient}>
                    Moedas insuficientes.
                  </Text>
                ) : null}
                <View style={styles.purchaseModalActions}>
                  <PrimaryButton
                    disabled={isPowerPurchaseProcessing}
                    size="small"
                    title="Cancelar"
                    variant="secondary"
                    onPress={() => setPendingPowerPurchase(undefined)}
                  />
                  <PrimaryButton
                    disabled={
                      isPowerPurchaseProcessing || !pendingPowerHasEnoughCoins
                    }
                    size="small"
                    title={
                      isPowerPurchaseProcessing
                        ? 'Comprando…'
                        : pendingPowerCanUseImmediately
                          ? 'Comprar e usar'
                          : 'Comprar'
                    }
                    onPress={confirmPendingPowerPurchase}
                  />
                </View>
              </>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
