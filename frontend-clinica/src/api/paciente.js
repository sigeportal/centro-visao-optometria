import api from './axios';

export const listarPacientes = async ({ busca = '', page = 1, limit = 10 } = {}) => {
  const params = { page, limit };
  if (busca) params.busca = busca;
  const { data } = await api.get('/v1/pacientes', { params });
  if (Array.isArray(data.data)) {
    return {
      items: data.data,
      total: data.data.length,
      page,
      limit,
    };
  }
  return {
    items: data.data?.items || [],
    total: Number(data.data?.total || 0),
    page: Number(data.data?.page || page),
    limit: Number(data.data?.limit || limit),
  };
};

export const obterPaciente = async (id) => {
  const { data } = await api.get(`/v1/pacientes/${id}`);
  return data.data;
};

export const criarPaciente = async (payload) => {
  const { data } = await api.post('/v1/pacientes', payload);
  return data.data;
};

export const atualizarPaciente = async (id, payload) => {
  const { data } = await api.put(`/v1/pacientes/${id}`, payload);
  return data.data;
};

export const excluirPaciente = async (id) => {
  const { data } = await api.delete(`/v1/pacientes/${id}`);
  return data;
};

export const listarAnamnesePaciente = async (pacienteId) => {
  const { data } = await api.get(`/v1/pacientes/${pacienteId}/anamneses`);
  return data.data;
};

export const listarFinanceiroPaciente = async (pacienteId) => {
  const { data } = await api.get(`/v1/pacientes/${pacienteId}/financeiro`);
  return data.data;
};

export const listarConsultasPaciente = async (pacienteId) => {
  const { data } = await api.get(`/v1/pacientes/${pacienteId}/consultas`);
  return data.data;
};

export const listarDocumentosPaciente = async (pacienteId) => {
  const { data } = await api.get(`/v1/pacientes/${pacienteId}/documentos`);
  return data.data;
};
