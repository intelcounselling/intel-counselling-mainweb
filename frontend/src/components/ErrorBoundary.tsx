import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7EBD3] flex items-center justify-center p-6 md:p-12 text-[#2A2825] font-sans">
          <div className="max-w-xl w-full bg-white/60 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-[#2A2825]/10 shadow-xl text-center">
            <div className="w-16 h-16 bg-[#D65A31]/10 text-[#D65A31] rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black serif mb-4 text-[#2A2825]">
              Something went wrong.
            </h1>
            
            <p className="text-[#2A2825]/70 text-base md:text-lg mb-8 font-light max-w-md mx-auto leading-relaxed">
              An unexpected error occurred. We have logged this issue and our team is looking into it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-red-50/80 border border-red-100 rounded-2xl p-4 mb-8 text-xs font-mono overflow-auto max-h-48 text-red-700">
                <div className="font-bold mb-1">{this.state.error.toString()}</div>
                {this.state.errorInfo?.componentStack}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto bg-[#D65A31] hover:bg-[#C24B24] text-white px-8 py-4 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-md"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto bg-[#2A2825]/5 hover:bg-[#2A2825]/10 text-[#2A2825] px-8 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-[#2A2825]/10"
              >
                <Home size={16} />
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
