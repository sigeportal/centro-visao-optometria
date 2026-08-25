import api from './axios';

/**
 * Obtém a lista de seções da ficha clínica persistidas no backend.
 */
export async function listarSecoesFicha(options = {}) {
  const response = await api.get('/v1/ficha-clinica/secoes', { signal: options.signal });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

/**
 * Salva a configuração completa de seções (ordem, ativo, exibição) no backend.
 */
export async function salvarConfiguracaoCompletaFicha(secoes) {
  const response = await api.put('/v1/ficha-clinica/secoes', { secoes });
  return Array.isArray(response.data?.data) ? response.data.data : response.data;
}

/**
 * Atualiza a ordem das seções da ficha clínica.
 */
export async function salvarOrdemSecoesFicha(secoes) {
  const payload = {
    secoes: secoes.map((s, index) => ({
      id: s.id,
      ordem: s.ordem ?? (index + 1),
    })),
  };
  const response = await api.put('/v1/ficha-clinica/secoes/ordem', payload);
  return Array.isArray(response.data?.data) ? response.data.data : response.data;
}

/**
 * Ativa ou desativa uma seção específica.
 */
export async function atualizarAtivoSecaoFicha(id, ativo) {
  const response = await api.patch(`/v1/ficha-clinica/secoes/${id}/ativo`, { ativo: Boolean(ativo) });
  return response.data?.data;
}

/**
 * Atualiza opções de exibição (tela/impressão) de uma seção.
 */
export async function atualizarExibicaoSecaoFicha(id, { exibe_tela, exibe_impressao }) {
  const payload = {};
  if (typeof exibe_tela === 'boolean') payload.exibe_tela = exibe_tela;
  if (typeof exibe_impressao === 'boolean') payload.exibe_impressao = exibe_impressao;
  const response = await api.patch(`/v1/ficha-clinica/secoes/${id}/exibicao`, payload);
  return response.data?.data;
}
