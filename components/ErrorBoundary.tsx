import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ICONS } from '../constants';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-dark-bg text-dark-text p-8">
            <div className="p-4 bg-red-500/20 rounded-full mb-4">
                {React.cloneElement(ICONS.error, { className: "h-12 w-12 text-red-400"})}
            </div>
            <h1 className="text-3xl font-bold text-white">Something went wrong.</h1>
            <p className="text-dark-text-secondary mt-2">An unexpected error occurred. Please try refreshing the page.</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-6 bg-brand-primary hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg"
            >
                Refresh Page
            </button>
            {this.state.error && (
                <details className="mt-4 text-left bg-dark-card p-4 rounded-lg w-full max-w-2xl">
                    <summary className="cursor-pointer text-dark-text-secondary">Error Details</summary>
                    <pre className="text-xs text-red-300 whitespace-pre-wrap mt-2">
                        {this.state.error.toString()}
                    </pre>
                </details>
            )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
