import api from './axios';

export async function login(username, password) {
  const response = await api.post('/v1/auth/login', { username, password });
  return response.data;
}

export async function obterMinhaSessao() {
  const response = await api.get('/v1/auth/me');
  return response.data?.data;
}

/**
 * Atualiza a foto de perfil do usuário autenticado.
 * Envia { foto_base64, mime_type } para o backend.
 *
 * @param {string} fotoBase64 - Imagem em Base64 ou Data URL (ex: 'data:image/webp;base64,...')
 * @param {string} [mimeType='image/webp'] - Tipo MIME da imagem comprimida
 * @param {number|string} [explicitUserId] - ID opcional do usuário (obtido da sessão se omitido)
 * @returns {Promise<{ success: boolean, data: { foto: string } }>}
 */
export async function atualizarMinhaFoto(fotoBase64, mimeType = 'image/webp', explicitUserId = null) {
  let userId = explicitUserId;
  if (!userId) {
    try {
      const stored = localStorage.getItem('co_user');
      if (stored) {
        const u = JSON.parse(stored);
        userId = u?.id || u?.usuario_id || u?.userId;
      }
    } catch {
      // ignora
    }
  }

  const endpoint = userId ? `/v1/usuarios/${userId}/foto` : '/v1/usuarios/minha-foto';
  const response = await api.post(endpoint, {
    foto_base64: fotoBase64 || '',
    mime_type: mimeType || 'image/webp',
  });
  return response.data;
}

/**
 * Remove a foto de perfil do usuário.
 *
 * @param {number|string} [userId]
 * @returns {Promise<any>}
 */
export async function removerMinhaFoto(userId = null) {
  return atualizarMinhaFoto('', '', userId);
}
