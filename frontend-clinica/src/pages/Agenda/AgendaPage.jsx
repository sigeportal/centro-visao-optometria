import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  alterarStatusAgendamento,
  atualizarAgendamento,
  cancelarAgendamento,
  criarAgendamento,
  lancarPagamentoAgendamento,
  listarAgenda,
  listarFilaEspera,
  obterAgendamento,
} from '../../api/agenda';
import { listarPacientes } from '../../api/paciente';
import {
  formatDateTime,
  parseLocalDateTime,
  toDateTimeInputValue,
  toLocalDateTimeParam,
} from '../../utils/date';

const HORAS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 .. 20:00
const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function inicioSemana(data) {
  const d = new Date(data);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function diasDaSemana(base) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatarMesAno(inicio, fim) {
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const d1 = inicio.getDate();
  const d2 = fim.getDate();
  const mes = meses[fim.getMonth()];
  const ano = fim.getFullYear();
  return `${d1} – ${d2} DE ${mes} DE ${ano}`;
}

function parseAgendaDate(valor) {
  return parseLocalDateTime(valor);
}

function paraInputDateTime(valor) {
  return toDateTimeInputValue(valor);
}

const STATUS = ['agendada', 'confirmada', 'atendida', 'cancelada', 'faltou'];
const FORM_VAZIO = {
  paciente_id: '',
  profissional_id: '',
  profissional: '',
  inicio: '',
  fim: '',
  procedimento_id: '',
  procedimento: 'Consulta',
  prioridade: 'normal',
  parceria_id: '',
  observacao: '',
  status: 'agendada',
};

export default function AgendaPage() {
  const location = useLocation();
  const [agenda, setAgenda] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [semanaBase, setSemanaBase] = useState(() => inicioSemana(new Date()));
  const [viewMode, setViewMode] = useState('semana');
  const [profFiltro, setProfFiltro] = useState('todos');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [filaEspera, setFilaEspera] = useState([]);
  const [filaAberta, setFilaAberta] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [saving, setSaving] = useState(false);

  const carregar = () => {
    const inicio = new Date(semanaBase);
    const fim = new Date(semanaBase);
    fim.setDate(fim.getDate() + 7);
    const params = {
      inicio: toLocalDateTimeParam(inicio),
      fim: toLocalDateTimeParam(fim),
      ...(statusFiltro ? { status: statusFiltro } : {}),
    };

    listarAgenda(params).then(setAgenda).catch(() => toast.error('Não foi possível carregar agenda'));
    listarPacientes().then((resultado) => setPacientes(resultado.items || [])).catch(() => {});
  };

  useEffect(() => {
    carregar();
  }, [semanaBase, statusFiltro]);

  useEffect(() => {
    const paciente = location.state?.agendarPaciente;
    if (!paciente?.pacienteId) return;

    setForm((prev) => ({
      ...prev,
      paciente_id: String(paciente.pacienteId),
    }));
    setEditId(null);
    setModalAberto(true);
    if (paciente.pacienteNome) {
      toast.success(`Agendar consulta para ${paciente.pacienteNome}`);
    }
  }, [location.state]);

  const profissionais = [...new Set(agenda.map((a) => a.profissional).filter(Boolean))];

  const agendaFiltrada = profFiltro === 'todos'
    ? agenda
    : agenda.filter((a) => a.profissional === profFiltro);

  const dias = diasDaSemana(semanaBase);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const eventosNoDia = (dia) =>
    agendaFiltrada.filter((item) => {
      const inicio = parseAgendaDate(item.inicio);
      return inicio ? inicio.toDateString() === dia.toDateString() : false;
    });

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const abrirNovoAgendamento = () => {
    setForm(FORM_VAZIO);
    setEditId(null);
    setModalAberto(true);
  };

  const abrirFilaEspera = () => {
    listarFilaEspera()
      .then((dados) => {
        setFilaEspera(dados);
        setFilaAberta(true);
      })
      .catch(() => toast.error('Não foi possível carregar a fila de espera'));
  };

  const abrirDetalhe = (item) => {
    obterAgendamento(item.id)
      .then((dados) => setDetalhe(dados))
      .catch(() => setDetalhe(item));
  };

  const abrirEditar = (item) => {
    const pac = pacientes.find((p) => String(p.id) === String(item.paciente_id) || p.nome === item.paciente);
    setForm({
      paciente_id: pac ? String(pac.id) : String(item.paciente_id || ''),
      profissional_id: String(item.profissional_id || ''),
      profissional: item.profissional || '',
      procedimento_id: String(item.procedimento_id || ''),
      inicio: paraInputDateTime(item.inicio),
      fim: paraInputDateTime(item.fim),
      procedimento: item.procedimento || 'Consulta',
      prioridade: item.prioridade || 'normal',
      parceria_id: String(item.parceria_id || ''),
      observacao: item.observacao || '',
      status: item.status || 'agendada',
    });
    setEditId(Number(item.id));
    setDetalhe(null);
    setModalAberto(true);
  };

  const salvar = (e) => {
    e.preventDefault();
    if (!form.paciente_id || !form.profissional || !form.procedimento || !form.inicio || !form.fim) {
      toast.error('Preencha paciente, profissional, procedimento, início e fim');
      return;
    }
    const inicio = parseAgendaDate(form.inicio);
    const fim = parseAgendaDate(form.fim);
    if (!inicio || !fim || fim <= inicio) {
      toast.error('O horário final deve ser maior que o inicial');
      return;
    }
    setSaving(true);
    const payload = {
      paciente_id: Number(form.paciente_id),
      profissional_id: Number(form.profissional_id || 0),
      profissional: form.profissional,
      procedimento_id: Number(form.procedimento_id || 0),
      procedimento: form.procedimento,
      data: form.inicio.slice(0, 10),
      hora_inicio: form.inicio.slice(11),
      hora_fim: form.fim.slice(11),
      inicio: toLocalDateTimeParam(inicio),
      fim: toLocalDateTimeParam(fim),
      prioridade: form.prioridade,
      parceria_id: Number(form.parceria_id || 0),
      observacao: form.observacao,
      status: form.status,
    };
    const op = editId ? atualizarAgendamento(editId, payload) : criarAgendamento(payload);
    op.then(() => {
      toast.success(editId ? 'Agendamento atualizado' : 'Agendamento criado');
      setModalAberto(false);
      carregar();
    })
      .catch((err) => {
        const msg = err?.response?.data?.error?.message || 'Não foi possível salvar agendamento';
        toast.error(msg);
      })
      .finally(() => setSaving(false));
  };

  const cancelar = (id) => {
    if (!window.confirm('Cancelar este agendamento?')) return;
    cancelarAgendamento(id)
      .then(() => { toast.success('Agendamento cancelado'); setDetalhe(null); carregar(); })
      .catch(() => toast.error('Não foi possível cancelar'));
  };

  const alterarStatus = (id, status) => {
    alterarStatusAgendamento(id, status)
      .then(() => {
        toast.success('Status atualizado');
        setDetalhe((prev) => (prev ? { ...prev, status } : prev));
        carregar();
      })
      .catch((err) => toast.error(err?.response?.data?.error?.message || 'Não foi possível alterar o status'));
  };

  const lancarPagamento = (id) => {
    const valor = window.prompt('Valor do lançamento', '0,00');
    if (valor === null) return;
    lancarPagamentoAgendamento(id, { valor, status: 'pendente' })
      .then(() => toast.success('Lançamento financeiro criado'))
      .catch(() => toast.error('Não foi possível lançar pagamento'));
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h2 className="page-title">Agendamentos</h2>
          <p className="breadcrumb">Início / Agendamentos</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-outline" onClick={abrirFilaEspera}>Fila de Espera</button>
          <button type="button" className="btn" onClick={abrirNovoAgendamento}>+ Novo Agendamento</button>
        </div>
      </div>

      {/* Filtro de profissional */}
      <div className="agenda-prof-tabs">
        <button
          type="button"
          className={`agenda-prof-tab ${profFiltro === 'todos' ? 'active' : ''}`}
          onClick={() => setProfFiltro('todos')}
        >
          Todos
        </button>
        {profissionais.map((p) => (
          <button
            key={p}
            type="button"
            className={`agenda-prof-tab ${profFiltro === p ? 'active' : ''}`}
            onClick={() => setProfFiltro(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Controles */}
      <div className="agenda-controls">
        <span className="muted">Agenda - {profFiltro === 'todos' ? 'Todos' : profFiltro}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="agenda-nav-btn"
            onClick={() => setSemanaBase((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
          >
            ‹
          </button>
          <strong>{formatarMesAno(dias[0], dias[6])}</strong>
          <button
            type="button"
            className="agenda-nav-btn"
            onClick={() => setSemanaBase((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
          >
            ›
          </button>

          <div className="view-toggle">
            {['mes', 'semana', 'dia', 'lista'].map((v) => (
              <button
                key={v}
                type="button"
                className={`view-btn ${viewMode === v ? 'active' : ''}`}
                onClick={() => setViewMode(v)}
              >
                {v === 'mes' ? 'Mês' : v === 'semana' ? 'Semana' : v === 'dia' ? 'Dia' : 'Agendamentos'}
              </button>
            ))}
          </div>

          <select className="form-input" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} style={{ width: 150 }}>
            <option value="">Todos status</option>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Calendário semanal */}
      {viewMode === 'semana' && (
        <div className="section" style={{ padding: 0, overflow: 'auto' }}>
          <div className="cal-week-grid">
            <div className="cal-hour-col">
              <div className="cal-header-cell" />
              {HORAS.map((h) => (
                <div key={h} className="cal-hour-label">{`${h}:00`}</div>
              ))}
            </div>

            {dias.map((dia, idx) => {
              const isHoje = dia.toDateString() === hoje.toDateString();
              const eventos = eventosNoDia(dia);
              return (
                <div key={idx} className={`cal-day-col ${isHoje ? 'today' : ''}`}>
                  <div className={`cal-header-cell ${isHoje ? 'today' : ''}`}>
                    <span className="cal-day-name">
                      {DIAS_SEMANA[dia.getDay()]} {dia.getDate()}/{dia.getMonth() + 1}
                    </span>
                  </div>
                  <div className="cal-day-body">
                    {HORAS.map((h) => (
                      <div key={h} className={`cal-slot ${isHoje ? 'today' : ''}`} />
                    ))}
                    {eventos.map((ev) => {
                      const ini = parseAgendaDate(ev.inicio);
                      const fim = parseAgendaDate(ev.fim);
                      if (!ini || !fim) return null;
                      const horaInicio = ini.getHours() + ini.getMinutes() / 60;
                      const dur = Math.max(0.5, (fim - ini) / 3600000);
                      const top = (horaInicio - 7) * 52;
                      return (
                        <div
                          key={ev.id}
                          className={`cal-event ${ev.status === 'cancelada' ? 'cancelled' : ''}`}
                          style={{ top: `${top}px`, height: `${dur * 52}px` }}
                          onClick={() => abrirDetalhe(ev)}
                          title={`${ev.paciente} – ${ev.profissional}`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && abrirDetalhe(ev)}
                        >
                          <span className="cal-event-time">
                            {ini.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>{ev.status === 'realizado' ? '✓ ' : ''}{ev.paciente}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(viewMode === 'dia' || viewMode === 'mes') && (
        <div className="section">
          <div style={{ display: 'grid', gap: 10 }}>
            {agendaFiltrada
              .filter((item) => {
                const inicio = parseAgendaDate(item.inicio);
                if (!inicio) return false;
                if (viewMode === 'dia') return inicio.toDateString() === hoje.toDateString();
                return inicio.getMonth() === semanaBase.getMonth() && inicio.getFullYear() === semanaBase.getFullYear();
              })
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="agenda-prof-tab"
                  onClick={() => abrirDetalhe(item)}
                  style={{ justifyContent: 'space-between', textAlign: 'left' }}
                >
                  <span>{item.paciente} · {item.profissional}</span>
                  <span>{formatDateTime(item.inicio)}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Lista */}
      {viewMode === 'lista' && (
        <div className="section">
          <table className="table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Profissional</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {agendaFiltrada.map((item) => {
                const inicio = parseAgendaDate(item.inicio);
                const fim = parseAgendaDate(item.fim);
                return (
                  <tr key={item.id}>
                    <td>{item.paciente}</td>
                    <td>{item.profissional}</td>
                    <td>{inicio ? formatDateTime(inicio) : '-'}</td>
                    <td>{fim ? formatDateTime(fim) : '-'}</td>
                    <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn-icon btn-view" title="Detalhes" onClick={() => abrirDetalhe(item)}>🔍</button>
                        <button type="button" className="btn-icon btn-edit" title="Editar" onClick={() => abrirEditar(item)}>✏️</button>
                        <button type="button" className="btn-icon btn-delete" onClick={() => cancelar(item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {detalhe && (
        <div className="modal-overlay" onClick={() => setDetalhe(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalhes Agendamento</h3>
              <button type="button" className="modal-close" onClick={() => setDetalhe(null)}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'grid', gap: 12 }}>
              <div className="form-row-2">
                <div>
                  <span className="muted">Paciente</span>
                  <strong style={{ display: 'block' }}>{detalhe.paciente || '-'}</strong>
                </div>
                <div>
                  <span className="muted">WhatsApp</span>
                  {detalhe.paciente_whatsapp ? (
                    <a
                      href={`https://wa.me/${String(detalhe.paciente_whatsapp).replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'block' }}
                    >
                      {detalhe.paciente_whatsapp}
                    </a>
                  ) : <strong style={{ display: 'block' }}>-</strong>}
                </div>
              </div>
              <div className="form-row-2">
                <div>
                  <span className="muted">Profissional</span>
                  <strong style={{ display: 'block' }}>{detalhe.profissional || '-'}</strong>
                </div>
                <div>
                  <span className="muted">Procedimento</span>
                  <strong style={{ display: 'block' }}>{detalhe.procedimento || 'Consulta'}</strong>
                </div>
              </div>
              <div className="form-row-2">
                <div>
                  <span className="muted">Início</span>
                  <strong style={{ display: 'block' }}>{formatDateTime(detalhe.inicio)}</strong>
                </div>
                <div>
                  <span className="muted">Fim</span>
                  <strong style={{ display: 'block' }}>{formatDateTime(detalhe.fim)}</strong>
                </div>
              </div>
              <div className="form-row-2">
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={detalhe.status || 'agendada'} onChange={(e) => alterarStatus(detalhe.id, e.target.value)}>
                    {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <span className="muted">Criação</span>
                  <strong style={{ display: 'block' }}>{formatDateTime(detalhe.criado_em)}</strong>
                </div>
              </div>
              <div>
                <span className="muted">Observações</span>
                <p style={{ marginTop: 4 }}>{detalhe.observacao || '-'}</p>
              </div>
              <div className="modal-footer" style={{ padding: 0 }}>
                <button type="button" className="btn btn-outline" onClick={() => cancelar(detalhe.id)}>Cancelar agendamento</button>
                <button type="button" className="btn btn-outline" onClick={() => abrirEditar(detalhe)}>Editar</button>
                <button type="button" className="btn" onClick={() => lancarPagamento(detalhe.id)}>Lançar pagamento</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filaAberta && (
        <div className="modal-overlay" onClick={() => setFilaAberta(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Fila de Espera</h3>
              <button type="button" className="modal-close" onClick={() => setFilaAberta(false)}>×</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Profissional</th>
                    <th>Procedimento</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filaEspera.map((item) => (
                    <tr key={item.id} onClick={() => { setFilaAberta(false); abrirDetalhe(item); }} style={{ cursor: 'pointer' }}>
                      <td>{item.paciente}</td>
                      <td>{item.profissional}</td>
                      <td>{item.procedimento || 'Consulta'}</td>
                      <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
                    </tr>
                  ))}
                  {filaEspera.length === 0 && (
                    <tr>
                      <td colSpan="4" className="muted">Nenhum paciente em fila de espera</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal agendamento */}
      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
              <button type="button" className="modal-close" onClick={() => setModalAberto(false)}>×</button>
            </div>

            <form onSubmit={salvar}>
              <div className="form-row" style={{ marginBottom: 12 }}>
                <label className="form-label">Paciente *</label>
                <select className="form-input" value={form.paciente_id} onChange={set('paciente_id')} required>
                  <option value="">Selecione o paciente</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-row" style={{ marginBottom: 12 }}>
                <label className="form-label">Profissional *</label>
                <input className="form-input" value={form.profissional} onChange={set('profissional')} required />
              </div>

              <div className="form-row-2" style={{ marginBottom: 12 }}>
                <div>
                  <label className="form-label">ID Profissional</label>
                  <input className="form-input" type="number" min="0" value={form.profissional_id} onChange={set('profissional_id')} />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={set('status')}>
                    {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row-2" style={{ marginBottom: 12 }}>
                <div>
                  <label className="form-label">Início *</label>
                  <input className="form-input" type="datetime-local" value={form.inicio} onChange={set('inicio')} required />
                </div>
                <div>
                  <label className="form-label">Fim *</label>
                  <input className="form-input" type="datetime-local" value={form.fim} onChange={set('fim')} required />
                </div>
              </div>

              <div className="form-row-2" style={{ marginBottom: 12 }}>
                <div>
                  <label className="form-label">Procedimento *</label>
                  <input className="form-input" value={form.procedimento} onChange={set('procedimento')} placeholder="Consulta" required />
                </div>
                <div>
                  <label className="form-label">ID Procedimento</label>
                  <input className="form-input" type="number" min="0" value={form.procedimento_id} onChange={set('procedimento_id')} />
                </div>
              </div>

              <div className="form-row-2" style={{ marginBottom: 12 }}>
                <div>
                  <label className="form-label">Prioridade</label>
                  <select className="form-input" value={form.prioridade} onChange={set('prioridade')}>
                    <option value="normal">normal</option>
                    <option value="alta">alta</option>
                    <option value="baixa">baixa</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Parceria</label>
                  <input className="form-input" type="number" min="0" value={form.parceria_id} onChange={set('parceria_id')} />
                </div>
              </div>

              <div className="form-row" style={{ marginBottom: 16 }}>
                <label className="form-label">Observação</label>
                <textarea className="form-input" rows="3" value={form.observacao} onChange={set('observacao')} />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? 'Salvando...' : editId ? 'Salvar alteração' : 'Criar agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
