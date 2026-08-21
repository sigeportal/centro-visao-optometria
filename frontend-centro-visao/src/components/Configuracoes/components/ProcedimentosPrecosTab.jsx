import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Clock, Loader2, Plus, RefreshCw, Save, Search, X } from 'lucide-react';
import { atualizarProcedimento, atualizarStatusProcedimento, criarProcedimento, listarProcedimentos } from '../../../api/configuracoes';
import { formatCurrency } from '../../../utils/formatters';

const EMPTY_FORM = { nome: '', duracao_minutos: 30, valor: 0, ativo: true };
const messageOf = (error, fallback) => error?.response?.data?.error?.message || error?.message || fallback;

function ProcedureModal({ form, setForm, saving, error, onClose, onSubmit }) {
  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-modal w-full max-w-lg overflow-hidden my-auto animate-fade-in text-xs">
        <div className="bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-forest-800">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Procedimentos & Preços</p>
            <h3 className="text-base font-bold text-white mt-0.5">{form.id ? 'Editar Procedimento' : 'Novo Procedimento'}</h3>
            <p className="text-[11px] text-forest-200/80">O valor é o padrão do catálogo utilizado na agenda.</p>
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
            <span className="clinical-label">Nome do Procedimento <span className="text-rose-500">*</span></span>
            <input
              required
              maxLength={120}
              value={form.nome}
              onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
              className="clinical-input mt-1 font-medium"
            />
          </label>

          <div className="grid grid-cols-2 gap-3.5">
            <label>
              <span className="clinical-label">Duração (minutos) <span className="text-rose-500">*</span></span>
              <input
                required
                type="number"
                min="5"
                max="1440"
                step="5"
                value={form.duracao_minutos}
                onChange={(event) => setForm((current) => ({ ...current, duracao_minutos: event.target.value }))}
                className="clinical-input mt-1 font-medium"
              />
            </label>
            <label>
              <span className="clinical-label">Valor padrão (R$) <span className="text-rose-500">*</span></span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={(event) => setForm((current) => ({ ...current, valor: event.target.value }))}
                className="clinical-input mt-1 font-mono font-medium"
              />
            </label>
          </div>

          <label className="flex items-center gap-2.5 p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl font-bold text-xs text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.ativo)}
              onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))}
              className="w-4 h-4 rounded text-forest-700 focus:ring-forest-500"
            />
            <span>Procedimento ativo no sistema</span>
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

export default function ProcedimentosPrecosTab({ onShowSuccess }) {
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
      setItems(await listarProcedimentos());
    } catch (requestError) {
      setError(messageOf(requestError, 'Não foi possível carregar os procedimentos.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');
    return q ? items.filter((item) => String(item.nome || '').toLocaleLowerCase('pt-BR').includes(q)) : items;
  }, [items, search]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        nome: form.nome.trim(),
        duracao_minutos: Number(form.duracao_minutos),
        valor: Number(form.valor),
      };
      const saved = form.id ? await atualizarProcedimento(form.id, payload) : await criarProcedimento(payload);
      if (Boolean(saved.ativo) !== Boolean(form.ativo)) await atualizarStatusProcedimento(saved.id, Boolean(form.ativo));
      setForm(null);
      await load();
      onShowSuccess();
    } catch (requestError) {
      setError(messageOf(requestError, 'Não foi possível salvar o procedimento.'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item) => {
    const action = item.ativo ? 'inativar' : 'reativar';
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} o procedimento “${item.nome}”?`)) return;
    try {
      await atualizarStatusProcedimento(item.id, !item.ativo);
      await load();
      onShowSuccess();
    } catch (requestError) {
      setError(messageOf(requestError, `Não foi possível ${action} o procedimento.`));
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      <div className="clinical-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Procedimentos & Catálogo de Preços</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Defina a duração e o valor padrão utilizados nos agendamentos da clínica.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar procedimento..."
              className="clinical-input !pl-10 w-full sm:w-60"
            />
          </div>
          <button
            type="button"
            onClick={() => { setError(''); setForm(EMPTY_FORM); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Procedimento</span>
          </button>
        </div>
      </div>

      {error && !form && (
        <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="clinical-panel overflow-hidden shadow-hairline">
        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando procedimentos...</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-slate-400 font-medium">Nenhum procedimento encontrado.</div>
            ) : (
              filtered.map((item) => (
                <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-forest-50/20 transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">{item.nome}</span>
                    <span className="text-slate-400 text-[10.5px] flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.duracao_minutos} minutos de atendimento</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-forest-800 text-sm">
                      {formatCurrency(Number(item.valor || 0))}
                    </span>
                    <span className={item.ativo ? 'badge-confirmed' : 'badge-neutral'}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setError(''); setForm({ ...item }); }}
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
                </div>
              ))
            )}
          </div>
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
        <ProcedureModal
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

