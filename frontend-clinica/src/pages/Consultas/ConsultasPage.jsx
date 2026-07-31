import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Section from '../../components/common/Section';
import { formatDateTime } from '../../utils/date';
import {
  criarPrescricao,
  finalizarConsulta,
  listarConsultas,
  listarPrescricoes,
  obterAnamnese,
  salvarAnamnese,
} from '../../api/consulta';

export default function ConsultasPage() {
  const location = useLocation();
  const [consultas, setConsultas] = useState([]);
  const [consultaAtiva, setConsultaAtiva] = useState(null);
  const [anamnese, setAnamnese] = useState({
    queixa_principal: '',
    historico: '',
    observacoes: '',
  });
  const [prescricoes, setPrescricoes] = useState([]);
  const [prescricaoForm, setPrescricaoForm] = useState({
    od_esferico: '',
    od_cilindrico: '',
    od_eixo: '',
    oe_esferico: '',
    oe_cilindrico: '',
    oe_eixo: '',
    adicao: '',
    observacoes: '',
  });

  const carregarConsultas = () => {
    listarConsultas()
      .then(setConsultas)
      .catch(() => toast.error('Nao foi possivel carregar consultas'));
  };

  useEffect(() => {
    carregarConsultas();
  }, []);

  useEffect(() => {
    const origemPaciente = location.state?.pacienteNome;
    if (origemPaciente) {
      toast.success(`Fluxo de atendimento iniciado para ${origemPaciente}`);
    }
  }, [location.state]);

  const abrirDetalhe = (consulta) => {
    setConsultaAtiva(consulta);
    obterAnamnese(consulta.id)
      .then((data) =>
        setAnamnese({
          queixa_principal: data.queixa_principal || '',
          historico: data.historico || '',
          observacoes: data.observacoes || '',
        })
      )
      .catch(() => setAnamnese({ queixa_principal: '', historico: '', observacoes: '' }));

    listarPrescricoes(consulta.id)
      .then(setPrescricoes)
      .catch(() => setPrescricoes([]));
  };

  const onFinalizar = (consultaId) => {
    finalizarConsulta(consultaId)
      .then(() => {
        toast.success('Consulta finalizada');
        carregarConsultas();
      })
      .catch(() => toast.error('Nao foi possivel finalizar consulta'));
  };

  const onSalvarAnamnese = (event) => {
    event.preventDefault();
    if (!consultaAtiva) return;

    salvarAnamnese(consultaAtiva.id, anamnese)
      .then(() => toast.success('Anamnese salva'))
      .catch(() => toast.error('Nao foi possivel salvar anamnese'));
  };

  const onSalvarPrescricao = (event) => {
    event.preventDefault();
    if (!consultaAtiva) return;

    criarPrescricao(consultaAtiva.id, prescricaoForm)
      .then(() => {
        toast.success('Prescricao cadastrada');
        setPrescricaoForm({
          od_esferico: '',
          od_cilindrico: '',
          od_eixo: '',
          oe_esferico: '',
          oe_cilindrico: '',
          oe_eixo: '',
          adicao: '',
          observacoes: '',
        });
        return listarPrescricoes(consultaAtiva.id);
      })
      .then(setPrescricoes)
      .catch(() => toast.error('Nao foi possivel salvar prescricao'));
  };

  return (
    <div className="page-stack">
      <Section title="Consultas atendidas">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Paciente</th>
              <th>Procedimento</th>
              <th>Status</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {consultas.map((consulta) => (
              <tr key={consulta.id}>
                <td>{consulta.id}</td>
                <td>{consulta.paciente}</td>
                <td>{consulta.procedimento}</td>
                <td>{consulta.status}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-soft" onClick={() => abrirDetalhe(consulta)}>Detalhes</button>
                    <button className="btn btn-soft" onClick={() => onFinalizar(consulta.id)}>Finalizar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {consultaAtiva ? (
        <>
          <Section title={`Anamnese - Consulta #${consultaAtiva.id}`}>
            <form className="form-grid-2" onSubmit={onSalvarAnamnese}>
              <input
                placeholder="Queixa principal"
                value={anamnese.queixa_principal}
                onChange={(event) => setAnamnese((prev) => ({ ...prev, queixa_principal: event.target.value }))}
              />
              <textarea
                placeholder="Historico"
                value={anamnese.historico}
                onChange={(event) => setAnamnese((prev) => ({ ...prev, historico: event.target.value }))}
              />
              <textarea
                placeholder="Observacoes"
                value={anamnese.observacoes}
                onChange={(event) => setAnamnese((prev) => ({ ...prev, observacoes: event.target.value }))}
              />
              <button className="btn" type="submit">Salvar anamnese</button>
            </form>
          </Section>

          <Section title={`Prescricao - Consulta #${consultaAtiva.id}`}>
            <form className="form-grid-2" onSubmit={onSalvarPrescricao}>
              <input placeholder="OD Esferico" value={prescricaoForm.od_esferico} onChange={(event) => setPrescricaoForm((prev) => ({ ...prev, od_esferico: event.target.value }))} />
              <input placeholder="OD Cilindrico" value={prescricaoForm.od_cilindrico} onChange={(event) => setPrescricaoForm((prev) => ({ ...prev, od_cilindrico: event.target.value }))} />
              <input placeholder="OD Eixo" value={prescricaoForm.od_eixo} onChange={(event) => setPrescricaoForm((prev) => ({ ...prev, od_eixo: event.target.value }))} />
              <input placeholder="OE Esferico" value={prescricaoForm.oe_esferico} onChange={(event) => setPrescricaoForm((prev) => ({ ...prev, oe_esferico: event.target.value }))} />
              <input placeholder="OE Cilindrico" value={prescricaoForm.oe_cilindrico} onChange={(event) => setPrescricaoForm((prev) => ({ ...prev, oe_cilindrico: event.target.value }))} />
              <input placeholder="OE Eixo" value={prescricaoForm.oe_eixo} onChange={(event) => setPrescricaoForm((prev) => ({ ...prev, oe_eixo: event.target.value }))} />
              <input placeholder="Adicao" value={prescricaoForm.adicao} onChange={(event) => setPrescricaoForm((prev) => ({ ...prev, adicao: event.target.value }))} />
              <textarea placeholder="Observacoes" value={prescricaoForm.observacoes} onChange={(event) => setPrescricaoForm((prev) => ({ ...prev, observacoes: event.target.value }))} />
              <button className="btn" type="submit">Salvar prescricao</button>
            </form>

            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>OD</th>
                  <th>OE</th>
                  <th>Adicao</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {prescricoes.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{`${item.od_esferico || '-'} / ${item.od_cilindrico || '-'} / ${item.od_eixo || '-'}`}</td>
                    <td>{`${item.oe_esferico || '-'} / ${item.oe_cilindrico || '-'} / ${item.oe_eixo || '-'}`}</td>
                    <td>{item.adicao || '-'}</td>
                    <td>{formatDateTime(item.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      ) : null}
    </div>
  );
}
