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
  { id: 'flexibilidadeAcomodacao', title: 'Flexibilidade e Facilidade de Acomodação', subtitle: 'Teste Flipper 40 cm e ciclos/min', enabled: true },
  { id: 'adicao', title: 'Adição', subtitle: 'Cálculo de adição para perto OD/OE', enabled: true },
  { id: 'ppc', title: 'PPC (Ponto Próximo de Convergência)', subtitle: 'Ponto de quebra e recuperação OR/Luz/Filtro', enabled: true },
  { id: 'reflexosPupilares', title: 'Reflexos Pupilares', subtitle: 'Fotomotor, Consensual e Acomodativo OD/OE', enabled: true },
  { id: 'reservasFusionais', title: 'Reservas Fusionais', subtitle: 'RFN e RFP em visão de longe e perto', enabled: true },
  { id: 'subjetivo', title: 'Subjetivo', subtitle: 'Refração subjetiva monocular e binocular', enabled: true },
  { id: 'testeAmbulatorial', title: 'Teste Ambulatorial', subtitle: 'Avaliação de tolerância e conforto com a nova refração', enabled: true },
];

export function getStoredClinicalSections() {
  try {
    const saved = localStorage.getItem('CENTRO_VISAO_CLINICAL_CONFIG') || localStorage.getItem('OPTOVISION_CLINICAL_CONFIG');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all default sections are present in case of newly added ones
        const savedIds = new Set(parsed.map(s => s.id));
        const missing = DEFAULT_CLINICAL_SECTIONS.filter(s => !savedIds.has(s.id));
        return [...parsed, ...missing];
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
