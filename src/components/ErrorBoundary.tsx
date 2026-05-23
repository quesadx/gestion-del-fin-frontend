import { Component } from 'react';
import { TacticalButton } from '@/components/tactical/TacticalButton';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Render error caught:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
          <div className="text-gdf-status-danger text-5xl font-bold font-mono">
            /// TACTICAL FAULT ///
          </div>
          <div className="text-gdf-text-secondary text-lg font-mono-data max-w-lg text-center">
            A critical render error was intercepted. The interface has been contained.
          </div>
          <pre className="mt-2 max-w-2xl overflow-auto rounded border border-gdf-border-subtle bg-gdf-surface-base p-4 text-xs text-gdf-status-danger/80 font-mono whitespace-pre-wrap">
            {this.state.error?.message}
          </pre>
          <div className="flex gap-3">
            <TacticalButton variant="ghost" onClick={this.handleGoHome}>
              RETURN TO DASHBOARD
            </TacticalButton>
            <TacticalButton variant="primary" onClick={this.handleRetry}>
              RETRY
            </TacticalButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
