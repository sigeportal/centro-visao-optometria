import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building2, Loader2, Mail, Phone, Plus, RefreshCw, Search } from 'lucide-react';
import { atualizarParceria, atualizarStatusParceria, criarParceria, listarParcerias } from '../../../api/configuracoes';
import NovaParceriaModal from './NovaParceriaModal';
import { formatCNPJ, formatPhone } from '../../../utils/formatters';

const EMPTY_FORM = { nome: '', cnpj: '', telefone: '', email: '', responsavel: '', endereco: '', cidade: '', estado: '', ativo: true };
const messageOf = (error, fallback) => error?.response?.data?.error?.message || error?.message || fallback;

export default function ParceriasTab({ onShowSuccess }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await listarParcerias()); }
    catch (requestError) { setError(messageOf(requestError, 'Não foi possível carregar as parcerias.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (!query) return items;
    return items.filter((item) => [item.nome, item.cnpj, item.responsavel, item.cidade].some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(query)));
  }, [items, search]);

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, nome: form.nome.trim() };
      const saved = form.id ? await atualizarParceria(form.id, payload) : await criarParceria(payload);
      if (Boolean(saved.ativo) !== Boolean(form.ativo)) await atualizarStatusParceria(saved.id, Boolean(form.ativo));
      setModalOpen(false); await load(); onShowSuccess();
    } catch (requestError) { setError(messageOf(requestError, 'Não foi possível salvar a parceria.')); }
    finally { setSaving(false); }
  };

  const toggle = async (item) => {
    const action = item.ativo ? 'inativar' : 'reativar';
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} a parceria “${item.nome}”?`)) return;
    try { await atualizarStatusParceria(item.id, !item.ativo); await load(); onShowSuccess(); }
    catch (requestError) { setError(messageOf(requestError, `Não foi possível ${action} a parceria.`)); }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      <div className="clinical-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Gestão de Parcerias</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Cadastre e gerencie óticas, clínicas e laboratórios parceiros.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar parceria..."
              className="clinical-input !pl-10 w-full sm:w-60"
            />
          </div>
          <button
            type="button"
            onClick={() => { setForm(EMPTY_FORM); setError(''); setModalOpen(true); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Parceria</span>
          </button>
        </div>
      </div>

      {error && !modalOpen && (
        <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold flex items-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="clinical-panel overflow-x-auto shadow-hairline">
        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando parcerias...</span>
          </div>
        ) : (
          <table className="clinical-table min-w-[850px]">
            <thead>
              <tr>
                <th className="py-3 px-5 text-left">Parceiro</th>
                <th className="py-3 px-3 text-left">CNPJ</th>
                <th className="py-3 px-3 text-left">Responsável</th>
                <th className="py-3 px-3 text-left">Contato</th>
                <th className="py-3 px-3 text-left">Localização</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">Nenhuma parceria encontrada.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-forest-50/20 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="flex items-center gap-2 font-bold text-slate-900">
                        <Building2 className="w-4 h-4 text-forest-700 shrink-0" />
                        {item.nome}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{item.endereco || 'Endereço não informado'}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">{formatCNPJ(item.cnpj) || '—'}</td>
                    <td className="py-3.5 px-3 font-medium text-slate-800">{item.responsavel || '—'}</td>
                    <td className="py-3.5 px-3 text-[10.5px] text-slate-600">
                      {item.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{formatPhone(item.telefone)}</span>}
                      {item.email && <span className="flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3 text-slate-400" />{item.email}</span>}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">{item.cidade ? `${item.cidade}${item.estado ? ` - ${item.estado}` : ''}` : '—'}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={item.ativo ? 'badge-confirmed' : 'badge-neutral'}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setForm({ ...EMPTY_FORM, ...item }); setError(''); setModalOpen(true); }}
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

      <NovaParceriaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        formData={form}
        setFormData={setForm}
        onSubmit={save}
        saving={saving}
        errorMessage={error}
      />
    </div>
  );
}

