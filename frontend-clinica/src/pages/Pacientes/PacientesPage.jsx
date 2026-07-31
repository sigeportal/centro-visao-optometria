import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { excluirPaciente, listarPacientes } from '../../api/paciente';
import { criarConsulta } from '../../api/consulta';
import { formatDate, parseLocalDateTime } from '../../utils/date';

function parseDataNascimento(valor) {
  return parseLocalDateTime(valor);
}

function formatarDataComIdade(valor) {
  const data = parseDataNascimento(valor);
  if (!data) return '—';

  const hoje = new Date();
  let idade = hoje.getFullYear() - data.getFullYear();
  const aniversarioAindaNaoPassou =
    hoje.getMonth() < data.getMonth()
    || (hoje.getMonth() === data.getMonth() && hoje.getDate() < data.getDate());
  if (aniversarioAindaNaoPassou) idade -= 1;

  const dataFmt = formatDate(data);
  return `${dataFmt} - ${idade >= 0 ? `${idade} anos` : '—'}`;
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const carregar = (termo = busca, pagina = page, porPagina = limit) => {
    setLoading(true);
    listarPacientes({ busca: termo, page: pagina, limit: porPagina })
      .then((resultado) => {
        setPacientes(resultado.items || []);
        setTotal(resultado.total || 0);
        setPage(resultado.page || pagina);
        setLimit(resultado.limit || porPagina);
      })
      .catch(() => toast.error('Não foi possível carregar pacientes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar(busca, page, limit);
  }, [page, limit]);

  const pesquisar = (e) => {
    e.preventDefault();
    setPage(1);
    carregar(busca, 1, limit);
  };

  const excluir = (id, nome) => {
    if (!window.confirm(`Excluir paciente "${nome}"?`)) return;
    excluirPaciente(id)
      .then(() => {
        toast.success('Paciente excluído');
        carregar(busca, page, limit);
      })
      .catch(() => toast.error('Não foi possível excluir paciente'));
  };

  const agendar = (paciente) => {
    navigate('/agenda', {
      state: {
        agendarPaciente: {
          pacienteId: paciente.id,
          pacienteNome: paciente.nome,
        },
      },
    });
  };

  const atender = async (paciente) => {
    try {
      const data = await criarConsulta({
        paciente_id: Number(paciente.id),
        procedimento: 'Consulta',
      });

      const consultaId = Number(data?.id || data?.consulta_id);
      if (!consultaId) {
        toast.error('Consulta criada, mas não foi possível abrir o atendimento');
        navigate('/consultas');
        return;
      }

      toast.success(`Atendimento iniciado para ${paciente.nome}`);
      navigate(`/consultas/${consultaId}`);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Não foi possível iniciar atendimento';
      toast.error(msg);
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(total / limit));
  const inicio = total === 0 ? 0 : (page - 1) * limit + 1;
  const fim = Math.min(page * limit, total);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h2 className="page-title">Pesquisar Pacientes</h2>
          <p className="breadcrumb">Início / Pesquisar Pacientes</p>
        </div>
      </div>

      <div className="section patient-search-shell">
        <div className="patient-search-toolbar">
          <button type="button" className="btn" onClick={() => navigate('/pacientes/novo')}>
            + Cadastrar
          </button>

          <form className="search-inline" onSubmit={pesquisar}>
            <button type="submit" className="search-submit-icon" aria-label="Pesquisar pacientes">
              🔎
            </button>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por Nome, CPF ou Cidade"
              className="search-input"
            />
          </form>
        </div>

        <div className="results-toolbar">
          <span className="muted">Exibir</span>
          <select
            className="form-input"
            style={{ width: 92 }}
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span className="muted">resultados por página</span>
        </div>

        {loading ? (
          <p className="muted" style={{ padding: '20px 0' }}>Carregando...</p>
        ) : pacientes.length === 0 ? (
          <p className="muted" style={{ padding: '20px 0' }}>Nenhum paciente encontrado.</p>
        ) : (
          <>
          <table className="table table-compact">
            <thead>
              <tr>
                <th>Cod</th>
                <th>Nome</th>
                <th>Cidade</th>
                <th>Data Nascimento</th>
                <th>Consultas</th>
                <th>Fila/Editar/Excluir</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => navigate(`/pacientes/${p.id}`)}
                    >
                      {p.nome}
                    </button>
                  </td>
                  <td>{p.cidade || '—'}</td>
                  <td>{formatarDataComIdade(p.data_nascimento)}</td>
                  <td>
                    <div className="consulta-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-schedule"
                        onClick={() => agendar(p)}
                      >
                        Agendar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-attend"
                        onClick={() => atender(p)}
                      >
                        Atender
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn-icon btn-queue"
                        title="Fila"
                        onClick={() => navigate(`/pacientes/${p.id}`)}
                      >
                        ◉
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-edit"
                        title="Editar"
                        onClick={() => navigate(`/pacientes/${p.id}/editar`)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-delete"
                        title="Excluir"
                        onClick={() => excluir(p.id, p.nome)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="results-note">
            Mostrando de {inicio} ate {fim} de {total} registros
          </p>
          <div className="pagination-actions">
            <button
              type="button"
              className="btn btn-outline"
              disabled={page <= 1}
              onClick={() => setPage((atual) => Math.max(1, atual - 1))}
            >
              Anterior
            </button>
            <span className="pagination-current">{page}</span>
            <button
              type="button"
              className="btn btn-outline"
              disabled={page >= totalPaginas}
              onClick={() => setPage((atual) => Math.min(totalPaginas, atual + 1))}
            >
              Proximo
            </button>
          </div>
          </>
        )}
      </div>
    </div>
  );
}

