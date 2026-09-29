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

export function obterUrlArquivoDocumento(id, download = false) {
  const baseURL = (api.defaults.baseURL || import.meta.env.VITE_API_URL || 'http://localhost:9000').replace(/\/+$/, '');
  const params = new URLSearchParams();
  if (download) params.set('download', '1');
  const token = localStorage.getItem('co_token');
  if (token) params.set('token', token);
  const qs = params.toString();
  return `${baseURL}/v1/documentos/${id}/arquivo${qs ? `?${qs}` : ''}`;
}

export async function baixarArquivoDocumento(id, nomeArquivo) {
  try {
    const response = await api.get(`/v1/documentos/${id}/arquivo`, {
      params: { download: 1 },
      responseType: 'blob',
    });
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = nomeArquivo || `documento-${id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    return true;
  } catch (error) {
    if (error.response?.data instanceof Blob && error.response.data.type?.includes('application/json')) {
      const text = await error.response.data.text();
      try {
        error.response.data = JSON.parse(text);
      } catch {
        // ignore parse error
      }
    }
    throw error;
  }
}

export async function visualizarArquivoDocumento(id) {
  try {
    const response = await api.get(`/v1/documentos/${id}/arquivo`, {
      responseType: 'blob',
    });
    const contentType = response.headers?.['content-type'] || 'application/pdf';
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    return url;
  } catch (error) {
    if (error.response?.data instanceof Blob && error.response.data.type?.includes('application/json')) {
      const text = await error.response.data.text();
      try {
        error.response.data = JSON.parse(text);
      } catch {
        // ignore parse error
      }
    }
    throw error;
  }
}

export async function atualizarAnexoConsulta(id, payload) {
  const response = await api.put(`/v1/documentos/${id}`, { tipo: 'anexo', ...payload });
  return response.data?.data;
}

export async function finalizarConsulta(id, payload) {
  const response = await api.post(`/v1/consultas/${id}/finalizar`, payload);
  return response.data?.data;
}
