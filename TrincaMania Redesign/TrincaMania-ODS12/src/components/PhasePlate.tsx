import { StyleSheet, Text, View } from 'react-native';

type PhasePlateProps = {
  levelLabel: string;
  worldLabel: string;
  worldName: string;
};

export function PhasePlate({
  levelLabel,
  worldLabel,
  worldName,
}: PhasePlateProps) {
  return (
    <View style={styles.plate} testID="phase-plate">
      <View style={styles.phase}>
        <Text style={styles.title}>Fase {levelLabel}</Text>
      </View>
      <View pointerEvents="none" style={styles.separator} />
      <View style={styles.location}>
        <Text numberOfLines={1} style={styles.worldName}>
          {worldName}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {worldLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFF7E5',
    borderColor: '#C5D3AF',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    maxWidth: 280,
    paddingHorizontal: 8,
    paddingVertical: 5,
    width: '100%',
    shadowColor: '#142F24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  phase: {
    backgroundColor: '#254B39',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  title: { color: '#FFF7E5', fontSize: 15, fontWeight: '900', lineHeight: 19 },
  separator: { width: 1, height: 22, backgroundColor: '#D7DEC7' },
  location: { flex: 1, minWidth: 0, gap: 1 },
  worldName: {
    color: '#284832',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
  },
  subtitle: {
    color: '#53634B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    lineHeight: 12,
    textTransform: 'uppercase',
  },
});
