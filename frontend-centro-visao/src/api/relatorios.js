import api from './axios';

function listData(response) {
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function listarRetornosRelatorio(options = {}) {
  return listData(await api.get('/v1/dashboard/retornos', { signal: options.signal }));
}

export async function listarAniversariantesRelatorio(params = {}, options = {}) {
  return listData(await api.get('/v1/dashboard/aniversariantes', {
    params,
    signal: options.signal,
  }));
}
