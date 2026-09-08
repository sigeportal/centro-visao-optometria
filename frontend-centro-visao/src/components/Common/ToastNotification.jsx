import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastNotification({ 
  message, 
  type = 'success', 
  duration = 3500, 
  onClose 
}) {
  useEffect(() => {
    if (!message || !duration || duration <= 0) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  const content = (
    <div 
      className={`fixed top-5 right-5 z-[9999999] max-w-sm sm:max-w-md px-4 py-3 rounded-xl border shadow-modal flex items-center space-x-3 text-xs font-bold animate-fade-in backdrop-blur-md transition-all ${
        isSuccess 
          ? 'bg-[#02241d]/95 text-forest-50 border-forest-600/60 shadow-forest-950/30' 
          : isError 
            ? 'bg-rose-950/95 text-rose-50 border-rose-700/60 shadow-rose-950/30' 
            : 'bg-slate-900/95 text-white border-slate-700/60 shadow-slate-950/30'
      }`} 
      role="status"
    >
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
        isSuccess ? 'bg-forest-800 text-forest-300' : isError ? 'bg-rose-800 text-rose-300' : 'bg-slate-800 text-amber-400'
      }`}>
        {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
        {isError && <AlertCircle className="w-3.5 h-3.5" />}
        {!isSuccess && !isError && <Info className="w-3.5 h-3.5" />}
      </div>
      
      <span className="flex-1 font-medium tracking-tight text-xs text-left leading-snug pr-2">
        {message}
      </span>
      
      {onClose && (
        <button 
          onClick={onClose} 
          className="text-white/60 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors ml-1 shrink-0"
          aria-label="Fechar notificação"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}
