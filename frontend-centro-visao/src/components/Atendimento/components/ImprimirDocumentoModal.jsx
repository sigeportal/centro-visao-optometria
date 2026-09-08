import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText } from 'lucide-react';
import { formatCPF, formatCNPJ, formatCEP, formatPhone } from '../../../utils/formatters';
import { obterDadosClinica } from '../../../api/configuracoes';

export default function ImprimirDocumentoModal({
  isOpen,
  onClose,
  docType,
  patient,
  glassesForm,
  contactLensForm,
  customText,
  onConfirmPrint
}) {
  const [clinicData, setClinicData] = useState({ name: '', cnpj: '', phone: '', address: '', city: '', state: '', cep: '' });

  useEffect(() => {
    if (!isOpen) return undefined;
    const controller = new AbortController();
    obterDadosClinica({ signal: controller.signal })
      .then((data) => {
        setClinicData({
          name: data.nome || data.name || '',
          cnpj: data.cnpj || '',
          phone: data.telefone || data.phone || '',
          address: data.endereco || data.address || '',
          city: data.cidade || data.city || '',
          state: data.estado || data.state || '',
          cep: data.cep || '',
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [isOpen]);

  if (!isOpen) return null;

  const addressLine = [
    clinicData.address,
    clinicData.city && clinicData.state ? `${clinicData.city} - ${clinicData.state}` : (clinicData.city || clinicData.state),
    clinicData.cep ? `CEP: ${formatCEP(clinicData.cep)}` : null,
    clinicData.phone ? `Tel/WhatsApp: ${formatPhone(clinicData.phone)}` : null,
  ].filter(Boolean).join(' • ');

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative bg-white max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-modal space-y-5 text-xs text-slate-900 my-auto font-sans print:shadow-none print:border-none print:max-w-full print:p-4 animate-fade-in">
        
        {/* Header do Documento */}
        <div className="flex items-center justify-between border-b-2 border-forest-700 pb-3.5">
          <div className="flex items-center gap-4">
            <img src="/logo-centro-visao.png" alt="Centro Visão" className="w-14 h-14 object-contain shrink-0" />
            <div>
              <h2 className="text-xl font-bold uppercase text-forest-900 tracking-wider">
                {clinicData.name || 'CENTRO VISÃO'}
              </h2>
              {clinicData.cnpj && (
                <p className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
                  CNPJ: {formatCNPJ(clinicData.cnpj)}
                </p>
              )}
              {addressLine && (
                <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                  {addressLine}
                </p>
              )}
            </div>
          </div>

          <div className="text-right print:hidden">
            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Identificação do Paciente */}
        <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-wrap justify-between items-center gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Paciente</span>
            <strong className="text-sm font-bold text-slate-900">{patient?.name || 'Paciente'}</strong>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Data de Emissão</span>
            <span className="font-bold text-slate-800">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* Corpo do Documento de acordo com o tipo */}
        {docType === 'Receita de Óculos' && glassesForm && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase text-slate-900 text-center border-b border-slate-200 pb-2">
              PRESCRIÇÃO ÓPTICA REFRATIVA (ÓCULOS)
            </h3>

            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-hairline">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 font-sans font-bold text-slate-700 uppercase text-[10px]">
                    <th className="p-2.5 border-r border-slate-200">Olho</th>
                    <th className="p-2.5 border-r border-slate-200">Esférico</th>
                    <th className="p-2.5 border-r border-slate-200">Cilíndrico</th>
                    <th className="p-2.5 border-r border-slate-200">Eixo</th>
                    <th className="p-2.5 border-r border-slate-200">DNP</th>
                    <th className="p-2.5">Adição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 font-sans font-bold text-forest-800 border-r border-slate-200">OD</td>
                    <td className="p-2.5 border-r border-slate-200 font-bold">{glassesForm.od?.esf || 'Plano'}</td>
                    <td className="p-2.5 border-r border-slate-200">{glassesForm.od?.cil || '—'}</td>
                    <td className="p-2.5 border-r border-slate-200">{glassesForm.od?.eixo ? `${glassesForm.od.eixo}°` : '—'}</td>
                    <td className="p-2.5 border-r border-slate-200">{glassesForm.od?.dnp || '—'}</td>
                    <td className="p-2.5 font-bold" rowSpan={2}>{glassesForm.od?.adicao || '—'}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-bold text-forest-800 border-r border-slate-200">OE</td>
                    <td className="p-2.5 border-r border-slate-200 font-bold">{glassesForm.oe?.esf || 'Plano'}</td>
                    <td className="p-2.5 border-r border-slate-200">{glassesForm.oe?.cil || '—'}</td>
                    <td className="p-2.5 border-r border-slate-200">{glassesForm.oe?.eixo ? `${glassesForm.oe.eixo}°` : '—'}</td>
                    <td className="p-2.5 border-r border-slate-200">{glassesForm.oe?.dnp || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5 text-[11px]">
              <div><strong>Lente Recomendada:</strong> {glassesForm.tipoLente || 'Multifocal Digital'}</div>
              <div><strong>Tratamentos:</strong> {glassesForm.tratamentos || 'Antirreflexo'}</div>
              {glassesForm.observacoes && <div><strong>Obs:</strong> {glassesForm.observacoes}</div>}
            </div>
          </div>
        )}

        {docType !== 'Receita de Óculos' && (
          <div className="p-5 border border-slate-200/80 rounded-xl bg-white font-serif text-sm leading-relaxed whitespace-pre-wrap shadow-hairline">
            {customText || 'Texto do documento...'}
          </div>
        )}

        {/* Rodapé e Assinatura */}
        <div className="pt-8 flex items-end justify-between border-t border-slate-200">
          <div className="text-slate-400 text-[10px]">
            Validade da prescrição: 12 meses a contar da data de emissão.
          </div>
          <div className="text-center w-64 border-t border-slate-800 pt-1.5">
            <p className="font-bold text-slate-900 text-xs">Dr. Adelino Souza / Dra. Katiuscia Almeida</p>
            <p className="text-[10px] text-slate-400">Optometrista Responsável • CBOO 45.892</p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 print:hidden">
          <button 
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Voltar
          </button>
          <button 
            type="button"
            onClick={onConfirmPrint}
            className="btn-primary"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Confirmar Impressão</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

