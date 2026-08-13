import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { GameIcon } from '../components/GameIcon';
import { ScreenShell } from '../components/ScreenShell';
import { CHAPTERS, getChapter, getChapterLevelSummaries } from '../data/chapters';
import { getChapterVisualIdentity } from '../data/chapterVisualIdentity';
import {
  ChapterProgressState,
  getChapterMapStars,
  getChapterProgressSummaries,
  isChapterMapUnlocked,
} from '../storage/chapterProgressStorage';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import { ChapterId, ChapterMilestone } from '../types/game';

const MAP_COLUMNS = 5;

const MILESTONE_LABEL: Record<ChapterMilestone, string> = {
  guardian: 'Guardião',
  rest: 'Descanso',
  shop: 'Loja',
};

type ChaptersScreenProps = {
  chapterProgress: ChapterProgressState;
  onBack: () => void;
  onSelectChapterLevel: (mapId: string) => void;
};

/**
 * Navegação dos 1000 mapas em dois níveis: a lista dos 10 capítulos e, dentro
 * de um capítulo, a grade dos 100 mapas. A campanha canônica fica na aba Mapa;
 * daqui o botão de voltar devolve o jogador para lá.
 *
 * A cor de cada capítulo sai de `getChapterVisualIdentity` do primeiro mapa, a
 * mesma identidade determinística que o tabuleiro usa — nenhuma paleta nova é
 * inventada aqui.
 */
export function ChaptersScreen({
  chapterProgress,
  onBack,
  onSelectChapterLevel,
}: ChaptersScreenProps) {
  const [openChapterId, setOpenChapterId] = useState<ChapterId | undefined>();
  const chapterSummaries = useMemo(
    () => getChapterProgressSummaries(chapterProgress),
    [chapterProgress],
  );
  const openChapter = openChapterId ? getChapter(openChapterId) : undefined;
  const openChapterMaps = useMemo(
    () => (openChapterId ? getChapterLevelSummaries(openChapterId) : []),
    [openChapterId],
  );

  if (openChapter) {
    const identity = getChapterVisualIdentity(openChapter.levelIds[0]);

    return (
      <ScreenShell scroll={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpenChapterId(undefined)}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <GameIcon name="back" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {openChapter.name}
            </Text>
            <Text numberOfLines={1} style={styles.headerSubtitle}>
              {openChapter.subtitle}
            </Text>
          </View>
        </View>

        <FlatList
          columnWrapperStyle={styles.mapRow}
          contentContainerStyle={styles.mapList}
          data={openChapterMaps}
          initialNumToRender={30}
          keyExtractor={(summary) => summary.id}
          numColumns={MAP_COLUMNS}
          renderItem={({ item }) => {
            const stars = getChapterMapStars(chapterProgress, item.id);
            const locked = !isChapterMapUnlocked(item.id, chapterProgress);

            return (
              <Pressable
                accessibilityLabel={`Mapa ${item.chapterMapNumber}: ${item.title}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: locked }}
                disabled={locked}
                onPress={() => onSelectChapterLevel(item.id)}
                style={({ pressed }) => [
                  styles.mapTile,
                  locked ? styles.mapTileLocked : { borderColor: identity.accentColor },
                  stars > 0 ? styles.mapTileDone : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                {locked ? (
                  <GameIcon muted name="lock" size={18} tone="neutral" />
                ) : (
                  <Text style={styles.mapNumber}>{item.chapterMapNumber}</Text>
                )}
                <View style={styles.mapStarsRow}>
                  {Array.from({ length: stars }).map((_, index) => (
                    <GameIcon
                      key={`${item.id}-star-${index}`}
                      name="star"
                      size={10}
                      tone="gold"
                      variant="plain"
                    />
                  ))}
                </View>
                {item.milestone ? (
                  <Text numberOfLines={1} style={styles.mapMilestone}>
                    {MILESTONE_LABEL[item.milestone]}
                  </Text>
                ) : null}
              </Pressable>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell scroll={false}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
        >
          <GameIcon name="back" size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            Capítulos
          </Text>
          <Text numberOfLines={1} style={styles.headerSubtitle}>
            10 capítulos · 100 mapas cada
          </Text>
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.chapterList}
        data={chapterSummaries}
        keyExtractor={(summary) => `chapter-${summary.chapterId}`}
        renderItem={({ index, item }) => {
          // `chapterSummaries` sai de `CHAPTERS.map`, então o índice é o mesmo.
          const chapter = CHAPTERS[index];
          const identity = getChapterVisualIdentity(chapter.levelIds[0]);
          const percent = Math.round((item.completedCount / item.totalCount) * 100);

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !item.unlocked }}
              disabled={!item.unlocked}
              onPress={() => setOpenChapterId(item.chapterId)}
              style={({ pressed }) => [
                styles.chapterCard,
                { borderColor: item.unlocked ? identity.accentColor : colors.locked },
                pressed ? styles.pressed : null,
              ]}
            >
              <View
                style={[
                  styles.chapterBadge,
                  { backgroundColor: item.unlocked ? identity.baseColor : colors.locked },
                ]}
              >
                {item.unlocked ? (
                  <Text style={styles.chapterBadgeText}>{item.chapterId}</Text>
                ) : (
                  <GameIcon muted name="lock" size={20} tone="neutral" />
                )}
              </View>
              <View style={styles.chapterCopy}>
                <Text numberOfLines={1} style={styles.chapterName}>
                  {chapter.name}
                </Text>
                <Text numberOfLines={2} style={styles.chapterSubtitle}>
                  {item.unlocked ? chapter.subtitle : chapter.lockedText}
                </Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: identity.accentColor, width: `${percent}%` },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.chapterCount}>
                {item.completedCount}/{item.totalCount}
              </Text>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  chapterBadge: {
    alignItems: 'center',
    borderColor: colors.creamLight,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  chapterBadgeText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.lg,
    fontWeight: '900',
  },
  chapterCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 3,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    ...shadows.card,
  },
  chapterCopy: {
    flex: 1,
    gap: 3,
  },
  chapterCount: {
    color: colors.primaryDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  chapterList: {
    paddingBottom: spacing.xl,
  },
  chapterName: {
    color: colors.ink,
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
  chapterSubtitle: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  headerSubtitle: {
    color: colors.secondary,
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },
  headerTitle: {
    color: colors.inkOnDark,
    fontSize: fontSizes.xl,
    fontWeight: '900',
  },
  mapList: {
    paddingBottom: spacing.xl,
  },
  mapMilestone: {
    color: colors.primaryDark,
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  mapNumber: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  mapRow: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  mapStarsRow: {
    flexDirection: 'row',
    height: 12,
  },
  mapTile: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    flex: 1,
    justifyContent: 'center',
    minHeight: 58,
    paddingVertical: 4,
  },
  mapTileDone: {
    backgroundColor: colors.surfaceWarm,
  },
  mapTileLocked: {
    backgroundColor: colors.panelDark,
    borderColor: colors.locked,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  progressFill: {
    borderRadius: radii.pill,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: colors.surfaceTint,
    borderRadius: radii.pill,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
});
