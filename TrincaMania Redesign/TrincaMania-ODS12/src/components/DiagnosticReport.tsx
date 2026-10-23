import Alert from '../utils/appAlert';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { diagnosticReport, log } from '../utils/log';

export function DiagnosticReport() {
  const [report, setReport] = useState(diagnosticReport);
  const copy = async () => {
    try {
      await Clipboard.setStringAsync(report);
      Alert.alert('Relatório copiado');
    } catch (error) {
      log('warn', 'diagnostics', 'copy-failed', error);
      Alert.alert(
        'Não foi possível copiar',
        'Selecione o texto abaixo ou compartilhe o relatório.',
      );
    }
  };
  const share = async () => {
    try {
      await Share.share({
        message: report,
        title: 'Diagnóstico TrincaMania ODS 12',
      });
    } catch (error) {
      log('warn', 'diagnostics', 'share-failed', error);
      Alert.alert(
        'Não foi possível compartilhar',
        'Você pode selecionar e copiar o relatório abaixo.',
      );
    }
  };
  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Relatório da sessão</Text>
      <Text style={styles.description}>
        Consulte os registros ou copie o relatório para suporte.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void copy()}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>Copiar relatório</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => setReport(diagnosticReport())}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>Atualizar relatório</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void share()}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>Compartilhar relatório</Text>
      </Pressable>
      <ScrollView style={styles.report}>
        <Text selectable style={styles.reportText}>
          {report}
        </Text>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: 9 },
  heading: { color: '#F5FFF7', fontSize: 18, fontWeight: '900' },
  description: { color: '#C8E3DB', fontSize: 14, lineHeight: 20 },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    borderColor: '#A6DDC4',
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 16,
    backgroundColor: '#DAF5E5',
  },
  buttonText: { color: '#174638', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  report: {
    backgroundColor: '#10272D',
    borderColor: '#47685E',
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 150,
    padding: 12,
  },
  reportText: {
    color: '#E4F4ED',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});
