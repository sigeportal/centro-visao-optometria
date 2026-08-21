import api from './axios';

async function getData(url) {
  const response = await api.get(url);
  return response.data?.data;
}

export const obterResumo = () => getData('/v1/dashboard/resumo');
export const listarProximasConsultas = () => getData('/v1/dashboard/proximas-consultas');
export const listarAniversariantes = () => getData('/v1/dashboard/aniversariantes');
export const listarConsultasVencidas = () => getData('/v1/dashboard/consultas-vencidas');
