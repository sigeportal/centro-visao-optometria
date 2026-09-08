import React, { useState } from 'react';
import { Save, Printer, History } from 'lucide-react';
import { formatDiopter, formatAxis } from '../../../utils/formatters';

export default function PrescricaoLentesTab({
  contactLensForm,
  setContactLensForm,
  onSave,
  onPrint
}) {
  const [subTab, setSubTab] = useState('inicio');

  return (
    <div className="clinical-panel shadow-sm animate-fade-in text-xs overflow-hidden">
      
      {/* Subtab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 p-3.5 sm:p-4 bg-slate-50/80">
        <div className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => setSubTab('inicio')}
            className={`px-3.5 py-1.5 font-bold text-xs rounded-lg transition-all ${
              subTab === 'inicio'
                ? 'bg-forest-700 text-white shadow-hairline'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Prescrição
          </button>
          <button
            type="button"
            onClick={() => setSubTab('historico')}
            className={`px-3.5 py-1.5 font-bold text-xs rounded-lg transition-all ${
              subTab === 'historico'
                ? 'bg-forest-700 text-white shadow-hairline'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Histórico
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onPrint}
            className="clinical-button-secondary py-1.5 px-3 text-xs flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimir Lentes</span>
          </button>
          <button
            type="button"
            onClick={onSave}
            className="clinical-button-primary py-1.5 px-3.5 text-xs flex items-center space-x-1.5 shadow-hairline"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Lentes</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Tabela de Graus para Lentes */}
        <div className="border border-slate-200/80 rounded-2xl overflow-x-auto shadow-hairline">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 font-bold text-slate-600 uppercase text-[11px]">
                <th className="py-3 px-4 text-left border-r border-slate-200/80">Olho</th>
                <th className="py-3 px-3 border-r border-slate-200/80">Esférico (D)</th>
                <th className="py-3 px-3 border-r border-slate-200/80">Cilíndrico (D)</th>
                <th className="py-3 px-3 border-r border-slate-200/80">Eixo (°)</th>
                <th className="py-3 px-3">Acuidade Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr className="hover:bg-forest-50/10">
                <td className="py-3 px-4 text-left font-sans font-bold text-forest-800 border-r border-slate-200/80">
                  OD (Direito)
                </td>
                <td className="p-1.5 border-r border-slate-200/80">
                  <input
                    type="number"
                    step="0.25"
                    value={contactLensForm?.od?.esf || ''}
                    onChange={(e) => setContactLensForm({ ...contactLensForm, od: { ...contactLensForm?.od, esf: e.target.value } })}
                    onBlur={(e) => setContactLensForm({ ...contactLensForm, od: { ...contactLensForm?.od, esf: formatDiopter(e.target.value) } })}
                    className="clinical-input text-center font-mono font-bold"
                  />
                </td>
                <td className="p-1.5 border-r border-slate-200/80">
                  <input
                    type="number"
                    step="0.25"
                    value={contactLensForm?.od?.cil || ''}
                    onChange={(e) => setContactLensForm({ ...contactLensForm, od: { ...contactLensForm?.od, cil: e.target.value } })}
                    onBlur={(e) => setContactLensForm({ ...contactLensForm, od: { ...contactLensForm?.od, cil: formatDiopter(e.target.value) } })}
                    className="clinical-input text-center font-mono font-bold"
                  />
                </td>
                <td className="p-1.5 border-r border-slate-200/80">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="180"
                    value={contactLensForm?.od?.eixo || ''}
                    onChange={(e) => setContactLensForm({ ...contactLensForm, od: { ...contactLensForm?.od, eixo: e.target.value } })}
                    onBlur={(e) => setContactLensForm({ ...contactLensForm, od: { ...contactLensForm?.od, eixo: formatAxis(e.target.value) } })}
                    className="clinical-input text-center font-mono font-bold"
                  />
                </td>
                <td className="p-1.5">
                  <input
                    type="text"
                    value={contactLensForm?.od?.av || ''}
                    onChange={(e) => setContactLensForm({ ...contactLensForm, od: { ...contactLensForm?.od, av: e.target.value } })}
                    className="clinical-input text-center font-mono font-bold"
                  />
                </td>
              </tr>

              <tr className="hover:bg-forest-50/10">
                <td className="py-3 px-4 text-left font-sans font-bold text-forest-800 border-r border-slate-200/80">
                  OE (Esquerdo)
                </td>
                <td className="p-1.5 border-r border-slate-200/80">
                  <input
                    type="number"
                    step="0.25"
                    value={contactLensForm?.oe?.esf || ''}
                    onChange={(e) => setContactLensForm({ ...contactLensForm, oe: { ...contactLensForm?.oe, esf: e.target.value } })}
                    onBlur={(e) => setContactLensForm({ ...contactLensForm, oe: { ...contactLensForm?.oe, esf: formatDiopter(e.target.value) } })}
                    className="clinical-input text-center font-mono font-bold"
                  />
                </td>
                <td className="p-1.5 border-r border-slate-200/80">
                  <input
                    type="number"
                    step="0.25"
                    value={contactLensForm?.oe?.cil || ''}
                    onChange={(e) => setContactLensForm({ ...contactLensForm, oe: { ...contactLensForm?.oe, cil: e.target.value } })}
                    onBlur={(e) => setContactLensForm({ ...contactLensForm, oe: { ...contactLensForm?.oe, cil: formatDiopter(e.target.value) } })}
                    className="clinical-input text-center font-mono font-bold"
                  />
                </td>
                <td className="p-1.5 border-r border-slate-200/80">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="180"
                    value={contactLensForm?.oe?.eixo || ''}
                    onChange={(e) => setContactLensForm({ ...contactLensForm, oe: { ...contactLensForm?.oe, eixo: e.target.value } })}
                    onBlur={(e) => setContactLensForm({ ...contactLensForm, oe: { ...contactLensForm?.oe, eixo: formatAxis(e.target.value) } })}
                    className="clinical-input text-center font-mono font-bold"
                  />
                </td>
                <td className="p-1.5">
                  <input
                    type="text"
                    value={contactLensForm?.oe?.av || ''}
                    onChange={(e) => setContactLensForm({ ...contactLensForm, oe: { ...contactLensForm?.oe, av: e.target.value } })}
                    className="clinical-input text-center font-mono font-bold"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modelo e Cuidados */}
        <div className="space-y-3.5">
          <div>
            <label className="clinical-label">
              Tipo, Curva Base (CB), Diâmetro (DIA) e Fabricante
            </label>
            <input
              type="text"
              value={contactLensForm?.lente || ''}
              onChange={(e) => setContactLensForm({ ...contactLensForm, lente: e.target.value })}
              className="clinical-input font-medium"
            />
          </div>

          <div>
            <label className="clinical-label">
              Instruções de Higiene, Desinfecção e Uso
            </label>
            <textarea
              rows={3}
              value={contactLensForm?.observacoes || ''}
              onChange={(e) => setContactLensForm({ ...contactLensForm, observacoes: e.target.value })}
              className="clinical-input p-3"
            />
          </div>
        </div>
      </div>

    </div>
  );
}

