import api from './axios';

export const listarConsultas = async () => {
  const { data } = await api.get('/v1/consultas');
  return data.data;
};

export const obterConsulta = async (id) => {
  const { data } = await api.get(`/v1/consultas/${id}`);
  return data.data;
};

export const criarConsulta = async (payload) => {
  const { data } = await api.post('/v1/consultas', payload);
  return data.data;
};

export const finalizarConsulta = async (id) => {
  const { data } = await api.post(`/v1/consultas/${id}/finalizar`);
  return data.data;
};

export const obterAnamnese = async (consultaId) => {
  const { data } = await api.get(`/v1/consultas/${consultaId}/anamnese`);
  return data.data;
};

export const listarAnamneses = async (consultaId) => {
  const { data } = await api.get(`/v1/consultas/${consultaId}/anamneses`);
  return data.data;
};

export const salvarAnamnese = async (consultaId, payload) => {
  const { data } = await api.post(`/v1/consultas/${consultaId}/anamnese`, payload);
  return data.data;
};

export const criarAnamnese = async (consultaId, payload) => {
  const { data } = await api.post(`/v1/consultas/${consultaId}/anamneses`, payload);
  return data.data;
};

export const atualizarAnamnese = async (anamneseId, payload) => {
  const { data } = await api.put(`/v1/anamneses/${anamneseId}`, payload);
  return data.data;
};

export const excluirAnamnese = async (anamneseId) => {
  const { data } = await api.delete(`/v1/anamneses/${anamneseId}`);
  return data;
};

export const obterImpressaoAnamnese = async (anamneseId) => {
  const { data } = await api.get(`/v1/anamneses/${anamneseId}/impressao`);
  return data.data;
};

export const listarPrescricoes = async (consultaId) => {
  const { data } = await api.get(`/v1/consultas/${consultaId}/prescricoes`);
  return data.data;
};

export const criarPrescricao = async (consultaId, payload) => {
  const { data } = await api.post(`/v1/consultas/${consultaId}/prescricoes`, payload);
  return data.data;
};

export const atualizarPrescricao = async (prescricaoId, payload) => {
  const { data } = await api.put(`/v1/prescricoes/${prescricaoId}`, payload);
  return data.data;
};

export const excluirPrescricao = async (prescricaoId) => {
  const { data } = await api.delete(`/v1/prescricoes/${prescricaoId}`);
  return data;
};

export const obterImpressaoPrescricao = async (prescricaoId) => {
  const { data } = await api.get(`/v1/prescricoes/${prescricaoId}/impressao`);
  return data.data;
};

export const listarDocumentosConsulta = async (consultaId) => {
  const { data } = await api.get(`/v1/consultas/${consultaId}/documentos`);
  return data.data;
};

export const criarDocumentoConsulta = async (consultaId, payload) => {
  const { data } = await api.post(`/v1/consultas/${consultaId}/documentos`, payload);
  return data.data;
};
