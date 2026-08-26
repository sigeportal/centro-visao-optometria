import api from './axios';

export async function listarFuncionarios(params = {}, options = {}) {
  const response = await api.get('/v1/funcionarios', { params, signal: options.signal });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function criarFuncionario(payload) {
  const response = await api.post('/v1/funcionarios', payload);
  return response.data?.data || {};
}

export async function atualizarFuncionario(id, payload) {
  const response = await api.put(`/v1/funcionarios/${id}`, payload);
  return response.data?.data || {};
}

export async function atualizarStatusFuncionario(id, ativo) {
  const response = await api.patch(`/v1/funcionarios/${id}/ativo`, { ativo });
  return response.data?.data || {};
}
