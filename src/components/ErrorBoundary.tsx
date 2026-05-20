import { Component } from 'react';
import { GlitchButton } from '@/components/cyber/GlitchButton';

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
          <div className="text-red-400 text-5xl font-bold font-mono">/// SYSTEM FAULT ///</div>
          <div className="text-zinc-400 text-lg font-mono-data max-w-lg text-center">
            A critical render error was intercepted. The application has been contained.
          </div>
          <pre className="mt-2 max-w-2xl overflow-auto rounded border border-zinc-800 bg-zinc-950 p-4 text-xs text-red-300 font-mono whitespace-pre-wrap">
            {this.state.error?.message}
          </pre>
          <div className="flex gap-3">
            <GlitchButton variant="ghost" onClick={this.handleGoHome}>
              RETURN TO BASE
            </GlitchButton>
            <GlitchButton variant="primary" onClick={this.handleRetry}>
              RECOVER
            </GlitchButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
