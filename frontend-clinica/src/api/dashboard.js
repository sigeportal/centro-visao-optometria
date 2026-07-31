import api from './axios';

export const obterResumo = async () => {
  const { data } = await api.get('/v1/dashboard/resumo');
  return data.data;
};

export const listarProximasConsultas = async () => {
  const { data } = await api.get('/v1/dashboard/proximas-consultas');
  return data.data;
};

export const listarAniversariantes = async () => {
  const { data } = await api.get('/v1/dashboard/aniversariantes');
  return data.data;
};

export const listarConsultasVencidas = async () => {
  const { data } = await api.get('/v1/dashboard/consultas-vencidas');
  return data.data;
};
