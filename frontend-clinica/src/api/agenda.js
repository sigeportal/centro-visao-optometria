import api from './axios';

export const listarAgenda = async (params = {}) => {
  const { data } = await api.get('/v1/agenda', { params });
  return data.data;
};

export const obterAgendamento = async (id) => {
  const { data } = await api.get(`/v1/agenda/${id}`);
  return data.data;
};

export const criarAgendamento = async (payload) => {
  const { data } = await api.post('/v1/agenda', payload);
  return data.data;
};

export const atualizarAgendamento = async (id, payload) => {
  const { data } = await api.put(`/v1/agenda/${id}`, payload);
  return data.data;
};

export const alterarStatusAgendamento = async (id, status) => {
  const { data } = await api.patch(`/v1/agenda/${id}/status`, { status });
  return data.data;
};

export const cancelarAgendamento = async (id) => {
  const { data } = await api.delete(`/v1/agenda/${id}`);
  return data.data;
};

export const listarFilaEspera = async () => {
  const { data } = await api.get('/v1/agenda/fila-espera');
  return data.data;
};

export const lancarPagamentoAgendamento = async (id, payload = {}) => {
  const { data } = await api.post(`/v1/agenda/${id}/lancar-pagamento`, payload);
  return data.data;
};
