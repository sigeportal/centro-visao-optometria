import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  atualizarAtivoSecaoFicha,
  atualizarExibicaoSecaoFicha,
  listarSecoesFicha,
  salvarOrdemSecoesFicha,
} from '../../api/fichaClinica';

export default function FichaClinicaConfigPage() {
  const [secoes, setSecoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dragIndexRef = useRef(null);
  const secoesRef = useRef([]);

  const carregar = () => {
    setLoading(true);
    listarSecoesFicha()
      .then(setSecoes)
      .catch(() => toast.error('Não foi possível carregar a ficha clínica'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    secoesRef.current = secoes;
  }, [secoes]);

  const aplicarListaRetornada = (lista) => {
    if (Array.isArray(lista) && lista.length > 0) {
      setSecoes(lista);
    }
  };

  const alternarAtivo = (secao) => {
    const proximoAtivo = !secao.ativo;
    const anterior = secoes;
    setSecoes((prev) => prev.map((item) => (item.id === secao.id ? { ...item, ativo: proximoAtivo } : item)));

    atualizarAtivoSecaoFicha(secao.id, proximoAtivo)
      .then(aplicarListaRetornada)
      .catch(() => {
        setSecoes(anterior);
        toast.error('Não foi possível atualizar a seção');
      });
  };

  const alternarExibicao = (secao, campo) => {
    const anterior = secoes;
    const exibicao = { [campo]: !secao[campo] };
    setSecoes((prev) => prev.map((item) => (item.id === secao.id ? { ...item, ...exibicao } : item)));

    atualizarExibicaoSecaoFicha(secao.id, exibicao)
      .then(aplicarListaRetornada)
      .catch(() => {
        setSecoes(anterior);
        toast.error('Não foi possível atualizar a exibição');
      });
  };

  const moverSecao = (origem, destino) => {
    if (origem === destino || origem === null) return;

    setSecoes((prev) => {
      const novaLista = [...prev];
      const [movida] = novaLista.splice(origem, 1);
      novaLista.splice(destino, 0, movida);
      dragIndexRef.current = destino;
      secoesRef.current = novaLista.map((secao, index) => ({ ...secao, ordem: index + 1 }));
      return secoesRef.current;
    });
  };

  const salvarOrdem = (lista = secoes) => {
    setSaving(true);
    salvarOrdemSecoesFicha(lista)
      .then((data) => {
        aplicarListaRetornada(data);
        toast.success('Configurações salvas');
      })
      .catch(() => toast.error('Não foi possível salvar configurações'))
      .finally(() => setSaving(false));
  };

  const finalizarArraste = () => {
    dragIndexRef.current = null;
    salvarOrdem(secoesRef.current);
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h2 className="page-title">Layout de Ficha Clínica</h2>
          <p className="breadcrumb">Início / Editar ficha clínica</p>
        </div>
      </div>

      <div className="section">
        <div className="section-label">FICHA CLÍNICA</div>
        <p className="config-hint">
          Ative, desative e organize as seções exibidas na ficha clínica e na impressão.
        </p>

        {loading ? (
          <p className="muted">Carregando...</p>
        ) : (
          <div className="ficha-config-list">
            {secoes.map((secao, index) => (
              <div
                key={secao.id}
                className={`ficha-config-item ${secao.ativo ? '' : 'is-disabled'}`}
                draggable
                onDragStart={() => {
                  dragIndexRef.current = index;
                }}
                onDragEnter={() => moverSecao(dragIndexRef.current, index)}
                onDragOver={(event) => event.preventDefault()}
                onDragEnd={finalizarArraste}
              >
                <span className="drag-handle" title="Arrastar para reordenar">::</span>
                <span className="ficha-config-label">{secao.nome}</span>

                <label className="ficha-config-check">
                  <input
                    type="checkbox"
                    checked={secao.exibe_tela}
                    onChange={() => alternarExibicao(secao, 'exibe_tela')}
                  />
                  Tela
                </label>

                <label className="ficha-config-check">
                  <input
                    type="checkbox"
                    checked={secao.exibe_impressao}
                    onChange={() => alternarExibicao(secao, 'exibe_impressao')}
                  />
                  Impressão
                </label>

                <button
                  type="button"
                  className={`toggle ${secao.ativo ? 'on' : ''}`}
                  onClick={() => alternarAtivo(secao)}
                  aria-label={`${secao.ativo ? 'Desativar' : 'Ativar'} ${secao.nome}`}
                >
                  <span />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="config-save-row">
          <button type="button" className="btn" onClick={() => salvarOrdem()} disabled={saving || loading}>
            {saving ? 'Salvando...' : 'Salvar ordem'}
          </button>
        </div>
      </div>
    </div>
  );
}
