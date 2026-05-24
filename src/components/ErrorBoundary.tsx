import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md w-full bg-surface-raised brutalist-border rounded-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-red-950/30 border border-red-500/30 rounded-full flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tighter text-red-300">
                System Failure
              </h2>
              <p className="text-sm text-zinc-400 font-mono">
                An unexpected error occurred while rendering this section.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-black/60 border border-zinc-800 rounded-lg p-4 text-left overflow-auto max-h-40">
                <p className="text-[10px] font-mono text-red-400 break-all leading-relaxed">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-[10px] font-mono text-zinc-600 cursor-pointer hover:text-zinc-400">
                      Stack trace
                    </summary>
                    <pre className="text-[9px] font-mono text-zinc-500 mt-2 whitespace-pre-wrap break-all leading-relaxed">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold uppercase tracking-wider text-xs rounded-lg transition-all"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
