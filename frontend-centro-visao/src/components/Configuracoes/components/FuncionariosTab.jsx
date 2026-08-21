import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Briefcase as BriefcaseBusiness, KeyRound, Loader2, Plus, RefreshCw, Save, Search, X } from 'lucide-react';
import { atualizarFuncionario, atualizarStatusFuncionario, criarFuncionario, listarFuncionarios } from '../../../api/funcionarios';

const EMPTY_FORM = { nome: '', cpf: '', celular: '', email: '', categoria: '', atende: false };
const messageOf = (error, fallback) => error?.response?.data?.error?.message || error?.message || fallback;

function EmployeeModal({ form, setForm, saving, error, onClose, onSubmit }) {
  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-modal w-full max-w-2xl overflow-hidden my-auto animate-fade-in text-xs">
        <div className="bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-forest-800">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Equipe & Funcionários</p>
            <h3 className="text-base font-bold text-white mt-0.5">{form.id ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
            <p className="text-[11px] text-forest-200/80">O acesso ao sistema poderá ser configurado na aba Usuários & Permissões.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-forest-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 font-bold flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="block">
            <span className="clinical-label">Nome Completo <span className="text-rose-500">*</span></span>
            <input
              required
              maxLength={120}
              value={form.nome}
              onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
              className="clinical-input mt-1 font-medium"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label>
              <span className="clinical-label">CPF</span>
              <input
                maxLength={14}
                value={form.cpf}
                onChange={(event) => setForm((current) => ({ ...current, cpf: event.target.value }))}
                className="clinical-input mt-1 font-mono font-medium"
              />
            </label>
            <label>
              <span className="clinical-label">Celular / WhatsApp</span>
              <input
                maxLength={20}
                value={form.celular}
                onChange={(event) => setForm((current) => ({ ...current, celular: event.target.value }))}
                className="clinical-input mt-1 font-medium"
              />
            </label>
            <label>
              <span className="clinical-label">E-mail</span>
              <input
                type="email"
                maxLength={120}
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="clinical-input mt-1 font-medium"
              />
            </label>
            <label>
              <span className="clinical-label">Categoria / Função</span>
              <input
                maxLength={60}
                value={form.categoria}
                onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value }))}
                placeholder="Ex.: Optometrista"
                className="clinical-input mt-1 font-medium"
              />
            </label>
          </div>

          <label className="flex items-center gap-2.5 p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl font-bold text-xs text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.atende)}
              onChange={(event) => setForm((current) => ({ ...current, atende: event.target.checked }))}
              className="w-4 h-4 rounded text-forest-700 focus:ring-forest-500"
            />
            <span>Realiza atendimentos clínicos e aparece na agenda</span>
          </label>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function FuncionariosTab({ onCreateAccess, onShowSuccess }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listarFuncionarios());
    } catch (requestError) {
      setError(messageOf(requestError, 'Não foi possível carregar os funcionários.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');
    if (!q) return items;
    return items.filter((item) => [item.nome, item.cpf, item.email, item.categoria].some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(q)));
  }, [items, search]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        nome: form.nome.trim(),
        cpf: form.cpf,
        celular: form.celular,
        email: form.email,
        categoria: form.categoria,
        atende: Boolean(form.atende),
      };
      const saved = form.id ? await atualizarFuncionario(form.id, payload) : await criarFuncionario(payload);
      if (Boolean(saved.ativo) !== Boolean(form.ativo)) await atualizarStatusFuncionario(saved.id, Boolean(form.ativo));
      setForm(null);
      await load();
      onShowSuccess();
    } catch (requestError) {
      setError(messageOf(requestError, 'Não foi possível salvar o funcionário.'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item) => {
    const action = item.ativo ? 'inativar' : 'reativar';
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} o funcionário “${item.nome}”?`)) return;
    try {
      await atualizarStatusFuncionario(item.id, !item.ativo);
      await load();
      onShowSuccess();
    } catch (requestError) {
      setError(messageOf(requestError, `Não foi possível ${action} o funcionário.`));
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      <div className="clinical-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Funcionários da Clínica</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Cadastre a equipe. Um funcionário pode existir sem acesso; cada acesso pertence a um único funcionário.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar funcionário..."
              className="clinical-input !pl-10 w-full sm:w-60"
            />
          </div>
          <button
            type="button"
            onClick={() => { setError(''); setForm(EMPTY_FORM); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Funcionário</span>
          </button>
        </div>
      </div>

      {error && !form && (
        <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="clinical-panel overflow-x-auto shadow-hairline">
        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando funcionários...</span>
          </div>
        ) : (
          <table className="clinical-table min-w-[900px]">
            <thead>
              <tr>
                <th className="py-3 px-5 text-left">Funcionário</th>
                <th className="py-3 px-3 text-left">Contato</th>
                <th className="py-3 px-3 text-left">Função</th>
                <th className="py-3 px-3 text-left">Atendimento</th>
                <th className="py-3 px-3 text-left">Acesso ao sistema</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">Nenhum funcionário encontrado.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-forest-50/20 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-slate-900 flex items-center gap-2">
                        <BriefcaseBusiness className="w-4 h-4 text-forest-700" />
                        {item.nome}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.cpf || `#${item.id}`}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="block font-medium text-slate-800">{item.celular || '—'}</span>
                      <span className="text-[10px] text-slate-400">{item.email || ''}</span>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-800">{item.categoria || 'Não informada'}</td>
                    <td className="py-3.5 px-3">
                      <span className={item.atende ? 'badge-confirmed' : 'badge-neutral'}>
                        {item.atende ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {item.possui_usuario ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{item.usuario_login}</span>
                          <span className={item.usuario_ativo ? 'badge-confirmed' : 'badge-neutral'}>
                            {item.usuario_ativo ? 'ativo' : 'inativo'}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!item.ativo}
                          onClick={() => onCreateAccess(item.id)}
                          className="btn-secondary py-1 px-2.5 text-xs text-forest-800 hover:bg-forest-50 inline-flex items-center gap-1"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Criar acesso</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={item.ativo ? 'badge-confirmed' : 'badge-neutral'}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setError(''); setForm({ ...EMPTY_FORM, ...item }); }}
                          className="btn-secondary py-1 px-2.5 text-xs"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(item)}
                          className="btn-secondary py-1 px-2.5 text-xs"
                        >
                          {item.ativo ? 'Inativar' : 'Reativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && (
        <button
          type="button"
          onClick={load}
          className="text-xs font-bold uppercase tracking-wider text-forest-800 hover:text-forest-900 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar lista</span>
        </button>
      )}

      {form && (
        <EmployeeModal
          form={form}
          setForm={setForm}
          saving={saving}
          error={error}
          onClose={() => setForm(null)}
          onSubmit={save}
        />
      )}
    </div>
  );
}
