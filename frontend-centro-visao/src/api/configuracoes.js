import api from './axios';

export async function obterDadosClinica(options = {}) {
  const response = await api.get('/v1/configuracoes/clinica', { signal: options.signal });
  return response.data?.data || {};
}

export async function atualizarDadosClinica(payload) {
  const response = await api.put('/v1/configuracoes/clinica', payload);
  return response.data?.data || {};
}

function arrayData(response) {
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function listarParcerias(params = {}, options = {}) {
  return arrayData(await api.get('/v1/configuracoes/parcerias', { params, signal: options.signal }));
}

export async function criarParceria(payload) {
  const response = await api.post('/v1/configuracoes/parcerias', payload);
  return response.data?.data || {};
}

export async function atualizarParceria(id, payload) {
  const response = await api.put(`/v1/configuracoes/parcerias/${id}`, payload);
  return response.data?.data || {};
}

export async function atualizarStatusParceria(id, ativo) {
  const response = await api.patch(`/v1/configuracoes/parcerias/${id}/ativo`, { ativo });
  return response.data?.data || {};
}

export async function listarProcedimentos(params = {}, options = {}) {
  return arrayData(await api.get('/v1/configuracoes/procedimentos', { params, signal: options.signal }));
}

export async function criarProcedimento(payload) {
  const response = await api.post('/v1/configuracoes/procedimentos', payload);
  return response.data?.data || {};
}

export async function atualizarProcedimento(id, payload) {
  const response = await api.put(`/v1/configuracoes/procedimentos/${id}`, payload);
  return response.data?.data || {};
}

export async function atualizarStatusProcedimento(id, ativo) {
  const response = await api.patch(`/v1/configuracoes/procedimentos/${id}/ativo`, { ativo });
  return response.data?.data || {};
}
