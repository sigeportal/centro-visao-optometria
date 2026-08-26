import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Headphones, 
  X, 
  MessageCircle, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink,
  LifeBuoy
} from 'lucide-react';

export default function SuporteModal({ isOpen, onClose }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen) return null;

  const WHATSAPP_NUMBER = "(67) 3467-3694";
  const WHATSAPP_CLEAN = "556734673694";
  const SUPPORT_EMAIL = "sigeportal@gmail.com";

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white w-full max-w-md flex flex-col rounded-2xl border border-slate-200/90 shadow-modal overflow-hidden my-auto animate-fade-in text-xs">
        
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-[#022b22] via-[#033b2e] to-[#022b22] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-forest-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-forest-850 border border-forest-700/80 text-amber-400 flex items-center justify-center shrink-0 shadow-hairline">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                ATENDIMENTO & AJUDA
              </span>
              <h3 className="font-bold text-white text-base tracking-tight mt-0.5">
                Suporte Técnico
              </h3>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-forest-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 bg-white overflow-y-auto">
          
          <div className="p-3.5 bg-forest-50/70 border border-forest-200/80 rounded-2xl flex items-start gap-3">
            <LifeBuoy className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs text-forest-900">
                Como podemos ajudar?
              </h4>
              <p className="text-[11.5px] text-forest-800/80 mt-0.5 leading-relaxed">
                Problemas técnicos, dúvidas sobre o sistema e solicitações devem ser resolvidos diretamente através dos nossos canais de suporte via <strong>WhatsApp</strong> ou <strong>E-mail</strong>.
              </p>
            </div>
          </div>

          {/* Opção 1: WhatsApp */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3 shadow-hairline">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0 font-bold">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="clinical-label !mb-0">Canal WhatsApp</span>
                  <span className="font-mono font-bold text-sm text-slate-900 block">
                    {WHATSAPP_NUMBER}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(WHATSAPP_NUMBER, 'whatsapp')}
                className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all text-[11px] flex items-center gap-1 font-semibold"
                title="Copiar número"
              >
                {copiedField === 'whatsapp' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-forest-700" />
                    <span className="text-forest-700">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <a
              href={`https://wa.me/${WHATSAPP_CLEAN}?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20no%20sistema%20Centro%20Vis%C3%A3o.`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-hairline flex items-center justify-center gap-2 transition-colors text-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Iniciar conversa no WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          {/* Opção 2: E-mail */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3 shadow-hairline">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 border border-sky-200 flex items-center justify-center shrink-0 font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="clinical-label !mb-0">Canal por E-mail</span>
                  <span className="font-mono font-bold text-sm text-slate-900 block truncate max-w-[200px]">
                    {SUPPORT_EMAIL}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(SUPPORT_EMAIL, 'email')}
                className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all text-[11px] flex items-center gap-1 font-semibold"
                title="Copiar e-mail"
              >
                {copiedField === 'email' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-forest-700" />
                    <span className="text-forest-700">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Suporte%20Centro%20Vis%C3%A3o%20Optometria`}
              className="w-full py-2 px-4 bg-forest-700 hover:bg-forest-800 active:bg-forest-900 text-white font-bold rounded-xl shadow-hairline flex items-center justify-center gap-2 transition-colors text-xs"
            >
              <Mail className="w-4 h-4" />
              <span>Enviar e-mail para o suporte</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-1.5 px-4"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
