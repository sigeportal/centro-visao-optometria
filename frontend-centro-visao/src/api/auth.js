import api from './axios';

export async function login(username, password) {
  const response = await api.post('/v1/auth/login', { username, password });
  return response.data;
}

export async function obterMinhaSessao() {
  const response = await api.get('/v1/auth/me');
  return response.data?.data;
}
