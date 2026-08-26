import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Edit2,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import {
  atualizarStatusUsuario,
  atualizarUsuario,
  criarUsuario,
  listarFuncionariosDisponiveis,
  listarUsuarios,
  redefinirSenha,
} from '../../../api/autorizacao';
import { useAuth } from '../../../context/AuthContext';
import { PROFILE_LABELS } from '../../../constants/permissions';

const PROFILES = ['recepcionista', 'optometrista', 'admin'];
const EMPTY_FORM = {
  username: '',
  funcionario_id: '',
  perfil: 'recepcionista',
  senha: '',
  confirmar_senha: '',
};

const PROFILE_PERMISSIONS = {
  recepcionista: [
    'Dashboard', 'Pacientes: consultar e editar', 'Agenda: consultar e alterar',
    'Consultas: visualizar resumo', 'Registrar pagamento do atendimento',
  ],
  optometrista: [
    'Dashboard', 'Pacientes: consultar e editar', 'Agenda: consultar e alterar',
    'Consultas: visualizar resumo', 'Conteúdo clínico: consultar e alterar',
    'Configurar ficha clínica',
  ],
  admin: [
    'Acesso operacional completo', 'Excluir ou inativar pacientes',
    'Conteúdo clínico: consultar e alterar', 'Configurar ficha clínica',
    'Financeiro: lançar e consultar', 'Administrar sistema, usuários e perfis',
  ],
};

function errorMessage(error, fallback) {
  return error?.response?.data?.error?.message || error?.message || fallback;
}

function PermissionSummary({ profile }) {
  return (
    <div className="border border-slate-200/80 rounded-xl bg-slate-50/70 p-3.5 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Permissões do perfil
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(PROFILE_PERMISSIONS[profile] || []).map((permission) => (
          <span key={permission} className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 shadow-hairline">
            {permission}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5">
        As permissões são definidas pelo perfil único do usuário e seguem a matriz de autorização do sistema.
      </p>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-modal w-full max-w-2xl max-h-[92vh] overflow-hidden my-auto animate-fade-in text-xs flex flex-col">
        <div className="bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white px-5 sm:px-6 py-4 flex items-start justify-between gap-4 border-b border-forest-800 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Usuários & Permissões</p>
            <h3 className="text-base font-bold text-white mt-0.5">{title}</h3>
            {subtitle && <p className="text-[11px] text-forest-200/80 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-forest-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function UsuariosPermissoesTab({ onShowSuccess, accessEmployeeRequest = null, onAccessRequestHandled }) {
  const { user, refreshSession } = useAuth();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [password, setPassword] = useState({ senha: '', confirmar_senha: '' });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await listarUsuarios());
    } catch (requestError) {
      setError(errorMessage(requestError, 'Não foi possível carregar os usuários.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!accessEmployeeRequest?.id) return undefined;
    let active = true;
    setError('');
    listarFuncionariosDisponiveis()
      .then((available) => {
        if (!active) return;
        setEmployees(available);
        setEditingUser(null);
        setForm({ ...EMPTY_FORM, funcionario_id: String(accessEmployeeRequest.id) });
        setUserModalOpen(true);
        onAccessRequestHandled?.();
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError, 'Não foi possível preparar o acesso do funcionário.'));
      });
    return () => { active = false; };
  }, [accessEmployeeRequest, onAccessRequestHandled]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (!query) return users;
    return users.filter((item) => [
      item.username,
      item.funcionario,
      PROFILE_LABELS[item.perfil],
      item.ativo ? 'ativo' : 'inativo',
    ].some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(query)));
  }, [search, users]);

  const openNewUser = async () => {
    setError('');
    try {
      setEmployees(await listarFuncionariosDisponiveis());
      setEditingUser(null);
      setForm(EMPTY_FORM);
      setUserModalOpen(true);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Não foi possível carregar os funcionários disponíveis.'));
    }
  };

  const openEditUser = async (selectedUser) => {
    setError('');
    try {
      setEmployees(await listarFuncionariosDisponiveis(selectedUser.user_id));
      setEditingUser(selectedUser);
      setForm({
        ...EMPTY_FORM,
        username: selectedUser.username || '',
        funcionario_id: String(selectedUser.funcionario_id || ''),
        perfil: selectedUser.perfil || 'recepcionista',
      });
      setUserModalOpen(true);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Não foi possível carregar os funcionários disponíveis.'));
    }
  };

  const saveUser = async (event) => {
    event.preventDefault();
    if (!editingUser && form.senha.length < 8) {
      setError('A senha deve possuir no mínimo 8 caracteres.');
      return;
    }
    if (!editingUser && form.senha !== form.confirmar_senha) {
      setError('A confirmação de senha não confere.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        username: form.username.trim(),
        funcionario_id: Number(form.funcionario_id),
        perfil: form.perfil,
        ...(!editingUser ? { senha: form.senha, confirmar_senha: form.confirmar_senha } : {}),
      };
      const savedUser = editingUser
        ? await atualizarUsuario(editingUser.user_id, payload)
        : await criarUsuario(payload);
      setUserModalOpen(false);
      await loadUsers();
      if (Number(user?.user_id) === Number(savedUser?.user_id)) await refreshSession();
      onShowSuccess();
    } catch (requestError) {
      setError(errorMessage(requestError, 'Não foi possível salvar o usuário.'));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (password.senha.length < 8) {
      setError('A senha deve possuir no mínimo 8 caracteres.');
      return;
    }
    if (password.senha !== password.confirmar_senha) {
      setError('A confirmação de senha não confere.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await redefinirSenha(editingUser.user_id, password.senha, password.confirmar_senha);
      setPasswordModalOpen(false);
      onShowSuccess();
    } catch (requestError) {
      setError(errorMessage(requestError, 'Não foi possível redefinir a senha.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = async (selectedUser) => {
    const action = selectedUser.ativo ? 'inativar' : 'reativar';
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} o usuário "${selectedUser.username}"?`)) return;
    setError('');
    try {
      await atualizarStatusUsuario(selectedUser.user_id, !selectedUser.ativo);
      await loadUsers();
      onShowSuccess();
    } catch (requestError) {
      setError(errorMessage(requestError, `Não foi possível ${action} o usuário.`));
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      <div className="clinical-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Usuários & Permissões</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Organize acessos, funcionário vinculado, perfil, estado e senha de login.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar usuário..."
              className="clinical-input !pl-10 w-full sm:w-60"
            />
          </div>
          <button
            type="button"
            onClick={openNewUser}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold flex items-center justify-between gap-3" role="alert">
          <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Fechar erro"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="clinical-panel overflow-x-auto shadow-hairline">
        {loading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Carregando usuários...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Nenhum usuário encontrado.</div>
        ) : (
          <table className="clinical-table min-w-[820px]">
            <thead>
              <tr>
                <th className="py-3 px-5 text-left">Usuário</th>
                <th className="py-3 px-3 text-left">Funcionário</th>
                <th className="py-3 px-3 text-left">Perfil e permissões</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((selectedUser) => {
                const ownUser = Number(user?.user_id) === Number(selectedUser.user_id);
                return (
                  <tr key={selectedUser.user_id} className="hover:bg-forest-50/20 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="block font-bold text-slate-900">{selectedUser.username}</span>
                      <span className="text-[10px] text-slate-400 font-mono">#{selectedUser.user_id}</span>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-800">{selectedUser.funcionario || 'Não vinculado'}</td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-forest-50 border border-forest-200 text-forest-800 text-[10px] font-bold uppercase rounded-lg">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {PROFILE_LABELS[selectedUser.perfil] || 'Sem perfil'}
                      </span>
                      <p className="mt-1 text-[10px] text-slate-400">{(PROFILE_PERMISSIONS[selectedUser.perfil] || []).length} permissões concedidas</p>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={selectedUser.ativo ? 'badge-confirmed' : 'badge-neutral'}>
                        {selectedUser.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditUser(selectedUser)}
                          className="btn-secondary p-2"
                          title="Editar usuário"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingUser(selectedUser); setPassword({ senha: '', confirmar_senha: '' }); setPasswordModalOpen(true); }}
                          className="btn-secondary p-2"
                          title="Redefinir senha"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={ownUser && selectedUser.ativo}
                          onClick={() => toggleUserStatus(selectedUser)}
                          className="btn-secondary p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={ownUser && selectedUser.ativo ? 'Não é permitido inativar o próprio usuário' : selectedUser.ativo ? 'Inativar usuário' : 'Reativar usuário'}
                        >
                          {selectedUser.ativo ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && (
        <button
          type="button"
          onClick={loadUsers}
          className="text-xs font-bold uppercase tracking-wider text-forest-800 hover:text-forest-900 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar lista</span>
        </button>
      )}

      {userModalOpen && (
        <Modal
          title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          subtitle="Cada usuário deve possuir um funcionário ativo exclusivo e um único perfil."
          onClose={() => setUserModalOpen(false)}
        >
          <form onSubmit={saveUser} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label>
                <span className="clinical-label">Login / Usuário</span>
                <input
                  required
                  maxLength={20}
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  className="clinical-input mt-1 font-medium"
                />
              </label>
              <label>
                <span className="clinical-label">Funcionário Vinculado</span>
                <select
                  required
                  value={form.funcionario_id}
                  onChange={(event) => setForm((current) => ({ ...current, funcionario_id: event.target.value }))}
                  className="clinical-input mt-1 font-medium"
                >
                  <option value="">Selecione um funcionário</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.nome}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="clinical-label">Perfil de Acesso</span>
              <select
                required
                value={form.perfil}
                onChange={(event) => setForm((current) => ({ ...current, perfil: event.target.value }))}
                className="clinical-input mt-1 font-medium"
              >
                {PROFILES.map((profile) => (
                  <option key={profile} value={profile}>{PROFILE_LABELS[profile]}</option>
                ))}
              </select>
            </label>
            <PermissionSummary profile={form.perfil} />
            {!editingUser && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label>
                  <span className="clinical-label">Senha Provisória</span>
                  <input
                    required
                    minLength={8}
                    type="password"
                    autoComplete="new-password"
                    value={form.senha}
                    onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))}
                    className="clinical-input mt-1 font-medium"
                  />
                </label>
                <label>
                  <span className="clinical-label">Confirmar Senha</span>
                  <input
                    required
                    minLength={8}
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmar_senha}
                    onChange={(event) => setForm((current) => ({ ...current, confirmar_senha: event.target.value }))}
                    className="clinical-input mt-1 font-medium"
                  />
                </label>
              </div>
            )}
            <div className="pt-3.5 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Salvar Usuário</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {passwordModalOpen && (
        <Modal
          title={`Redefinir senha de ${editingUser?.username || ''}`}
          subtitle="A nova senha deve possuir no mínimo 8 caracteres."
          onClose={() => setPasswordModalOpen(false)}
        >
          <form onSubmit={savePassword} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label>
                <span className="clinical-label">Nova Senha</span>
                <input
                  required
                  minLength={8}
                  type="password"
                  autoComplete="new-password"
                  value={password.senha}
                  onChange={(event) => setPassword((current) => ({ ...current, senha: event.target.value }))}
                  className="clinical-input mt-1 font-medium"
                />
              </label>
              <label>
                <span className="clinical-label">Confirmar Senha</span>
                <input
                  required
                  minLength={8}
                  type="password"
                  autoComplete="new-password"
                  value={password.confirmar_senha}
                  onChange={(event) => setPassword((current) => ({ ...current, confirmar_senha: event.target.value }))}
                  className="clinical-input mt-1 font-medium"
                />
              </label>
            </div>
            <div className="pt-3.5 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                <span>Redefinir Senha</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

