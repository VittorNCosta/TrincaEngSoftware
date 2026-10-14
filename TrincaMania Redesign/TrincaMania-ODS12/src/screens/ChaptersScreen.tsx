import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { GameIcon } from '../components/GameIcon';
import { RecyclingMarkerArt } from '../components/RecyclingMarkerArt';
import { ScreenShell } from '../components/ScreenShell';
import {
  CHAPTERS,
  getChapter,
  getChapterLevelSummaries,
} from '../data/chapters';
import { getChapterVisualIdentity } from '../data/chapterVisualIdentity';
import {
  ChapterProgressState,
  getChapterMapStars,
  getChapterProgressSummaries,
  isChapterMapUnlocked,
} from '../storage/chapterProgressStorage';
import { ChapterId, ChapterMilestone, WorldId } from '../types/game';
import { playMetaMusic, playWorldMusic } from '../utils/music';
import { styles } from './chaptersStyles';

const MAPS_PER_SECTION = 10;
const SECTION_COUNT = 10;

const MILESTONE_LABEL: Record<ChapterMilestone, string> = {
  guardian: 'Guardião',
  rest: 'Descanso',
  shop: 'Loja',
};

type ChaptersScreenProps = {
  devMode?: boolean;
  chapterProgress: ChapterProgressState;
  onBack: () => void;
  onSelectChapterLevel: (mapId: string) => void;
};

/** Os capítulos são um percurso separado da campanha; o modo dev não grava desbloqueios. */
export function ChaptersScreen({
  devMode = false,
  chapterProgress,
  onBack,
  onSelectChapterLevel,
}: ChaptersScreenProps) {
  const [openChapterId, setOpenChapterId] = useState<ChapterId | undefined>();
  const [sectionIndex, setSectionIndex] = useState(0);
  const sectionTabsRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (openChapterId) setOpenChapterId(undefined);
        else onBack();
        return true;
      },
    );
    return () => subscription.remove();
  }, [onBack, openChapterId]);

  useEffect(() => {
    if (!openChapterId) return;
    sectionTabsRef.current?.scrollTo({
      x: Math.max(0, sectionIndex - 2) * 50,
      animated: true,
    });
  }, [openChapterId, sectionIndex]);

  useEffect(() => {
    if (openChapterId) playWorldMusic((100 + openChapterId) as WorldId);
    else playMetaMusic();
  }, [openChapterId]);

  const chapterSummaries = useMemo(
    () =>
      getChapterProgressSummaries(chapterProgress).map((summary) => ({
        ...summary,
        unlocked: devMode || summary.unlocked,
      })),
    [chapterProgress, devMode],
  );
  const completedTotal = chapterSummaries.reduce(
    (total, summary) => total + summary.completedCount,
    0,
  );
  const openChapter = openChapterId ? getChapter(openChapterId) : undefined;
  const openChapterMaps = useMemo(
    () => (openChapterId ? getChapterLevelSummaries(openChapterId) : []),
    [openChapterId],
  );
  const openSummary = chapterSummaries.find(
    (summary) => summary.chapterId === openChapterId,
  );
  const nextMap =
    openChapterMaps.find(
      (map) =>
        getChapterMapStars(chapterProgress, map.id) === 0 &&
        (devMode || isChapterMapUnlocked(map.id, chapterProgress)),
    ) ?? openChapterMaps[openChapterMaps.length - 1];
  const visibleMaps = openChapterMaps.slice(
    sectionIndex * MAPS_PER_SECTION,
    (sectionIndex + 1) * MAPS_PER_SECTION,
  );
  const sectionCompleted = visibleMaps.filter(
    (map) => getChapterMapStars(chapterProgress, map.id) > 0,
  ).length;

  const showChapter = (chapterId: ChapterId) => {
    const maps = getChapterLevelSummaries(chapterId);
    const nextIndex = maps.findIndex(
      (map) =>
        getChapterMapStars(chapterProgress, map.id) === 0 &&
        (devMode || isChapterMapUnlocked(map.id, chapterProgress)),
    );
    setSectionIndex(
      Math.floor(
        (nextIndex >= 0 ? nextIndex : maps.length - 1) / MAPS_PER_SECTION,
      ),
    );
    setOpenChapterId(chapterId);
  };

  const header = (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel={
          openChapter ? 'Voltar aos capítulos' : 'Voltar ao mapa'
        }
        accessibilityRole="button"
        onPress={openChapter ? () => setOpenChapterId(undefined) : onBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <GameIcon name="back" size={26} tone="green" variant="plain" />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text style={styles.headerEyebrow}>JORNADA EXTRA · ODS 12</Text>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {openChapter
            ? `Capítulo ${String(openChapter.id).padStart(2, '0')}`
            : 'Capítulos'}
        </Text>
      </View>
    </View>
  );

  if (openChapter) {
    return (
      <ScreenShell scroll={false}>
        {header}
        <ScrollView
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.overviewCard}>
            <Text style={styles.overviewKicker}>SEU PROGRESSO</Text>
            <Text style={styles.overviewTitle}>{openChapter.name}</Text>
            <Text style={styles.overviewSubtitle}>{openChapter.subtitle}</Text>
            <View style={styles.overviewProgressRow}>
              <Text style={styles.overviewProgressValue}>
                {openSummary?.completedCount ?? 0} de 100 mapas
              </Text>
              <Text style={styles.overviewProgressPercent}>
                {openSummary?.completedCount ?? 0}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${openSummary?.completedCount ?? 0}%` },
                ]}
              />
            </View>
          </View>

          {nextMap ? (
            <Pressable
              accessibilityLabel={`${openSummary?.completedCount === 100 ? 'Rejogar' : 'Continuar no'} mapa ${nextMap.chapterMapNumber}: ${nextMap.title}`}
              accessibilityRole="button"
              onPress={() => onSelectChapterLevel(nextMap.id)}
              style={({ pressed }) => [
                styles.continueCard,
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={styles.continueIcon}>
                <GameIcon name="play" size={23} tone="green" variant="plain" />
              </View>
              <View style={styles.continueCopy}>
                <Text style={styles.continueKicker}>
                  {openSummary?.completedCount === 100
                    ? 'REJOGAR'
                    : 'CONTINUAR'}{' '}
                  · MAPA {nextMap.chapterMapNumber}
                </Text>
                <Text numberOfLines={1} style={styles.continueTitle}>
                  {nextMap.title}
                </Text>
              </View>
              <GameIcon name="next" size={23} tone="green" variant="plain" />
            </Pressable>
          ) : null}

          <View style={styles.sectionPanel}>
            <Text style={styles.sectionKicker}>ESCOLHA UM CONJUNTO</Text>
            <ScrollView
              contentContainerStyle={styles.sectionTabs}
              horizontal
              ref={sectionTabsRef}
              showsHorizontalScrollIndicator={false}
            >
              {Array.from({ length: SECTION_COUNT }, (_, index) => (
                <Pressable
                  accessibilityLabel={`Mapas ${index * 10 + 1} a ${(index + 1) * 10}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sectionIndex === index }}
                  key={`section-${index}`}
                  onPress={() => setSectionIndex(index)}
                  style={({ pressed }) => [
                    styles.sectionTab,
                    sectionIndex === index ? styles.sectionTabActive : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionTabText,
                      sectionIndex === index
                        ? styles.sectionTabTextActive
                        : null,
                    ]}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>
                  Mapas {sectionIndex * 10 + 1} a {(sectionIndex + 1) * 10}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Toque em um mapa para jogar
                </Text>
              </View>
              <Text style={styles.sectionCount}>{sectionCompleted}/10</Text>
            </View>

            <View style={styles.mapGrid}>
              {visibleMaps.map((map) => {
                const stars = getChapterMapStars(chapterProgress, map.id);
                const locked =
                  !devMode && !isChapterMapUnlocked(map.id, chapterProgress);
                const isNext = map.id === nextMap?.id && stars === 0;

                return (
                  <Pressable
                    accessibilityLabel={`Mapa ${map.chapterMapNumber}: ${map.title}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: locked }}
                    disabled={locked}
                    key={map.id}
                    onPress={() => onSelectChapterLevel(map.id)}
                    style={({ pressed }) => [
                      styles.mapTile,
                      locked ? styles.mapTileLocked : null,
                      stars > 0 ? styles.mapTileDone : null,
                      isNext ? styles.mapTileNext : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mapNumber,
                        locked ? styles.mapNumberLocked : null,
                      ]}
                    >
                      {map.chapterMapNumber}
                    </Text>
                    {locked ? (
                      <GameIcon
                        muted
                        name="lock"
                        size={18}
                        tone="neutral"
                        variant="plain"
                      />
                    ) : map.milestone ? (
                      <>
                        <RecyclingMarkerArt
                          kind={map.milestone}
                          style={styles.milestoneArt}
                        />
                        <Text numberOfLines={1} style={styles.mapCaption}>
                          {MILESTONE_LABEL[map.milestone]}
                        </Text>
                      </>
                    ) : stars > 0 ? (
                      <View style={styles.mapStarsRow}>
                        {Array.from({ length: stars }, (_, index) => (
                          <GameIcon
                            key={`${map.id}-star-${index}`}
                            name="star"
                            size={13}
                            tone="gold"
                            variant="plain"
                          />
                        ))}
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.mapCaption,
                          isNext ? styles.mapCaptionNext : null,
                        ]}
                      >
                        {isNext ? 'PRÓXIMO' : 'JOGAR'}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sectionActions}>
              <Pressable
                accessibilityLabel="Conjunto anterior"
                accessibilityRole="button"
                accessibilityState={{ disabled: sectionIndex === 0 }}
                disabled={sectionIndex === 0}
                onPress={() => setSectionIndex((index) => index - 1)}
                style={[
                  styles.sectionAction,
                  sectionIndex === 0 ? styles.sectionActionDisabled : null,
                ]}
              >
                <Text style={styles.sectionActionText}>Anterior</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Próximo conjunto"
                accessibilityRole="button"
                accessibilityState={{
                  disabled: sectionIndex === SECTION_COUNT - 1,
                }}
                disabled={sectionIndex === SECTION_COUNT - 1}
                onPress={() => setSectionIndex((index) => index + 1)}
                style={[
                  styles.sectionAction,
                  sectionIndex === SECTION_COUNT - 1
                    ? styles.sectionActionDisabled
                    : null,
                ]}
              >
                <Text style={styles.sectionActionText}>Próximos 10</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell scroll={false}>
      {header}
      <FlatList
        contentContainerStyle={styles.chapterList}
        data={chapterSummaries}
        keyExtractor={(summary) => `chapter-${summary.chapterId}`}
        ListHeaderComponent={
          <View style={styles.listIntro}>
            <Text style={styles.listIntroTitle}>
              Explore novos caminhos da reciclagem
            </Text>
            <Text style={styles.listIntroBody}>
              São 10 capítulos. Continue de onde parou ou escolha um tema
              disponível.
            </Text>
            <View style={styles.totalProgressRow}>
              <Text style={styles.totalProgressLabel}>Jornada completa</Text>
              <Text style={styles.totalProgressValue}>
                {completedTotal}/1.000
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${completedTotal / 10}%` },
                ]}
              />
            </View>
          </View>
        }
        renderItem={({ index, item }) => {
          const chapter = CHAPTERS[index];
          const identity = getChapterVisualIdentity(chapter.levelIds[0]);
          const isComplete = item.completedCount === item.totalCount;
          const status = !item.unlocked
            ? 'BLOQUEADO'
            : isComplete
              ? 'CONCLUÍDO'
              : item.completedCount > 0 || index === 0
                ? 'CONTINUAR'
                : 'DISPONÍVEL';

          return (
            <Pressable
              accessibilityLabel={`${chapter.name}, ${status.toLowerCase()}, ${item.completedCount} de ${item.totalCount} mapas`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !item.unlocked }}
              disabled={!item.unlocked}
              onPress={() => showChapter(item.chapterId)}
              style={({ pressed }) => [
                styles.chapterCard,
                !item.unlocked ? styles.chapterCardLocked : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <View
                style={[
                  styles.chapterAccent,
                  {
                    backgroundColor: item.unlocked
                      ? identity.baseColor
                      : '#9FAEAA',
                  },
                ]}
              />
              <View style={styles.chapterCardTop}>
                <View
                  style={[
                    styles.chapterBadge,
                    {
                      backgroundColor: item.unlocked
                        ? identity.baseColor
                        : '#85938F',
                    },
                  ]}
                >
                  {item.unlocked ? (
                    <Text style={styles.chapterBadgeText}>
                      {String(item.chapterId).padStart(2, '0')}
                    </Text>
                  ) : (
                    <GameIcon
                      muted
                      name="lock"
                      size={20}
                      tone="neutral"
                      variant="plain"
                    />
                  )}
                </View>
                <View style={styles.chapterCopy}>
                  <Text numberOfLines={2} style={styles.chapterName}>
                    {chapter.name}
                  </Text>
                  <Text numberOfLines={2} style={styles.chapterSubtitle}>
                    {item.unlocked ? chapter.subtitle : chapter.lockedText}
                  </Text>
                </View>
                {item.unlocked ? (
                  <GameIcon
                    name="next"
                    size={22}
                    tone="green"
                    variant="plain"
                  />
                ) : null}
              </View>
              <View style={styles.chapterMeta}>
                <Text
                  style={[
                    styles.chapterStatus,
                    !item.unlocked ? styles.chapterStatusLocked : null,
                  ]}
                >
                  {status}
                </Text>
                <Text style={styles.chapterCount}>
                  {item.completedCount}/{item.totalCount} mapas
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${item.completedCount}%` },
                  ]}
                />
              </View>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </ScreenShell>
  );
}
