import api from './axios';

const normalizarSecao = (secao) => ({
  id: Number(secao.id),
  chave: secao.chave,
  nome: secao.nome || secao.chave,
  ativo: Number(secao.ativo) === 1 || secao.ativo === true,
  ordem: Number(secao.ordem),
  exibe_tela: Number(secao.exibe_tela) === 1 || secao.exibe_tela === true,
  exibe_impressao: Number(secao.exibe_impressao) === 1 || secao.exibe_impressao === true,
});

const normalizarLista = (data) => (Array.isArray(data?.data) ? data.data.map(normalizarSecao) : []);

export const listarSecoesFicha = async () => {
  const { data } = await api.get('/v1/ficha-clinica/secoes');
  return normalizarLista(data);
};

export const salvarOrdemSecoesFicha = async (secoes) => {
  const payload = {
    secoes: secoes.map((secao, index) => ({
      id: secao.id,
      ordem: index + 1,
    })),
  };
  const { data } = await api.put('/v1/ficha-clinica/secoes/ordem', payload);
  return normalizarLista(data);
};

export const atualizarAtivoSecaoFicha = async (id, ativo) => {
  const { data } = await api.patch(`/v1/ficha-clinica/secoes/${id}/ativo`, { ativo });
  return normalizarLista(data);
};

export const atualizarExibicaoSecaoFicha = async (id, exibicao) => {
  const { data } = await api.patch(`/v1/ficha-clinica/secoes/${id}/exibicao`, exibicao);
  return normalizarLista(data);
};
