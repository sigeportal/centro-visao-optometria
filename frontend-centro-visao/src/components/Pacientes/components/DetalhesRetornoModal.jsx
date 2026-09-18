import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, 
  CalendarClock, 
  Clock, 
  History, 
  MessageSquare, 
  Stethoscope, 
  User, 
  X 
} from 'lucide-react';
import { 
  buildReturnWhatsAppMessage, 
  generateNewConsultationMessage, 
  buildWhatsAppLink, 
  formatPhone, 
  formatCEP, 
  formatCPF 
} from '../../../utils/formatters';

const TYPE_LABELS = {
  data_definida: 'Data prevista',
  conforme_necessidade: 'Conforme necessidade',
  acompanhamento: 'Acompanhamento clínico',
  revisao: 'Revisão',
  adaptacao: 'Adaptação',
  outro: 'Outro',
};

const SITUATION_LABELS = {
  retorno_programado: 'Retorno indicado',
  sem_retorno: 'Sem retorno programado',
  recusado_pelo_paciente: 'Paciente não aceitou o retorno',
};

function parseDateOnly(value) {
  const text = String(value || '').trim();
  const isoMatch = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const slashMatch = text.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})/);
  if (!slashMatch) return null;

  const first = Number(slashMatch[1]);
  const second = Number(slashMatch[2]);
  const month = first > 12 ? second : first;
  const day = first > 12 ? first : second;
  return new Date(Number(slashMatch[3]), month - 1, day);
}

function dateOnly(value) {
  const date = parseDateOnly(value);
  if (date) {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }
  return value ? String(value) : 'Não informada';
}

function dateTime(value) {
  if (!value) return 'Não informado';
  const text = String(value).replace('T', ' ');
  return text.length > 16 ? text.slice(0, 16) : text;
}

function getTimingBadge(dateValue) {
  if (!dateValue) return null;
  const d = parseDateOnly(dateValue);
  if (!d || Number.isNaN(d.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Prazo decorrido há ${Math.abs(diffDays)} dia(s)`,
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }
  if (diffDays === 0) {
    return {
      label: 'Previsto para hoje',
      className: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
    };
  }
  if (diffDays === 1) {
    return {
      label: 'Previsto para amanhã',
      className: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }
  if (diffDays <= 30) {
    return {
      label: `Previsto em ${diffDays} dias`,
      className: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }
  return {
    label: 'Programado',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

const toBool = (val) => val === 1 || val === '1' || val === true || val === 'true';

export default function DetalhesRetornoModal({
  isOpen,
  onClose,
  item,
  patient,
  clinicData,
  onSchedule,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const hasRetorno = (toBool(item.tem_retorno) || ((item.tem_retorno == null || item.tem_retorno === '') && item.data_retorno)) && item.data_retorno;
  const hasNova = (toBool(item.tem_nova_consulta) || Boolean(item.nova_consulta_data)) && item.nova_consulta_data;

  const returnTiming = hasRetorno ? getTimingBadge(item.data_retorno) : null;
  const crmTiming = hasNova ? getTimingBadge(item.nova_consulta_data) : null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative bg-white rounded-2xl border border-slate-200/90 w-full max-w-2xl shadow-modal flex flex-col max-h-[90vh] my-auto overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-detalhes-titulo"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white p-4 sm:p-5 flex items-center justify-between border-b border-forest-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-forest-800 border border-forest-600 flex items-center justify-center text-emerald-300 font-bold shadow-hairline">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-detalhes-titulo" className="font-bold text-sm tracking-tight text-white">
                Detalhes do Retorno e Previsão Clínica
              </h3>
              <p className="text-[11px] text-forest-200/80">
                Registro #{item.id} • Origem: Consulta #{item.consulta_id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-forest-200/70 hover:text-white transition-colors"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 bg-white overflow-y-auto flex-1 text-xs">
          {/* Card Paciente e Consulta de Origem */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Paciente</span>
                  <span className="font-bold text-slate-900 text-xs">{patient?.name || 'Paciente não identificado'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                {patient?.cpf && <span>CPF: {formatCPF(patient.cpf)}</span>}
                {patient?.phone && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{formatPhone(patient.phone)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-0.5">
              <div className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                <span>Profissional: <strong className="text-slate-800 font-semibold">{item.profissional || 'Não informado'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Consulta realizada em: <strong className="text-slate-800 font-semibold">{dateOnly(item.consulta_data)}</strong></span>
              </div>
            </div>
          </div>

          {/* Card Retorno Clínico Gratuito (se houver) */}
          {hasRetorno && (
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Retorno Clínico
                  </span>
                  {returnTiming && (
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-semibold border ${returnTiming.className}`}>
                      {returnTiming.label}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-emerald-800 font-bold block">Data Prevista</span>
                  <span className="text-sm font-bold text-emerald-950">{dateOnly(item.data_retorno)}</span>
                </div>
              </div>

              <div className="space-y-2 text-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Conduta / Modalidade</span>
                  <p className="font-semibold text-xs mt-0.5">{TYPE_LABELS[item.tipo] || item.tipo || 'Acompanhamento imediato'}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Motivo Clínico</span>
                  <p className="font-medium text-xs mt-0.5 text-slate-700">{item.motivo || 'Nenhum motivo detalhado informado.'}</p>
                </div>

                {item.observacao && (
                  <div className="bg-white/80 border border-emerald-200/80 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">Observações Clínicas</span>
                    <p className="text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed">{item.observacao}</p>
                  </div>
                )}
              </div>

              {/* Ações do Retorno */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-emerald-200/60">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSchedule('retorno', item);
                  }}
                  className="btn-primary py-1.5 px-3.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-hairline transition-colors"
                  title="Abrir agendamento de retorno na agenda"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar Retorno na Agenda</span>
                </button>

                {patient?.phone && (
                  <a
                    href={buildWhatsAppLink(
                      patient.phone,
                      buildReturnWhatsAppMessage({
                        patientName: patient.name,
                        returnDate: item.data_retorno,
                        returnType: TYPE_LABELS[item.tipo] || item.tipo,
                        reason: item.motivo,
                        doctor: item.profissional,
                        consultationDate: item.consulta_data,
                        clinicName: clinicData?.name || 'Centro Visão',
                        clinicPhone: clinicData?.phone ? formatPhone(clinicData.phone) : '',
                        clinicAddress: [
                          clinicData?.address,
                          clinicData?.city && clinicData?.state ? `${clinicData.city} - ${clinicData.state}` : (clinicData?.city || clinicData?.state),
                          clinicData?.cep ? `CEP: ${formatCEP(clinicData.cep)}` : null,
                        ].filter(Boolean).join(' - ')
                      })
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-3 text-xs rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-semibold flex items-center gap-1.5 transition-colors shadow-hairline"
                    title="Enviar lembrete de retorno gratuito no WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Retorno</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Card Previsão de Nova Consulta (CRM) (se houver) */}
          {hasNova && (
            <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                    Nova Consulta (CRM)
                  </span>
                  {crmTiming && (
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-semibold border ${crmTiming.className}`}>
                      {crmTiming.label}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-amber-800 font-bold block">Previsão Estipulada</span>
                  <span className="text-sm font-bold text-amber-950">{dateOnly(item.nova_consulta_data)}</span>
                </div>
              </div>

              <div className="space-y-2 text-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Indicação / Objetivo</span>
                  <p className="font-semibold text-xs mt-0.5">{item.nova_consulta_motivo || 'Revisão periódica / Validade dos óculos'}</p>
                </div>

                {item.nova_consulta_observacao && (
                  <div className="bg-white/80 border border-amber-200/80 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block mb-1">Observações de CRM</span>
                    <p className="text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed">{item.nova_consulta_observacao}</p>
                  </div>
                )}
              </div>

              {/* Ações do CRM */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSchedule('crm', item);
                  }}
                  className="btn-primary py-1.5 px-3.5 text-xs bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-hairline transition-colors"
                  title="Abrir agendamento de nova consulta na agenda"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar CRM na Agenda</span>
                </button>

                {patient?.phone && (
                  <a
                    href={buildWhatsAppLink(
                      patient.phone,
                      generateNewConsultationMessage({
                        patientName: patient.name,
                        estimatedDate: item.nova_consulta_data,
                        reason: item.nova_consulta_motivo,
                        doctor: item.profissional,
                        consultationDate: item.consulta_data,
                        clinicName: clinicData?.name || 'Centro Visão',
                        clinicPhone: clinicData?.phone ? formatPhone(clinicData.phone) : '',
                        clinicAddress: [
                          clinicData?.address,
                          clinicData?.city && clinicData?.state ? `${clinicData.city} - ${clinicData.state}` : (clinicData?.city || clinicData?.state),
                          clinicData?.cep ? `CEP: ${formatCEP(clinicData.cep)}` : null,
                        ].filter(Boolean).join(' - ')
                      })
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-3 text-xs rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-amber-800 font-semibold flex items-center gap-1.5 transition-colors shadow-hairline"
                    title="Enviar mensagem de captação para nova consulta no WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>WhatsApp CRM</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Situação caso não tenha agendamento */}
          {!hasRetorno && !hasNova && (
            <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-4 text-center text-slate-500">
              <p className="font-semibold text-slate-700">Situação: {SITUATION_LABELS[item.situacao] || item.situacao || 'Sem agendamento previsto'}</p>
              <p className="text-[11px] text-slate-400 mt-1">Nenhum retorno ou nova consulta foi registrado nesta consulta.</p>
            </div>
          )}

          {/* Card de Auditoria e Rastreabilidade */}
          <div className="border border-slate-200 rounded-xl bg-slate-50/70 p-3.5 space-y-2 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-600 text-[10px]">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Auditoria e Rastreabilidade do Registro</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white border border-slate-200/80 rounded-lg p-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Criação do Registro</span>
                <p className="text-slate-800 font-semibold mt-0.5">
                  Por: <span className="text-slate-900">{item.criado_por_login || item.criado_por || 'Sistema'}</span>
                </p>
                <p className="text-slate-500 mt-0.5">Em: {dateTime(item.criado_em)}</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-lg p-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Última Alteração</span>
                {item.atualizado_em ? (
                  <>
                    <p className="text-slate-800 font-semibold mt-0.5">
                      Por: <span className="text-slate-900">{item.atualizado_por_login || item.atualizado_por || 'Sistema'}</span>
                    </p>
                    <p className="text-slate-500 mt-0.5">Em: {dateTime(item.atualizado_em)}</p>
                  </>
                ) : (
                  <p className="text-slate-400 italic mt-0.5">Nenhuma alteração registrada</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors text-xs shadow-hairline"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
