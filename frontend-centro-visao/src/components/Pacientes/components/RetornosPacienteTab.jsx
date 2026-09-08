import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, Loader2, MessageSquare, RefreshCw, Stethoscope, PhoneCall } from 'lucide-react';
import { listarRetornosPaciente } from '../../../api/pacientes';
import { obterDadosClinica } from '../../../api/configuracoes';
import { 
  buildReturnWhatsAppMessage, 
  generateNewConsultationMessage, 
  buildWhatsAppLink, 
  formatPhone, 
  formatCEP 
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

function dateOnly(value) {
  const date = parseDateOnly(value);
  if (date) {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }
  return value ? String(value) : 'Não informada';
}

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

function dateTime(value) {
  if (!value) return 'Não informado';
  const text = String(value).replace('T', ' ');
  return text.length > 16 ? text.slice(0, 16) : text;
}

function errorMessage(error) {
  return error?.response?.data?.error?.message || error?.message || 'Não foi possível carregar os retornos.';
}

const toBool = (val) => val === 1 || val === '1' || val === true || val === 'true';

export default function RetornosPacienteTab({ patient }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [clinicData, setClinicData] = useState({ name: '', cnpj: '', phone: '', address: '', city: '', state: '', cep: '' });

  useEffect(() => {
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
  }, []);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const data = await listarRetornosPaciente(patient.id, { signal });
      if (!signal.aborted) setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!signal.aborted) setError(errorMessage(err));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [patient.id]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  const nextReturn = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return items
      .filter((item) => (toBool(item.tem_retorno) || ((item.tem_retorno == null || item.tem_retorno === '') && item.data_retorno)) && item.situacao === 'retorno_programado' && item.data_retorno)
      .map((item) => ({ item, date: parseDateOnly(item.data_retorno) }))
      .filter(({ date }) => date && !Number.isNaN(date.getTime()) && date >= today)
      .sort((left, right) => left.date - right.date)[0]?.item;
  }, [items]);

  const nextNewConsultation = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return items
      .filter((item) => (toBool(item.tem_nova_consulta) || Boolean(item.nova_consulta_data)) && item.nova_consulta_data)
      .map((item) => ({ item, date: parseDateOnly(item.nova_consulta_data) }))
      .filter(({ date }) => date && !Number.isNaN(date.getTime()) && date >= today)
      .sort((left, right) => left.date - right.date)[0]?.item;
  }, [items]);

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      <div className="clinical-panel p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Retornos e Previsões Clínicas</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Acompanhe os retornos imediatos gratuitos e as previsões de novas consultas para revisão periódica e validade dos óculos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
          className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center disabled:cursor-wait disabled:text-slate-400 transition-colors shadow-hairline"
          title="Atualizar retornos"
          aria-label="Atualizar retornos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-forest-700' : ''}`} />
        </button>
      </div>

      {/* Destaques de Próximos Atendimentos */}
      {(nextReturn || nextNewConsultation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Card Retorno Clínico Gratuito */}
          {nextReturn && (
            <div className="clinical-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-emerald-200 bg-emerald-50/40">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="clinical-label !mb-0">Próximo Retorno</span>
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Gratuito (Isento)
                    </span>
                  </div>
                  <p className="text-sm font-bold text-emerald-950 mt-0.5">{dateOnly(nextReturn.data_retorno)}</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    {nextReturn.motivo || TYPE_LABELS[nextReturn.tipo] || 'Acompanhamento imediato'}
                  </p>
                </div>
              </div>

              {patient?.phone && (
                <a
                  href={buildWhatsAppLink(
                    patient.phone,
                    buildReturnWhatsAppMessage({
                      patientName: patient.name,
                      returnDate: nextReturn.data_retorno,
                      returnType: TYPE_LABELS[nextReturn.tipo] || nextReturn.tipo,
                      reason: nextReturn.motivo,
                      doctor: nextReturn.profissional,
                      consultationDate: nextReturn.consulta_data,
                      clinicName: clinicData.name || 'Centro Visão',
                      clinicPhone: clinicData.phone ? formatPhone(clinicData.phone) : '',
                      clinicAddress: [
                        clinicData.address,
                        clinicData.city && clinicData.state ? `${clinicData.city} - ${clinicData.state}` : (clinicData.city || clinicData.state),
                        clinicData.cep ? `CEP: ${formatCEP(clinicData.cep)}` : null,
                      ].filter(Boolean).join(' - ')
                    })
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary py-1.5 px-3 text-xs shrink-0 self-start sm:self-auto bg-emerald-700 hover:bg-emerald-800"
                  title="Enviar lembrete de retorno gratuito no WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Retorno</span>
                </a>
              )}
            </div>
          )}

          {/* Card Previsão de Nova Consulta */}
          {nextNewConsultation && (
            <div className="clinical-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-blue-200 bg-blue-50/40">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="clinical-label !mb-0">Previsão Nova Consulta</span>
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      CRM / Validade
                    </span>
                  </div>
                  <p className="text-sm font-bold text-blue-950 mt-0.5">{dateOnly(nextNewConsultation.nova_consulta_data)}</p>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    {nextNewConsultation.nova_consulta_motivo || 'Revisão periódica / Validade dos óculos'}
                  </p>
                </div>
              </div>

              {patient?.phone && (
                <a
                  href={buildWhatsAppLink(
                    patient.phone,
                    generateNewConsultationMessage({
                      patientName: patient.name,
                      estimatedDate: nextNewConsultation.nova_consulta_data,
                      reason: nextNewConsultation.nova_consulta_motivo,
                      doctor: nextNewConsultation.profissional,
                      consultationDate: nextNewConsultation.consulta_data,
                      clinicName: clinicData.name || 'Centro Visão',
                      clinicPhone: clinicData.phone ? formatPhone(clinicData.phone) : '',
                      clinicAddress: [
                        clinicData.address,
                        clinicData.city && clinicData.state ? `${clinicData.city} - ${clinicData.state}` : (clinicData.city || clinicData.state),
                        clinicData.cep ? `CEP: ${formatCEP(clinicData.cep)}` : null,
                      ].filter(Boolean).join(' - ')
                    })
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary py-1.5 px-3 text-xs shrink-0 self-start sm:self-auto bg-blue-700 hover:bg-blue-800"
                  title="Enviar mensagem de captação para nova consulta no WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp CRM</span>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3.5 flex items-start justify-between gap-3 text-xs text-rose-900 shadow-hairline" role="alert">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="font-bold underline hover:text-rose-950 shrink-0">
            Tentar novamente
          </button>
        </div>
      )}

      <div className="clinical-table overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr>
              <th className="py-3 px-4">Previsão / Procedimento</th>
              <th className="py-3 px-4">Indicação / Conduta</th>
              <th className="py-3 px-4">Consulta de origem</th>
              <th className="py-3 px-4">Profissional</th>
              <th className="py-3 px-4">Auditoria</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {!loading && items.map((item) => {
              const hasRetorno = (toBool(item.tem_retorno) || ((item.tem_retorno == null || item.tem_retorno === '') && item.data_retorno)) && item.data_retorno;
              const hasNova = (toBool(item.tem_nova_consulta) || Boolean(item.nova_consulta_data)) && item.nova_consulta_data;

              return (
                <tr key={item.id} className="hover:bg-forest-50/20 transition-colors align-top">
                  <td className="py-3.5 px-4 space-y-2">
                    {hasRetorno && (
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <CalendarClock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Retorno: {dateOnly(item.data_retorno)}</span>
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Gratuito (Isento)
                        </span>
                      </div>
                    )}

                    {hasNova && (
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <PhoneCall className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          <span>Nova Consulta: {dateOnly(item.nova_consulta_data)}</span>
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          Nova Consulta (CRM)
                        </span>
                      </div>
                    )}

                    {!hasRetorno && !hasNova && (
                      <div className="text-slate-500 font-medium">
                        {SITUATION_LABELS[item.situacao] || item.situacao || 'Sem agendamento previsto'}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono">Registro #{item.id}</div>
                  </td>

                  <td className="py-3.5 px-4 space-y-2">
                    {hasRetorno && (
                      <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          Retorno • {TYPE_LABELS[item.tipo] || item.tipo || 'Acompanhamento'}
                        </div>
                        <p className="text-slate-800 font-medium mt-0.5">{item.motivo || 'Sem motivo detalhado'}</p>
                        {item.observacao && (
                          <p className="text-[11px] text-slate-500 mt-1 whitespace-pre-wrap">{item.observacao}</p>
                        )}
                      </div>
                    )}

                    {hasNova && (
                      <div className="p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                          Nova Consulta • Indicação
                        </div>
                        <p className="text-slate-800 font-medium mt-0.5">{item.nova_consulta_motivo || 'Revisão periódica / Validade dos óculos'}</p>
                        {item.nova_consulta_observacao && (
                          <p className="text-[11px] text-slate-500 mt-1 whitespace-pre-wrap">{item.nova_consulta_observacao}</p>
                        )}
                      </div>
                    )}

                    {!hasRetorno && !hasNova && (
                      <p className="text-slate-500 italic">Nenhum detalhe adicional informado.</p>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="font-mono font-bold">Consulta #{item.consulta_id}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Realizada em {dateOnly(item.consulta_data)}</div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-800 font-semibold">{item.profissional || 'Não informado'}</td>

                  <td className="py-3.5 px-4 text-[11px] text-slate-500">
                    <div>Criado por: <strong className="text-slate-700">{item.criado_por_login || item.criado_por || 'Não informado'}</strong></div>
                    <div className="mt-0.5">Em: {dateTime(item.criado_em)}</div>
                    {item.atualizado_em && (
                      <>
                        <div className="mt-1">Alterado por: <strong className="text-slate-700">{item.atualizado_por_login || item.atualizado_por || 'Não informado'}</strong></div>
                        <div className="mt-0.5">Em: {dateTime(item.atualizado_em)}</div>
                      </>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      {hasRetorno && patient?.phone && (
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
                              clinicName: clinicData.name || 'Centro Visão',
                              clinicPhone: clinicData.phone ? formatPhone(clinicData.phone) : '',
                              clinicAddress: [
                                clinicData.address,
                                clinicData.city && clinicData.state ? `${clinicData.city} - ${clinicData.state}` : (clinicData.city || clinicData.state),
                                clinicData.cep ? `CEP: ${formatCEP(clinicData.cep)}` : null,
                              ].filter(Boolean).join(' - ')
                            })
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-all inline-flex items-center gap-1 font-bold text-[10.5px] shadow-hairline whitespace-nowrap"
                          title="WhatsApp Retorno Gratuito"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp Retorno</span>
                        </a>
                      )}

                      {hasNova && patient?.phone && (
                        <a
                          href={buildWhatsAppLink(
                            patient.phone,
                            generateNewConsultationMessage({
                              patientName: patient.name,
                              estimatedDate: item.nova_consulta_data,
                              reason: item.nova_consulta_motivo,
                              doctor: item.profissional,
                              consultationDate: item.consulta_data,
                              clinicName: clinicData.name || 'Centro Visão',
                              clinicPhone: clinicData.phone ? formatPhone(clinicData.phone) : '',
                              clinicAddress: [
                                clinicData.address,
                                clinicData.city && clinicData.state ? `${clinicData.city} - ${clinicData.state}` : (clinicData.city || clinicData.state),
                                clinicData.cep ? `CEP: ${formatCEP(clinicData.cep)}` : null,
                              ].filter(Boolean).join(' - ')
                            })
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-all inline-flex items-center gap-1 font-bold text-[10.5px] shadow-hairline whitespace-nowrap"
                          title="WhatsApp Captação Nova Consulta"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                          <span>WhatsApp CRM</span>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && (
          <div className="min-h-40 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando retornos e previsões...</span>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="min-h-40 flex flex-col items-center justify-center text-center px-4 py-8">
            <Stethoscope className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">Nenhum retorno ou previsão registrado para este paciente</p>
            <p className="text-[11px] text-slate-400 mt-1">Os dados serão criados ao finalizar uma consulta.</p>
          </div>
        )}
      </div>
    </div>
  );
}
