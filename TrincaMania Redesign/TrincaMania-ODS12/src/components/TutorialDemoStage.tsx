import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BASE_TRAY_CAPACITY } from '../storage/trayBoostStorage';
import { radii, spacing } from '../styles/theme';
import {
  advanceTutorialPractice,
  createTutorialPractice,
  getTutorialPracticeAction,
  type TutorialDemoKind,
} from '../utils/tutorialPractice';
import { BoardTile } from './BoardTile';
import { GameIcon } from './GameIcon';
import { PowerIcon } from './PowerIcon';
import { Tray } from './Tray';
import {
  TutorialTarget,
  tutorialPalette,
  useTutorialReducedMotion,
} from './TutorialVisuals';

const powerLabels = {
  hint: 'Trinca automática',
  shuffle: 'Misturar peças',
  undo: 'Voltar jogada',
};

export function TutorialDemoStage({
  kind,
  visible = true,
}: {
  kind: TutorialDemoKind;
  visible?: boolean;
}) {
  const [practice, setPractice] = useState(() => createTutorialPractice(kind));
  const reducedMotion = useTutorialReducedMotion();
  const action = getTutorialPracticeAction(practice);
  const nextTileId = action && 'tileId' in action ? action.tileId : undefined;
  const power =
    kind === 'hint' || kind === 'shuffle' || kind === 'undo' ? kind : undefined;
  const powerReady = Boolean(action && 'power' in action);
  const finished = !action;
  useEffect(() => {
    setPractice(createTutorialPractice(kind));
  }, [kind, visible]);
  useEffect(() => {
    if (!visible || reducedMotion || finished) return;
    const timer = setTimeout(
      () =>
        setPractice((current) => {
          const next = getTutorialPracticeAction(current);
          return next ? advanceTutorialPractice(current, next) : current;
        }),
      2200,
    );
    return () => clearTimeout(timer);
  }, [finished, kind, nextTileId, powerReady, reducedMotion, visible]);

  const caption =
    kind === 'tray'
      ? `${practice.tray.length}/${BASE_TRAY_CAPACITY} espaços ocupados`
      : finished
        ? kind === 'cycle' || kind === 'hint'
          ? 'Trinca formada! A bandeja ficou livre.'
          : kind === 'undo'
            ? 'A peça voltou ao tabuleiro.'
            : 'As peças foram reorganizadas.'
        : powerReady
          ? 'Toque no item de apoio destacado.'
          : practice.step === 0
            ? 'Toque nas peças para formar o ciclo do plástico.'
            : `${practice.tray.length}/3 peças na bandeja`;

  return (
    <View style={styles.stage}>
      <Text accessibilityLiveRegion="polite" style={styles.caption}>
        {caption}
      </Text>
      {kind !== 'tray' ? (
        <View style={styles.boardViewport}>
          <View style={styles.board}>
            {practice.board
              .filter((tile) => !tile.removed)
              .map((tile) => (
                <View
                  key={tile.id}
                  style={{
                    position: 'absolute',
                    left: tile.x,
                    top: tile.y,
                    width: 52,
                    height: 52,
                    zIndex: tile.id === nextTileId ? 1 : 0,
                  }}
                >
                  <BoardTile
                    tile={tile}
                    blocked={false}
                    boardOriginX={tile.x}
                    boardOriginY={tile.y}
                    disabled={finished || powerReady || tile.id !== nextTileId}
                    highlighted={false}
                    onPress={(tileId) =>
                      setPractice((current) =>
                        advanceTutorialPractice(current, { tileId }),
                      )
                    }
                  />
                  {tile.id === nextTileId ? <TutorialTarget /> : null}
                </View>
              ))}
          </View>
        </View>
      ) : null}
      {kind === 'cycle' ? (
        <View style={styles.roles}>
          <Text style={styles.role}>RESÍDUO</Text>
          <Text style={styles.role}>LIXEIRA</Text>
          <Text style={styles.role}>RECICLAGEM</Text>
        </View>
      ) : null}
      {power ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Testar ${powerLabels[power]}`}
          accessibilityState={{ disabled: !powerReady }}
          disabled={!powerReady}
          onPress={() =>
            setPractice((current) =>
              advanceTutorialPractice(current, { power }),
            )
          }
          style={styles.power}
        >
          <PowerIcon name={power} size={32} />
          <Text style={styles.powerLabel}>{powerLabels[power]}</Text>
          {powerReady ? <TutorialTarget /> : null}
        </Pressable>
      ) : null}
      <View style={styles.tray}>
        <Tray activeCapacity={BASE_TRAY_CAPACITY} tiles={practice.tray} />
        {kind === 'tray' ? <TutorialTarget showHand={false} /> : null}
      </View>
      {kind === 'tray' ? (
        <Text style={styles.note}>
          Forme uma trinca para liberar espaço antes que a bandeja encha.
        </Text>
      ) : null}
      <Pressable
        accessibilityHint="Recomeça a demonstração sem alterar seu progresso."
        accessibilityLabel="Rever demonstração"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => setPractice(createTutorialPractice(kind))}
        style={({ pressed }) => [
          styles.replay,
          pressed ? styles.pressed : null,
        ]}
      >
        <GameIcon name="reset" size={16} tone="green" variant="plain" />
        <Text style={styles.replayText}>Rever</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { gap: spacing.sm, width: '100%', paddingVertical: 8 },
  boardViewport: {
    alignItems: 'center',
    alignSelf: 'center',
    height: 130,
    justifyContent: 'center',
    width: 203,
  },
  board: { width: 184, height: 118 },
  caption: {
    color: tutorialPalette.woodDark,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  note: {
    color: tutorialPalette.wood,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    textAlign: 'center',
  },
  roles: { alignSelf: 'center', flexDirection: 'row', gap: 8 },
  role: {
    color: tutorialPalette.moss,
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    width: 60,
  },
  tray: { width: '100%', position: 'relative' },
  power: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#E8F1DF',
    borderColor: tutorialPalette.moss,
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 14,
    position: 'relative',
  },
  powerLabel: { color: tutorialPalette.moss, fontSize: 12, fontWeight: '900' },
  replay: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: tutorialPalette.cream,
    borderColor: tutorialPalette.wood,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  replayText: {
    color: tutorialPalette.woodDark,
    fontSize: 13,
    fontWeight: '900',
  },
  pressed: { opacity: 0.72 },
});
