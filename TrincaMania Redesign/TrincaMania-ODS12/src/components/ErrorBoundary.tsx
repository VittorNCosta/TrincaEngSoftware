import { reportRemoteError } from '../observability/errorReporter';
import { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { DiagnosticReport } from './DiagnosticReport';
import { diagnosticReport, log } from '../utils/log';

import { colors, fontSizes, spacing } from '../styles/theme';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
  report?: string;
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
    log('error', 'render', 'render-failed', error);
    reportRemoteError(error);
    if (__DEV__) log('error', 'render', 'component-stack', info.componentStack);
    this.setState({ report: diagnosticReport() });
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
              progresso já confirmado será mantido. Conte pra gente o que estava
              fazendo quando travou.
            </Text>
            {__DEV__ ? (
              <Text selectable style={styles.message}>
                {this.state.error.stack}
              </Text>
            ) : null}
            <DiagnosticReport
              key={this.state.report ? 'captured' : 'pending'}
            />
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
