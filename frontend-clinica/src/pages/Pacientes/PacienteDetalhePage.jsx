import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  listarAnamnesePaciente,
  listarConsultasPaciente,
  listarDocumentosPaciente,
  listarFinanceiroPaciente,
  obterPaciente,
} from '../../api/paciente';
import { formatDate, formatDateTime, parseLocalDateTime } from '../../utils/date';

const TABS = ['Informações Pessoais', 'Anamnese', 'Financeiro', 'Consultas', 'Documentos'];

function calcularIdade(dataNasc) {
  if (!dataNasc) return null;
  const nasc = parseLocalDateTime(dataNasc);
  if (!nasc) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function formatarData(valor) {
  if (!valor) return '—';
  return formatDate(valor, '—');
}

function formatarDataHora(valor) {
  if (!valor) return '—';
  return formatDateTime(valor, '—');
}

export default function PacienteDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabAtiva, setTabAtiva] = useState(0);
  const [paciente, setPaciente] = useState(null);
  const [anamneses, setAnamneses] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obterPaciente(id)
      .then(setPaciente)
      .catch(() => toast.error('Não foi possível carregar paciente'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tabAtiva === 1 && anamneses.length === 0) {
      listarAnamnesePaciente(id).then(setAnamneses).catch(() => setAnamneses([]));
    }
    if (tabAtiva === 2 && financeiro.length === 0) {
      listarFinanceiroPaciente(id).then(setFinanceiro).catch(() => setFinanceiro([]));
    }
    if (tabAtiva === 3 && consultas.length === 0) {
      listarConsultasPaciente(id).then(setConsultas).catch(() => setConsultas([]));
    }
    if (tabAtiva === 4 && documentos.length === 0) {
      listarDocumentosPaciente(id).then(setDocumentos).catch(() => setDocumentos([]));
    }
  }, [tabAtiva, id]);

  if (loading) return <div className="page-stack"><p className="muted">Carregando...</p></div>;
  if (!paciente) return <div className="page-stack"><p className="muted">Paciente não encontrado.</p></div>;

  const idade = calcularIdade(paciente.data_nascimento);

  const totalReceitas = financeiro.reduce((s, f) => s + (Number(f.valor) || 0), 0);

  return (
    <div className="page-stack">
      {/* Banner do paciente */}
      <div className="patient-banner">
        <div className="patient-banner-avatar">👤</div>
        <h2 className="patient-banner-name">{paciente.nome}</h2>
      </div>

      {/* Tabs */}
      <div className="patient-tabs-row">
        <div className="patient-tabs">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={`patient-tab ${tabAtiva === i ? 'active' : ''}`}
              onClick={() => setTabAtiva(i)}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => navigate(`/pacientes/${id}/editar`)}
        >
          ✏️ Editar Paciente
        </button>
      </div>

      {/* Tab 0 - Informações Pessoais */}
      {tabAtiva === 0 && (
        <div className="patient-info-grid">
          <div className="section">
            <div className="form-section-title">CONTATO</div>
            <dl className="info-list">
              <dt>Nome Completo:</dt><dd>{paciente.nome}</dd>
              <dt>Nome Social:</dt><dd>{paciente.nome_social || '—'}</dd>
              <dt>Celular/Whatsapp:</dt>
              <dd>
                {paciente.celular ? (
                  <a className="whatsapp-link" href={`https://wa.me/55${paciente.celular.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                    📱 {paciente.celular}
                  </a>
                ) : '—'}
              </dd>
              <dt>Telefone 2:</dt><dd>{paciente.telefone2 || '—'}</dd>
              <dt>E-mail:</dt><dd>{paciente.email || '—'}</dd>
              <dt>Sexo:</dt><dd>{paciente.sexo || '—'}</dd>
            </dl>
          </div>

          <div className="section">
            <div className="form-section-title">INFORMAÇÕES COMPLEMENTARES</div>
            <dl className="info-list">
              <dt>CPF:</dt><dd>{paciente.cpf || '—'}</dd>
              <dt>RG:</dt><dd>{paciente.rg || '—'}</dd>
              <dt>Data de Nascimento:</dt>
              <dd>{paciente.data_nascimento ? `${formatarData(paciente.data_nascimento)}${idade != null ? ` - ${idade} anos` : ''}` : '—'}</dd>
              <dt>Ocupação:</dt><dd>{paciente.ocupacao || '—'}</dd>
              <dt>Data do cadastro:</dt><dd>{formatarData(paciente.data_cadastro || paciente.criado_em || paciente.created_at)}</dd>
              <dt>Como chegou à clínica:</dt><dd>{paciente.como_conheceu || '—'}</dd>
              <dt>Endereço:</dt><dd>{paciente.endereco || '—'}</dd>
              <dt>Complemento:</dt><dd>{paciente.complemento || '—'}</dd>
              <dt>Cidade:</dt><dd>{[paciente.cidade, paciente.estado].filter(Boolean).join(' - ')}{paciente.cep ? ` - Cep: ${paciente.cep}` : ''}</dd>
            </dl>
          </div>
        </div>
      )}

      {/* Tab 1 - Anamnese */}
      {tabAtiva === 1 && (
        <div className="section">
          <div className="section-head">
            <div className="form-section-title">ANAMNESE</div>
            <button type="button" className="btn">+ Adicionar Anamnese</button>
          </div>
          {anamneses.length === 0 ? (
            <p className="muted">Nenhuma anamnese cadastrada.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Data de cadastro</th>
                  <th>Cadastrado por:</th>
                  <th>Opções</th>
                </tr>
              </thead>
              <tbody>
                {anamneses.map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}</td>
                    <td>{formatarDataHora(a.criado_em || a.data)}</td>
                    <td>{a.profissional || a.usuario || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn-icon btn-print" title="Imprimir">🖨️</button>
                        <button type="button" className="btn-icon btn-view" title="Visualizar">🔍</button>
                        <button type="button" className="btn-icon btn-edit" title="Editar">✏️</button>
                        <button type="button" className="btn-icon btn-delete" title="Excluir">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2 - Financeiro */}
      {tabAtiva === 2 && (
        <div className="section">
          <div className="section-head">
            <div className="form-section-title">RELAÇÃO DE PAGAMENTOS</div>
            <button type="button" className="btn">+ Adicionar Pagamento</button>
          </div>

          <div className="financeiro-summary">
            <div className="financeiro-card green">
              <span>✅ RECEITAS</span>
              <strong>R$ {totalReceitas.toFixed(2)}</strong>
            </div>
            <div className="financeiro-card yellow">
              <span>✅ TOTAL À RECEBER</span>
              <strong>R$ 0,00</strong>
            </div>
            <div className="financeiro-card blue">
              <span>✅ TOTAL PREVISTO</span>
              <strong>R$ 0,00</strong>
            </div>
          </div>

          {financeiro.length === 0 ? (
            <p className="muted" style={{ marginTop: 16 }}>Nenhum pagamento cadastrado.</p>
          ) : (
            <table className="table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Nome</th>
                  <th>Forma de Pagamento</th>
                  <th>Valor R$</th>
                </tr>
              </thead>
              <tbody>
                {financeiro.map((f) => (
                  <tr key={f.id}>
                    <td>{formatarData(f.data)}</td>
                    <td>{f.descricao || f.nome || '—'}</td>
                    <td>{f.forma_pagamento || '—'}</td>
                    <td>R$ {Number(f.valor || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right', color: 'var(--muted)' }}>Valor Total</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    R$ {totalReceitas.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* Tab 3 - Consultas */}
      {tabAtiva === 3 && (
        <div className="section">
          <div className="form-section-title">CONSULTAS ATENDIDAS</div>
          {consultas.length === 0 ? (
            <p className="muted">Nenhuma consulta registrada.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Data da Consulta</th>
                  <th>Profissional</th>
                  <th>Procedimento</th>
                  <th>Visualizar</th>
                  <th>Editar</th>
                  <th>Excluir</th>
                </tr>
              </thead>
              <tbody>
                {consultas.map((c, i) => (
                  <tr key={c.id}>
                    <td>{i + 1}</td>
                    <td>{formatarDataHora(c.data || c.inicio || c.criado_em)}</td>
                    <td>{c.profissional || '—'}</td>
                    <td>{c.procedimento || 'Consulta'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => navigate(`/consultas/${c.id}`)}
                      >
                        🔍 Visualizar
                      </button>
                    </td>
                    <td>
                      <button type="button" className="btn-icon btn-edit" title="Editar">✏️</button>
                    </td>
                    <td>
                      <button type="button" className="btn-icon btn-delete" title="Excluir">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 4 - Documentos */}
      {tabAtiva === 4 && (
        <div className="section">
          <div className="form-section-title">DOCUMENTOS</div>
          {documentos.length === 0 ? (
            <p className="muted">Nenhum documento registrado.</p>
          ) : (
            <div className="docs-accordion">
              {documentos.map((grupo) => (
                <details key={grupo.consulta_id || grupo.data} className="docs-group">
                  <summary className="docs-group-header">
                    CONSULTA REALIZADA EM {formatarData(grupo.data || grupo.consulta_data)}{' '}
                    <span className="docs-count">{grupo.documentos?.length || 0} DOCUMENTO(S)</span>
                    <span className="docs-chevron">+</span>
                  </summary>
                  <div className="docs-items">
                    {(grupo.documentos || []).map((doc) => (
                      <div key={doc.id} className="docs-item">
                        <span>📄 {doc.nome || doc.titulo || 'Documento'}</span>
                        <a href={doc.url} target="_blank" rel="noreferrer" className="btn-icon btn-view" title="Baixar">⬇️</a>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
