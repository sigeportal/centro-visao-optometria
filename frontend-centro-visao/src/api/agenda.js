import api from './axios';

export async function listarAgenda(params = {}, options = {}) {
  const response = await api.get('/v1/agenda', {
    params,
    signal: options.signal,
  });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function listarProfissionais(options = {}) {
  const response = await api.get('/v1/agenda/profissionais', {
    signal: options.signal,
  });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function listarParceriasAgenda(options = {}) {
  const response = await api.get('/v1/agenda/parcerias', { signal: options.signal });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function listarProcedimentosAgenda(options = {}) {
  const response = await api.get('/v1/agenda/procedimentos', { signal: options.signal });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function listarFilaEspera(options = {}) {
  const response = await api.get('/v1/agenda/fila-espera', {
    signal: options.signal,
  });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function criarAgendamento(payload) {
  const response = await api.post('/v1/agenda', payload);
  return response.data?.data;
}

export async function atualizarAgendamento(id, payload) {
  const response = await api.put(`/v1/agenda/${id}`, payload);
  return response.data?.data;
}

export async function alterarStatusAgendamento(id, status) {
  const response = await api.patch(`/v1/agenda/${id}/status`, { status });
  return response.data?.data;
}

export async function cancelarAgendamento(id) {
  const response = await api.post(`/v1/agenda/${id}/cancelar`);
  return response.data?.data;
}

export async function iniciarAtendimento(id) {
  const response = await api.post(`/v1/agenda/${id}/iniciar-atendimento`);
  return response.data?.data;
}
