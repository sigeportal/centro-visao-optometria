import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { atualizarPaciente, criarPaciente, obterPaciente } from '../../api/paciente';
import { toDateInputValue } from '../../utils/date';

const FORM_VAZIO = {
  nome: '',
  nome_social: '',
  data_nascimento: '',
  sexo: '',
  celular: '',
  telefone2: '',
  email: '',
  ocupacao: '',
  cpf: '',
  rg: '',
  como_conheceu: '',
  responsavel_nome: '',
  responsavel_cpf: '',
  endereco: '',
  complemento: '',
  cidade: '',
  estado: '',
  cep: '',
};

export default function PacienteFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(FORM_VAZIO);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit) {
      obterPaciente(id)
        .then((data) => {
          setForm({
            nome: data.nome || '',
            nome_social: data.nome_social || '',
            data_nascimento: toDateInputValue(data.data_nascimento),
            sexo: data.sexo || '',
            celular: data.celular || '',
            telefone2: data.telefone2 || '',
            email: data.email || '',
            ocupacao: data.ocupacao || '',
            cpf: data.cpf || '',
            rg: data.rg || '',
            como_conheceu: data.como_conheceu || '',
            responsavel_nome: data.responsavel_nome || '',
            responsavel_cpf: data.responsavel_cpf || '',
            endereco: data.endereco || '',
            complemento: data.complemento || '',
            cidade: data.cidade || '',
            estado: data.estado || '',
            cep: data.cep || '',
          });
        })
        .catch(() => toast.error('Não foi possível carregar paciente'));
    }
  }, [id, isEdit]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const salvar = (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error('Informe o nome do paciente');
      return;
    }
    setSaving(true);
    const op = isEdit ? atualizarPaciente(id, form) : criarPaciente(form);
    op.then((data) => {
      toast.success(isEdit ? 'Paciente atualizado' : 'Paciente cadastrado');
      navigate(`/pacientes/${isEdit ? id : data?.id || ''}`);
    })
      .catch(() => toast.error('Não foi possível salvar paciente'))
      .finally(() => setSaving(false));
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h2 className="page-title">{isEdit ? 'Editar Paciente' : 'Cadastrar Paciente'}</h2>
          <p className="breadcrumb">
            Início / Pacientes / {isEdit ? 'Editar' : 'Cadastrar'}
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/pacientes')}>
          ← Voltar
        </button>
      </div>

      <form className="section patient-form" onSubmit={salvar}>
        <div className="form-section-title">INFORMAÇÕES DO PACIENTE</div>

        <div className="patient-form-layout">
          <div className="patient-form-fields">
            <div className="form-row full">
              <label className="form-label">Nome do Paciente *</label>
              <input className="form-input" value={form.nome} onChange={set('nome')} required />
            </div>

            <div className="form-row-3">
              <div>
                <label className="form-label">Nome Social ou Apelido</label>
                <input className="form-input" value={form.nome_social} onChange={set('nome_social')} />
              </div>
              <div>
                <label className="form-label">Data de Nascimento</label>
                <input className="form-input" type="date" value={form.data_nascimento} onChange={set('data_nascimento')} />
              </div>
              <div>
                <label className="form-label">Sexo</label>
                <select className="form-input" value={form.sexo} onChange={set('sexo')}>
                  <option value="">Selecione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div>
                <label className="form-label">Celular/Whatsapp</label>
                <input className="form-input" value={form.celular} onChange={set('celular')} placeholder="(xx) xxxxx-xxxx" />
              </div>
              <div>
                <label className="form-label">Telefone 2</label>
                <input className="form-input" value={form.telefone2} onChange={set('telefone2')} placeholder="(xx) xxxx-xxxx" />
              </div>
            </div>

            <div className="form-section-subtitle">Dados Complementares</div>

            <div className="form-row-2">
              <div>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="form-label">Ocupação</label>
                <input className="form-input" value={form.ocupacao} onChange={set('ocupacao')} />
              </div>
            </div>

            <div className="form-row-2">
              <div>
                <label className="form-label">CPF</label>
                <input className="form-input" value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="form-label">RG</label>
                <input className="form-input" value={form.rg} onChange={set('rg')} />
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">Como conheceu a clínica?</label>
              <select className="form-input" value={form.como_conheceu} onChange={set('como_conheceu')}>
                <option value="">Selecione</option>
                <option value="Indicação">Indicação</option>
                <option value="Google">Google</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Plano de Saúde">Plano de Saúde</option>
                <option value="Outro">Outro</option>
              </select>
              <p className="form-hint">Use "Outro" quando a origem do cadastro nao estiver listada.</p>
            </div>

            <div className="form-section-subtitle">Responsável Legal</div>

            <div className="form-row-2">
              <div>
                <label className="form-label">Nome</label>
                <input className="form-input" value={form.responsavel_nome} onChange={set('responsavel_nome')} />
              </div>
              <div>
                <label className="form-label">CPF</label>
                <input className="form-input" value={form.responsavel_cpf} onChange={set('responsavel_cpf')} />
              </div>
            </div>

            <div className="form-section-subtitle">Endereço</div>

            <div className="form-row full">
              <label className="form-label">Endereço</label>
              <input className="form-input" value={form.endereco} onChange={set('endereco')} />
            </div>

            <div className="form-row full">
              <label className="form-label">Complemento</label>
              <input className="form-input" value={form.complemento} onChange={set('complemento')} />
            </div>

            <div className="form-row-3">
              <div>
                <label className="form-label">Cidade</label>
                <input className="form-input" value={form.cidade} onChange={set('cidade')} />
              </div>
              <div>
                <label className="form-label">Estado</label>
                <input className="form-input" value={form.estado} onChange={set('estado')} maxLength={2} />
              </div>
              <div>
                <label className="form-label">CEP</label>
                <input className="form-input" value={form.cep} onChange={set('cep')} placeholder="00000-000" />
              </div>
            </div>
          </div>

          <div className="patient-photo-col">
            <div className="patient-photo-box">
              <div className="patient-photo-avatar">👤</div>
              <p className="patient-photo-hint">Clique para inserir foto</p>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/pacientes')}>
            Cancelar
          </button>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar paciente'}
          </button>
        </div>
      </form>
    </div>
  );
}
