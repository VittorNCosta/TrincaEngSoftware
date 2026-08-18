import { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSizes, spacing } from '../styles/theme';

/**
 * Ponto único de relato de erro não tratado. Hoje só loga; quando o projeto
 * tiver um DSN do Sentry, troque o corpo por `Sentry.captureException(error)`
 * (pacote `@sentry/react-native`) sem mexer em mais nada.
 */
const reportUnhandledError = (error: Error, info: ErrorInfo) => {
  console.error('[ErrorBoundary]', error, info.componentStack);
};

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportUnhandledError(error, info);
  }

  render() {
    if (this.state.error) {
      // Provider próprio: o ErrorBoundary fica fora do `App` em `index.ts`,
      // então se o `App` quebrar, o SafeAreaProvider dele quebra junto — sem
      // este aqui a tela de erro ficaria sem respeitar notch/home indicator.
      return (
        <SafeAreaProvider>
          <SafeAreaView style={styles.root}>
            <Text style={styles.title}>Algo deu errado</Text>
            <Text style={styles.message}>
              Feche e abra o TrincaMania de novo. Se continuar acontecendo, seu
              progresso está salvo — pode contar pra gente o que estava fazendo
              quando travou.
            </Text>
          </SafeAreaView>
        </SafeAreaProvider>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  message: {
    color: colors.creamLight,
    fontSize: fontSizes.md,
    lineHeight: 22,
    textAlign: 'center',
  },
  root: {
    alignItems: 'center',
    backgroundColor: colors.backgroundDeep,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  title: {
    color: colors.gold,
    fontSize: fontSizes.xl,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
});
