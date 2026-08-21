import { useMemo } from 'react';
import {
  AlertCircle,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Stethoscope,
} from 'lucide-react';
import { isConsultationFinished } from '../../../domain/consultas';

function formatDate(date) {
  return date ? date.toLocaleDateString('pt-BR') : 'Data não informada';
}

export default function ConsultasListView({
  consultationsList,
  filterTab,
  setFilterTab,
  searchTerm,
  setSearchTerm,
  onOpenConsultation,
  onRefresh,
  loading = false,
  errorMessage = '',
  canOpenClinical = false,
}) {
  const filteredList = useMemo(() => consultationsList.filter((consultation) => {
    const today = new Date();
    if (filterTab === 'hoje' && consultation.dateIso !== [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-')) return false;
    if (filterTab === 'finalizadas' && !isConsultationFinished(consultation.statusCode)) return false;
    if (filterTab === 'andamento' && consultation.statusCode !== 'em_atendimento') return false;

    const query = searchTerm.trim().toLocaleLowerCase('pt-BR');
    if (!query) return true;
    return [consultation.patientName, consultation.id, consultation.doctor, consultation.procedure]
      .some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(query));
  }), [consultationsList, filterTab, searchTerm]);

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      <div className="clinical-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-forest-800 block">Atendimento Clínico</span>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">Consultas & Atendimentos</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Histórico completo de atendimentos optométricos e fila de consultório.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center disabled:cursor-wait disabled:text-slate-400 transition-colors shadow-hairline"
          title="Atualizar consultas"
          aria-label="Atualizar consultas"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-forest-700' : ''}`} />
        </button>
      </div>

      <div className="clinical-panel p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'hoje', label: 'Hoje' },
            { id: 'andamento', label: 'Em atendimento' },
            { id: 'finalizadas', label: 'Finalizadas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                filterTab === tab.id 
                  ? 'bg-forest-700 text-white shadow-hairline' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar consulta, paciente ou profissional..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="clinical-input !pl-10"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3.5 flex items-start justify-between gap-3 text-xs text-rose-900 shadow-hairline" role="alert">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button type="button" onClick={onRefresh} className="font-bold underline hover:text-rose-950 shrink-0">
            Tentar novamente
          </button>
        </div>
      )}

      <div className="clinical-table">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="py-3 px-4">Código</th>
              <th className="py-3 px-4">Paciente</th>
              <th className="py-3 px-4">Data / Horário</th>
              <th className="py-3 px-4">Profissional</th>
              <th className="py-3 px-4">Procedimento</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {!loading && filteredList.map((consultation) => {
              const finished = isConsultationFinished(consultation.statusCode);
              return (
                <tr key={consultation.id} className="hover:bg-forest-50/20 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-400">#{consultation.id}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span>{consultation.patientName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">
                    <span className="flex items-center space-x-1.5 font-bold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(consultation.date)} às {consultation.time}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-semibold">{consultation.doctor}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{consultation.procedure}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={finished ? 'badge-finished' : 'badge-waiting'}>
                      {consultation.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => onOpenConsultation(consultation)}
                        className="btn-secondary py-1.5 px-3 text-xs"
                      >
                        <span>{canOpenClinical ? (finished ? 'Ver ficha' : 'Abrir atendimento') : 'Ver resumo'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && (
          <div className="min-h-44 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando consultas...</span>
          </div>
        )}
        {!loading && !errorMessage && filteredList.length === 0 && (
          <div className="min-h-44 flex flex-col items-center justify-center text-center px-4 py-8">
            <Stethoscope className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">Nenhuma consulta encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}

