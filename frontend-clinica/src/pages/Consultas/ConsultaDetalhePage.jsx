import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  atualizarAnamnese,
  atualizarPrescricao,
  criarAnamnese,
  criarDocumentoConsulta,
  criarPrescricao,
  excluirAnamnese,
  excluirPrescricao,
  listarAnamneses,
  listarDocumentosConsulta,
  listarPrescricoes,
  obterConsulta,
  obterImpressaoAnamnese,
  obterImpressaoPrescricao,
} from '../../api/consulta';
import { formatDate, formatDateTime, toDateInputValue } from '../../utils/date';

const ANAMNESE_VAZIA = {
  motivo_principal: '',
  data_ultimo_exame: '',
  observacoes_gerais: '',
  sintomas: '',
  doencas_oculares: '',
  doencas_sistemicas: '',
  medicamentos: '',
  uso_oculos: false,
  uso_lente: false,
  dificuldade_longe: false,
  dificuldade_perto: false,
  cefaleia: false,
  cefaleia_local: '',
  cefaleia_frequencia: '',
  antecedentes_familiares: '',
  observacoes_finais: '',
};

const PRESC_VAZIA = {
  titulo: 'Prescricao para Oculos',
  od_esferico: '',
  od_cilindrico: '',
  od_eixo: '',
  od_av: '',
  od_prisma: '',
  od_dnp: '',
  oe_esferico: '',
  oe_cilindrico: '',
  oe_eixo: '',
  oe_av: '',
  oe_prisma: '',
  oe_dnp: '',
  adicao: '',
  lente: '',
  retorno: '',
  observacoes: '',
};

const DOC_VAZIO = {
  titulo: '',
  nome: '',
  tipo: 'documento',
  url: '',
  mime_type: '',
};

function formatarDataHora(valor) {
  return formatDateTime(valor);
}

function formatarData(valor) {
  return formatDate(valor);
}

function escapeHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function texto(valor) {
  const v = valor === null || valor === undefined ? '' : String(valor).trim();
  return escapeHtml(v || '-');
}

function simNao(valor) {
  return valor ? 'Sim' : 'Nao';
}

function bloco(label, value) {
  return `
    <div class="field">
      <span>${escapeHtml(label)}</span>
      <strong>${texto(value)}</strong>
    </div>
  `;
}

function renderBasePrint(titulo, corpo) {
  return `
    <html>
      <head>
        <title>${titulo}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            line-height: 1.35;
          }
          .doc-header {
            border-bottom: 2px solid #111827;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 20px;
            padding-bottom: 10px;
            margin-bottom: 16px;
          }
          .brand-title { font-size: 19px; font-weight: 700; margin: 0; }
          .brand-subtitle { margin: 3px 0 0; color: #4b5563; }
          .doc-title { text-align: right; font-size: 18px; font-weight: 700; }
          .section-title {
            background: #e5eef2;
            border: 1px solid #b9c9d1;
            font-weight: 700;
            padding: 7px 9px;
            margin: 14px 0 8px;
          }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .field {
            border: 1px solid #cfd9df;
            min-height: 38px;
            padding: 6px 8px;
          }
          .field span {
            color: #64748b;
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .field strong { font-size: 12px; font-weight: 600; white-space: pre-wrap; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #aebdc5; padding: 7px 8px; text-align: center; }
          th { background: #e5eef2; font-size: 11px; }
          td:first-child, th:first-child { font-weight: 700; }
          .notes {
            border: 1px solid #cfd9df;
            min-height: 86px;
            padding: 8px;
            white-space: pre-wrap;
          }
          .signature-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 42px;
          }
          .signature {
            border-top: 1px solid #111827;
            padding-top: 6px;
            text-align: center;
          }
          .footer {
            color: #64748b;
            font-size: 10px;
            margin-top: 20px;
            text-align: center;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${corpo}
      </body>
    </html>
  `;
}

function renderAnamnesePrint(dados, consulta) {
  const corpo = `
    <header class="doc-header">
      <div>
        <p class="brand-title">Centro Visao Optometria</p>
        <p class="brand-subtitle">Ficha clinica optometrica</p>
      </div>
      <div class="doc-title">Anamnese</div>
    </header>

    <div class="section-title">Identificacao</div>
    <div class="grid">
      ${bloco('Paciente', consulta?.paciente_nome)}
      ${bloco('Consulta', dados?.consulta_id || consulta?.id)}
      ${bloco('Data', formatarDataHora(dados?.data))}
      ${bloco('Profissional', consulta?.profissional)}
      ${bloco('Procedimento', consulta?.procedimento)}
      ${bloco('Cidade', consulta?.paciente_cidade)}
    </div>

    <div class="section-title">Anamnese</div>
    <div class="grid-2">
      ${bloco('Motivo principal', dados?.motivo_principal || dados?.queixa_principal)}
      ${bloco('Data do ultimo exame', formatarData(dados?.data_ultimo_exame))}
      ${bloco('Sintomas', dados?.sintomas)}
      ${bloco('Medicamentos', dados?.medicamentos)}
      ${bloco('Doencas oculares', dados?.doencas_oculares)}
      ${bloco('Doencas sistemicas', dados?.doencas_sistemicas)}
      ${bloco('Uso de oculos', simNao(dados?.uso_oculos))}
      ${bloco('Uso de lente', simNao(dados?.uso_lente))}
      ${bloco('Dificuldade longe', simNao(dados?.dificuldade_longe))}
      ${bloco('Dificuldade perto', simNao(dados?.dificuldade_perto))}
      ${bloco('Cefaleia', simNao(dados?.cefaleia))}
      ${bloco('Cefaleia local/frequencia', [dados?.cefaleia_local, dados?.cefaleia_frequencia].filter(Boolean).join(' - '))}
    </div>

    <div class="section-title">Observacoes gerais</div>
    <div class="notes">${texto(dados?.observacoes_gerais || dados?.historico)}</div>

    <div class="section-title">Antecedentes e observacoes finais</div>
    <div class="grid-2">
      ${bloco('Antecedentes familiares', dados?.antecedentes_familiares)}
      ${bloco('Observacoes finais', dados?.observacoes_finais || dados?.observacoes)}
    </div>

    <div class="signature-row">
      <div class="signature">Paciente ou responsavel</div>
      <div class="signature">Profissional</div>
    </div>
    <div class="footer">Documento gerado pelo sistema Centro Visao Optometria.</div>
  `;
  return renderBasePrint('Anamnese', corpo);
}

function renderPrescricaoPrint(dados, consulta) {
  const corpo = `
    <header class="doc-header">
      <div>
        <p class="brand-title">Centro Visao Optometria</p>
        <p class="brand-subtitle">Prescricao optometrica</p>
      </div>
      <div class="doc-title">${texto(dados?.titulo || 'Prescricao para Oculos')}</div>
    </header>

    <div class="section-title">Paciente</div>
    <div class="grid">
      ${bloco('Nome', consulta?.paciente_nome)}
      ${bloco('Data', formatarDataHora(dados?.data))}
      ${bloco('Profissional', consulta?.profissional)}
      ${bloco('Procedimento', consulta?.procedimento)}
      ${bloco('Retorno', formatarData(dados?.retorno))}
      ${bloco('Lente', dados?.lente)}
    </div>

    <div class="section-title">Grau para longe</div>
    <table>
      <thead>
        <tr>
          <th>Olho</th>
          <th>Esferico</th>
          <th>Cilindrico</th>
          <th>Eixo</th>
          <th>AV</th>
          <th>Prisma</th>
          <th>DNP</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>OD</td>
          <td>${texto(dados?.od_esferico)}</td>
          <td>${texto(dados?.od_cilindrico)}</td>
          <td>${texto(dados?.od_eixo)}</td>
          <td>${texto(dados?.od_av)}</td>
          <td>${texto(dados?.od_prisma)}</td>
          <td>${texto(dados?.od_dnp)}</td>
        </tr>
        <tr>
          <td>OE</td>
          <td>${texto(dados?.oe_esferico)}</td>
          <td>${texto(dados?.oe_cilindrico)}</td>
          <td>${texto(dados?.oe_eixo)}</td>
          <td>${texto(dados?.oe_av)}</td>
          <td>${texto(dados?.oe_prisma)}</td>
          <td>${texto(dados?.oe_dnp)}</td>
        </tr>
      </tbody>
    </table>

    <div class="grid" style="margin-top: 10px;">
      ${bloco('Adicao', dados?.adicao)}
      ${bloco('Lente', dados?.lente)}
      ${bloco('Retorno', formatarData(dados?.retorno))}
    </div>

    <div class="section-title">Observacoes</div>
    <div class="notes">${texto(dados?.observacoes)}</div>

    <div class="signature-row">
      <div class="signature">Paciente ou responsavel</div>
      <div class="signature">Profissional</div>
    </div>
    <div class="footer">Documento gerado pelo sistema Centro Visao Optometria.</div>
  `;
  return renderBasePrint('Prescricao', corpo);
}

function abrirImpressao(titulo, html) {
  const win = window.open('', '_blank', 'width=820,height=920');
  if (!win) {
    toast.error('Permita pop-ups para imprimir este documento');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 250);
}

function CampoPrescricao({ field, value, onChange }) {
  const isEixo = field.endsWith('_eixo');
  return (
    <input
      className="presc-input"
      type="number"
      step={isEixo ? '1' : '0.5'}
      min={isEixo ? '0' : undefined}
      max={isEixo ? '180' : undefined}
      inputMode="decimal"
      value={value}
      onChange={onChange(field)}
      onWheel={(e) => e.currentTarget.blur()}
    />
  );
}

export default function ConsultaDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consulta, setConsulta] = useState(null);
  const [anamneses, setAnamneses] = useState([]);
  const [prescricoes, setPrescricoes] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalPrescricao, setModalPrescricao] = useState(false);
  const [prescricaoEditando, setPrescricaoEditando] = useState(null);
  const [formPresc, setFormPresc] = useState(PRESC_VAZIA);
  const [modalAnamnese, setModalAnamnese] = useState(false);
  const [anamneseEditando, setAnamneseEditando] = useState(null);
  const [formAnamnese, setFormAnamnese] = useState(ANAMNESE_VAZIA);
  const [formDoc, setFormDoc] = useState(DOC_VAZIO);
  const [saving, setSaving] = useState(false);

  const carregar = () => {
    setLoading(true);
    obterConsulta(id)
      .then(setConsulta)
      .catch(() => toast.error('Nao foi possivel carregar consulta'))
      .finally(() => setLoading(false));

    listarAnamneses(id).then(setAnamneses).catch(() => setAnamneses([]));
    listarPrescricoes(id).then(setPrescricoes).catch(() => setPrescricoes([]));
    listarDocumentosConsulta(id).then(setDocumentos).catch(() => setDocumentos([]));
  };

  useEffect(() => {
    carregar();
  }, [id]);

  const abrirNovaAnamnese = () => {
    setFormAnamnese(ANAMNESE_VAZIA);
    setAnamneseEditando(null);
    setModalAnamnese(true);
  };

  const abrirEditarAnamnese = (a) => {
    setFormAnamnese({
      motivo_principal: a.motivo_principal || a.queixa_principal || '',
      data_ultimo_exame: toDateInputValue(a.data_ultimo_exame),
      observacoes_gerais: a.observacoes_gerais || a.historico || '',
      sintomas: a.sintomas || '',
      doencas_oculares: a.doencas_oculares || '',
      doencas_sistemicas: a.doencas_sistemicas || '',
      medicamentos: a.medicamentos || '',
      uso_oculos: Boolean(a.uso_oculos),
      uso_lente: Boolean(a.uso_lente),
      dificuldade_longe: Boolean(a.dificuldade_longe),
      dificuldade_perto: Boolean(a.dificuldade_perto),
      cefaleia: Boolean(a.cefaleia),
      cefaleia_local: a.cefaleia_local || '',
      cefaleia_frequencia: a.cefaleia_frequencia || '',
      antecedentes_familiares: a.antecedentes_familiares || '',
      observacoes_finais: a.observacoes_finais || a.observacoes || '',
    });
    setAnamneseEditando(a);
    setModalAnamnese(true);
  };

  const abrirNovaPrescricao = () => {
    setFormPresc(PRESC_VAZIA);
    setPrescricaoEditando(null);
    setModalPrescricao(true);
  };

  const abrirEditarPrescricao = (p) => {
    setFormPresc({
      titulo: p.titulo || 'Prescricao para Oculos',
      od_esferico: p.od_esferico || '',
      od_cilindrico: p.od_cilindrico || '',
      od_eixo: p.od_eixo || '',
      od_av: p.od_av || '',
      od_prisma: p.od_prisma || '',
      od_dnp: p.od_dnp || '',
      oe_esferico: p.oe_esferico || '',
      oe_cilindrico: p.oe_cilindrico || '',
      oe_eixo: p.oe_eixo || '',
      oe_av: p.oe_av || '',
      oe_prisma: p.oe_prisma || '',
      oe_dnp: p.oe_dnp || '',
      adicao: p.adicao || '',
      lente: p.lente || '',
      retorno: toDateInputValue(p.retorno),
      observacoes: p.observacoes || '',
    });
    setPrescricaoEditando(p);
    setModalPrescricao(true);
  };

  const setPresc = (field) => (e) => setFormPresc((prev) => ({ ...prev, [field]: e.target.value }));
  const setAnamnese = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormAnamnese((prev) => ({ ...prev, [field]: value }));
  };

  const salvarAnamnese = (e) => {
    e.preventDefault();
    setSaving(true);
    const op = anamneseEditando
      ? atualizarAnamnese(anamneseEditando.id, formAnamnese)
      : criarAnamnese(id, formAnamnese);

    op.then(() => {
      toast.success(anamneseEditando ? 'Anamnese atualizada' : 'Anamnese cadastrada');
      setModalAnamnese(false);
      return listarAnamneses(id).then(setAnamneses);
    })
      .catch(() => toast.error('Nao foi possivel salvar anamnese'))
      .finally(() => setSaving(false));
  };

  const salvarPrescricao = (e) => {
    e.preventDefault();
    setSaving(true);
    const op = prescricaoEditando
      ? atualizarPrescricao(prescricaoEditando.id, formPresc)
      : criarPrescricao(id, formPresc);

    op.then(() => {
      toast.success(prescricaoEditando ? 'Prescricao atualizada' : 'Prescricao cadastrada');
      setModalPrescricao(false);
      return listarPrescricoes(id).then(setPrescricoes);
    })
      .catch(() => toast.error('Nao foi possivel salvar prescricao'))
      .finally(() => setSaving(false));
  };

  const salvarDocumento = (e) => {
    e.preventDefault();
    criarDocumentoConsulta(id, formDoc)
      .then(() => {
        toast.success('Documento vinculado');
        setFormDoc(DOC_VAZIO);
        return listarDocumentosConsulta(id).then(setDocumentos);
      })
      .catch(() => toast.error('Nao foi possivel vincular documento'));
  };

  const excluirAnamneseAtual = (anamneseId) => {
    if (!window.confirm('Excluir esta anamnese?')) return;
    excluirAnamnese(anamneseId)
      .then(() => listarAnamneses(id).then(setAnamneses))
      .then(() => toast.success('Anamnese excluida'))
      .catch(() => toast.error('Nao foi possivel excluir anamnese'));
  };

  const excluirPrescricaoAtual = (prescId) => {
    if (!window.confirm('Excluir esta prescricao?')) return;
    excluirPrescricao(prescId)
      .then(() => listarPrescricoes(id).then(setPrescricoes))
      .then(() => toast.success('Prescricao excluida'))
      .catch(() => toast.error('Nao foi possivel excluir prescricao'));
  };

  const imprimirAnamnese = (anamneseId) => {
    obterImpressaoAnamnese(anamneseId)
      .then((dados) => abrirImpressao('Anamnese', renderAnamnesePrint(dados, consulta)))
      .catch(() => toast.error('Nao foi possivel gerar a impressao da anamnese'));
  };

  const imprimirPrescricao = (prescricaoId) => {
    obterImpressaoPrescricao(prescricaoId)
      .then((dados) => abrirImpressao('Prescricao', renderPrescricaoPrint(dados, consulta)))
      .catch(() => toast.error('Nao foi possivel gerar a impressao da prescricao'));
  };

  if (loading) return <div className="page-stack"><p className="muted">Carregando...</p></div>;

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h2 className="page-title">Consultas</h2>
          <p className="breadcrumb">Inicio / Consultas / Detalhe</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Voltar</button>
      </div>

      <div className="section">
        <div className="form-section-title">Informacoes do paciente</div>
        {consulta && (
          <div>
            <h3 className="patient-name-heading">{consulta.paciente_nome || '-'}</h3>
            <p className="patient-meta">
              {[consulta.paciente_sexo, consulta.paciente_ocupacao, consulta.paciente_cidade].filter(Boolean).join(' - ')}
            </p>
            <p><strong>Atendido por:</strong> <span className="link-text">{consulta.profissional || '-'}</span></p>
            <p><strong>Procedimento:</strong> <span className="muted">{consulta.procedimento || 'Consulta'}</span></p>
            <p><strong>Status:</strong> <span className="muted">{consulta.status || '-'}</span></p>
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-head">
          <div className="form-section-title">Anamneses</div>
          <button type="button" className="btn" onClick={abrirNovaAnamnese}>Adicionar</button>
        </div>
        {anamneses.length === 0 ? (
          <p className="muted">Nenhuma anamnese cadastrada.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Motivo</th>
                <th>Data</th>
                <th>Opcoes</th>
              </tr>
            </thead>
            <tbody>
              {anamneses.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.motivo_principal || a.queixa_principal || '-'}</td>
                  <td>{formatarDataHora(a.data)}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn-icon btn-view" title="Visualizar" onClick={() => abrirEditarAnamnese(a)}>Ver</button>
                      <button type="button" className="btn-icon btn-print" title="Imprimir" onClick={() => imprimirAnamnese(a.id)}>Imp</button>
                      <button type="button" className="btn-icon btn-delete" title="Excluir" onClick={() => excluirAnamneseAtual(a.id)}>Exc</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="section">
        <div className="section-head">
          <div className="form-section-title">Prescricoes cadastradas</div>
          <button type="button" className="btn" onClick={abrirNovaPrescricao}>Adicionar</button>
        </div>
        {prescricoes.length === 0 ? (
          <p className="muted">Nenhuma prescricao cadastrada.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Titulo</th>
                <th>Data cadastro</th>
                <th>Opcoes</th>
              </tr>
            </thead>
            <tbody>
              {prescricoes.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    <button type="button" className="link-btn" onClick={() => abrirEditarPrescricao(p)}>
                      {p.titulo || 'Prescricao para Oculos'}
                    </button>
                  </td>
                  <td>{formatarDataHora(p.data)}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn-icon btn-view" title="Visualizar" onClick={() => abrirEditarPrescricao(p)}>Ver</button>
                      <button type="button" className="btn-icon btn-print" title="Imprimir" onClick={() => imprimirPrescricao(p.id)}>Imp</button>
                      <button type="button" className="btn-icon btn-delete" title="Excluir" onClick={() => excluirPrescricaoAtual(p.id)}>Exc</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="section">
        <div className="section-head">
          <div className="form-section-title">Documentos</div>
        </div>
        <form className="form-grid" onSubmit={salvarDocumento}>
          <input placeholder="Titulo" value={formDoc.titulo} onChange={(e) => setFormDoc((prev) => ({ ...prev, titulo: e.target.value }))} />
          <input placeholder="Nome do arquivo" value={formDoc.nome} onChange={(e) => setFormDoc((prev) => ({ ...prev, nome: e.target.value }))} />
          <input placeholder="URL ou caminho" value={formDoc.url} onChange={(e) => setFormDoc((prev) => ({ ...prev, url: e.target.value }))} />
          <button type="submit" className="btn">Adicionar</button>
        </form>
        {documentos.length === 0 ? (
          <p className="muted results-note">Nenhum documento vinculado.</p>
        ) : (
          <div className="docs-accordion" style={{ marginTop: 12 }}>
            {documentos.map((doc) => (
              <div key={doc.id} className="docs-item">
                <span>{doc.titulo || doc.nome || 'Documento'} - {formatarDataHora(doc.data_upload)}</span>
                {doc.url ? <a href={doc.url} target="_blank" rel="noreferrer" className="btn-icon btn-view" title="Abrir">Abrir</a> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAnamnese && (
        <div className="modal-overlay" onClick={() => setModalAnamnese(false)}>
          <div className="modal-box prescricao-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{anamneseEditando ? 'Editar anamnese' : 'Nova anamnese'}</h3>
              <button type="button" className="modal-close" onClick={() => setModalAnamnese(false)}>x</button>
            </div>
            <form onSubmit={salvarAnamnese}>
              <div className="form-row">
                <label className="form-label">Motivo principal</label>
                <input className="form-input" value={formAnamnese.motivo_principal} onChange={setAnamnese('motivo_principal')} />
              </div>
              <div className="form-row-2">
                <div className="form-row">
                  <label className="form-label">Ultimo exame</label>
                  <input className="form-input" type="date" value={formAnamnese.data_ultimo_exame} onChange={setAnamnese('data_ultimo_exame')} />
                </div>
                <div className="form-row">
                  <label className="form-label">Medicamentos</label>
                  <input className="form-input" value={formAnamnese.medicamentos} onChange={setAnamnese('medicamentos')} />
                </div>
              </div>
              <div className="form-row-2">
                <textarea className="form-input" rows={3} placeholder="Sintomas" value={formAnamnese.sintomas} onChange={setAnamnese('sintomas')} />
                <textarea className="form-input" rows={3} placeholder="Observacoes gerais" value={formAnamnese.observacoes_gerais} onChange={setAnamnese('observacoes_gerais')} />
                <textarea className="form-input" rows={3} placeholder="Doencas oculares" value={formAnamnese.doencas_oculares} onChange={setAnamnese('doencas_oculares')} />
                <textarea className="form-input" rows={3} placeholder="Doencas sistemicas" value={formAnamnese.doencas_sistemicas} onChange={setAnamnese('doencas_sistemicas')} />
              </div>
              <div className="checkbox-grid">
                {[
                  ['uso_oculos', 'Usa oculos'],
                  ['uso_lente', 'Usa lente'],
                  ['dificuldade_longe', 'Dificuldade longe'],
                  ['dificuldade_perto', 'Dificuldade perto'],
                  ['cefaleia', 'Cefaleia'],
                ].map(([field, label]) => (
                  <label key={field} className="check-pill">
                    <input type="checkbox" checked={formAnamnese[field]} onChange={setAnamnese(field)} />
                    {label}
                  </label>
                ))}
              </div>
              <div className="form-row-2">
                <input className="form-input" placeholder="Local da cefaleia" value={formAnamnese.cefaleia_local} onChange={setAnamnese('cefaleia_local')} />
                <input className="form-input" placeholder="Frequencia da cefaleia" value={formAnamnese.cefaleia_frequencia} onChange={setAnamnese('cefaleia_frequencia')} />
              </div>
              <textarea className="form-input" rows={3} placeholder="Antecedentes familiares" value={formAnamnese.antecedentes_familiares} onChange={setAnamnese('antecedentes_familiares')} />
              <textarea className="form-input" rows={4} placeholder="Observacoes finais" value={formAnamnese.observacoes_finais} onChange={setAnamnese('observacoes_finais')} style={{ marginTop: 12 }} />
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModalAnamnese(false)}>Fechar</button>
                <button type="submit" className="btn" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalPrescricao && (
        <div className="modal-overlay" onClick={() => setModalPrescricao(false)}>
          <div className="modal-box prescricao-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{prescricaoEditando ? formPresc.titulo : 'Nova Prescricao para Oculos'}</h3>
              <button type="button" className="modal-close" onClick={() => setModalPrescricao(false)}>x</button>
            </div>
            <form onSubmit={salvarPrescricao}>
              <div className="form-row">
                <label className="form-label">Titulo</label>
                <input className="form-input" value={formPresc.titulo} onChange={setPresc('titulo')} />
              </div>
              <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                <table className="table presc-table">
                  <thead>
                    <tr>
                      <th>Para longe</th>
                      <th>Esferico</th>
                      <th>Cilindrico</th>
                      <th>Eixo</th>
                      <th>AV</th>
                      <th>Prisma</th>
                      <th>DNP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>OD</strong></td>
                      <td><CampoPrescricao field="od_esferico" value={formPresc.od_esferico} onChange={setPresc} /></td>
                      <td><CampoPrescricao field="od_cilindrico" value={formPresc.od_cilindrico} onChange={setPresc} /></td>
                      <td><CampoPrescricao field="od_eixo" value={formPresc.od_eixo} onChange={setPresc} /></td>
                      <td><CampoPrescricao field="od_av" value={formPresc.od_av} onChange={setPresc} /></td>
                      <td><CampoPrescricao field="od_prisma" value={formPresc.od_prisma} onChange={setPresc} /></td>
                      <td><CampoPrescricao field="od_dnp" value={formPresc.od_dnp} onChange={setPresc} /></td>
                    </tr>
                    <tr>
                      <td><strong>OE</strong></td>
                      <td><CampoPrescricao field="oe_esferico" value={formPresc.oe_esferico} onChange={setPresc} /></td>
                      <td><CampoPrescricao field="oe_cilindrico" value={formPresc.oe_cilindrico} onChange={setPresc} /></td>
                      <td><CampoPrescricao field="oe_eixo" value={formPresc.oe_eixo} onChange={setPresc} /></td>
                      <td><CampoPrescricao field="oe_av" value={formPresc.oe_av} onChange={setPresc} /></td>
                      <td><CampoPrescricao field="oe_prisma" value={formPresc.oe_prisma} onChange={setPresc} /></td>
                      <td><CampoPrescricao field="oe_dnp" value={formPresc.oe_dnp} onChange={setPresc} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="form-row-3">
                <input className="form-input" type="number" step="0.5" inputMode="decimal" placeholder="Adicao" value={formPresc.adicao} onChange={setPresc('adicao')} />
                <input className="form-input" placeholder="Lente" value={formPresc.lente} onChange={setPresc('lente')} />
                <input className="form-input" type="date" value={formPresc.retorno} onChange={setPresc('retorno')} />
              </div>
              <textarea className="form-input" value={formPresc.observacoes} onChange={setPresc('observacoes')} rows={4} placeholder="Observacoes" />
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModalPrescricao(false)}>Fechar</button>
                <button type="submit" className="btn" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
