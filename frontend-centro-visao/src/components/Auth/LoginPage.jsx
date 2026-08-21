import { useState } from 'react';
import { AlertCircle, Loader2, LockKeyhole, LogIn, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../Common/BrandLogo';

function getErrorMessage(error) {
  return error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || 'Não foi possível entrar. Verifique as credenciais e tente novamente.';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Preencha usuário e senha.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(username.trim(), password);
      if (result?.success) {
        navigate('/', { replace: true });
        return;
      }
      setErrorMessage(result?.error?.message || 'Usuário ou senha inválidos.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#021c17] via-[#02241d] to-[#011410] flex items-center justify-center p-4 sm:p-6 relative select-none overflow-hidden">
      {/* Ambient optical glow matching logo emerald & amber */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <section className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-panel overflow-hidden relative z-10 animate-fade-in" aria-labelledby="login-title">
        {/* Brand Header Banner */}
        <div className="bg-gradient-to-r from-[#022e24] via-[#033c2e] to-[#022e24] text-white px-7 py-6 border-b border-forest-700/60 relative">
          <BrandLogo theme="dark" size="lg" showSubtitle={true} />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-7 space-y-4" noValidate>
          <div>
            <h2 id="login-title" className="text-base font-bold text-slate-900 tracking-tight">Acesso ao sistema</h2>
            <p className="text-xs text-slate-500 mt-0.5">Informe suas credenciais para gerenciar a clínica.</p>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 border border-rose-200 bg-rose-50 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-rose-800 animate-slide-down" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="username" className="clinical-label">
              Usuário
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={loading}
                placeholder="Seu usuário"
                className="clinical-input pl-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="clinical-label">
              Senha
            </label>
            <div className="relative">
              <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                placeholder="Sua senha"
                className="clinical-input pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 btn-primary mt-2 uppercase tracking-wider text-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <LogIn className="w-4 h-4" aria-hidden="true" />}
            <span>{loading ? 'Validando acesso...' : 'Entrar no sistema'}</span>
          </button>
        </form>
      </section>
    </main>
  );
}

