import React from 'react';
import { Eye, Glasses, FileText } from 'lucide-react';

export default function ProntuarioClinicoTab({ patient }) {
  return (
    <div className="space-y-4 animate-fade-in text-xs">
      
      {/* Top Banner */}
      <div className="clinical-panel p-4 sm:p-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">
            Prontuário Eletrônico & Evolução Refrativa
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Dados clínicos consolidados, histórico refrativo e comparação de acuidade visual.
          </p>
        </div>
      </div>

      {/* Refração Atual OD / OE */}
      <div className="clinical-panel p-5 sm:p-6 space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
            <Glasses className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 tracking-wide uppercase">
            Última Refração Subjetiva Prescrita (14/08/2026)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Olho Direito */}
          <div className="p-4 bg-slate-50/50 border border-slate-200/80 rounded-xl space-y-2.5">
            <span className="font-mono font-bold text-xs text-forest-900 uppercase block">
              Olho Direito (OD)
            </span>
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-hairline">
                <span className="text-[9.5px] text-slate-400 block font-sans font-semibold">Esférico</span>
                <span className="font-bold text-sm text-slate-900">-1.50</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-hairline">
                <span className="text-[9.5px] text-slate-400 block font-sans font-semibold">Cilíndrico</span>
                <span className="font-bold text-sm text-slate-900">-0.75</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-hairline">
                <span className="text-[9.5px] text-slate-400 block font-sans font-semibold">Eixo</span>
                <span className="font-bold text-sm text-forest-800">180°</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 text-slate-600">
              <span>Acuidade Visual (Longe): <strong className="text-slate-900">20/20</strong></span>
              <span>Adição (Perto): <strong className="text-slate-900">+1.75</strong></span>
            </div>
          </div>

          {/* Olho Esquerdo */}
          <div className="p-4 bg-slate-50/50 border border-slate-200/80 rounded-xl space-y-2.5">
            <span className="font-mono font-bold text-xs text-forest-900 uppercase block">
              Olho Esquerdo (OE)
            </span>
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-hairline">
                <span className="text-[9.5px] text-slate-400 block font-sans font-semibold">Esférico</span>
                <span className="font-bold text-sm text-slate-900">-1.25</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-hairline">
                <span className="text-[9.5px] text-slate-400 block font-sans font-semibold">Cilíndrico</span>
                <span className="font-bold text-sm text-slate-900">-0.50</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-hairline">
                <span className="text-[9.5px] text-slate-400 block font-sans font-semibold">Eixo</span>
                <span className="font-bold text-sm text-forest-800">175°</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 text-slate-600">
              <span>Acuidade Visual (Longe): <strong className="text-slate-900">20/20</strong></span>
              <span>Adição (Perto): <strong className="text-slate-900">+1.75</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Biomicroscopia & Fundo de Olho */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="clinical-panel p-4 sm:p-5 space-y-2 text-xs">
          <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Eye className="w-4 h-4 text-forest-700" />
            <span>Biomicroscopia Ocular</span>
          </h4>
          <p className="text-slate-700 leading-relaxed text-[11.5px]">
            Córnea transparente sem opacidades, câmara anterior ampla e límpida, íris íntegra e reativa, cristalino transparente sem sinais de catarata.
          </p>
        </div>

        <div className="clinical-panel p-4 sm:p-5 space-y-2 text-xs">
          <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-2 pb-2 border-b border-slate-100">
            <FileText className="w-4 h-4 text-forest-700" />
            <span>Oftalmoscopia / Fundo de Olho</span>
          </h4>
          <p className="text-slate-700 leading-relaxed text-[11.5px]">
            Papila óptica com bordas nítidas, coloração habitual, escavação fisiológica 0.3. Mácula com brilho foveal preservado. Vasos retinianos com calibre regular.
          </p>
        </div>
      </div>

    </div>
  );
}

