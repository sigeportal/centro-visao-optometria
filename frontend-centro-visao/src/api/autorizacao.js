import api from './axios';

export async function listarUsuarios() {
  const response = await api.get('/v1/auth/usuarios');
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function listarFuncionariosDisponiveis(usuarioId = 0) {
  const response = await api.get('/v1/auth/usuarios/funcionarios-disponiveis', {
    params: usuarioId ? { usuario_id: usuarioId } : {},
  });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function criarUsuario(payload) {
  const response = await api.post('/v1/auth/usuarios', payload);
  return response.data?.data || {};
}

export async function atualizarUsuario(usuarioId, payload) {
  const response = await api.put(`/v1/auth/usuarios/${usuarioId}`, payload);
  return response.data?.data || {};
}

export async function redefinirSenha(usuarioId, senha, confirmarSenha) {
  const response = await api.patch(`/v1/auth/usuarios/${usuarioId}/senha`, {
    senha,
    confirmar_senha: confirmarSenha,
  });
  return response.data;
}

export async function atualizarStatusUsuario(usuarioId, ativo) {
  const response = await api.patch(`/v1/auth/usuarios/${usuarioId}/ativo`, { ativo });
  return response.data;
}
