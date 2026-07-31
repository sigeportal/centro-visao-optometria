import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Section from '../../components/common/Section';
import {
  listarAniversariantes,
  listarConsultasVencidas,
  listarProximasConsultas,
  obterResumo,
} from '../../api/dashboard';
import { formatDateTimeShort } from '../../utils/date';

const initialResumo = {
  total_pacientes: 0,
  agendamentos_hoje: 0,
  consultas_realizadas_hoje: 0,
  consultas_mes: 0,
};

function formatDateTime(value) {
  return formatDateTimeShort(value);
}

function EmptyState({ children }) {
  return <p className="muted">{children}</p>;
}

function ConsultaList({ items }) {
  if (!items.length) {
    return <EmptyState>Nenhuma consulta encontrada.</EmptyState>;
  }

  return (
    <div className="dashboard-list">
      {items.map((item) => (
        <Link className="dashboard-list-item" to="/agenda" key={item.id}>
          <div>
            <strong>{item.paciente_nome || item.paciente || 'Paciente'}</strong>
            <span>{item.profissional_nome || item.profissional || 'Profissional nao informado'}</span>
          </div>
          <div className="dashboard-list-meta">
            <span>{formatDateTime(item.data_hora || item.inicio)}</span>
            <span className={`status-badge ${item.status || 'agendado'}`}>{item.status || 'agendada'}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [resumo, setResumo] = useState(initialResumo);
  const [proximas, setProximas] = useState([]);
  const [aniversariantes, setAniversariantes] = useState([]);
  const [vencidas, setVencidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setLoading(true);
      setErro('');
      try {
        const [resumoData, proximasData, aniversariantesData, vencidasData] = await Promise.all([
          obterResumo(),
          listarProximasConsultas(),
          listarAniversariantes(),
          listarConsultasVencidas(),
        ]);

        if (!ativo) return;
        setResumo({ ...initialResumo, ...(resumoData || {}) });
        setProximas(Array.isArray(proximasData) ? proximasData : []);
        setAniversariantes(Array.isArray(aniversariantesData) ? aniversariantesData : []);
        setVencidas(Array.isArray(vencidasData) ? vencidasData : []);
      } catch {
        if (ativo) {
          setErro('Nao foi possivel carregar o dashboard.');
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const cards = useMemo(() => [
    ['Pacientes', resumo.total_pacientes, 'Total cadastrado'],
    ['Agendamentos (dia)', resumo.agendamentos_hoje, 'Hoje'],
    ['Consultas (dia)', resumo.consultas_realizadas_hoje, 'Atendidas'],
    ['Consultas (mes)', resumo.consultas_mes, 'Acumulado'],
  ], [resumo]);

  return (
    <div className="page-stack">
      {erro ? <div className="section dashboard-error">{erro}</div> : null}

      <section className="grid-cards">
        {cards.map(([title, value, subtitle]) => (
          <Card key={title} title={title} value={loading ? '...' : String(value ?? 0)} subtitle={subtitle} />
        ))}
      </section>

      <Section title="Proximas consultas" action={<Link className="link-text" to="/agenda">Ver agenda</Link>}>
        {loading ? <EmptyState>Carregando consultas...</EmptyState> : <ConsultaList items={proximas} />}
      </Section>

      <section className="split-2">
        <Section title="Aniversariantes do dia" action={<Link className="link-text" to="/pacientes">Ver pacientes</Link>}>
          {loading ? (
            <EmptyState>Carregando aniversariantes...</EmptyState>
          ) : aniversariantes.length ? (
            <div className="dashboard-list compact">
              {aniversariantes.map((item) => (
                <Link className="dashboard-list-item" to={`/pacientes/${item.id}`} key={item.id}>
                  <div>
                    <strong>{item.nome}</strong>
                    <span>{item.celular || 'Sem contato informado'}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState>Sem aniversariantes para hoje.</EmptyState>
          )}
        </Section>
        <Section title="Consultas vencidas" action={<Link className="link-text" to="/agenda">Ver lista completa</Link>}>
          {loading ? <EmptyState>Carregando pendencias...</EmptyState> : (
            vencidas.length ? <ConsultaList items={vencidas} /> : <EmptyState>Sem consultas vencidas.</EmptyState>
          )}
        </Section>
      </section>
    </div>
  );
}
