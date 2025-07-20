import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-red-900">
                    Something went wrong
                  </h3>
                  <p className="mt-2 text-sm text-red-700">
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                    <details className="mt-4">
                      <summary className="text-sm text-red-600 cursor-pointer">
                        Error details
                      </summary>
                      <pre className="mt-2 text-xs text-red-600 overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                  <div className="mt-4">
                    <Button
                      onClick={this.handleReset}
                      variant="outline"
                      size="sm"
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      Try again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}