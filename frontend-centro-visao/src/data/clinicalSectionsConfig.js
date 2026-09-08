export const DEFAULT_CLINICAL_SECTIONS = [
  { id: 'anamnese', title: 'Anamnese', subtitle: 'Histórico ocular, queixa principal, sintomas e antecedentes', enabled: true },
  { id: 'prescricaoUltimoExame', title: 'Prescrição do Último Exame', subtitle: 'Óculos anteriores e medições prévias', enabled: true },
  { id: 'acuidadeVisual', title: 'Acuidade Visual', subtitle: 'Medição VL/VP com optotipos Snellen/LogMAR', enabled: true },
  { id: 'biomicroscopia', title: 'Biomicroscopia', subtitle: 'Inspeção de anexos, córnea e segmento anterior', enabled: true },
  { id: 'ceratometria', title: 'Ceratometria', subtitle: 'Medição de curvatura e astigmatismo corneano (OD/OE)', enabled: true },
  { id: 'tonometria', title: 'Tonometria', subtitle: 'Pressão intraocular (PIO OD/OE)', enabled: true },
  { id: 'forometria', title: 'Forometria', subtitle: 'Alinhamento e equilíbrio forométrica S/C e C/C', enabled: true },
  { id: 'oftalmoscopia', title: 'Oftalmoscopia', subtitle: 'Fundo de olho, papila, mácula e escavação OD/OE', enabled: true },
  { id: 'retinoscopiaDinamica', title: 'Retinoscopia Dinâmica', subtitle: 'Refração objetiva com acomodação ativa', enabled: true },
  { id: 'retinoscopiaEstatica', title: 'Retinoscopia Estática', subtitle: 'Refração objetiva ao longe', enabled: true },
  { id: 'avaliacaoMotora', title: 'Avaliação Motora', subtitle: 'Kappa, Hirschberg, Ducções e Versões (H-Diagram)', enabled: true },
  { id: 'rxFinal', title: 'RX Final', subtitle: 'Prescrição final de lentes e tratamentos', enabled: true },
  { id: 'amplitudeAcomodacao', title: 'Amplitude de Acomodação', subtitle: 'Técnica Sheard 40 cm e níveis OD/OE', enabled: true },
  { id: 'afinamento', title: 'Afinamento', subtitle: 'Ajuste fino esférico e cilíndrico', enabled: true },
  { id: 'dx', title: 'DX (Diagnóstico e Conduta)', subtitle: 'Diagnósticos refrativo/motor/ocular e conduta', enabled: true },
  { id: 'flexibilidadeAcomodacao', title: 'Flexibilidade e Facilidade de Acomodação', subtitle: 'Teste Flipper 40 cm, ciclos/min e adição', enabled: true },
  { id: 'ppc', title: 'PPC (Ponto Próximo de Convergência)', subtitle: 'Ponto de quebra e recuperação OR/Luz/Filtro', enabled: true },
  { id: 'reflexosPupilares', title: 'Reflexos Pupilares', subtitle: 'Fotomotor, Consensual e Acomodativo OD/OE', enabled: true },
  { id: 'reservasFusionais', title: 'Reservas Fusionais', subtitle: 'RFN e RFP em visão de longe e perto', enabled: true },
  { id: 'subjetivo', title: 'Subjetivo', subtitle: 'Refração subjetiva monocular e binocular', enabled: true },
  { id: 'testeAmbulatorial', title: 'Teste Ambulatorial', subtitle: 'Avaliação de tolerância e conforto com a nova refração', enabled: true },
];

export const ID_TO_CHAVE_MAP = {
  anamnese: 'anamnese',
  prescricaoUltimoExame: 'prescricao_ultimo_exame',
  acuidadeVisual: 'acuidade_visual',
  biomicroscopia: 'biomicroscopia',
  ceratometria: 'ceratometria',
  tonometria: 'tonometria',
  forometria: 'forometria',
  oftalmoscopia: 'oftalmoscopia',
  retinoscopiaDinamica: 'retinoscopia_dinamica',
  retinoscopiaEstatica: 'retinoscopia_estatica',
  avaliacaoMotora: 'avaliacao_motora',
  rxFinal: 'rx_final',
  amplitudeAcomodacao: 'amplitude_acomodacao',
  afinamento: 'afinamento',
  dx: 'dx',
  flexibilidadeAcomodacao: 'flexibilidade_acomodacao',
  adicao: 'adicao',
  ppc: 'ppc',
  reflexosPupilares: 'reflexos_pupilares',
  reservasFusionais: 'reservas_fusionais',
  subjetivo: 'subjetivo',
  testeAmbulatorial: 'teste_ambulatorial',
};

export const CHAVE_TO_ID_MAP = Object.entries(ID_TO_CHAVE_MAP).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {});

export function normalizeSectionId(keyOrId) {
  if (!keyOrId) return '';
  if (DEFAULT_CLINICAL_SECTIONS.some(s => s.id === keyOrId)) return keyOrId;
  return CHAVE_TO_ID_MAP[keyOrId] || keyOrId;
}

function normalizeFlag(value, fallback = true) {
  if (value === true || value === 1 || value === '1') return true;
  if (value === false || value === 0 || value === '0') return false;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

export function normalizeFromApi(apiItems) {
  if (!Array.isArray(apiItems) || apiItems.length === 0) {
    return getStoredClinicalSections();
  }

  const defaultMap = new Map(DEFAULT_CLINICAL_SECTIONS.map(s => [s.id, s]));
  const seenIds = new Set();
  const normalized = [];

  for (const item of apiItems) {
    const rawKey = item.chave || item.id;
    const frontendId = normalizeSectionId(rawKey);
    const def = defaultMap.get(frontendId);
    if (!def) continue;

    seenIds.add(frontendId);
    const ativo = normalizeFlag(item.ativo ?? item.enabled, true);
    const exibeTela = normalizeFlag(item.exibe_tela ?? item.exibeTela, true);

    normalized.push({
      id: frontendId,
      dbId: typeof item.id === 'number' ? item.id : undefined,
      title: item.nome || def.title,
      subtitle: def.subtitle,
      enabled: ativo && exibeTela,
      exibeTela,
      exibeImpressao: normalizeFlag(item.exibe_impressao ?? item.exibeImpressao, true),
      ordem: typeof item.ordem === 'number' ? item.ordem : normalized.length + 1,
    });
  }

  // Adiciona quaisquer seções padrão que ainda não constem na API
  for (const def of DEFAULT_CLINICAL_SECTIONS) {
    if (!seenIds.has(def.id)) {
      normalized.push({
        ...def,
        ordem: normalized.length + 1,
      });
    }
  }

  return normalized.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

export function normalizeToApi(frontendSections) {
  if (!Array.isArray(frontendSections)) return [];
  return frontendSections.map((s, index) => ({
    id: s.dbId,
    chave: ID_TO_CHAVE_MAP[s.id] || s.id,
    nome: s.title,
    ativo: s.enabled ? 1 : 0,
    ordem: index + 1,
    exibe_tela: s.enabled ? 1 : 0,
    exibe_impressao: s.exibeImpressao !== false ? 1 : 0,
  }));
}

export function getStoredClinicalSections() {
  try {
    const saved = localStorage.getItem('CENTRO_VISAO_CLINICAL_CONFIG') || localStorage.getItem('OPTOVISION_CLINICAL_CONFIG');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Garantir que todos os IDs padrão estejam presentes
        const savedIds = new Set(parsed.map(s => normalizeSectionId(s.id)));
        const normalizedParsed = parsed.map((s, idx) => {
          const id = normalizeSectionId(s.id);
          const def = DEFAULT_CLINICAL_SECTIONS.find(d => d.id === id);
          return {
            ...def,
            ...s,
            id,
            title: s.title || def?.title || id,
            subtitle: s.subtitle || def?.subtitle || '',
            enabled: normalizeFlag(s.enabled ?? s.ativo, true)
              && normalizeFlag(s.exibeTela ?? s.exibe_tela, true),
            exibeTela: normalizeFlag(s.exibeTela ?? s.exibe_tela, true),
            exibeImpressao: normalizeFlag(s.exibeImpressao ?? s.exibe_impressao, true),
            ordem: typeof s.ordem === 'number' ? s.ordem : idx + 1,
          };
        });
        const missing = DEFAULT_CLINICAL_SECTIONS.filter(s => !savedIds.has(s.id));
        return [...normalizedParsed, ...missing].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      }
    }
  } catch (e) {
    console.error('Failed to load clinical config from localStorage', e);
  }
  return DEFAULT_CLINICAL_SECTIONS;
}

export function saveStoredClinicalSections(sections) {
  try {
    localStorage.setItem('CENTRO_VISAO_CLINICAL_CONFIG', JSON.stringify(sections));
    window.dispatchEvent(new Event('clinical-sections-updated'));
  } catch (e) {
    console.error('Failed to save clinical config to localStorage', e);
  }
}
