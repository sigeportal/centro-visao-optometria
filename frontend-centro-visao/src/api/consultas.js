import api from './axios';

let clinicalReadQueue = Promise.resolve();

function enqueueClinicalRead(request) {
  const result = clinicalReadQueue.then(request);
  clinicalReadQueue = result.catch(() => undefined);
  return result;
}

export async function listarConsultas(options = {}) {
  const response = await api.get('/v1/consultas', { signal: options.signal });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function criarConsulta(payload) {
  const response = await api.post('/v1/consultas', payload);
  return response.data?.data;
}

export async function obterConsulta(id, options = {}) {
  const response = await api.get(`/v1/consultas/${id}`, { signal: options.signal });
  return response.data?.data;
}

export async function obterAnamneseConsulta(id, options = {}) {
  const response = await enqueueClinicalRead(() => api.get(`/v1/consultas/${id}/anamnese`, { signal: options.signal }));
  return response.data?.data || {};
}

export async function salvarAnamneseConsulta(id, payload) {
  const response = await api.post(`/v1/consultas/${id}/anamnese`, payload);
  return response.data?.data;
}

export async function criarAnamneseConsulta(id, payload) {
  const response = await api.post(`/v1/consultas/${id}/anamneses`, payload);
  return response.data?.data;
}

export async function obterImpressaoAnamnese(id) {
  const response = await api.get(`/v1/anamneses/${id}/impressao`);
  return response.data?.data;
}

export async function obterAnamnese(id, options = {}) {
  const response = await enqueueClinicalRead(() => api.get(`/v1/anamneses/${id}`, { signal: options.signal }));
  return response.data?.data || {};
}

export async function atualizarAnamnese(id, payload) {
  const response = await api.put(`/v1/anamneses/${id}`, payload);
  return response.data?.data;
}

export async function excluirAnamnese(id) {
  const response = await api.delete(`/v1/anamneses/${id}`);
  return response.data?.data;
}

export async function obterSecaoFichaClinica(id, section, options = {}) {
  const response = await enqueueClinicalRead(() => api.get(`/v1/consultas/${id}/ficha/${section}`, { signal: options.signal }));
  return response.data?.data;
}

export async function salvarSecaoFichaClinica(id, section, payload) {
  const response = await api.put(`/v1/consultas/${id}/ficha/${section}`, payload);
  return response.data?.data;
}

export async function listarPrescricoesConsulta(id, options = {}) {
  const response = await api.get(`/v1/consultas/${id}/prescricoes`, { signal: options.signal });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function criarPrescricaoConsulta(id, payload) {
  const response = await api.post(`/v1/consultas/${id}/prescricoes`, payload);
  return response.data?.data;
}

export async function atualizarPrescricaoConsulta(id, prescriptionId, payload) {
  const response = await api.put(`/v1/consultas/${id}/prescricoes/${prescriptionId}`, payload);
  return response.data?.data;
}

export async function obterImpressaoPrescricao(id) {
  const response = await api.get(`/v1/prescricoes/${id}/impressao`);
  return response.data?.data;
}

export async function listarDocumentosConsulta(id, options = {}) {
  const response = await api.get(`/v1/consultas/${id}/documentos`, { signal: options.signal });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function obterDocumentoConsulta(id, options = {}) {
  const response = await api.get(`/v1/documentos/${id}`, { signal: options.signal });
  return response.data?.data;
}

export async function criarDocumentoConsulta(id, payload) {
  const response = await api.post(`/v1/consultas/${id}/documentos`, payload);
  return response.data?.data;
}

export async function atualizarDocumentoConsulta(id, payload) {
  const response = await api.put(`/v1/documentos/${id}`, payload);
  return response.data?.data;
}

export async function emitirDocumentoConsulta(id) {
  const response = await api.post(`/v1/documentos/${id}/emitir`);
  return response.data?.data;
}

export async function obterImpressaoDocumento(id) {
  const response = await api.get(`/v1/documentos/${id}/impressao`);
  return response.data?.data;
}

export async function listarAnexosConsulta(id, options = {}) {
  const response = await api.get(`/v1/consultas/${id}/anexos`, { signal: options.signal });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function criarAnexoConsulta(id, payload) {
  const response = await api.post(`/v1/consultas/${id}/anexos`, payload);
  return response.data?.data;
}

export async function atualizarAnexoConsulta(id, payload) {
  const response = await api.put(`/v1/documentos/${id}`, { tipo: 'anexo', ...payload });
  return response.data?.data;
}

export async function finalizarConsulta(id, payload) {
  const response = await api.post(`/v1/consultas/${id}/finalizar`, payload);
  return response.data?.data;
}
