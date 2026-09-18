import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro não tratado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 m-4 space-y-3 shadow-sm animate-fade-in text-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Ocorreu um erro ao carregar esta tela.</span>
          </div>
          <p className="text-slate-700">
            {this.state.error?.message || 'Erro inesperado na interface.'}
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) {
                  this.props.onReset();
                } else {
                  window.location.reload();
                }
              }}
              className="bg-white hover:bg-slate-50 border border-rose-300 text-rose-900 font-bold py-1.5 px-3 rounded-xl inline-flex items-center gap-1.5 shadow-hairline transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-rose-700" />
              <span>Tentar novamente</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
