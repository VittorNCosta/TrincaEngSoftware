import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  Alert,
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
      await Share.share({ message: report, title: 'Diagnóstico TrincaMania' });
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
      <Pressable
        accessibilityRole="button"
        onPress={() => void copy()}
        style={styles.button}
      >
        <Text style={styles.text}>Copiar relatório</Text>
      </Pressable>
      <Text style={styles.text}>
        Registros desta sessão. Para copiar, mantenha o texto pressionado.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setReport(diagnosticReport())}
        style={styles.button}
      >
        <Text style={styles.text}>Atualizar relatório</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void share()}
        style={styles.button}
      >
        <Text style={styles.text}>Compartilhar relatório</Text>
      </Pressable>
      <ScrollView style={styles.report}>
        <Text selectable style={styles.text}>
          {report}
        </Text>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { maxHeight: 420, gap: 8 },
  text: { color: '#ffffff', fontSize: 14 },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#26395c',
  },
  report: { flexShrink: 1 },
});
