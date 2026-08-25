import api from './axios';

export async function listarPacientes({ busca = '', page = 1, limit = 10 } = {}, options = {}) {
  const params = { page, limit };
  if (busca.trim()) params.busca = busca.trim();

  const response = await api.get('/v1/pacientes', {
    params,
    signal: options.signal,
  });
  const data = response.data?.data;

  if (Array.isArray(data)) {
    return { items: data, total: data.length, page, limit };
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number(data?.total || 0),
    page: Number(data?.page || page),
    limit: Number(data?.limit || limit),
  };
}

export async function listarConsultasPaciente(id, options = {}) {
  const response = await api.get(`/v1/pacientes/${id}/consultas`, { signal: options.signal });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function listarRetornosPaciente(id, options = {}) {
  const response = await api.get(`/v1/pacientes/${id}/retornos`, { signal: options.signal });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function listarAnamnesesPaciente(id, options = {}) {
  const response = await api.get(`/v1/pacientes/${id}/anamneses`, { signal: options.signal });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function listarDocumentosPaciente(id, options = {}) {
  const response = await api.get(`/v1/pacientes/${id}/documentos`, { signal: options.signal });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function obterPaciente(id, options = {}) {
  const response = await api.get(`/v1/pacientes/${id}`, { signal: options.signal });
  return response.data?.data;
}

export async function criarPaciente(payload) {
  const response = await api.post('/v1/pacientes', payload);
  return response.data?.data;
}

export async function atualizarPaciente(id, payload) {
  const response = await api.put(`/v1/pacientes/${id}`, payload);
  return response.data?.data;
}
