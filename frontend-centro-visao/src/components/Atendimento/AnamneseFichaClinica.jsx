import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Calendar, 
  Clock, 
  Check, 
  Eye, 
  Save, 
  History, 
  Plus, 
  FolderClock,
  Sparkles,
  CheckSquare,
  Square,
  Printer
} from 'lucide-react';
import { 
  getStoredClinicalSections, 
  normalizeFromApi, 
  saveStoredClinicalSections 
} from '../../data/clinicalSectionsConfig';
import { listarSecoesFicha } from '../../api/fichaClinica';
import { listarConsultasPaciente } from '../../api/pacientes';
import { obterDadosClinica } from '../../api/configuracoes';
import { generateAnamnesisHtml, printAnamneseViaIframe } from '../../utils/printAnamnese';
import {
  obterAnamneseConsulta,
  obterSecaoFichaClinica,
  salvarAnamneseConsulta,
  salvarSecaoFichaClinica,
} from '../../api/consultas';
import { parseApiDateTime, toIsoDate } from '../../domain/agenda';
import { adaptConsultation } from '../../domain/consultas';
import RichTextEditor, { sanitizeRichTextHtml } from '../Common/RichTextEditor';

const ANAMNESIS_OPTIONS = {
  sintomas: [
    'Prurido', 'Fotofobia', 'Hiperemia', 'Pterígio', 'Epífera', 'Trauma',
    'Vermelhidão', 'Ardência', 'Dor Ocular', 'Lacrimejamento', 'Força a Visão',
    'Cansaço Visual', 'Sensibilidade à Luz',
  ],
  doencasOculares: ['Glaucoma', 'Catarata', 'Pterígio', 'Ceratocone', 'Estrabismo', 'Conjuntivite'],
  doencasSistemicas: ['Hipertensão', 'Diabetes', 'Colesterol', 'Asma', 'Depressão', 'Renite', 'Sinusite', 'Alergias', 'Reumatismo'],
  medicamentos: [
    'Losartana', 'Captopril', 'Atenolol', 'Nifidipino', 'Propanolol', 'Hidrocloratiazida',
    'Metiformina', 'Glibencamida', 'AAS', 'Sinvastantina', 'Polaramine', 'Omeprazol',
  ],
  antecedentes: ['Diabetes', 'Estrabismo', 'Glaucoma', 'Pressão Alta', 'Catarata', 'Alguém usa óculos?'],
  cefaleiaLocal: ['Frontal', 'Temporal', 'Occipital', 'Parietal'],
  cefaleiaFrequencia: ['Todo o dia', 'Eventual', 'Segue o sexo', 'Fim de semana', 'Manhã', 'Tarde', 'Noite', 'Infrequente', 'Frequente', 'Crônica'],
};

const BIOMICROSCOPY_FIELDS = [
  ['sobrancelhas', 'Sobrancelhas'],
  ['cilios', 'Cílios'],
  ['palpebras', 'Pálpebras'],
  ['conjuntiva', 'Conjuntiva'],
  ['esclerotica', 'Esclerótica'],
  ['cornea', 'Córnea'],
  ['iris', 'Íris'],
  ['pupila', 'Pupila'],
  ['cristalino', 'Cristalino'],
  ['camaraAnterior', 'Câmara anterior'],
];

const FOROMETRY_FIELDS = [
  ['ppc', 'Resumo PPC'],
  ['reflexosPupilares', 'Resumo dos reflexos pupilares'],
  ['coverTest', 'Cover test'],
  ['rfp', 'Resumo RFP'],
  ['rfn', 'Resumo RFN'],
  ['flexibilidadeMonocular', 'Flexibilidade monocular'],
  ['acA', 'Relação AC/A'],
  ['estereopsia', 'Estereopsia'],
  ['visaoCromatica', 'Visão cromática'],
];

const OPHTHALMOSCOPY_FIELDS = [
  ['bruckner', 'Bruckner'],
  ['meiosRefringentes', 'Meios refringentes'],
  ['papila', 'Papila'],
  ['escavacao', 'Escavação'],
  ['macula', 'Mácula'],
  ['fixacao', 'Fixação'],
  ['cor', 'Cor'],
  ['relacaoAv', 'Relação A/V'],
];

const REFRACTION_FIELDS = [
  ['esferico', 'Esférico', 'text'],
  ['cilindrico', 'Cilíndrico', 'text'],
  ['eixo', 'Eixo', 'number'],
  ['avLonge', 'AV longe', 'text'],
];

const REFRACTION_NEAR_FIELDS = [
  ...REFRACTION_FIELDS,
  ['avPerto', 'AV perto', 'text'],
];

const RX_FINAL_EYE_FIELDS = [
  ...REFRACTION_NEAR_FIELDS,
  ['dnp', 'DNP', 'text'],
  ['altura', 'Altura', 'text'],
];

const SECTIONS_CONFIG = [
  { id: 'anamnese', title: '1. Anamnese' },
  { id: 'prescricaoUltimoExame', title: '2. Prescrição do Último Exame' },
  { id: 'acuidadeVisual', title: '3. Acuidade Visual' },
  { id: 'biomicroscopia', title: '4. Biomicroscopia' },
  { id: 'ceratometria', title: '5. Ceratometria' },
  { id: 'tonometria', title: '6. Tonometria' },
  { id: 'forometria', title: '7. Forometria' },
  { id: 'oftalmoscopia', title: '8. Oftalmoscopia' },
  { id: 'retinoscopiaDinamica', title: '9. Retinoscopia Dinâmica' },
  { id: 'retinoscopiaEstatica', title: '10. Retinoscopia Estática' },
  { id: 'avaliacaoMotora', title: '11. Avaliação Motora' },
  { id: 'rxFinal', title: '12. RX Final' },
  { id: 'amplitudeAcomodacao', title: '13. Amplitude de Acomodação' },
  { id: 'afinamento', title: '14. Afinamento' },
  { id: 'dx', title: '15. DX (Diagnóstico e Conduta)' },
  { id: 'flexibilidadeAcomodacao', title: '16. Flexibilidade e Facilidade de Acomodação' },
  { id: 'adicao', title: '17. Adição' },
  { id: 'ppc', title: '18. PPC (Ponto Próximo de Convergência)' },
  { id: 'reflexosPupilares', title: '19. Reflexos Pupilares' },
  { id: 'reservasFusionais', title: '20. Reservas Fusionais' },
  { id: 'subjetivo', title: '21. Subjetivo' },
  { id: 'testeAmbulatorial', title: '22. Teste Ambulatorial' },
];

function clearClinicalData(value) {
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clearClinicalData(item)]));
  }
  if (typeof value === 'boolean') return false;
  return '';
}

function splitStoredValues(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  const text = String(value || '').trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // Values produced by the current Delphi contract are comma-separated.
  }
  return text.split(/\s*[;,|]\s*/).filter(Boolean);
}

function separateKnownValues(value, knownValues) {
  const values = splitStoredValues(value);
  const known = values.filter((item) => knownValues.includes(item));
  const other = values.filter((item) => !knownValues.includes(item)).join(', ');
  return { known, other };
}

function joinValues(values, other = '') {
  return [...values, ...splitStoredValues(other)].filter(Boolean).join(', ');
}

function asBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return ['1', 'true', 'sim', 'yes'].includes(String(value || '').trim().toLowerCase());
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || fallback;
}

function eyeValue(value, eye) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[eye] ?? '';
  return value ?? '';
}

function VersoesHDiagram({ eye = 'OD', values = {}, onChange, disabled = false }) {
  const handleChange = (pos, val) => {
    if (onChange) onChange(pos, val);
  };

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative w-[180px] h-[100px] flex items-center justify-center select-none">
        {/* H Grid Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" width="180" height="100">
          {/* Vertical line Left */}
          <line x1="60" y1="12" x2="60" y2="88" stroke="#0f172a" strokeWidth="2.5" />
          {/* Vertical line Right */}
          <line x1="120" y1="12" x2="120" y2="88" stroke="#0f172a" strokeWidth="2.5" />
          {/* Horizontal line */}
          <line x1="14" y1="50" x2="166" y2="50" stroke="#0f172a" strokeWidth="2.5" />
        </svg>

        {/* 6 Small Input Boxes */}
        {/* Top-Left */}
        <div className="absolute" style={{ left: '60px', top: '12px', transform: 'translate(-50%, -50%)' }}>
          <input
            type="text"
            maxLength={3}
            value={values.tl || ''}
            onChange={(e) => handleChange('tl', e.target.value)}
            disabled={disabled}
            className="w-6 h-6 bg-white border border-slate-200/80 rounded-[3px] text-center font-bold text-xs text-slate-800 shadow-xs focus:border-forest-600 focus:outline-none"
          />
        </div>

        {/* Top-Right */}
        <div className="absolute" style={{ left: '120px', top: '12px', transform: 'translate(-50%, -50%)' }}>
          <input
            type="text"
            maxLength={3}
            value={values.tr || ''}
            onChange={(e) => handleChange('tr', e.target.value)}
            disabled={disabled}
            className="w-6 h-6 bg-white border border-slate-200/80 rounded-[3px] text-center font-bold text-xs text-slate-800 shadow-xs focus:border-forest-600 focus:outline-none"
          />
        </div>

        {/* Middle-Left */}
        <div className="absolute" style={{ left: '14px', top: '50px', transform: 'translate(-50%, -50%)' }}>
          <input
            type="text"
            maxLength={3}
            value={values.ml || ''}
            onChange={(e) => handleChange('ml', e.target.value)}
            disabled={disabled}
            className="w-6 h-6 bg-white border border-slate-200/80 rounded-[3px] text-center font-bold text-xs text-slate-800 shadow-xs focus:border-forest-600 focus:outline-none"
          />
        </div>

        {/* Middle-Right */}
        <div className="absolute" style={{ left: '166px', top: '50px', transform: 'translate(-50%, -50%)' }}>
          <input
            type="text"
            maxLength={3}
            value={values.mr || ''}
            onChange={(e) => handleChange('mr', e.target.value)}
            disabled={disabled}
            className="w-6 h-6 bg-white border border-slate-200/80 rounded-[3px] text-center font-bold text-xs text-slate-800 shadow-xs focus:border-forest-600 focus:outline-none"
          />
        </div>

        {/* Bottom-Left */}
        <div className="absolute" style={{ left: '60px', top: '88px', transform: 'translate(-50%, -50%)' }}>
          <input
            type="text"
            maxLength={3}
            value={values.bl || ''}
            onChange={(e) => handleChange('bl', e.target.value)}
            disabled={disabled}
            className="w-6 h-6 bg-white border border-slate-200/80 rounded-[3px] text-center font-bold text-xs text-slate-800 shadow-xs focus:border-forest-600 focus:outline-none"
          />
        </div>

        {/* Bottom-Right */}
        <div className="absolute" style={{ left: '120px', top: '88px', transform: 'translate(-50%, -50%)' }}>
          <input
            type="text"
            maxLength={3}
            value={values.br || ''}
            onChange={(e) => handleChange('br', e.target.value)}
            disabled={disabled}
            className="w-6 h-6 bg-white border border-slate-200/80 rounded-[3px] text-center font-bold text-xs text-slate-800 shadow-xs focus:border-forest-600 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

export default function AnamneseFichaClinica({ patient, consultation, disabled = false, onNotify }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const saveFeedbackTimerRef = useRef(null);
  const saveAllInProgressRef = useRef(false);
  const saveAllFailedRef = useRef(false);
  const [subTab, setSubTab] = useState('inicio'); // 'inicio' | 'historico'
  const [previousSheets, setPreviousSheets] = useState([]);
  const [loadingPreviousSheets, setLoadingPreviousSheets] = useState(false);
  const [previousSheetsError, setPreviousSheetsError] = useState('');
  const [openSections, setOpenSections] = useState({ anamnese: true });
  const [savedSection, setSavedSection] = useState('');
  const [savingAllSections, setSavingAllSections] = useState(false);
  const [clinicalConfig, setClinicalConfig] = useState(() => getStoredClinicalSections());
  const [clinicInfo, setClinicInfo] = useState({ name: '', cnpj: '', phone: '', address: '', city: '', state: '', cep: '' });
  const [printingAnamnese, setPrintingAnamnese] = useState(false);
  const [loadingAnamnesis, setLoadingAnamnesis] = useState(false);
  const [savingAnamnesis, setSavingAnamnesis] = useState(false);
  const [loadingLastPrescription, setLoadingLastPrescription] = useState(false);
  const [savingLastPrescription, setSavingLastPrescription] = useState(false);
  const [lastPrescriptionExtra, setLastPrescriptionExtra] = useState({});
  const [loadingVisualAcuity, setLoadingVisualAcuity] = useState(false);
  const [savingVisualAcuity, setSavingVisualAcuity] = useState(false);
  const [visualAcuityRaw, setVisualAcuityRaw] = useState({});
  const [loadingBiomicroscopy, setLoadingBiomicroscopy] = useState(false);
  const [savingBiomicroscopy, setSavingBiomicroscopy] = useState(false);
  const [biomicroscopyRaw, setBiomicroscopyRaw] = useState({});
  const [loadingKeratometry, setLoadingKeratometry] = useState(false);
  const [savingKeratometry, setSavingKeratometry] = useState(false);
  const [keratometryRaw, setKeratometryRaw] = useState({});
  const [loadingTonometry, setLoadingTonometry] = useState(false);
  const [savingTonometry, setSavingTonometry] = useState(false);
  const [loadingForometry, setLoadingForometry] = useState(false);
  const [savingForometry, setSavingForometry] = useState(false);
  const [loadingOphthalmoscopy, setLoadingOphthalmoscopy] = useState(false);
  const [savingOphthalmoscopy, setSavingOphthalmoscopy] = useState(false);
  const [ophthalmoscopyRaw, setOphthalmoscopyRaw] = useState({});
  const [loadingDynamicRetinoscopy, setLoadingDynamicRetinoscopy] = useState(false);
  const [savingDynamicRetinoscopy, setSavingDynamicRetinoscopy] = useState(false);
  const [dynamicRetinoscopyRaw, setDynamicRetinoscopyRaw] = useState({});
  const [loadingStaticRetinoscopy, setLoadingStaticRetinoscopy] = useState(false);
  const [savingStaticRetinoscopy, setSavingStaticRetinoscopy] = useState(false);
  const [staticRetinoscopyRaw, setStaticRetinoscopyRaw] = useState({});
  const [loadingMotorEvaluation, setLoadingMotorEvaluation] = useState(false);
  const [savingMotorEvaluation, setSavingMotorEvaluation] = useState(false);
  const [motorEvaluationRaw, setMotorEvaluationRaw] = useState({});
  const [loadingFinalRx, setLoadingFinalRx] = useState(false);
  const [savingFinalRx, setSavingFinalRx] = useState(false);
  const [finalRxRaw, setFinalRxRaw] = useState({});
  const [loadingAccommodationAmplitude, setLoadingAccommodationAmplitude] = useState(false);
  const [savingAccommodationAmplitude, setSavingAccommodationAmplitude] = useState(false);
  const [accommodationAmplitudeRaw, setAccommodationAmplitudeRaw] = useState({});
  const [loadingRefinement, setLoadingRefinement] = useState(false);
  const [savingRefinement, setSavingRefinement] = useState(false);
  const [refinementRaw, setRefinementRaw] = useState({});
  const [loadingDx, setLoadingDx] = useState(false);
  const [savingDx, setSavingDx] = useState(false);
  const [dxRaw, setDxRaw] = useState({});
  const [loadingAccommodationFacility, setLoadingAccommodationFacility] = useState(false);
  const [savingAccommodationFacility, setSavingAccommodationFacility] = useState(false);
  const [accommodationFacilityRaw, setAccommodationFacilityRaw] = useState({});
  const [loadingAddition, setLoadingAddition] = useState(false);
  const [savingAddition, setSavingAddition] = useState(false);
  const [additionRaw, setAdditionRaw] = useState({});
  const [loadingPpc, setLoadingPpc] = useState(false);
  const [savingPpc, setSavingPpc] = useState(false);
  const [ppcRaw, setPpcRaw] = useState({});
  const [loadingPupillaryReflexes, setLoadingPupillaryReflexes] = useState(false);
  const [savingPupillaryReflexes, setSavingPupillaryReflexes] = useState(false);
  const [pupillaryReflexesRaw, setPupillaryReflexesRaw] = useState({});
  const [loadingFusionalReserves, setLoadingFusionalReserves] = useState(false);
  const [savingFusionalReserves, setSavingFusionalReserves] = useState(false);
  const [fusionalReservesRaw, setFusionalReservesRaw] = useState({});
  const [loadingSubjective, setLoadingSubjective] = useState(false);
  const [savingSubjective, setSavingSubjective] = useState(false);
  const [subjectiveRaw, setSubjectiveRaw] = useState({});
  const [loadingAmbulatoryTest, setLoadingAmbulatoryTest] = useState(false);
  const [savingAmbulatoryTest, setSavingAmbulatoryTest] = useState(false);
  const [ambulatoryTestRaw, setAmbulatoryTestRaw] = useState({});

  useEffect(() => () => {
    if (saveFeedbackTimerRef.current) clearTimeout(saveFeedbackTimerRef.current);
  }, []);

  useEffect(() => {
    if (subTab !== 'historico' || !patient?.id || !consultation?.id) return undefined;
    const controller = new AbortController();
    setLoadingPreviousSheets(true);
    setPreviousSheetsError('');
    listarConsultasPaciente(patient.id, { signal: controller.signal })
      .then((items) => setPreviousSheets(items.map((item) => adaptConsultation({
        ...item,
        paciente_id: item.paciente_id || patient.id,
        paciente_nome: item.paciente_nome || patient.name,
      })).filter((item) => {
        if (!item || String(item.id) === String(consultation.id)) return false;
        if (item.date && consultation.date) return item.date.getTime() < consultation.date.getTime();
        return Number(item.id) < Number(consultation.id);
      })))
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') setPreviousSheetsError(getErrorMessage(error, 'Não foi possível carregar as fichas anteriores.'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingPreviousSheets(false); });
    return () => controller.abort();
  }, [consultation?.id, patient?.id, patient?.name, subTab]);

  useEffect(() => {
    if (saveFeedbackTimerRef.current) clearTimeout(saveFeedbackTimerRef.current);
    setSavedSection('');
  }, [consultation?.id]);

  const markSectionSaved = (section) => {
    if (saveFeedbackTimerRef.current) clearTimeout(saveFeedbackTimerRef.current);
    setSavedSection(section);
    saveFeedbackTimerRef.current = setTimeout(() => setSavedSection(''), 3500);
  };

  const markSectionSaveSuccess = (section) => {
    if (!saveAllInProgressRef.current) markSectionSaved(section);
  };

  const notifySaveError = (message) => {
    if (saveAllInProgressRef.current) {
      if (!saveAllFailedRef.current) onNotify?.('error', message);
      saveAllFailedRef.current = true;
      return;
    }
    onNotify?.('error', message);
  };

  const saveButtonClass = (section) => `btn-primary py-1.5 px-3.5 text-xs ${
    savedSection === section
      ? 'bg-forest-800 ring-2 ring-forest-600/30'
      : ''
  }`;

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    listarSecoesFicha({ signal: controller.signal })
      .then((apiSections) => {
        if (isMounted && Array.isArray(apiSections) && apiSections.length > 0) {
          const normalized = normalizeFromApi(apiSections);
          setClinicalConfig(normalized);
          saveStoredClinicalSections(normalized);
        }
      })
      .catch(() => {
        // Silently fallback to local storage
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const handleConfigUpdate = () => {
      setClinicalConfig(getStoredClinicalSections());
    };
    window.addEventListener('clinical-sections-updated', handleConfigUpdate);
    return () => window.removeEventListener('clinical-sections-updated', handleConfigUpdate);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    obterDadosClinica({ signal: controller.signal })
      .then((data) => {
        setClinicInfo({
          name: data?.nome || data?.name || '',
          cnpj: data?.cnpj || '',
          phone: data?.telefone || data?.phone || '',
          address: data?.endereco || data?.address || '',
          city: data?.cidade || data?.city || '',
          state: data?.estado || data?.state || '',
          cep: data?.cep || '',
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const handlePrintAnamnese = () => {
    if (printingAnamnese) return;
    setPrintingAnamnese(true);
    try {
      const patientData = patient || {
        name: consultation?.patientName,
        cpf: consultation?.patientCpf,
        rg: consultation?.patientRg,
        birthDate: consultation?.patientBirthDate,
        phone: consultation?.patientPhone,
      };
      const html = generateAnamnesisHtml(anamneseData, patientData, clinicInfo, consultation);
      printAnamneseViaIframe(html);
      onNotify?.('success', 'Anamnese enviada para impressão.');
    } catch {
      onNotify?.('error', 'Não foi possível imprimir a anamnese.');
    } finally {
      setPrintingAnamnese(false);
    }
  };

  const isSectionEnabled = (id) => {
    const found = clinicalConfig.find(s => s.id === id);
    return found ? found.enabled !== false : true;
  };

  const toggleSection = (id) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAll = (open) => {
    const all = {};
    clinicalConfig.forEach(s => {
      if (s.enabled !== false) {
        all[s.id] = open;
      }
    });
    setOpenSections(all);
  };

  // State for all fields in Anamnese
  const [anamneseData, setAnamneseData] = useState(() => clearClinicalData({
    // 1. Anamnese
    motivoPrincipal: "Paciente relata cansaço visual noturno e dificuldade para focar perto após 6h de computador.",
    dataUltimoExame: "2025-08-10",
    observacoesGerais: "Faz uso contínuo de telas. Refere melhora nos finais de semana.",
    sintomas: ["Cansaço Visual", "Sensibilidade à Luz", "Ardência", "Força a Visão"],
    doencasOculares: [],
    doencasSistemicas: ["Hipertensão"],
    medicamentos: ["Losartana"],
    outrosSintomas: "",
    outrasDoencasOculares: "",
    outrasDoencasSistemicas: "",
    outrosMedicamentos: "",
    usoOculos: ["Usa Óculos", "Dificuldade Perto"],
    usoLentes: [],
    cefaleia: ["Dor de cabeça", "Frontal", "Tarde", "Frequente"],
    antecedentes: ["Pressão Alta", "Alguém usa óculos?"],
    observacoesAnamnese: "Histórico familiar positivo para miopia materna.",

    // 2. Prescrição do Último Exame
    ultimoExame: {
      od: { esferico: "-2.00", cilindrico: "-0.50", eixo: "180", adicao: "+1.50", dnp: "32", alt: "18", lentes: "Multifocal" },
      oe: { esferico: "-1.75", cilindrico: "-0.75", eixo: "175", adicao: "+1.50", dnp: "31.5", alt: "18", lentes: "Multifocal" }
    },

    // 3. Acuidade Visual
    acuidade: {
      optotipo: '',
      visaoHabitual: '',
      semCorrecao: {
        od: { longe: '', perto: '', ph: '' },
        oe: { longe: '', perto: '', ph: '' },
        ao: { longe: '', perto: '' },
      },
      comCorrecao: {
        od: { longe: '', perto: '', ph: '' },
        oe: { longe: '', perto: '', ph: '' },
        ao: { longe: '', perto: '' },
      },
      observacoes: '',
    },

    // 4. Biomicroscopia
    biomicroscopia: {
      od: { cilios: '', sobrancelhas: '', palpebras: '', conjuntiva: '', esclerotica: '', cornea: '', iris: '', pupila: '', cristalino: '', camaraAnterior: '' },
      oe: { cilios: '', sobrancelhas: '', palpebras: '', conjuntiva: '', esclerotica: '', cornea: '', iris: '', pupila: '', cristalino: '', camaraAnterior: '' },
      observacoes: '',
    },

    // 5. Ceratometria
    ceratometria: {
      tecnica: '',
      od: { horizontal: '', vertical: '', eixo: '' },
      oe: { horizontal: '', vertical: '', eixo: '' },
      miras: '',
      observacoes: '',
    },

    // 6. Tonometria
    tonometria: {
      tecnica: '',
      horario: '',
      odMmhg: '',
      oeMmhg: '',
      observacoes: '',
    },

    // 7. Forometria
    forometria: {
      ppc: '',
      reflexosPupilares: '',
      coverTest: '',
      rfp: '',
      rfn: '',
      flexibilidadeMonocular: '',
      acA: '',
      estereopsia: '',
      visaoCromatica: '',
      observacoes: '',
    },

    // 8. Oftalmoscopia
    oftalmoscopia: {
      tecnica: '',
      od: { bruckner: '', meiosRefringentes: '', papila: '', escavacao: '', macula: '', fixacao: '', cor: '', relacaoAv: '' },
      oe: { bruckner: '', meiosRefringentes: '', papila: '', escavacao: '', macula: '', fixacao: '', cor: '', relacaoAv: '' },
      observacoes: '',
    },

    // 9. Retinoscopia Dinâmica
    retinoscopiaDinamica: {
      od: { esferico: '', cilindrico: '', eixo: '', avLonge: '' },
      oe: { esferico: '', cilindrico: '', eixo: '', avLonge: '' },
      observacoes: '',
    },

    // 10. Retinoscopia Estática
    retinoscopiaEstatica: {
      od: { esferico: '', cilindrico: '', eixo: '', avLonge: '' },
      oe: { esferico: '', cilindrico: '', eixo: '', avLonge: '' },
      observacoes: '',
    },

    // 11. Avaliação Motora
    avaliacaoMotora: {
      kappa: { od: '', oe: '' },
      hirschberg: { od: '', oe: '' },
      duccoes: { od: '', oe: '' },
      versoes: { od: { tl: '', tr: '', ml: '', mr: '', bl: '', br: '' }, oe: { tl: '', tr: '', ml: '', mr: '', bl: '', br: '' } },
      observacoes: '',
    },

    // 12. RX Final
    rxFinal: {
      od: { esferico: '', cilindrico: '', eixo: '', avLonge: '', avPerto: '', dnp: '', altura: '' },
      oe: { esferico: '', cilindrico: '', eixo: '', avLonge: '', avPerto: '', dnp: '', altura: '' },
      adicao: '', tipoLente: '', filtro: '', cor: '', tratamento: '', observacoes: '',
    },

    // 13. Amplitude de Acomodação
    amplitudeAcomodacao: {
      od: { amplitude: '', nivel: '' },
      oe: { amplitude: '', nivel: '' },
      distancia: '',
      flexibilidade: { od: '', oe: '', ciclosMinuto: '' },
      metodo: 'Sheard 40 cm',
      acA: '',
      observacoes: '',
    },

    // 14. Afinamento
    afinamento: {
      od: { esferico: '', cilindrico: '', eixo: '', avLonge: '', avPerto: '' },
      oe: { esferico: '', cilindrico: '', eixo: '', avLonge: '', avPerto: '' },
      adicao: '',
      observacoes: '',
    },

    // 15. DX
    dx: {
      refrativo: '',
      motor: '',
      patologico: '',
      conduta: [],
      controle: [],
      observacoes: '',
    },

    // 16. Flexibilidade e Facilidade de Acomodação
    flexibilidadeAcomodacao: {
      tecnica: '',
      od: { resultado: '', ciclosMinuto: '' },
      oe: { resultado: '', ciclosMinuto: '' },
      observacoes: '',
    },

    // 17. Adição
    adicao: {
      od: { valor: '', av: '' },
      oe: { valor: '', av: '' },
      observacoes: '',
    },

    // 18. PPC
    ppc: {
      objetoReal: { semCorrecao: '', comCorrecao: '' },
      luzPontual: { semCorrecao: '', comCorrecao: '' },
      filtroVermelho: { semCorrecao: '', comCorrecao: '' },
      observacoes: '',
    },

    // 19. Reflexos Pupilares
    reflexosPupilares: {
      od: { fotomotor: '', consensual: '', acomodativo: '' },
      oe: { fotomotor: '', consensual: '', acomodativo: '' },
      observacoes: '',
    },

    // 20. Reservas Fusionais
    reservasFusionais: {
      tecnica: '',
      rfn: { vl: '', vp: '' },
      rfp: { vl: '', vp: '' },
      observacoes: '',
    },

    // 21. Subjetivo
    subjetivo: {
      od: { esferico: '', cilindrico: '', eixo: '', av: '' },
      oe: { esferico: '', cilindrico: '', eixo: '', av: '' },
      observacoes: '',
    },

    // 22. Teste Ambulatorial
    testeAmbulatorial: {
      tempoMinutos: '',
      resultado: '',
      observacoes: '',
    }
  }));

  useEffect(() => {
    if (!consultation?.id) return undefined;
    const controller = new AbortController();
    setLoadingAnamnesis(true);

    obterAnamneseConsulta(consultation.id, { signal: controller.signal })
      .then((data) => {
        const sintomas = separateKnownValues(data?.sintomas, ANAMNESIS_OPTIONS.sintomas);
        const oculares = separateKnownValues(data?.doencas_oculares, ANAMNESIS_OPTIONS.doencasOculares);
        const sistemicas = separateKnownValues(data?.doencas_sistemicas, ANAMNESIS_OPTIONS.doencasSistemicas);
        const medicamentos = separateKnownValues(data?.medicamentos, ANAMNESIS_OPTIONS.medicamentos);
        const antecedentes = separateKnownValues(data?.antecedentes_familiares, ANAMNESIS_OPTIONS.antecedentes);
        const cefaleiaLocal = separateKnownValues(data?.cefaleia_local, ANAMNESIS_OPTIONS.cefaleiaLocal);
        const cefaleiaFrequencia = separateKnownValues(data?.cefaleia_frequencia, ANAMNESIS_OPTIONS.cefaleiaFrequencia);
        const lastExamDate = parseApiDateTime(data?.data_ultimo_exame);

        setAnamneseData((current) => ({
          ...current,
          motivoPrincipal: data?.motivo_principal || data?.queixa_principal || '',
          dataUltimoExame: lastExamDate ? toIsoDate(lastExamDate) : '',
          observacoesGerais: data?.observacoes_gerais || data?.historico || '',
          sintomas: sintomas.known,
          doencasOculares: oculares.known,
          doencasSistemicas: sistemicas.known,
          medicamentos: medicamentos.known,
          outrosSintomas: sintomas.other,
          outrasDoencasOculares: oculares.other,
          outrasDoencasSistemicas: sistemicas.other,
          outrosMedicamentos: medicamentos.other,
          usoOculos: [
            asBoolean(data?.uso_oculos) ? 'Usa Óculos' : null,
            asBoolean(data?.dificuldade_longe) ? 'Dificuldade Longe' : null,
            asBoolean(data?.dificuldade_perto) ? 'Dificuldade Perto' : null,
          ].filter(Boolean),
          usoLentes: [
            asBoolean(data?.uso_lente) ? 'Usa Lente de Contato?' : null,
            asBoolean(data?.dificuldade_longe) ? 'Dificuldade Longe' : null,
            asBoolean(data?.dificuldade_perto) ? 'Dificuldade Perto' : null,
          ].filter(Boolean),
          cefaleia: [
            asBoolean(data?.cefaleia) ? 'Dor de cabeça' : null,
            ...cefaleiaLocal.known,
            ...cefaleiaFrequencia.known,
          ].filter(Boolean),
          antecedentes: antecedentes.known,
          antecedentesOutros: antecedentes.other,
          cefaleiaLocalOutro: cefaleiaLocal.other,
          cefaleiaFrequenciaOutro: cefaleiaFrequencia.other,
          observacoesAnamnese: data?.observacoes_finais || data?.observacoes || '',
        }));
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') {
          onNotify?.('error', getErrorMessage(error, 'Não foi possível carregar a Anamnese.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingAnamnesis(false);
      });

    return () => controller.abort();
  }, [consultation?.id, onNotify]);

  useEffect(() => {
    if (!consultation?.id) return undefined;
    const controller = new AbortController();
    setLoadingVisualAcuity(true);

    obterSecaoFichaClinica(consultation.id, 'acuidade_visual', { signal: controller.signal })
      .then((data) => {
        const content = data?.conteudo && typeof data.conteudo === 'object' ? data.conteudo : {};
        const withoutCorrection = content.sem_correcao && typeof content.sem_correcao === 'object'
          ? content.sem_correcao
          : {};
        const withCorrection = content.com_correcao && typeof content.com_correcao === 'object'
          ? content.com_correcao
          : {};
        setVisualAcuityRaw(content);
        setAnamneseData((current) => ({
          ...current,
          acuidade: {
            optotipo: content.optotipo ?? '',
            visaoHabitual: content.visao_habitual ?? '',
            semCorrecao: {
              od: { longe: withoutCorrection.od_longe ?? '', perto: withoutCorrection.od_perto ?? '', ph: withoutCorrection.ph_od ?? '' },
              oe: { longe: withoutCorrection.oe_longe ?? '', perto: withoutCorrection.oe_perto ?? '', ph: withoutCorrection.ph_oe ?? '' },
              ao: { longe: withoutCorrection.ao_longe ?? '', perto: withoutCorrection.ao_perto ?? '' },
            },
            comCorrecao: {
              od: { longe: withCorrection.od_longe ?? '', perto: withCorrection.od_perto ?? '', ph: withCorrection.ph_od ?? '' },
              oe: { longe: withCorrection.oe_longe ?? '', perto: withCorrection.oe_perto ?? '', ph: withCorrection.ph_oe ?? '' },
              ao: { longe: withCorrection.ao_longe ?? '', perto: withCorrection.ao_perto ?? '' },
            },
            observacoes: content.observacoes ?? '',
          },
        }));
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') {
          onNotify?.('error', getErrorMessage(error, 'Não foi possível carregar a Acuidade Visual.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingVisualAcuity(false);
      });

    return () => controller.abort();
  }, [consultation?.id, onNotify]);

  useEffect(() => {
    if (!consultation?.id) return undefined;
    const controller = new AbortController();
    setLoadingBiomicroscopy(true);
    setBiomicroscopyRaw({});
    setAnamneseData((current) => ({
      ...current,
      biomicroscopia: clearClinicalData(current.biomicroscopia),
    }));

    obterSecaoFichaClinica(consultation.id, 'biomicroscopia', { signal: controller.signal })
      .then((data) => {
        const content = data?.conteudo && typeof data.conteudo === 'object' ? data.conteudo : {};
        const od = content.od && typeof content.od === 'object' ? content.od : {};
        const oe = content.oe && typeof content.oe === 'object' ? content.oe : {};
        const mapEye = (eye) => ({
          sobrancelhas: eye.sobrancelhas ?? '',
          cilios: eye.cilios ?? '',
          palpebras: eye.palpebras ?? '',
          conjuntiva: eye.conjuntiva ?? '',
          esclerotica: eye.esclerotica ?? '',
          cornea: eye.cornea ?? '',
          iris: eye.iris ?? '',
          pupila: eye.pupila ?? '',
          cristalino: eye.cristalino ?? '',
          camaraAnterior: eye.camara_anterior ?? eye.camaraAnterior ?? '',
        });
        setBiomicroscopyRaw(content);
        setAnamneseData((current) => ({
          ...current,
          biomicroscopia: {
            od: mapEye(od),
            oe: mapEye(oe),
            observacoes: content.observacoes ?? '',
          },
        }));
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') {
          onNotify?.('error', getErrorMessage(error, 'Não foi possível carregar a Biomicroscopia.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingBiomicroscopy(false);
      });

    return () => controller.abort();
  }, [consultation?.id, onNotify]);

  useEffect(() => {
    if (!consultation?.id) return undefined;
    const controller = new AbortController();
    setLoadingKeratometry(true);
    setKeratometryRaw({});
    setAnamneseData((current) => ({
      ...current,
      ceratometria: clearClinicalData(current.ceratometria),
    }));

    obterSecaoFichaClinica(consultation.id, 'ceratometria', { signal: controller.signal })
      .then((data) => {
        const content = data?.conteudo && typeof data.conteudo === 'object' ? data.conteudo : {};
        const od = content.od && typeof content.od === 'object' ? content.od : {};
        const oe = content.oe && typeof content.oe === 'object' ? content.oe : {};
        const mapEye = (eye) => ({
          horizontal: eye.horizontal ?? '',
          vertical: eye.vertical ?? '',
          eixo: eye.eixo ?? '',
        });
        setKeratometryRaw(content);
        setAnamneseData((current) => ({
          ...current,
          ceratometria: {
            tecnica: content.tecnica ?? '',
            od: mapEye(od),
            oe: mapEye(oe),
            miras: content.miras ?? '',
            observacoes: content.observacoes ?? '',
          },
        }));
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') {
          onNotify?.('error', getErrorMessage(error, 'Não foi possível carregar a Ceratometria.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingKeratometry(false);
      });

    return () => controller.abort();
  }, [consultation?.id, onNotify]);

  useEffect(() => {
    if (!consultation?.id) return undefined;
    const controller = new AbortController();
    setLoadingTonometry(true);
    setAnamneseData((current) => ({
      ...current,
      tonometria: clearClinicalData(current.tonometria),
    }));

    obterSecaoFichaClinica(consultation.id, 'tonometria', { signal: controller.signal })
      .then((data) => {
        const content = data?.conteudo && typeof data.conteudo === 'object' ? data.conteudo : {};
        setAnamneseData((current) => ({
          ...current,
          tonometria: {
            tecnica: content.tecnica ?? '',
            horario: content.horario ? String(content.horario).slice(0, 5) : '',
            odMmhg: content.od_mmhg ?? '',
            oeMmhg: content.oe_mmhg ?? '',
            observacoes: content.observacoes ?? '',
          },
        }));
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') {
          onNotify?.('error', getErrorMessage(error, 'Não foi possível carregar a Tonometria.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTonometry(false);
      });

    return () => controller.abort();
  }, [consultation?.id, onNotify]);

  useEffect(() => {
    if (!consultation?.id) return undefined;
    const controller = new AbortController();
    const loadingSetters = [
      setLoadingForometry,
      setLoadingOphthalmoscopy,
      setLoadingDynamicRetinoscopy,
      setLoadingStaticRetinoscopy,
    ];
    loadingSetters.forEach((setLoading) => setLoading(true));
    setOphthalmoscopyRaw({});
    setDynamicRetinoscopyRaw({});
    setStaticRetinoscopyRaw({});
    setAnamneseData((current) => ({
      ...current,
      forometria: clearClinicalData(current.forometria),
      oftalmoscopia: clearClinicalData(current.oftalmoscopia),
      retinoscopiaDinamica: clearClinicalData(current.retinoscopiaDinamica),
      retinoscopiaEstatica: clearClinicalData(current.retinoscopiaEstatica),
    }));

    const mapRefractionEye = (eye) => ({
      esferico: eye?.esferico ?? '',
      cilindrico: eye?.cilindrico ?? '',
      eixo: eye?.eixo ?? '',
      avLonge: eye?.av_longe ?? eye?.avLonge ?? '',
    });
    const mapOphthalmoscopyEye = (eye) => ({
      bruckner: eye?.bruckner ?? '',
      meiosRefringentes: eye?.meios_refringentes ?? eye?.meiosRefringentes ?? '',
      papila: eye?.papila ?? '',
      escavacao: eye?.escavacao ?? '',
      macula: eye?.macula ?? '',
      fixacao: eye?.fixacao ?? '',
      cor: eye?.cor ?? '',
      relacaoAv: eye?.relacao_av ?? eye?.relacaoAv ?? '',
    });
    const loadSection = async ({ section, setLoading, apply, errorMessage }) => {
      try {
        const data = await obterSecaoFichaClinica(consultation.id, section, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const content = data?.conteudo && typeof data.conteudo === 'object' ? data.conteudo : {};
        apply(content);
      } catch (error) {
        if (error?.code !== 'ERR_CANCELED') {
          onNotify?.('error', getErrorMessage(error, errorMessage));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    const loadBatch = async () => {
      await loadSection({
        section: 'forometria',
        setLoading: setLoadingForometry,
        errorMessage: 'Não foi possível carregar a Forometria.',
        apply: (content) => setAnamneseData((current) => ({
          ...current,
          forometria: {
            ppc: content.ppc ?? '',
            reflexosPupilares: content.reflexos_pupilares ?? '',
            coverTest: content.cover_test ?? '',
            rfp: content.rfp ?? '',
            rfn: content.rfn ?? '',
            flexibilidadeMonocular: content.flexibilidade_monocular ?? '',
            acA: content.ac_a ?? '',
            estereopsia: content.estereopsia ?? '',
            visaoCromatica: content.visao_cromatica ?? '',
            observacoes: content.observacoes ?? '',
          },
        })),
      });
      await loadSection({
        section: 'oftalmoscopia',
        setLoading: setLoadingOphthalmoscopy,
        errorMessage: 'Não foi possível carregar a Oftalmoscopia.',
        apply: (content) => {
          setOphthalmoscopyRaw(content);
          setAnamneseData((current) => ({
            ...current,
            oftalmoscopia: {
              tecnica: content.tecnica ?? '',
              od: mapOphthalmoscopyEye(content.od),
              oe: mapOphthalmoscopyEye(content.oe),
              observacoes: content.observacoes ?? '',
            },
          }));
        },
      });
      for (const item of [
        { section: 'retinoscopia_dinamica', stateKey: 'retinoscopiaDinamica', setLoading: setLoadingDynamicRetinoscopy, setRaw: setDynamicRetinoscopyRaw, errorMessage: 'Não foi possível carregar a Retinoscopia Dinâmica.' },
        { section: 'retinoscopia_estatica', stateKey: 'retinoscopiaEstatica', setLoading: setLoadingStaticRetinoscopy, setRaw: setStaticRetinoscopyRaw, errorMessage: 'Não foi possível carregar a Retinoscopia Estática.' },
      ]) {
        await loadSection({
          ...item,
          apply: (content) => {
            item.setRaw(content);
            setAnamneseData((current) => ({
              ...current,
              [item.stateKey]: {
                od: mapRefractionEye(content.od),
                oe: mapRefractionEye(content.oe),
                observacoes: content.observacoes ?? '',
              },
            }));
          },
        });
      }
    };

    loadBatch();
    return () => controller.abort();
  }, [consultation?.id, onNotify]);

  useEffect(() => {
    if (!consultation?.id) return undefined;
    const controller = new AbortController();
    [setLoadingMotorEvaluation, setLoadingFinalRx, setLoadingAccommodationAmplitude, setLoadingRefinement]
      .forEach((setLoading) => setLoading(true));
    setMotorEvaluationRaw({});
    setFinalRxRaw({});
    setAccommodationAmplitudeRaw({});
    setRefinementRaw({});
    setAnamneseData((current) => ({
      ...current,
      avaliacaoMotora: clearClinicalData(current.avaliacaoMotora),
      rxFinal: clearClinicalData(current.rxFinal),
      amplitudeAcomodacao: clearClinicalData(current.amplitudeAcomodacao),
      afinamento: clearClinicalData(current.afinamento),
    }));

    const refractionEye = (eye, includeMeasurements = false) => ({
      esferico: eye?.esferico ?? '', cilindrico: eye?.cilindrico ?? '', eixo: eye?.eixo ?? '',
      avLonge: eye?.av_longe ?? eye?.avLonge ?? '', avPerto: eye?.av_perto ?? eye?.avPerto ?? '',
      ...(includeMeasurements ? { dnp: eye?.dnp ?? '', altura: eye?.altura ?? '' } : {}),
    });
    const loadSection = async (section, setLoading, apply, message) => {
      try {
        const data = await obterSecaoFichaClinica(consultation.id, section, { signal: controller.signal });
        if (controller.signal.aborted) return;
        apply(data?.conteudo && typeof data.conteudo === 'object' ? data.conteudo : {});
      } catch (error) {
        if (error?.code !== 'ERR_CANCELED') onNotify?.('error', getErrorMessage(error, message));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    const run = async () => {
      await loadSection('avaliacao_motora', setLoadingMotorEvaluation, (content) => {
        const emptyVersions = { tl: '', tr: '', ml: '', mr: '', bl: '', br: '' };
        setMotorEvaluationRaw(content);
        setAnamneseData((current) => ({ ...current, avaliacaoMotora: {
          kappa: { od: eyeValue(content.kappa, 'od'), oe: eyeValue(content.kappa, 'oe') },
          hirschberg: { od: eyeValue(content.hirschberg, 'od'), oe: eyeValue(content.hirschberg, 'oe') },
          duccoes: { od: eyeValue(content.duccoes, 'od'), oe: eyeValue(content.duccoes, 'oe') },
          versoes: {
            od: content.versoes?.od && typeof content.versoes.od === 'object' ? { ...emptyVersions, ...content.versoes.od } : emptyVersions,
            oe: content.versoes?.oe && typeof content.versoes.oe === 'object' ? { ...emptyVersions, ...content.versoes.oe } : emptyVersions,
          },
          observacoes: content.observacoes ?? '',
        }}));
      }, 'Não foi possível carregar a Avaliação Motora.');
      await loadSection('rx_final', setLoadingFinalRx, (content) => {
        setFinalRxRaw(content);
        setAnamneseData((current) => ({ ...current, rxFinal: {
          od: refractionEye(content.od, true), oe: refractionEye(content.oe, true),
          adicao: content.adicao ?? '', tipoLente: content.tipo_lente ?? '', filtro: content.filtro ?? '',
          cor: content.cor ?? '', tratamento: content.tratamento ?? '', observacoes: content.observacoes ?? '',
        }}));
      }, 'Não foi possível carregar o RX Final.');
      await loadSection('amplitude_acomodacao', setLoadingAccommodationAmplitude, (content) => {
        setAccommodationAmplitudeRaw(content);
        setAnamneseData((current) => ({ ...current, amplitudeAcomodacao: {
          od: { amplitude: content.od?.amplitude ?? '', nivel: content.od?.nivel ?? '' },
          oe: { amplitude: content.oe?.amplitude ?? '', nivel: content.oe?.nivel ?? '' },
          distancia: content.distancia ?? '',
          flexibilidade: { od: content.flexibilidade?.od ?? '', oe: content.flexibilidade?.oe ?? '', ciclosMinuto: content.flexibilidade?.ciclos_minuto ?? '' },
          metodo: content.metodo ?? 'Sheard 40 cm', acA: content.ac_a ?? '', observacoes: content.observacoes ?? '',
        }}));
      }, 'Não foi possível carregar a Amplitude de Acomodação.');
      await loadSection('afinamento', setLoadingRefinement, (content) => {
        setRefinementRaw(content);
        setAnamneseData((current) => ({ ...current, afinamento: {
          od: refractionEye(content.od), oe: refractionEye(content.oe),
          adicao: content.adicao ?? '', observacoes: content.observacoes ?? '',
        }}));
      }, 'Não foi possível carregar o Afinamento.');
    };
    run();
    return () => controller.abort();
  }, [consultation?.id, onNotify]);

  useEffect(() => {
    if (!consultation?.id) return undefined;
    const controller = new AbortController();
    [setLoadingDx, setLoadingAccommodationFacility, setLoadingAddition, setLoadingPpc]
      .forEach((setLoading) => setLoading(true));
    setDxRaw({});
    setAccommodationFacilityRaw({});
    setAdditionRaw({});
    setPpcRaw({});
    setAnamneseData((current) => ({
      ...current,
      dx: clearClinicalData(current.dx),
      flexibilidadeAcomodacao: clearClinicalData(current.flexibilidadeAcomodacao),
      adicao: clearClinicalData(current.adicao),
      ppc: clearClinicalData(current.ppc),
    }));

    const objectValue = (value) => (
      value && typeof value === 'object' && !Array.isArray(value) ? value : {}
    );
    const loadSection = async (section, setLoading, apply, message) => {
      try {
        const data = await obterSecaoFichaClinica(consultation.id, section, { signal: controller.signal });
        if (controller.signal.aborted) return;
        apply(data?.conteudo && typeof data.conteudo === 'object' ? data.conteudo : {});
      } catch (error) {
        if (error?.code !== 'ERR_CANCELED') onNotify?.('error', getErrorMessage(error, message));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    const run = async () => {
      await loadSection('dx', setLoadingDx, (content) => {
        setDxRaw(content);
        const conduta = splitStoredValues(content.conduta);
        if (asBoolean(content.encaminhamento) && !conduta.includes('Encaminhamento')) conduta.push('Encaminhamento');
        setAnamneseData((current) => ({ ...current, dx: {
          refrativo: content.refrativo ?? '',
          motor: content.motor ?? '',
          patologico: content.patologico ?? '',
          conduta,
          controle: splitStoredValues(content.controle),
          observacoes: content.observacoes ?? '',
        }}));
      }, 'Não foi possível carregar o DX.');
      await loadSection('flexibilidade_acomodacao', setLoadingAccommodationFacility, (content) => {
        setAccommodationFacilityRaw(content);
        const od = objectValue(content.od);
        const oe = objectValue(content.oe);
        setAnamneseData((current) => ({ ...current, flexibilidadeAcomodacao: {
          tecnica: content.tecnica ?? 'Flipper 40 cm',
          od: { resultado: od.resultado ?? '', ciclosMinuto: od.ciclos_minuto ?? '' },
          oe: { resultado: oe.resultado ?? '', ciclosMinuto: oe.ciclos_minuto ?? '' },
          observacoes: content.observacoes ?? '',
        }}));
      }, 'Não foi possível carregar a Flexibilidade e Facilidade de Acomodação.');
      await loadSection('adicao', setLoadingAddition, (content) => {
        setAdditionRaw(content);
        const od = objectValue(content.od);
        const oe = objectValue(content.oe);
        setAnamneseData((current) => ({ ...current, adicao: {
          od: { valor: od.valor ?? '', av: od.av ?? '' },
          oe: { valor: oe.valor ?? '', av: oe.av ?? '' },
          observacoes: content.observacoes ?? '',
        }}));
      }, 'Não foi possível carregar a Adição.');
      await loadSection('ppc', setLoadingPpc, (content) => {
        setPpcRaw(content);
        const mapPpc = (value) => {
          const item = objectValue(value);
          return { semCorrecao: item.sem_correcao ?? '', comCorrecao: item.com_correcao ?? '' };
        };
        setAnamneseData((current) => ({ ...current, ppc: {
          objetoReal: mapPpc(content.objeto_real),
          luzPontual: mapPpc(content.luz_pontual),
          filtroVermelho: mapPpc(content.filtro_vermelho),
          observacoes: content.observacoes ?? '',
        }}));
      }, 'Não foi possível carregar o PPC.');
    };

    run();
    return () => controller.abort();
  }, [consultation?.id, onNotify]);

  useEffect(() => {
    if (!consultation?.id) return undefined;
    const controller = new AbortController();
    [setLoadingPupillaryReflexes, setLoadingFusionalReserves, setLoadingSubjective, setLoadingAmbulatoryTest]
      .forEach((setLoading) => setLoading(true));
    setPupillaryReflexesRaw({});
    setFusionalReservesRaw({});
    setSubjectiveRaw({});
    setAmbulatoryTestRaw({});
    setAnamneseData((current) => ({
      ...current,
      reflexosPupilares: clearClinicalData(current.reflexosPupilares),
      reservasFusionais: clearClinicalData(current.reservasFusionais),
      subjetivo: clearClinicalData(current.subjetivo),
      testeAmbulatorial: clearClinicalData(current.testeAmbulatorial),
    }));

    const objectValue = (value) => (
      value && typeof value === 'object' && !Array.isArray(value) ? value : {}
    );
    const loadSection = async (section, setLoading, apply, message) => {
      try {
        const data = await obterSecaoFichaClinica(consultation.id, section, { signal: controller.signal });
        if (controller.signal.aborted) return;
        apply(data?.conteudo && typeof data.conteudo === 'object' ? data.conteudo : {});
      } catch (error) {
        if (error?.code !== 'ERR_CANCELED') onNotify?.('error', getErrorMessage(error, message));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    const run = async () => {
      await loadSection('reflexos_pupilares', setLoadingPupillaryReflexes, (content) => {
        setPupillaryReflexesRaw(content);
        const mapEye = (value) => {
          const eye = objectValue(value);
          return { fotomotor: eye.fotomotor ?? '', consensual: eye.consensual ?? '', acomodativo: eye.acomodativo ?? '' };
        };
        setAnamneseData((current) => ({ ...current, reflexosPupilares: {
          od: mapEye(content.od), oe: mapEye(content.oe), observacoes: content.observacoes ?? '',
        }}));
      }, 'Não foi possível carregar os Reflexos Pupilares.');
      await loadSection('reservas_fusionais', setLoadingFusionalReserves, (content) => {
        setFusionalReservesRaw(content);
        const rfn = objectValue(content.rfn);
        const rfp = objectValue(content.rfp);
        setAnamneseData((current) => ({ ...current, reservasFusionais: {
          tecnica: content.tecnica ?? '',
          rfn: { vl: rfn.vl ?? '', vp: rfn.vp ?? '' },
          rfp: { vl: rfp.vl ?? '', vp: rfp.vp ?? '' },
          observacoes: content.observacoes ?? '',
        }}));
      }, 'Não foi possível carregar as Reservas Fusionais.');
      await loadSection('subjetivo', setLoadingSubjective, (content) => {
        setSubjectiveRaw(content);
        const mapEye = (value) => {
          const eye = objectValue(value);
          return { esferico: eye.esferico ?? '', cilindrico: eye.cilindrico ?? '', eixo: eye.eixo ?? '', av: eye.av ?? eye.av_longe ?? '' };
        };
        setAnamneseData((current) => ({ ...current, subjetivo: {
          od: mapEye(content.od), oe: mapEye(content.oe), observacoes: content.observacoes ?? '',
        }}));
      }, 'Não foi possível carregar o Subjetivo.');
      await loadSection('teste_ambulatorial', setLoadingAmbulatoryTest, (content) => {
        setAmbulatoryTestRaw(content);
        setAnamneseData((current) => ({ ...current, testeAmbulatorial: {
          tempoMinutos: content.tempo_minutos ?? '',
          resultado: content.resultado ?? '',
          observacoes: content.observacoes ?? '',
        }}));
      }, 'Não foi possível carregar o Teste Ambulatorial.');
    };

    run();
    return () => controller.abort();
  }, [consultation?.id, onNotify]);

  const updateVisualAcuity = (group, eye, field, value) => {
    setAnamneseData((current) => ({
      ...current,
      acuidade: {
        ...current.acuidade,
        [group]: {
          ...current.acuidade[group],
          [eye]: { ...current.acuidade[group][eye], [field]: value },
        },
      },
    }));
  };

  const updateBiomicroscopy = (eye, field, value) => {
    setAnamneseData((current) => ({
      ...current,
      biomicroscopia: {
        ...current.biomicroscopia,
        [eye]: { ...current.biomicroscopia[eye], [field]: value },
      },
    }));
  };

  const updateKeratometryEye = (eye, field, value) => {
    setAnamneseData((current) => ({
      ...current,
      ceratometria: {
        ...current.ceratometria,
        [eye]: { ...current.ceratometria[eye], [field]: value },
      },
    }));
  };

  const updateClinicalSectionField = (section, field, value) => {
    setAnamneseData((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
  };

  const updateClinicalEyeField = (section, eye, field, value) => {
    setAnamneseData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [eye]: { ...current[section][eye], [field]: value },
      },
    }));
  };

  const toggleDxOption = (field, option) => {
    setAnamneseData((current) => {
      const values = current.dx[field] || [];
      return {
        ...current,
        dx: {
          ...current.dx,
          [field]: values.includes(option)
            ? values.filter((item) => item !== option)
            : [...values, option],
        },
      };
    });
  };

  const updateMotorField = (field, eye, value) => {
    setAnamneseData((current) => ({ ...current, avaliacaoMotora: {
      ...current.avaliacaoMotora,
      [field]: { ...current.avaliacaoMotora[field], [eye]: value },
    }}));
  };

  const updateMotorVersion = (eye, position, value) => {
    setAnamneseData((current) => ({ ...current, avaliacaoMotora: {
      ...current.avaliacaoMotora,
      versoes: { ...current.avaliacaoMotora.versoes, [eye]: { ...current.avaliacaoMotora.versoes[eye], [position]: value } },
    }}));
  };

  useEffect(() => {
    if (!consultation?.id) return undefined;
    const controller = new AbortController();
    setLoadingLastPrescription(true);

    obterSecaoFichaClinica(consultation.id, 'prescricao_ultimo_exame', { signal: controller.signal })
      .then((data) => {
        const content = data?.conteudo && typeof data.conteudo === 'object' ? data.conteudo : {};
        const od = content.od && typeof content.od === 'object' ? content.od : {};
        const oe = content.oe && typeof content.oe === 'object' ? content.oe : {};
        setAnamneseData((current) => ({
          ...current,
          ultimoExame: {
            od: {
              esferico: od.esferico ?? '',
              cilindrico: od.cilindrico ?? '',
              eixo: od.eixo ?? '',
              adicao: eyeValue(content.adicao, 'od'),
              dnp: eyeValue(content.dnp, 'od'),
              alt: eyeValue(content.altura, 'od'),
              lentes: eyeValue(content.tipo_lente, 'od'),
            },
            oe: {
              esferico: oe.esferico ?? '',
              cilindrico: oe.cilindrico ?? '',
              eixo: oe.eixo ?? '',
              adicao: eyeValue(content.adicao, 'oe'),
              dnp: eyeValue(content.dnp, 'oe'),
              alt: eyeValue(content.altura, 'oe'),
              lentes: eyeValue(content.tipo_lente, 'oe'),
            },
          },
        }));
        setLastPrescriptionExtra({
          filtro: content.filtro ?? '',
          cor: content.cor ?? '',
          observacoes: content.observacoes ?? '',
        });
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') {
          onNotify?.('error', getErrorMessage(error, 'Não foi possível carregar a Prescrição do Último Exame.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingLastPrescription(false);
      });

    return () => controller.abort();
  }, [consultation?.id, onNotify]);

  const updateLastPrescription = (eye, field, value) => {
    setAnamneseData((current) => ({
      ...current,
      ultimoExame: {
        ...current.ultimoExame,
        [eye]: { ...current.ultimoExame[eye], [field]: value },
      },
    }));
  };

  const saveAnamnesis = async () => {
    if (!consultation?.id || disabled || savingAnamnesis) return;
    const safeGeneralObservations = sanitizeRichTextHtml(anamneseData.observacoesGerais);
    if (safeGeneralObservations.length > 2000) {
      notifySaveError('Observações Gerais deve possuir no máximo 2.000 caracteres, incluindo a formatação.');
      return;
    }
    setSavingAnamnesis(true);
    try {
      await salvarAnamneseConsulta(consultation.id, {
        motivo_principal: anamneseData.motivoPrincipal,
        data_ultimo_exame: anamneseData.dataUltimoExame,
        observacoes_gerais: safeGeneralObservations,
        sintomas: joinValues(anamneseData.sintomas, anamneseData.outrosSintomas),
        doencas_oculares: joinValues(anamneseData.doencasOculares, anamneseData.outrasDoencasOculares),
        doencas_sistemicas: joinValues(anamneseData.doencasSistemicas, anamneseData.outrasDoencasSistemicas),
        medicamentos: joinValues(anamneseData.medicamentos, anamneseData.outrosMedicamentos),
        uso_oculos: anamneseData.usoOculos.includes('Usa Óculos'),
        uso_lente: anamneseData.usoLentes.includes('Usa Lente de Contato?'),
        dificuldade_longe: anamneseData.usoOculos.includes('Dificuldade Longe') || anamneseData.usoLentes.includes('Dificuldade Longe'),
        dificuldade_perto: anamneseData.usoOculos.includes('Dificuldade Perto') || anamneseData.usoLentes.includes('Dificuldade Perto'),
        cefaleia: anamneseData.cefaleia.includes('Dor de cabeça'),
        cefaleia_local: joinValues(
          anamneseData.cefaleia.filter((item) => ANAMNESIS_OPTIONS.cefaleiaLocal.includes(item)),
          anamneseData.cefaleiaLocalOutro,
        ),
        cefaleia_frequencia: joinValues(
          anamneseData.cefaleia.filter((item) => ANAMNESIS_OPTIONS.cefaleiaFrequencia.includes(item)),
          anamneseData.cefaleiaFrequenciaOutro,
        ),
        antecedentes_familiares: joinValues(anamneseData.antecedentes, anamneseData.antecedentesOutros),
        observacoes_finais: anamneseData.observacoesAnamnese,
      });
      markSectionSaveSuccess('anamnese');
    } catch (error) {
      notifySaveError(getErrorMessage(error, 'Não foi possível salvar a Anamnese.'));
    } finally {
      setSavingAnamnesis(false);
    }
  };

  const saveLastPrescription = async () => {
    if (!consultation?.id || disabled || savingLastPrescription) return;
    const { od, oe } = anamneseData.ultimoExame;
    setSavingLastPrescription(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'prescricao_ultimo_exame', {
        od: { esferico: od.esferico, cilindrico: od.cilindrico, eixo: od.eixo },
        oe: { esferico: oe.esferico, cilindrico: oe.cilindrico, eixo: oe.eixo },
        adicao: { od: od.adicao, oe: oe.adicao },
        dnp: { od: od.dnp, oe: oe.dnp },
        altura: { od: od.alt, oe: oe.alt },
        tipo_lente: { od: od.lentes, oe: oe.lentes },
        filtro: lastPrescriptionExtra.filtro,
        cor: lastPrescriptionExtra.cor,
        observacoes: lastPrescriptionExtra.observacoes,
      });
      markSectionSaveSuccess('prescricaoUltimoExame');
    } catch (error) {
      notifySaveError(getErrorMessage(error, 'Não foi possível salvar a Prescrição do Último Exame.'));
    } finally {
      setSavingLastPrescription(false);
    }
  };

  const saveVisualAcuity = async () => {
    if (!consultation?.id || disabled || savingVisualAcuity) return;
    const { acuidade } = anamneseData;
    const payload = {
      optotipo: acuidade.optotipo,
      visao_habitual: acuidade.visaoHabitual,
      sem_correcao: {
        ...(visualAcuityRaw.sem_correcao || {}),
        od_longe: acuidade.semCorrecao.od.longe,
        oe_longe: acuidade.semCorrecao.oe.longe,
        ao_longe: acuidade.semCorrecao.ao.longe,
        od_perto: acuidade.semCorrecao.od.perto,
        oe_perto: acuidade.semCorrecao.oe.perto,
        ao_perto: acuidade.semCorrecao.ao.perto,
        ph_od: acuidade.semCorrecao.od.ph,
        ph_oe: acuidade.semCorrecao.oe.ph,
      },
      com_correcao: {
        ...(visualAcuityRaw.com_correcao || {}),
        od_longe: acuidade.comCorrecao.od.longe,
        oe_longe: acuidade.comCorrecao.oe.longe,
        ao_longe: acuidade.comCorrecao.ao.longe,
        od_perto: acuidade.comCorrecao.od.perto,
        oe_perto: acuidade.comCorrecao.oe.perto,
        ao_perto: acuidade.comCorrecao.ao.perto,
        ph_od: acuidade.comCorrecao.od.ph,
        ph_oe: acuidade.comCorrecao.oe.ph,
      },
      observacoes: acuidade.observacoes,
    };
    setSavingVisualAcuity(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'acuidade_visual', payload);
      setVisualAcuityRaw(payload);
      markSectionSaveSuccess('acuidadeVisual');
    } catch (error) {
      notifySaveError(getErrorMessage(error, 'Não foi possível salvar a Acuidade Visual.'));
    } finally {
      setSavingVisualAcuity(false);
    }
  };

  const saveBiomicroscopy = async () => {
    if (!consultation?.id || disabled || savingBiomicroscopy) return;
    const { biomicroscopia } = anamneseData;
    const buildEye = (eye, rawEye) => {
      const preserved = { ...(rawEye || {}) };
      delete preserved.camaraAnterior;
      return {
        ...preserved,
        sobrancelhas: eye.sobrancelhas,
        cilios: eye.cilios,
        palpebras: eye.palpebras,
        conjuntiva: eye.conjuntiva,
        esclerotica: eye.esclerotica,
        cornea: eye.cornea,
        iris: eye.iris,
        pupila: eye.pupila,
        cristalino: eye.cristalino,
        camara_anterior: eye.camaraAnterior,
      };
    };
    const payload = {
      od: buildEye(biomicroscopia.od, biomicroscopyRaw.od),
      oe: buildEye(biomicroscopia.oe, biomicroscopyRaw.oe),
      observacoes: biomicroscopia.observacoes,
    };

    setSavingBiomicroscopy(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'biomicroscopia', payload);
      setBiomicroscopyRaw(payload);
      markSectionSaveSuccess('biomicroscopia');
    } catch (error) {
      notifySaveError(getErrorMessage(error, 'Não foi possível salvar a Biomicroscopia.'));
    } finally {
      setSavingBiomicroscopy(false);
    }
  };

  const saveKeratometry = async () => {
    if (!consultation?.id || disabled || savingKeratometry) return;
    const { ceratometria } = anamneseData;
    const buildEye = (eye, rawEye) => ({
      ...(rawEye || {}),
      horizontal: eye.horizontal,
      vertical: eye.vertical,
      eixo: eye.eixo,
    });
    const payload = {
      tecnica: ceratometria.tecnica,
      od: buildEye(ceratometria.od, keratometryRaw.od),
      oe: buildEye(ceratometria.oe, keratometryRaw.oe),
      miras: ceratometria.miras,
      observacoes: ceratometria.observacoes,
    };

    setSavingKeratometry(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'ceratometria', payload);
      setKeratometryRaw(payload);
      markSectionSaveSuccess('ceratometria');
    } catch (error) {
      notifySaveError(getErrorMessage(error, 'Não foi possível salvar a Ceratometria.'));
    } finally {
      setSavingKeratometry(false);
    }
  };

  const saveTonometry = async () => {
    if (!consultation?.id || disabled || savingTonometry) return;
    const { tonometria } = anamneseData;
    const payload = {
      tecnica: tonometria.tecnica,
      horario: tonometria.horario,
      od_mmhg: tonometria.odMmhg,
      oe_mmhg: tonometria.oeMmhg,
      observacoes: tonometria.observacoes,
    };

    setSavingTonometry(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'tonometria', payload);
      markSectionSaveSuccess('tonometria');
    } catch (error) {
      notifySaveError(getErrorMessage(error, 'Não foi possível salvar a Tonometria.'));
    } finally {
      setSavingTonometry(false);
    }
  };

  const saveForometry = async () => {
    if (!consultation?.id || disabled || savingForometry) return;
    const data = anamneseData.forometria;
    const payload = {
      ppc: data.ppc,
      reflexos_pupilares: data.reflexosPupilares,
      cover_test: data.coverTest,
      rfp: data.rfp,
      rfn: data.rfn,
      flexibilidade_monocular: data.flexibilidadeMonocular,
      ac_a: data.acA,
      estereopsia: data.estereopsia,
      visao_cromatica: data.visaoCromatica,
      observacoes: data.observacoes,
    };
    setSavingForometry(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'forometria', payload);
      markSectionSaveSuccess('forometria');
    } catch (error) {
      notifySaveError(getErrorMessage(error, 'Não foi possível salvar a Forometria.'));
    } finally {
      setSavingForometry(false);
    }
  };

  const saveOphthalmoscopy = async () => {
    if (!consultation?.id || disabled || savingOphthalmoscopy) return;
    const data = anamneseData.oftalmoscopia;
    const buildEye = (eye, rawEye) => {
      const preserved = { ...(rawEye || {}) };
      delete preserved.meiosRefringentes;
      delete preserved.relacaoAv;
      return {
        ...preserved,
        bruckner: eye.bruckner,
        meios_refringentes: eye.meiosRefringentes,
        papila: eye.papila,
        escavacao: eye.escavacao,
        macula: eye.macula,
        fixacao: eye.fixacao,
        cor: eye.cor,
        relacao_av: eye.relacaoAv,
      };
    };
    const payload = {
      tecnica: data.tecnica,
      od: buildEye(data.od, ophthalmoscopyRaw.od),
      oe: buildEye(data.oe, ophthalmoscopyRaw.oe),
      observacoes: data.observacoes,
    };
    setSavingOphthalmoscopy(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'oftalmoscopia', payload);
      setOphthalmoscopyRaw(payload);
      markSectionSaveSuccess('oftalmoscopia');
    } catch (error) {
      notifySaveError(getErrorMessage(error, 'Não foi possível salvar a Oftalmoscopia.'));
    } finally {
      setSavingOphthalmoscopy(false);
    }
  };

  const saveRetinoscopy = async ({ section, stateKey, raw, setRaw, setSaving, saving, feedbackKey, label }) => {
    if (!consultation?.id || disabled || saving) return;
    const data = anamneseData[stateKey];
    const buildEye = (eye, rawEye) => {
      const preserved = { ...(rawEye || {}) };
      delete preserved.avLonge;
      return {
        ...preserved,
        esferico: eye.esferico,
        cilindrico: eye.cilindrico,
        eixo: eye.eixo,
        av_longe: eye.avLonge,
      };
    };
    const payload = {
      od: buildEye(data.od, raw.od),
      oe: buildEye(data.oe, raw.oe),
      observacoes: data.observacoes,
    };
    setSaving(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, section, payload);
      setRaw(payload);
      markSectionSaveSuccess(feedbackKey);
    } catch (error) {
      notifySaveError(getErrorMessage(error, `Não foi possível salvar a ${label}.`));
    } finally {
      setSaving(false);
    }
  };

  const saveDynamicRetinoscopy = () => saveRetinoscopy({
    section: 'retinoscopia_dinamica',
    stateKey: 'retinoscopiaDinamica',
    raw: dynamicRetinoscopyRaw,
    setRaw: setDynamicRetinoscopyRaw,
    setSaving: setSavingDynamicRetinoscopy,
    saving: savingDynamicRetinoscopy,
    feedbackKey: 'retinoscopiaDinamica',
    label: 'Retinoscopia Dinâmica',
  });

  const saveStaticRetinoscopy = () => saveRetinoscopy({
    section: 'retinoscopia_estatica',
    stateKey: 'retinoscopiaEstatica',
    raw: staticRetinoscopyRaw,
    setRaw: setStaticRetinoscopyRaw,
    setSaving: setSavingStaticRetinoscopy,
    saving: savingStaticRetinoscopy,
    feedbackKey: 'retinoscopiaEstatica',
    label: 'Retinoscopia Estática',
  });

  const saveMotorEvaluation = async () => {
    if (!consultation?.id || disabled || savingMotorEvaluation) return;
    const data = anamneseData.avaliacaoMotora;
    const versionsFilled = [...Object.values(data.versoes.od), ...Object.values(data.versoes.oe)].some(Boolean);
    const payload = {
      kappa: { ...(typeof motorEvaluationRaw.kappa === 'object' ? motorEvaluationRaw.kappa : {}), ...data.kappa },
      hirschberg: { ...(typeof motorEvaluationRaw.hirschberg === 'object' ? motorEvaluationRaw.hirschberg : {}), ...data.hirschberg },
      duccoes: { ...(typeof motorEvaluationRaw.duccoes === 'object' ? motorEvaluationRaw.duccoes : {}), ...data.duccoes },
      versoes: versionsFilled ? data.versoes : (motorEvaluationRaw.versoes ?? data.versoes),
      observacoes: data.observacoes,
    };
    setSavingMotorEvaluation(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'avaliacao_motora', payload);
      setMotorEvaluationRaw(payload); markSectionSaveSuccess('avaliacaoMotora');
    } catch (error) { notifySaveError(getErrorMessage(error, 'Não foi possível salvar a Avaliação Motora.')); }
    finally { setSavingMotorEvaluation(false); }
  };

  const buildRefractionEyePayload = (eye, rawEye, includeMeasurements = false) => {
    const preserved = { ...(rawEye && typeof rawEye === 'object' ? rawEye : {}) };
    delete preserved.avLonge; delete preserved.avPerto;
    return { ...preserved, esferico: eye.esferico, cilindrico: eye.cilindrico, eixo: eye.eixo,
      av_longe: eye.avLonge, av_perto: eye.avPerto,
      ...(includeMeasurements ? { dnp: eye.dnp, altura: eye.altura } : {}) };
  };

  const saveFinalRx = async () => {
    if (!consultation?.id || disabled || savingFinalRx) return;
    const data = anamneseData.rxFinal;
    const payload = { od: buildRefractionEyePayload(data.od, finalRxRaw.od, true), oe: buildRefractionEyePayload(data.oe, finalRxRaw.oe, true),
      adicao: data.adicao, tipo_lente: data.tipoLente, filtro: data.filtro, cor: data.cor,
      tratamento: data.tratamento, observacoes: data.observacoes };
    setSavingFinalRx(true);
    try { await salvarSecaoFichaClinica(consultation.id, 'rx_final', payload); setFinalRxRaw(payload); markSectionSaveSuccess('rxFinal'); }
    catch (error) { notifySaveError(getErrorMessage(error, 'Não foi possível salvar o RX Final.')); }
    finally { setSavingFinalRx(false); }
  };

  const saveAccommodationAmplitude = async () => {
    if (!consultation?.id || disabled || savingAccommodationAmplitude) return;
    const data = anamneseData.amplitudeAcomodacao;
    const payload = {
      od: { ...(accommodationAmplitudeRaw.od && typeof accommodationAmplitudeRaw.od === 'object' ? accommodationAmplitudeRaw.od : {}), amplitude: data.od.amplitude, nivel: data.od.nivel },
      oe: { ...(accommodationAmplitudeRaw.oe && typeof accommodationAmplitudeRaw.oe === 'object' ? accommodationAmplitudeRaw.oe : {}), amplitude: data.oe.amplitude, nivel: data.oe.nivel },
      distancia: data.distancia,
      flexibilidade: { ...(accommodationAmplitudeRaw.flexibilidade && typeof accommodationAmplitudeRaw.flexibilidade === 'object' ? accommodationAmplitudeRaw.flexibilidade : {}), od: data.flexibilidade.od, oe: data.flexibilidade.oe, ciclos_minuto: data.flexibilidade.ciclosMinuto },
      metodo: data.metodo, ac_a: data.acA, observacoes: data.observacoes,
    };
    setSavingAccommodationAmplitude(true);
    try { await salvarSecaoFichaClinica(consultation.id, 'amplitude_acomodacao', payload); setAccommodationAmplitudeRaw(payload); markSectionSaveSuccess('amplitudeAcomodacao'); }
    catch (error) { notifySaveError(getErrorMessage(error, 'Não foi possível salvar a Amplitude de Acomodação.')); }
    finally { setSavingAccommodationAmplitude(false); }
  };

  const saveRefinement = async () => {
    if (!consultation?.id || disabled || savingRefinement) return;
    const data = anamneseData.afinamento;
    const payload = { od: buildRefractionEyePayload(data.od, refinementRaw.od), oe: buildRefractionEyePayload(data.oe, refinementRaw.oe), adicao: data.adicao, observacoes: data.observacoes };
    setSavingRefinement(true);
    try { await salvarSecaoFichaClinica(consultation.id, 'afinamento', payload); setRefinementRaw(payload); markSectionSaveSuccess('afinamento'); }
    catch (error) { notifySaveError(getErrorMessage(error, 'Não foi possível salvar o Afinamento.')); }
    finally { setSavingRefinement(false); }
  };

  const saveDx = async () => {
    if (!consultation?.id || disabled || savingDx) return;
    const data = anamneseData.dx;
    if (![data.refrativo, data.motor, data.patologico].some((value) => String(value || '').trim())) {
      notifySaveError('Informe ao menos um diagnóstico refrativo, motor ou ocular.');
      return;
    }
    const payload = {
      ...dxRaw,
      refrativo: data.refrativo,
      motor: data.motor,
      patologico: data.patologico,
      conduta: data.conduta,
      controle: data.controle,
      encaminhamento: data.conduta.includes('Encaminhamento'),
      observacoes: data.observacoes,
    };
    setSavingDx(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'dx', payload);
      setDxRaw(payload);
      markSectionSaveSuccess('dx');
    } catch (error) { notifySaveError(getErrorMessage(error, 'Não foi possível salvar o DX.')); }
    finally { setSavingDx(false); }
  };

  const saveAccommodationFacility = async () => {
    if (!consultation?.id || disabled || savingAccommodationFacility) return;
    const data = anamneseData.flexibilidadeAcomodacao;
    const buildEye = (eye, rawEye) => ({
      ...(rawEye && typeof rawEye === 'object' ? rawEye : {}),
      resultado: eye.resultado,
      ciclos_minuto: eye.ciclosMinuto,
    });
    const payload = {
      ...accommodationFacilityRaw,
      tecnica: data.tecnica,
      od: buildEye(data.od, accommodationFacilityRaw.od),
      oe: buildEye(data.oe, accommodationFacilityRaw.oe),
      observacoes: data.observacoes,
    };
    setSavingAccommodationFacility(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'flexibilidade_acomodacao', payload);
      setAccommodationFacilityRaw(payload);
      markSectionSaveSuccess('flexibilidadeAcomodacao');
    } catch (error) { notifySaveError(getErrorMessage(error, 'Não foi possível salvar a Flexibilidade e Facilidade de Acomodação.')); }
    finally { setSavingAccommodationFacility(false); }
  };

  const saveAddition = async () => {
    if (!consultation?.id || disabled || savingAddition) return;
    const data = anamneseData.adicao;
    const buildEye = (eye, rawEye) => ({
      ...(rawEye && typeof rawEye === 'object' ? rawEye : {}),
      valor: eye.valor,
      av: eye.av,
    });
    const payload = {
      ...additionRaw,
      od: buildEye(data.od, additionRaw.od),
      oe: buildEye(data.oe, additionRaw.oe),
      observacoes: data.observacoes,
    };
    setSavingAddition(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'adicao', payload);
      setAdditionRaw(payload);
      markSectionSaveSuccess('adicao');
    } catch (error) { notifySaveError(getErrorMessage(error, 'Não foi possível salvar a Adição.')); }
    finally { setSavingAddition(false); }
  };

  const savePpc = async () => {
    if (!consultation?.id || disabled || savingPpc) return;
    const data = anamneseData.ppc;
    const buildMeasurement = (measurement, rawMeasurement) => ({
      ...(rawMeasurement && typeof rawMeasurement === 'object' ? rawMeasurement : {}),
      sem_correcao: measurement.semCorrecao,
      com_correcao: measurement.comCorrecao,
    });
    const payload = {
      ...ppcRaw,
      objeto_real: buildMeasurement(data.objetoReal, ppcRaw.objeto_real),
      luz_pontual: buildMeasurement(data.luzPontual, ppcRaw.luz_pontual),
      filtro_vermelho: buildMeasurement(data.filtroVermelho, ppcRaw.filtro_vermelho),
      observacoes: data.observacoes,
    };
    setSavingPpc(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'ppc', payload);
      setPpcRaw(payload);
      markSectionSaveSuccess('ppc');
    } catch (error) { notifySaveError(getErrorMessage(error, 'Não foi possível salvar o PPC.')); }
    finally { setSavingPpc(false); }
  };

  const savePupillaryReflexes = async () => {
    if (!consultation?.id || disabled || savingPupillaryReflexes) return;
    const data = anamneseData.reflexosPupilares;
    const buildEye = (eye, rawEye) => ({
      ...(rawEye && typeof rawEye === 'object' ? rawEye : {}),
      fotomotor: eye.fotomotor,
      consensual: eye.consensual,
      acomodativo: eye.acomodativo,
    });
    const payload = {
      ...pupillaryReflexesRaw,
      od: buildEye(data.od, pupillaryReflexesRaw.od),
      oe: buildEye(data.oe, pupillaryReflexesRaw.oe),
      observacoes: data.observacoes,
    };
    setSavingPupillaryReflexes(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'reflexos_pupilares', payload);
      setPupillaryReflexesRaw(payload);
      markSectionSaveSuccess('reflexosPupilares');
    } catch (error) { notifySaveError(getErrorMessage(error, 'Não foi possível salvar os Reflexos Pupilares.')); }
    finally { setSavingPupillaryReflexes(false); }
  };

  const saveFusionalReserves = async () => {
    if (!consultation?.id || disabled || savingFusionalReserves) return;
    const data = anamneseData.reservasFusionais;
    const buildReserve = (reserve, rawReserve) => ({
      ...(rawReserve && typeof rawReserve === 'object' ? rawReserve : {}),
      vl: reserve.vl,
      vp: reserve.vp,
    });
    const payload = {
      ...fusionalReservesRaw,
      tecnica: data.tecnica,
      rfn: buildReserve(data.rfn, fusionalReservesRaw.rfn),
      rfp: buildReserve(data.rfp, fusionalReservesRaw.rfp),
      observacoes: data.observacoes,
    };
    setSavingFusionalReserves(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'reservas_fusionais', payload);
      setFusionalReservesRaw(payload);
      markSectionSaveSuccess('reservasFusionais');
    } catch (error) { notifySaveError(getErrorMessage(error, 'Não foi possível salvar as Reservas Fusionais.')); }
    finally { setSavingFusionalReserves(false); }
  };

  const saveSubjective = async () => {
    if (!consultation?.id || disabled || savingSubjective) return;
    const data = anamneseData.subjetivo;
    const buildEye = (eye, rawEye) => ({
      ...(rawEye && typeof rawEye === 'object' ? rawEye : {}),
      esferico: eye.esferico,
      cilindrico: eye.cilindrico,
      eixo: eye.eixo,
      av: eye.av,
    });
    const payload = {
      ...subjectiveRaw,
      od: buildEye(data.od, subjectiveRaw.od),
      oe: buildEye(data.oe, subjectiveRaw.oe),
      observacoes: data.observacoes,
    };
    setSavingSubjective(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'subjetivo', payload);
      setSubjectiveRaw(payload);
      markSectionSaveSuccess('subjetivo');
    } catch (error) { notifySaveError(getErrorMessage(error, 'Não foi possível salvar o Subjetivo.')); }
    finally { setSavingSubjective(false); }
  };

  const saveAmbulatoryTest = async () => {
    if (!consultation?.id || disabled || savingAmbulatoryTest) return;
    const data = anamneseData.testeAmbulatorial;
    const payload = {
      ...ambulatoryTestRaw,
      tempo_minutos: data.tempoMinutos === '' ? '' : Number(data.tempoMinutos),
      resultado: data.resultado,
      observacoes: data.observacoes,
    };
    setSavingAmbulatoryTest(true);
    try {
      await salvarSecaoFichaClinica(consultation.id, 'teste_ambulatorial', payload);
      setAmbulatoryTestRaw(payload);
      markSectionSaveSuccess('testeAmbulatorial');
    } catch (error) { notifySaveError(getErrorMessage(error, 'Não foi possível salvar o Teste Ambulatorial.')); }
    finally { setSavingAmbulatoryTest(false); }
  };

  const isAnySectionLoading = loadingAnamnesis || loadingLastPrescription || loadingVisualAcuity
    || loadingBiomicroscopy || loadingKeratometry || loadingTonometry || loadingForometry
    || loadingOphthalmoscopy || loadingDynamicRetinoscopy || loadingStaticRetinoscopy
    || loadingMotorEvaluation || loadingFinalRx || loadingAccommodationAmplitude || loadingRefinement
    || loadingDx || loadingAccommodationFacility || loadingAddition || loadingPpc
    || loadingPupillaryReflexes || loadingFusionalReserves || loadingSubjective || loadingAmbulatoryTest;

  const isAnySectionSaving = savingAnamnesis || savingLastPrescription || savingVisualAcuity
    || savingBiomicroscopy || savingKeratometry || savingTonometry || savingForometry
    || savingOphthalmoscopy || savingDynamicRetinoscopy || savingStaticRetinoscopy
    || savingMotorEvaluation || savingFinalRx || savingAccommodationAmplitude || savingRefinement
    || savingDx || savingAccommodationFacility || savingAddition || savingPpc
    || savingPupillaryReflexes || savingFusionalReserves || savingSubjective || savingAmbulatoryTest;

  const saveAllClinicalSections = async () => {
    if (!consultation?.id || disabled || savingAllSections || isAnySectionLoading || isAnySectionSaving) return;
    const hasDxDiagnosis = [anamneseData.dx.refrativo, anamneseData.dx.motor, anamneseData.dx.patologico]
      .some((value) => String(value || '').trim());

    const sectionSaveMap = {
      anamnese: saveAnamnesis,
      prescricaoUltimoExame: saveLastPrescription,
      acuidadeVisual: saveVisualAcuity,
      biomicroscopia: saveBiomicroscopy,
      ceratometria: saveKeratometry,
      tonometria: saveTonometry,
      forometria: saveForometry,
      oftalmoscopia: saveOphthalmoscopy,
      retinoscopiaDinamica: saveDynamicRetinoscopy,
      retinoscopiaEstatica: saveStaticRetinoscopy,
      avaliacaoMotora: saveMotorEvaluation,
      rxFinal: saveFinalRx,
      amplitudeAcomodacao: saveAccommodationAmplitude,
      afinamento: saveRefinement,
      dx: hasDxDiagnosis ? saveDx : null,
      flexibilidadeAcomodacao: saveAccommodationFacility,
      adicao: saveAddition,
      ppc: savePpc,
      reflexosPupilares: savePupillaryReflexes,
      reservasFusionais: saveFusionalReserves,
      subjetivo: saveSubjective,
      testeAmbulatorial: saveAmbulatoryTest,
    };

    const activeSaveOps = clinicalConfig
      .filter((s) => s.enabled !== false)
      .map((s) => sectionSaveMap[s.id])
      .filter(Boolean);

    const saveOperations = activeSaveOps.length > 0 ? activeSaveOps : Object.values(sectionSaveMap).filter(Boolean);

    setSavingAllSections(true);
    saveAllInProgressRef.current = true;
    saveAllFailedRef.current = false;
    try {
      for (const saveSection of saveOperations) await saveSection();
    } catch (error) {
      notifySaveError(getErrorMessage(error, 'Não foi possível salvar toda a ficha clínica.'));
    } finally {
      const completedSuccessfully = !saveAllFailedRef.current;
      saveAllInProgressRef.current = false;
      saveAllFailedRef.current = false;
      setSavingAllSections(false);
      if (completedSuccessfully) markSectionSaved('allClinicalSections');
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.querySelectorAll('input, textarea, select').forEach((control) => {
      const visualAcuitySection = control.closest('[data-clinical-section="acuidadeVisual"]');
      const biomicroscopySection = control.closest('[data-clinical-section="biomicroscopia"]');
      const keratometrySection = control.closest('[data-clinical-section="ceratometria"]');
      const tonometrySection = control.closest('[data-clinical-section="tonometria"]');
      const forometrySection = control.closest('[data-clinical-section="forometria"]');
      const ophthalmoscopySection = control.closest('[data-clinical-section="oftalmoscopia"]');
      const dynamicRetinoscopySection = control.closest('[data-clinical-section="retinoscopiaDinamica"]');
      const staticRetinoscopySection = control.closest('[data-clinical-section="retinoscopiaEstatica"]');
      const motorEvaluationSection = control.closest('[data-clinical-section="avaliacaoMotora"]');
      const finalRxSection = control.closest('[data-clinical-section="rxFinal"]');
      const accommodationAmplitudeSection = control.closest('[data-clinical-section="amplitudeAcomodacao"]');
      const refinementSection = control.closest('[data-clinical-section="afinamento"]');
      const dxSection = control.closest('[data-clinical-section="dx"]');
      const accommodationFacilitySection = control.closest('[data-clinical-section="flexibilidadeAcomodacao"]');
      const additionSection = control.closest('[data-clinical-section="adicao"]');
      const ppcSection = control.closest('[data-clinical-section="ppc"]');
      const pupillaryReflexesSection = control.closest('[data-clinical-section="reflexosPupilares"]');
      const fusionalReservesSection = control.closest('[data-clinical-section="reservasFusionais"]');
      const subjectiveSection = control.closest('[data-clinical-section="subjetivo"]');
      const ambulatoryTestSection = control.closest('[data-clinical-section="testeAmbulatorial"]');
      const belongsToEnabledSection = Boolean(control.closest(
        '[data-clinical-section="anamnese"], [data-clinical-section="prescricaoUltimoExame"], [data-clinical-section="acuidadeVisual"], [data-clinical-section="biomicroscopia"], [data-clinical-section="ceratometria"], [data-clinical-section="tonometria"], [data-clinical-section="forometria"], [data-clinical-section="oftalmoscopia"], [data-clinical-section="retinoscopiaDinamica"], [data-clinical-section="retinoscopiaEstatica"], [data-clinical-section="avaliacaoMotora"], [data-clinical-section="rxFinal"], [data-clinical-section="amplitudeAcomodacao"], [data-clinical-section="afinamento"], [data-clinical-section="dx"], [data-clinical-section="flexibilidadeAcomodacao"], [data-clinical-section="adicao"], [data-clinical-section="ppc"], [data-clinical-section="reflexosPupilares"], [data-clinical-section="reservasFusionais"], [data-clinical-section="subjetivo"], [data-clinical-section="testeAmbulatorial"]',
      ));
      const visualAcuityBusy = Boolean(visualAcuitySection) && (loadingVisualAcuity || savingVisualAcuity);
      const biomicroscopyBusy = Boolean(biomicroscopySection) && (loadingBiomicroscopy || savingBiomicroscopy);
      const keratometryBusy = Boolean(keratometrySection) && (loadingKeratometry || savingKeratometry);
      const tonometryBusy = Boolean(tonometrySection) && (loadingTonometry || savingTonometry);
      const forometryBusy = Boolean(forometrySection) && (loadingForometry || savingForometry);
      const ophthalmoscopyBusy = Boolean(ophthalmoscopySection) && (loadingOphthalmoscopy || savingOphthalmoscopy);
      const dynamicRetinoscopyBusy = Boolean(dynamicRetinoscopySection) && (loadingDynamicRetinoscopy || savingDynamicRetinoscopy);
      const staticRetinoscopyBusy = Boolean(staticRetinoscopySection) && (loadingStaticRetinoscopy || savingStaticRetinoscopy);
      const motorEvaluationBusy = Boolean(motorEvaluationSection) && (loadingMotorEvaluation || savingMotorEvaluation);
      const finalRxBusy = Boolean(finalRxSection) && (loadingFinalRx || savingFinalRx);
      const accommodationAmplitudeBusy = Boolean(accommodationAmplitudeSection) && (loadingAccommodationAmplitude || savingAccommodationAmplitude);
      const refinementBusy = Boolean(refinementSection) && (loadingRefinement || savingRefinement);
      const dxBusy = Boolean(dxSection) && (loadingDx || savingDx);
      const accommodationFacilityBusy = Boolean(accommodationFacilitySection) && (loadingAccommodationFacility || savingAccommodationFacility);
      const additionBusy = Boolean(additionSection) && (loadingAddition || savingAddition);
      const ppcBusy = Boolean(ppcSection) && (loadingPpc || savingPpc);
      const pupillaryReflexesBusy = Boolean(pupillaryReflexesSection) && (loadingPupillaryReflexes || savingPupillaryReflexes);
      const fusionalReservesBusy = Boolean(fusionalReservesSection) && (loadingFusionalReserves || savingFusionalReserves);
      const subjectiveBusy = Boolean(subjectiveSection) && (loadingSubjective || savingSubjective);
      const ambulatoryTestBusy = Boolean(ambulatoryTestSection) && (loadingAmbulatoryTest || savingAmbulatoryTest);
      control.disabled = disabled || !belongsToEnabledSection || visualAcuityBusy || biomicroscopyBusy || keratometryBusy || tonometryBusy || forometryBusy || ophthalmoscopyBusy || dynamicRetinoscopyBusy || staticRetinoscopyBusy || motorEvaluationBusy || finalRxBusy || accommodationAmplitudeBusy || refinementBusy || dxBusy || accommodationFacilityBusy || additionBusy || ppcBusy || pupillaryReflexesBusy || fusionalReservesBusy || subjectiveBusy || ambulatoryTestBusy;
    });
  }, [
    disabled,
    loadingBiomicroscopy,
    loadingAccommodationAmplitude,
    loadingDynamicRetinoscopy,
    loadingFinalRx,
    loadingDx,
    loadingAccommodationFacility,
    loadingAddition,
    loadingPpc,
    loadingPupillaryReflexes,
    loadingFusionalReserves,
    loadingSubjective,
    loadingAmbulatoryTest,
    loadingForometry,
    loadingKeratometry,
    loadingOphthalmoscopy,
    loadingMotorEvaluation,
    loadingRefinement,
    loadingStaticRetinoscopy,
    loadingTonometry,
    loadingVisualAcuity,
    openSections,
    savingBiomicroscopy,
    savingAccommodationAmplitude,
    savingDynamicRetinoscopy,
    savingForometry,
    savingFinalRx,
    savingDx,
    savingAccommodationFacility,
    savingAddition,
    savingPpc,
    savingPupillaryReflexes,
    savingFusionalReserves,
    savingSubjective,
    savingAmbulatoryTest,
    savingKeratometry,
    savingOphthalmoscopy,
    savingMotorEvaluation,
    savingRefinement,
    savingStaticRetinoscopy,
    savingTonometry,
    savingVisualAcuity,
    subTab,
  ]);

  const toggleArrayItem = (key, item) => {
    setAnamneseData(prev => {
      const list = prev[key] || [];
      const exists = list.includes(item);
      return {
        ...prev,
        [key]: exists ? list.filter(i => i !== item) : [...list, item]
      };
    });
  };

  return (
    <div ref={containerRef} className={`space-y-4 ${disabled ? 'opacity-80' : ''}`}>
      
      {/* Sub navigation: Início vs Histórico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-bold">
          <button
            onClick={() => setSubTab('inicio')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              subTab === 'inicio' 
                ? 'bg-forest-700 text-white shadow-hairline' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Início (Ficha Clínica da Consulta)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('historico')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              subTab === 'historico' 
                ? 'bg-forest-700 text-white shadow-hairline' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico de Fichas Anteriores</span>
          </button>
        </div>

        {subTab === 'inicio' && (
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => toggleAll(true)}
              className="btn-secondary py-1.5 px-3"
            >
              Expandir Todos
            </button>
            <button 
              onClick={() => toggleAll(false)}
              className="btn-secondary py-1.5 px-3"
            >
              Recolher Todos
            </button>
            <button 
              type="button"
              disabled={disabled || savingAllSections || isAnySectionLoading || isAnySectionSaving}
              onClick={saveAllClinicalSections}
              className={saveButtonClass('allClinicalSections')}
            >
              {savingAllSections ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'allClinicalSections' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savingAllSections ? 'Salvando...' : savedSection === 'allClinicalSections' ? 'Salvo com sucesso' : 'Salvar Ficha'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: INÍCIO (ACCORDIONS DE TODOS OS CAMPOS FECHADOS POR PADRÃO)      */}
      {/* ========================================================================= */}
      {subTab === 'inicio' && (
        <fieldset disabled={savingAllSections} className="space-y-2 disabled:opacity-75">

          {/* Mensagem caso todas as seções estejam desativadas */}
          {clinicalConfig.length > 0 && clinicalConfig.every(s => s.enabled === false) && (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800">Nenhuma seção ativa na Ficha Clínica</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Todas as seções da ficha clínica estão desativadas no momento. Acesse a tela de Configurações para ativar as seções desejadas.
              </p>
            </div>
          )}

          {/* 1. ANAMNESE */}
          {isSectionEnabled('anamnese') && (
            <div data-clinical-section="anamnese" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('anamnese')}
                className="w-full p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/80 hover:bg-forest-50/20 text-left transition-colors font-bold text-xs uppercase text-slate-900 border-b border-slate-100"
              >
                <div className="flex items-center space-x-2">
                  {openSections['anamnese'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>1. Anamnese</span>
                </div>
                {openSections['anamnese'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['anamnese'] && (
                <div className="p-5 sm:p-6 space-y-4 text-xs animate-fade-in bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="clinical-label">Motivo principal da consulta</label>
                      <input 
                        type="text" 
                        value={anamneseData.motivoPrincipal}
                        onChange={(e) => setAnamneseData({...anamneseData, motivoPrincipal: e.target.value})}
                        className="clinical-input font-medium" 
                      />
                    </div>
                    <div>
                      <label className="clinical-label">Data do último exame</label>
                      <input 
                        type="date" 
                        value={anamneseData.dataUltimoExame}
                        onChange={(e) => setAnamneseData({...anamneseData, dataUltimoExame: e.target.value})}
                        className="clinical-input font-bold" 
                      />
                    </div>
                  </div>

                  <RichTextEditor
                    value={anamneseData.observacoesGerais}
                    onChange={(value) => setAnamneseData((current) => ({ ...current, observacoesGerais: value }))}
                    disabled={disabled || savingAllSections || loadingAnamnesis || savingAnamnesis}
                  />

                  {/* Sintomas Checkboxes */}
                  <div>
                    <span className="font-extrabold text-slate-900 uppercase block mb-1.5">Sintomas</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {[
                        "Prurido", "Fotofobia", "Hiperemia", "Pterígio", "Epífera", "Trauma", 
                        "Vermelhidão", "Ardência", "Dor Ocular", "Lacrimejamento", "Força a Visão", 
                        "Cansaço Visual", "Sensibilidade à Luz"
                      ].map(s => {
                        const checked = anamneseData.sintomas.includes(s);
                        return (
                          <label key={s} className="flex items-center space-x-1.5 cursor-pointer bg-slate-50/80 p-2 rounded-xl border border-slate-200/80 text-[11px] font-semibold text-slate-800 hover:bg-forest-50/60 hover:border-forest-200 transition-all">
                            <input 
                              type="checkbox" 
                              checked={checked} 
                              onChange={() => toggleArrayItem('sintomas', s)}
                              className="accent-forest-700"
                            />
                            <span>{s}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Doenças Oculares */}
                  <div>
                    <span className="font-extrabold text-slate-900 uppercase block mb-1.5">Doenças Oculares</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {["Glaucoma", "Catarata", "Pterígio", "Ceratocone", "Estrabismo", "Conjuntivite"].map(d => (
                        <label key={d} className="flex items-center space-x-1.5 cursor-pointer bg-slate-50/80 p-2 rounded-xl border border-slate-200/80 text-[11px] font-semibold text-slate-800 hover:bg-forest-50/60 hover:border-forest-200 transition-all">
                          <input 
                            type="checkbox" 
                            checked={anamneseData.doencasOculares.includes(d)} 
                            onChange={() => toggleArrayItem('doencasOculares', d)}
                            className="accent-forest-700"
                          />
                          <span>{d}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Doenças Sistêmicas */}
                  <div>
                    <span className="font-extrabold text-slate-900 uppercase block mb-1.5">Doenças Sistêmicas</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {["Hipertensão", "Diabetes", "Colesterol", "Asma", "Depressão", "Renite", "Sinusite", "Alergias", "Reumatismo"].map(d => (
                        <label key={d} className="flex items-center space-x-1.5 cursor-pointer bg-slate-50/80 p-2 rounded-xl border border-slate-200/80 text-[11px] font-semibold text-slate-800 hover:bg-forest-50/60 hover:border-forest-200 transition-all">
                          <input 
                            type="checkbox" 
                            checked={anamneseData.doencasSistemicas.includes(d)} 
                            onChange={() => toggleArrayItem('doencasSistemicas', d)}
                            className="accent-forest-700"
                          />
                          <span>{d}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Medicamentos */}
                  <div>
                    <span className="font-extrabold text-slate-900 uppercase block mb-1.5">Medicamentos em Uso</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        "Losartana", "Captopril", "Atenolol", "Nifidipino", "Propanolol", "Hidrocloratiazida", 
                        "Metiformina", "Glibencamida", "AAS", "Sinvastantina", "Polaramine", "Omeprazol"
                      ].map(m => (
                        <label key={m} className="flex items-center space-x-1.5 cursor-pointer bg-slate-50/80 p-2 rounded-xl border border-slate-200/80 text-[11px] font-semibold text-slate-800 hover:bg-forest-50/60 hover:border-forest-200 transition-all">
                          <input 
                            type="checkbox" 
                            checked={anamneseData.medicamentos.includes(m)} 
                            onChange={() => toggleArrayItem('medicamentos', m)}
                            className="accent-forest-700"
                          />
                          <span>{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Outros Registros */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">Outros Sintomas</label>
                      <input type="text" value={anamneseData.outrosSintomas} onChange={(e) => setAnamneseData({...anamneseData, outrosSintomas: e.target.value})} className="clinical-input font-medium text-xs" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">Outras Doenças Oculares</label>
                      <input type="text" value={anamneseData.outrasDoencasOculares} onChange={(e) => setAnamneseData({...anamneseData, outrasDoencasOculares: e.target.value})} className="clinical-input font-medium text-xs" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">Outras Doenças Sistêmicas</label>
                      <input type="text" value={anamneseData.outrasDoencasSistemicas} onChange={(e) => setAnamneseData({...anamneseData, outrasDoencasSistemicas: e.target.value})} className="clinical-input font-medium text-xs" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">Outros Medicamentos</label>
                      <input type="text" value={anamneseData.outrosMedicamentos} onChange={(e) => setAnamneseData({...anamneseData, outrosMedicamentos: e.target.value})} className="clinical-input font-medium text-xs" />
                    </div>
                  </div>

                  {/* Uso de Óculos & Lentes & Cefaleia */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 space-y-2">
                      <span className="font-extrabold text-slate-900 uppercase block text-[11px]">Uso de Óculos</span>
                      {["Usa Óculos", "Dificuldade Longe", "Dificuldade Perto"].map(o => (
                        <label key={o} className="flex items-center space-x-1.5 text-xs font-medium cursor-pointer">
                          <input type="checkbox" checked={anamneseData.usoOculos.includes(o)} onChange={() => toggleArrayItem('usoOculos', o)} className="accent-forest-700" />
                          <span>{o}</span>
                        </label>
                      ))}
                    </div>

                    <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 space-y-2">
                      <span className="font-extrabold text-slate-900 uppercase block text-[11px]">Uso de Lentes de Contato</span>
                      {["Usa Lente de Contato?", "Dificuldade Longe", "Dificuldade Perto"].map(l => (
                        <label key={l} className="flex items-center space-x-1.5 text-xs font-medium cursor-pointer">
                          <input type="checkbox" checked={anamneseData.usoLentes.includes(l)} onChange={() => toggleArrayItem('usoLentes', l)} className="accent-forest-700" />
                          <span>{l}</span>
                        </label>
                      ))}
                    </div>

                    <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 space-y-2">
                      <span className="font-extrabold text-slate-900 uppercase block text-[11px]">Antecedentes Familiares</span>
                      {["Diabetes", "Estrabismo", "Glaucoma", "Pressão Alta", "Catarata", "Alguém usa óculos?"].map(a => (
                        <label key={a} className="flex items-center space-x-1.5 text-xs font-medium cursor-pointer">
                          <input type="checkbox" checked={anamneseData.antecedentes.includes(a)} onChange={() => toggleArrayItem('antecedentes', a)} className="accent-forest-700" />
                          <span>{a}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Cefaleia */}
                  <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="font-extrabold text-slate-900 uppercase block text-[11px]">Cefaleia (Dor de Cabeça)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-8 gap-2">
                      {[
                        "Dor de cabeça", "Frontal", "Temporal", "Occipital", "Parietal", "Todo o dia", 
                        "Eventual", "Segue o sexo", "Fim de semana", "Manhã", "Tarde", "Noite", 
                        "Infrequente", "Frequente", "Crônica"
                      ].map(c => (
                        <label key={c} className="flex items-center space-x-1.5 text-[11px] font-medium cursor-pointer">
                          <input type="checkbox" checked={anamneseData.cefaleia.includes(c)} onChange={() => toggleArrayItem('cefaleia', c)} className="accent-forest-700" />
                          <span>{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Observações da Anamnese */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Observações da Anamnese</label>
                    <textarea 
                      rows={2} 
                      value={anamneseData.observacoesAnamnese} 
                      onChange={(e) => setAnamneseData({...anamneseData, observacoesAnamnese: e.target.value})}
                      className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" 
                    />
                  </div>
                  <div className="flex justify-end items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrintAnamnese}
                      disabled={loadingAnamnesis || printingAnamnese}
                      className="btn-secondary py-1.5 px-3.5 inline-flex items-center gap-1.5"
                      title="Imprimir esta Anamnese"
                    >
                      {printingAnamnese ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5 text-forest-700" />}
                      <span>Imprimir Anamnese</span>
                    </button>
                    <button type="button" onClick={saveAnamnesis} disabled={disabled || loadingAnamnesis || savingAnamnesis} className={saveButtonClass('anamnese')}>
                      {savingAnamnesis ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'anamnese' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{savingAnamnesis ? 'Salvando...' : savedSection === 'anamnese' ? 'Salvo com sucesso' : 'Salvar Anamnese'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. PRESCRIÇÃO DO ÚLTIMO EXAME */}
          {isSectionEnabled('prescricaoUltimoExame') && (
            <div data-clinical-section="prescricaoUltimoExame" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('prescricaoUltimoExame')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['prescricaoUltimoExame'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>2. Prescrição do Último Exame</span>
                </div>
                {openSections['prescricaoUltimoExame'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['prescricaoUltimoExame'] && (
                <div className="p-4 space-y-3 text-xs border-t border-slate-200 animate-fade-in">
                  <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-hairline my-2"><table className="w-full text-center border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200/80 font-extrabold text-[11px] text-slate-700 uppercase">
                          <th className="py-2 px-3 text-left">Olho</th>
                          <th className="py-2 px-3">Esférico</th>
                          <th className="py-2 px-3">Cilíndrico</th>
                          <th className="py-2 px-3">Eixo</th>
                          <th className="py-2 px-3">Adição</th>
                          <th className="py-2 px-3">DNP</th>
                          <th className="py-2 px-3">Alt</th>
                          <th className="py-2 px-3">Lentes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {['od', 'oe'].map(eye => (
                          <tr key={eye}>
                            <td className="py-2 px-3 text-left font-bold font-sans uppercase">{eye === 'od' ? 'Olho Direito (OD)' : 'Olho Esquerdo (OE)'}</td>
                            <td className="py-1 px-1"><input type="number" step="0.25" value={anamneseData.ultimoExame[eye].esferico} onChange={(event) => updateLastPrescription(eye, 'esferico', event.target.value)} className="clinical-input h-8 text-center font-mono font-bold text-xs" /></td>
                            <td className="py-1 px-1"><input type="number" step="0.25" value={anamneseData.ultimoExame[eye].cilindrico} onChange={(event) => updateLastPrescription(eye, 'cilindrico', event.target.value)} className="clinical-input h-8 text-center font-mono font-bold text-xs" /></td>
                            <td className="py-1 px-1"><input type="number" min="0" max="180" value={anamneseData.ultimoExame[eye].eixo} onChange={(event) => updateLastPrescription(eye, 'eixo', event.target.value)} className="clinical-input h-8 text-center font-mono font-bold text-xs" /></td>
                            <td className="py-1 px-1"><input type="number" step="0.25" value={anamneseData.ultimoExame[eye].adicao} onChange={(event) => updateLastPrescription(eye, 'adicao', event.target.value)} className="clinical-input h-8 text-center font-mono font-bold text-xs" /></td>
                            <td className="py-1 px-1"><input type="text" value={anamneseData.ultimoExame[eye].dnp} onChange={(event) => updateLastPrescription(eye, 'dnp', event.target.value)} className="clinical-input h-8 text-center font-mono font-bold text-xs" /></td>
                            <td className="py-1 px-1"><input type="text" value={anamneseData.ultimoExame[eye].alt} onChange={(event) => updateLastPrescription(eye, 'alt', event.target.value)} className="clinical-input h-8 text-center font-mono font-bold text-xs" /></td>
                            <td className="py-1 px-1"><input type="text" value={anamneseData.ultimoExame[eye].lentes} onChange={(event) => updateLastPrescription(eye, 'lentes', event.target.value)} className="clinical-input h-8 text-xs font-medium" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="block font-bold text-slate-700 mb-1">Filtro</span>
                      <input type="text" value={lastPrescriptionExtra.filtro || ''} onChange={(event) => setLastPrescriptionExtra((current) => ({ ...current, filtro: event.target.value }))} className="clinical-input h-8 text-xs font-medium" />
                    </label>
                    <label className="block">
                      <span className="block font-bold text-slate-700 mb-1">Cor</span>
                      <input type="text" value={lastPrescriptionExtra.cor || ''} onChange={(event) => setLastPrescriptionExtra((current) => ({ ...current, cor: event.target.value }))} className="clinical-input h-8 text-xs font-medium" />
                    </label>
                  </div>
                  <label className="block">
                    <span className="block font-bold text-slate-700 mb-1">Observações</span>
                    <textarea rows={2} value={lastPrescriptionExtra.observacoes || ''} onChange={(event) => setLastPrescriptionExtra((current) => ({ ...current, observacoes: event.target.value }))} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={saveLastPrescription}
                      disabled={disabled || loadingLastPrescription || savingLastPrescription}
                      className={saveButtonClass('prescricaoUltimoExame')}
                    >
                      {savingLastPrescription ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'prescricaoUltimoExame' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{savingLastPrescription ? 'Salvando...' : savedSection === 'prescricaoUltimoExame' ? 'Salvo com sucesso' : 'Salvar Prescrição'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. ACUIDADE VISUAL */}
          {isSectionEnabled('acuidadeVisual') && (
            <div data-clinical-section="acuidadeVisual" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('acuidadeVisual')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['acuidadeVisual'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>3. Acuidade Visual</span>
                </div>
                {openSections['acuidadeVisual'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['acuidadeVisual'] && (
                <div className="p-4 space-y-4 text-xs border-t border-slate-200 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <label className="block">
                      <span className="block font-bold text-slate-700 mb-1">Tipo de Optotipo</span>
                      <select
                        value={anamneseData.acuidade.optotipo}
                        onChange={(event) => setAnamneseData((current) => ({ ...current, acuidade: { ...current.acuidade, optotipo: event.target.value } }))}
                        className="clinical-input h-8 text-xs font-medium"
                      >
                        <option value="">Selecione</option>
                        <option value="Snellen">Snellen</option>
                        <option value="Tumbling E">Tumbling E</option>
                        <option value="Figuras">Figuras</option>
                        <option value="LogMAR">LogMAR</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="block font-bold text-slate-700 mb-1">Visão habitual</span>
                      <input
                        type="text"
                        value={anamneseData.acuidade.visaoHabitual}
                        onChange={(event) => setAnamneseData((current) => ({ ...current, acuidade: { ...current.acuidade, visaoHabitual: event.target.value } }))}
                        className="clinical-input h-8 text-xs font-medium"
                      />
                    </label>
                  </div>

                  <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-hairline my-2"><table className="w-full min-w-[760px] text-center border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200/80 font-extrabold text-[11px] text-slate-700 uppercase">
                          <th rowSpan={2} className="py-2 px-3 text-left border-r border-slate-200/80">Olho</th>
                          <th colSpan={3} className="py-2 px-3 border-r border-slate-200/80">Sem correção</th>
                          <th colSpan={3} className="py-2 px-3">Com correção</th>
                        </tr>
                        <tr className="bg-slate-50 border-b border-slate-200/80 font-bold text-[10px] text-slate-600 uppercase">
                          <th className="py-1.5 px-2">VL</th>
                          <th className="py-1.5 px-2">VP</th>
                          <th className="py-1.5 px-2 border-r border-slate-200/80">PH</th>
                          <th className="py-1.5 px-2">VL</th>
                          <th className="py-1.5 px-2">VP</th>
                          <th className="py-1.5 px-2">PH</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {[
                          { key: 'od', label: 'Olho Direito (OD)' },
                          { key: 'oe', label: 'Olho Esquerdo (OE)' },
                          { key: 'ao', label: 'Ambos os Olhos (AO)' }
                        ].map(row => (
                          <tr key={row.key}>
                            <td className="py-2 px-3 text-left font-bold font-sans border-r border-slate-200">{row.label}</td>
                            {['semCorrecao', 'comCorrecao'].flatMap((group) => [
                              <td key={`${group}-longe`} className="py-1 px-1"><input type="text" value={anamneseData.acuidade[group][row.key].longe} onChange={(event) => updateVisualAcuity(group, row.key, 'longe', event.target.value)} className="clinical-input h-8 text-center font-mono font-bold text-xs" /></td>,
                              <td key={`${group}-perto`} className="py-1 px-1"><input type="text" value={anamneseData.acuidade[group][row.key].perto} onChange={(event) => updateVisualAcuity(group, row.key, 'perto', event.target.value)} className="clinical-input h-8 text-center font-mono font-bold text-xs" /></td>,
                              <td key={`${group}-ph`} className={`py-1 px-1 ${group === 'semCorrecao' ? 'border-r border-slate-200' : ''}`}>
                                {row.key === 'ao' ? <span className="text-slate-400">—</span> : <input type="text" value={anamneseData.acuidade[group][row.key].ph} onChange={(event) => updateVisualAcuity(group, row.key, 'ph', event.target.value)} className="clinical-input h-8 text-center font-mono font-bold text-xs" />}
                              </td>,
                            ])}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <label className="block">
                    <span className="block font-bold text-slate-700 mb-1">Observações</span>
                    <textarea
                      rows={2}
                      value={anamneseData.acuidade.observacoes}
                      onChange={(event) => setAnamneseData((current) => ({ ...current, acuidade: { ...current.acuidade, observacoes: event.target.value } }))}
                      className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y"
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={saveVisualAcuity}
                      disabled={disabled || loadingVisualAcuity || savingVisualAcuity}
                      className={saveButtonClass('acuidadeVisual')}
                    >
                      {savingVisualAcuity ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'acuidadeVisual' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{savingVisualAcuity ? 'Salvando...' : savedSection === 'acuidadeVisual' ? 'Salvo com sucesso' : 'Salvar Acuidade'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. BIOMICROSCOPIA */}
          {isSectionEnabled('biomicroscopia') && (
            <div data-clinical-section="biomicroscopia" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('biomicroscopia')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['biomicroscopia'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>4. Biomicroscopia</span>
                </div>
                {openSections['biomicroscopia'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['biomicroscopia'] && (
                <div className="p-4 space-y-4 text-xs border-t border-slate-200 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['od', 'oe'].map(eye => (
                      <div key={eye} className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3 shadow-hairline">
                        <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                          <span className="font-extrabold uppercase text-forest-800 text-xs tracking-wider">
                            {eye === 'od' ? 'Olho Direito (OD)' : 'Olho Esquerdo (OE)'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          {BIOMICROSCOPY_FIELDS.map(([field, label]) => (
                            <div key={field}>
                              <label className="clinical-label !text-[9.5px] !mb-1">{label}</label>
                              <input
                                type="text"
                                value={anamneseData.biomicroscopia[eye][field]}
                                onChange={(event) => updateBiomicroscopy(eye, field, event.target.value)}
                                disabled={disabled || loadingBiomicroscopy || savingBiomicroscopy}
                                className="clinical-input h-8 text-xs font-medium"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <label className="block">
                    <span className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Observações</span>
                    <textarea
                      rows={3}
                      value={anamneseData.biomicroscopia.observacoes}
                      onChange={(event) => setAnamneseData((current) => ({
                        ...current,
                        biomicroscopia: { ...current.biomicroscopia, observacoes: event.target.value },
                      }))}
                      disabled={disabled || loadingBiomicroscopy || savingBiomicroscopy}
                      className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y"
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={saveBiomicroscopy}
                      disabled={disabled || loadingBiomicroscopy || savingBiomicroscopy}
                      className={saveButtonClass('biomicroscopia')}
                    >
                      {savingBiomicroscopy ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'biomicroscopia' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{savingBiomicroscopy ? 'Salvando...' : savedSection === 'biomicroscopia' ? 'Salvo com sucesso' : 'Salvar Biomicroscopia'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. CERATOMETRIA */}
          {isSectionEnabled('ceratometria') && (
            <div data-clinical-section="ceratometria" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('ceratometria')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['ceratometria'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>5. Ceratometria</span>
                </div>
                {openSections['ceratometria'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['ceratometria'] && (
                <div className="p-5 space-y-4 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="font-semibold text-slate-700 sm:w-28 shrink-0 text-xs">
                      Técnica
                    </label>
                    <input
                      type="text"
                      value={anamneseData.ceratometria.tecnica}
                      onChange={(event) => setAnamneseData((current) => ({
                        ...current,
                        ceratometria: { ...current.ceratometria, tecnica: event.target.value },
                      }))}
                      disabled={disabled || loadingKeratometry || savingKeratometry}
                      className="clinical-input h-9 font-medium"
                    />
                  </div>

                  <div className="overflow-x-auto pt-2 border-t border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200/80">
                          <th className="py-2.5 px-3 w-40 font-bold text-slate-500"></th>
                          <th className="py-2.5 px-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">
                            OD
                          </th>
                          <th className="py-2.5 px-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">
                            OE
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          ['horizontal', 'Meridiano horizontal', 'text'],
                          ['vertical', 'Meridiano vertical', 'text'],
                          ['eixo', 'Eixo', 'number'],
                        ].map(([field, label, type]) => (
                          <tr key={field} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-semibold text-slate-700 align-middle">{label}</td>
                            {['od', 'oe'].map((eye) => (
                              <td key={eye} className="py-1.5 px-3 w-1/2">
                                <input
                                  type={type}
                                  min={type === 'number' ? 0 : undefined}
                                  max={type === 'number' ? 180 : undefined}
                                  step={type === 'number' ? 1 : undefined}
                                  value={anamneseData.ceratometria[eye][field]}
                                  onChange={(event) => updateKeratometryEye(eye, field, event.target.value)}
                                  disabled={disabled || loadingKeratometry || savingKeratometry}
                                  className="clinical-input text-center font-mono font-bold h-9"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-700 align-middle">
                            Miras
                          </td>
                          <td colSpan={2} className="py-1.5 px-3">
                            <input
                              type="text"
                              value={anamneseData.ceratometria.miras}
                              onChange={(event) => setAnamneseData((current) => ({
                                ...current,
                                ceratometria: { ...current.ceratometria, miras: event.target.value },
                              }))}
                              disabled={disabled || loadingKeratometry || savingKeratometry}
                              className="clinical-input h-9 font-medium"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <label className="block">
                    <span className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Observações</span>
                    <textarea
                      rows={3}
                      value={anamneseData.ceratometria.observacoes}
                      onChange={(event) => setAnamneseData((current) => ({
                        ...current,
                        ceratometria: { ...current.ceratometria, observacoes: event.target.value },
                      }))}
                      disabled={disabled || loadingKeratometry || savingKeratometry}
                      className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y"
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={saveKeratometry}
                      disabled={disabled || loadingKeratometry || savingKeratometry}
                      className={saveButtonClass('ceratometria')}
                    >
                      {savingKeratometry ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'ceratometria' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{savingKeratometry ? 'Salvando...' : savedSection === 'ceratometria' ? 'Salvo com sucesso' : 'Salvar Ceratometria'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. TONOMETRIA */}
          {isSectionEnabled('tonometria') && (
            <div data-clinical-section="tonometria" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('tonometria')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['tonometria'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>6. Tonometria</span>
                </div>
                {openSections['tonometria'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['tonometria'] && (
                <div className="p-5 space-y-4 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="font-semibold text-slate-700 sm:w-28 shrink-0 text-xs">
                      Técnica
                    </label>
                    <input
                      type="text"
                      value={anamneseData.tonometria.tecnica}
                      onChange={(event) => setAnamneseData((current) => ({
                        ...current,
                        tonometria: { ...current.tonometria, tecnica: event.target.value },
                      }))}
                      disabled={disabled || loadingTonometry || savingTonometry}
                      className="clinical-input h-9 font-medium"
                    />
                  </div>

                  <div className="overflow-x-auto pt-2 border-t border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200/80">
                          <th className="py-2.5 px-3 w-40 font-bold text-slate-500"></th>
                          <th className="py-2.5 px-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">
                            OD
                          </th>
                          <th className="py-2.5 px-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">
                            OE
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-700 align-middle">
                            Pressão Intraocular
                          </td>
                          <td className="py-1.5 px-3 w-1/2">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={anamneseData.tonometria.odMmhg}
                              onChange={(event) => setAnamneseData((current) => ({
                                ...current,
                                tonometria: { ...current.tonometria, odMmhg: event.target.value },
                              }))}
                              disabled={disabled || loadingTonometry || savingTonometry}
                              className="clinical-input text-center font-mono font-bold h-9"
                              aria-label="Pressão intraocular OD em mmHg"
                            />
                          </td>
                          <td className="py-1.5 px-3 w-1/2">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={anamneseData.tonometria.oeMmhg}
                              onChange={(event) => setAnamneseData((current) => ({
                                ...current,
                                tonometria: { ...current.tonometria, oeMmhg: event.target.value },
                              }))}
                              disabled={disabled || loadingTonometry || savingTonometry}
                              className="clinical-input text-center font-mono font-bold h-9"
                              aria-label="Pressão intraocular OE em mmHg"
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-700 align-middle">
                            Hora da Medição
                          </td>
                          <td colSpan={2} className="py-1.5 px-3">
                            <input
                              type="time"
                              value={anamneseData.tonometria.horario}
                              onChange={(event) => setAnamneseData((current) => ({
                                ...current,
                                tonometria: { ...current.tonometria, horario: event.target.value },
                              }))}
                              disabled={disabled || loadingTonometry || savingTonometry}
                              className="clinical-input text-center font-mono font-bold h-9"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <label className="block">
                    <span className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Observações</span>
                    <textarea
                      rows={3}
                      value={anamneseData.tonometria.observacoes}
                      onChange={(event) => setAnamneseData((current) => ({
                        ...current,
                        tonometria: { ...current.tonometria, observacoes: event.target.value },
                      }))}
                      disabled={disabled || loadingTonometry || savingTonometry}
                      className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y"
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={saveTonometry}
                      disabled={disabled || loadingTonometry || savingTonometry}
                      className={saveButtonClass('tonometria')}
                    >
                      {savingTonometry ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'tonometria' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{savingTonometry ? 'Salvando...' : savedSection === 'tonometria' ? 'Salvo com sucesso' : 'Salvar Tonometria'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. FOROMETRIA */}
          {isSectionEnabled('forometria') && (
            <div data-clinical-section="forometria" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('forometria')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['forometria'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>7. Forometria</span>
                </div>
                {openSections['forometria'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['forometria'] && (
                <div className="p-5 space-y-4 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {FOROMETRY_FIELDS.map(([field, label]) => (
                      <label key={field} className="block">
                        <span className="block text-[10px] font-bold uppercase text-slate-600 mb-1">{label}</span>
                        <input
                          type="text"
                          value={anamneseData.forometria[field]}
                          onChange={(event) => updateClinicalSectionField('forometria', field, event.target.value)}
                          disabled={disabled || loadingForometry || savingForometry}
                          className="clinical-input h-9 font-medium"
                        />
                      </label>
                    ))}
                  </div>
                  <label className="block">
                    <span className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Observações</span>
                    <textarea rows={3} value={anamneseData.forometria.observacoes} onChange={(event) => updateClinicalSectionField('forometria', 'observacoes', event.target.value)} disabled={disabled || loadingForometry || savingForometry} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" />
                  </label>
                  <div className="flex justify-end">
                    <button type="button" onClick={saveForometry} disabled={disabled || loadingForometry || savingForometry} className={saveButtonClass('forometria')}>
                      {savingForometry ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'forometria' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{savingForometry ? 'Salvando...' : savedSection === 'forometria' ? 'Salvo com sucesso' : 'Salvar Forometria'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. OFTALMOSCOPIA */}
          {isSectionEnabled('oftalmoscopia') && (
            <div data-clinical-section="oftalmoscopia" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('oftalmoscopia')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['oftalmoscopia'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>8. Oftalmoscopia</span>
                </div>
                {openSections['oftalmoscopia'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['oftalmoscopia'] && (
                <div className="p-5 space-y-4 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <label className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="font-semibold text-slate-700 sm:w-28 shrink-0">Técnica</span>
                    <input type="text" value={anamneseData.oftalmoscopia.tecnica} onChange={(event) => updateClinicalSectionField('oftalmoscopia', 'tecnica', event.target.value)} disabled={disabled || loadingOphthalmoscopy || savingOphthalmoscopy} className="clinical-input h-9 font-medium" />
                  </label>
                  <div className="overflow-x-auto pt-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200/80">
                          <th className="py-2.5 px-3 w-40 font-bold text-slate-500"></th>
                          <th className="py-2.5 px-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">
                            OD
                          </th>
                          <th className="py-2.5 px-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">
                            OE
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {OPHTHALMOSCOPY_FIELDS.map(([field, label]) => (
                          <tr key={field} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-semibold text-slate-700 align-middle">{label}</td>
                            {['od', 'oe'].map((eye) => (
                              <td key={eye} className="py-1.5 px-3 w-1/2">
                                <input type="text" value={anamneseData.oftalmoscopia[eye][field]} onChange={(event) => updateClinicalEyeField('oftalmoscopia', eye, field, event.target.value)} disabled={disabled || loadingOphthalmoscopy || savingOphthalmoscopy} className="clinical-input h-9 font-medium" />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <label className="block">
                    <span className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Observações</span>
                    <textarea rows={3} value={anamneseData.oftalmoscopia.observacoes} onChange={(event) => updateClinicalSectionField('oftalmoscopia', 'observacoes', event.target.value)} disabled={disabled || loadingOphthalmoscopy || savingOphthalmoscopy} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" />
                  </label>
                  <div className="flex justify-end">
                    <button type="button" onClick={saveOphthalmoscopy} disabled={disabled || loadingOphthalmoscopy || savingOphthalmoscopy} className={saveButtonClass('oftalmoscopia')}>
                      {savingOphthalmoscopy ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'oftalmoscopia' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{savingOphthalmoscopy ? 'Salvando...' : savedSection === 'oftalmoscopia' ? 'Salvo com sucesso' : 'Salvar Oftalmoscopia'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 9. RETINOSCOPIA DINÂMICA (Fiel à Imagem 1) */}
          {isSectionEnabled('retinoscopiaDinamica') && (
            <div data-clinical-section="retinoscopiaDinamica" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('retinoscopiaDinamica')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['retinoscopiaDinamica'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>9. Retinoscopia Dinâmica</span>
                </div>
                {openSections['retinoscopiaDinamica'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['retinoscopiaDinamica'] && (
                <div className="p-5 space-y-3 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-hairline my-2"><table className="w-full min-w-[680px] text-left border-collapse">
                      <thead><tr className="border-b border-slate-200/80"><th className="py-2 px-3">Olho</th>{REFRACTION_FIELDS.map(([field, label]) => <th key={field} className="py-2 px-3 text-center uppercase text-[10px]">{label}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {['od', 'oe'].map((eye) => <tr key={eye}><td className="py-2 px-3 font-bold uppercase">{eye}</td>{REFRACTION_FIELDS.map(([field, , type]) => <td key={field} className="py-1.5 px-2"><input type={type} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 180 : undefined} step={type === 'number' ? 1 : undefined} value={anamneseData.retinoscopiaDinamica[eye][field]} onChange={(event) => updateClinicalEyeField('retinoscopiaDinamica', eye, field, event.target.value)} disabled={disabled || loadingDynamicRetinoscopy || savingDynamicRetinoscopy} className="clinical-input text-center font-mono font-bold h-9" /></td>)}</tr>)}
                      </tbody>
                    </table>
                  </div>
                  <textarea rows={3} aria-label="Observações da Retinoscopia Dinâmica" value={anamneseData.retinoscopiaDinamica.observacoes} onChange={(event) => updateClinicalSectionField('retinoscopiaDinamica', 'observacoes', event.target.value)} disabled={disabled || loadingDynamicRetinoscopy || savingDynamicRetinoscopy} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" placeholder="Observações" />
                  <div className="flex justify-end"><button type="button" onClick={saveDynamicRetinoscopy} disabled={disabled || loadingDynamicRetinoscopy || savingDynamicRetinoscopy} className={saveButtonClass('retinoscopiaDinamica')}>{savingDynamicRetinoscopy ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'retinoscopiaDinamica' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingDynamicRetinoscopy ? 'Salvando...' : savedSection === 'retinoscopiaDinamica' ? 'Salvo com sucesso' : 'Salvar Retinoscopia Dinâmica'}</span></button></div>
                </div>
              )}
            </div>
          )}

          {/* 10. RETINOSCOPIA ESTÁTICA (Fiel à Imagem 1) */}
          {isSectionEnabled('retinoscopiaEstatica') && (
            <div data-clinical-section="retinoscopiaEstatica" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('retinoscopiaEstatica')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['retinoscopiaEstatica'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>10. Retinoscopia Estática</span>
                </div>
                {openSections['retinoscopiaEstatica'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['retinoscopiaEstatica'] && (
                <div className="p-5 space-y-3 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-hairline my-2"><table className="w-full min-w-[680px] text-left border-collapse">
                      <thead><tr className="border-b border-slate-200/80"><th className="py-2 px-3">Olho</th>{REFRACTION_FIELDS.map(([field, label]) => <th key={field} className="py-2 px-3 text-center uppercase text-[10px]">{label}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {['od', 'oe'].map((eye) => <tr key={eye}><td className="py-2 px-3 font-bold uppercase">{eye}</td>{REFRACTION_FIELDS.map(([field, , type]) => <td key={field} className="py-1.5 px-2"><input type={type} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 180 : undefined} step={type === 'number' ? 1 : undefined} value={anamneseData.retinoscopiaEstatica[eye][field]} onChange={(event) => updateClinicalEyeField('retinoscopiaEstatica', eye, field, event.target.value)} disabled={disabled || loadingStaticRetinoscopy || savingStaticRetinoscopy} className="clinical-input text-center font-mono font-bold h-9" /></td>)}</tr>)}
                      </tbody>
                    </table>
                  </div>
                  <textarea rows={3} aria-label="Observações da Retinoscopia Estática" value={anamneseData.retinoscopiaEstatica.observacoes} onChange={(event) => updateClinicalSectionField('retinoscopiaEstatica', 'observacoes', event.target.value)} disabled={disabled || loadingStaticRetinoscopy || savingStaticRetinoscopy} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" placeholder="Observações" />
                  <div className="flex justify-end"><button type="button" onClick={saveStaticRetinoscopy} disabled={disabled || loadingStaticRetinoscopy || savingStaticRetinoscopy} className={saveButtonClass('retinoscopiaEstatica')}>{savingStaticRetinoscopy ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'retinoscopiaEstatica' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingStaticRetinoscopy ? 'Salvando...' : savedSection === 'retinoscopiaEstatica' ? 'Salvo com sucesso' : 'Salvar Retinoscopia Estática'}</span></button></div>
                </div>
              )}
            </div>
          )}

          {/* 11. AVALIAÇÃO MOTORA (Fiel à Imagem 2) */}
          {isSectionEnabled('avaliacaoMotora') && (
            <div data-clinical-section="avaliacaoMotora" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('avaliacaoMotora')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['avaliacaoMotora'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>11. Avaliação Motora</span>
                </div>
                {openSections['avaliacaoMotora'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['avaliacaoMotora'] && (
                <div className="p-5 space-y-4 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-hairline my-2"><table className="w-full text-left border-collapse text-xs">
                      <thead><tr className="border-b border-slate-200/80"><th className="py-2.5 px-3 w-40"></th><th className="py-2.5 px-3 text-center uppercase">OD</th><th className="py-2.5 px-3 text-center uppercase">OE</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {[['kappa', 'Kappa'], ['hirschberg', 'Hirschberg'], ['duccoes', 'Ducções']].map(([field, label]) => <tr key={field}><td className="py-2.5 px-3 font-semibold">{label}</td>{['od', 'oe'].map((eye) => <td key={eye} className="py-1.5 px-3"><input type="text" value={anamneseData.avaliacaoMotora[field][eye]} onChange={(event) => updateMotorField(field, eye, event.target.value)} disabled={disabled || loadingMotorEvaluation || savingMotorEvaluation} className="clinical-input h-9 font-medium" /></td>)}</tr>)}
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-700 align-middle">Versões</td>
                          <td className="py-3 px-3 w-1/2 text-center">
                            <VersoesHDiagram eye="OD" values={anamneseData.avaliacaoMotora.versoes.od} onChange={(pos, val) => updateMotorVersion('od', pos, val)} disabled={disabled || loadingMotorEvaluation || savingMotorEvaluation} />
                          </td>
                          <td className="py-3 px-3 w-1/2 text-center">
                            <VersoesHDiagram eye="OE" values={anamneseData.avaliacaoMotora.versoes.oe} onChange={(pos, val) => updateMotorVersion('oe', pos, val)} disabled={disabled || loadingMotorEvaluation || savingMotorEvaluation} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <textarea rows={3} aria-label="Observações da Avaliação Motora" value={anamneseData.avaliacaoMotora.observacoes} onChange={(event) => updateClinicalSectionField('avaliacaoMotora', 'observacoes', event.target.value)} disabled={disabled || loadingMotorEvaluation || savingMotorEvaluation} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" placeholder="Observações" />
                  <div className="flex justify-end"><button type="button" onClick={saveMotorEvaluation} disabled={disabled || loadingMotorEvaluation || savingMotorEvaluation} className={saveButtonClass('avaliacaoMotora')}>{savingMotorEvaluation ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'avaliacaoMotora' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingMotorEvaluation ? 'Salvando...' : savedSection === 'avaliacaoMotora' ? 'Salvo com sucesso' : 'Salvar Avaliação Motora'}</span></button></div>
                </div>
              )}
            </div>
          )}

          {/* 12. RX FINAL */}
          {isSectionEnabled('rxFinal') && (
            <div data-clinical-section="rxFinal" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('rxFinal')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['rxFinal'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>12. RX Final</span>
                </div>
                {openSections['rxFinal'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['rxFinal'] && (
                <div className="p-4 space-y-3 text-xs border-t border-slate-200 animate-fade-in">
                  <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-hairline my-2"><table className="w-full min-w-[900px] text-center border-collapse text-xs">
                      <thead><tr className="bg-slate-100 border-b border-slate-200/80 font-extrabold text-[11px] text-slate-700 uppercase"><th className="py-2 px-3 text-left">Olho</th>{RX_FINAL_EYE_FIELDS.map(([field, label]) => <th key={field} className="py-2 px-3">{label}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {['od', 'oe'].map((eye) => <tr key={eye}><td className="py-2 px-3 text-left font-bold font-sans uppercase">{eye}</td>{RX_FINAL_EYE_FIELDS.map(([field, , type]) => <td key={field} className="py-1 px-1"><input type={type} min={field === 'eixo' ? 0 : undefined} max={field === 'eixo' ? 180 : undefined} value={anamneseData.rxFinal[eye][field]} onChange={(event) => updateClinicalEyeField('rxFinal', eye, field, event.target.value)} disabled={disabled || loadingFinalRx || savingFinalRx} className="clinical-input h-8 text-center font-mono font-bold text-xs" /></td>)}</tr>)}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">{[['adicao', 'Adição'], ['tipoLente', 'Tipo de lente'], ['filtro', 'Filtro'], ['cor', 'Cor'], ['tratamento', 'Tratamento']].map(([field, label]) => <label key={field}><span className="block text-[10px] font-bold uppercase text-slate-600 mb-1">{label}</span><input type="text" value={anamneseData.rxFinal[field]} onChange={(event) => updateClinicalSectionField('rxFinal', field, event.target.value)} disabled={disabled || loadingFinalRx || savingFinalRx} className="clinical-input h-9 font-medium" /></label>)}</div>
                  <textarea rows={3} aria-label="Observações do RX Final" value={anamneseData.rxFinal.observacoes} onChange={(event) => updateClinicalSectionField('rxFinal', 'observacoes', event.target.value)} disabled={disabled || loadingFinalRx || savingFinalRx} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" placeholder="Observações" />
                  <div className="flex justify-end"><button type="button" onClick={saveFinalRx} disabled={disabled || loadingFinalRx || savingFinalRx} className={saveButtonClass('rxFinal')}>{savingFinalRx ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'rxFinal' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingFinalRx ? 'Salvando...' : savedSection === 'rxFinal' ? 'Salvo com sucesso' : 'Salvar RX Final'}</span></button></div>
                </div>
              )}
            </div>
          )}

          {/* 13. AMPLITUDE DE ACOMODAÇÃO (Fiel à Imagem 3) */}
          {isSectionEnabled('amplitudeAcomodacao') && (
            <div data-clinical-section="amplitudeAcomodacao" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('amplitudeAcomodacao')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['amplitudeAcomodacao'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>13. Amplitude de Acomodação</span>
                </div>
                {openSections['amplitudeAcomodacao'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['amplitudeAcomodacao'] && (
                <div className="p-5 space-y-4 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <label className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="font-semibold text-slate-700 sm:w-28 shrink-0">Técnica</span>
                    <input type="text" value={anamneseData.amplitudeAcomodacao.metodo} onChange={(event) => updateClinicalSectionField('amplitudeAcomodacao', 'metodo', event.target.value)} disabled={disabled || loadingAccommodationAmplitude || savingAccommodationAmplitude} className="clinical-input h-9 font-medium" />
                  </label>
                  <div className="divide-y divide-slate-200 border-b border-slate-200">
                    {['od', 'oe'].map((eye) => (
                      <div key={eye} className="grid grid-cols-1 sm:grid-cols-[72px_minmax(0,1fr)_120px_minmax(0,1fr)] items-center gap-3 py-2">
                        <label htmlFor={`amplitude-${eye}`} className="px-2 font-medium text-slate-600 uppercase">{eye}</label>
                        <input id={`amplitude-${eye}`} type="text" value={anamneseData.amplitudeAcomodacao[eye].amplitude} onChange={(event) => updateClinicalEyeField('amplitudeAcomodacao', eye, 'amplitude', event.target.value)} disabled={disabled || loadingAccommodationAmplitude || savingAccommodationAmplitude} className="clinical-input h-9 font-medium" />
                        <label htmlFor={`nivel-${eye}`} className="px-1 font-medium text-slate-600">Nível</label>
                        <input id={`nivel-${eye}`} type="text" value={anamneseData.amplitudeAcomodacao[eye].nivel} onChange={(event) => updateClinicalEyeField('amplitudeAcomodacao', eye, 'nivel', event.target.value)} disabled={disabled || loadingAccommodationAmplitude || savingAccommodationAmplitude} className="clinical-input h-9 font-medium" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end"><button type="button" onClick={saveAccommodationAmplitude} disabled={disabled || loadingAccommodationAmplitude || savingAccommodationAmplitude} className={saveButtonClass('amplitudeAcomodacao')}>{savingAccommodationAmplitude ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'amplitudeAcomodacao' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingAccommodationAmplitude ? 'Salvando...' : savedSection === 'amplitudeAcomodacao' ? 'Salvo com sucesso' : 'Salvar Amplitude'}</span></button></div>
                </div>
              )}
            </div>
          )}

          {/* 14. AFINAMENTO */}
          {isSectionEnabled('afinamento') && (
            <div data-clinical-section="afinamento" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('afinamento')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['afinamento'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>14. Afinamento</span>
                </div>
                {openSections['afinamento'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['afinamento'] && (
                <div className="p-5 space-y-3 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-hairline my-2"><table className="w-full min-w-[760px] text-left border-collapse"><thead><tr className="border-b border-slate-200/80"><th className="py-2 px-3">Olho</th>{REFRACTION_NEAR_FIELDS.map(([field, label]) => <th key={field} className="py-2 px-3 text-center uppercase text-[10px]">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{['od', 'oe'].map((eye) => <tr key={eye}><td className="py-2 px-3 font-bold uppercase">{eye}</td>{REFRACTION_NEAR_FIELDS.map(([field, , type]) => <td key={field} className="py-1.5 px-2"><input type={type} min={field === 'eixo' ? 0 : undefined} max={field === 'eixo' ? 180 : undefined} value={anamneseData.afinamento[eye][field]} onChange={(event) => updateClinicalEyeField('afinamento', eye, field, event.target.value)} disabled={disabled || loadingRefinement || savingRefinement} className="clinical-input text-center font-mono font-bold" /></td>)}</tr>)}</tbody></table></div>
                  <label className="block max-w-sm"><span className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Adição</span><input type="text" value={anamneseData.afinamento.adicao} onChange={(event) => updateClinicalSectionField('afinamento', 'adicao', event.target.value)} disabled={disabled || loadingRefinement || savingRefinement} className="clinical-input h-9 font-medium" /></label>
                  <textarea rows={3} aria-label="Observações do Afinamento" value={anamneseData.afinamento.observacoes} onChange={(event) => updateClinicalSectionField('afinamento', 'observacoes', event.target.value)} disabled={disabled || loadingRefinement || savingRefinement} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" placeholder="Observações" />
                  <div className="flex justify-end"><button type="button" onClick={saveRefinement} disabled={disabled || loadingRefinement || savingRefinement} className={saveButtonClass('afinamento')}>{savingRefinement ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'afinamento' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingRefinement ? 'Salvando...' : savedSection === 'afinamento' ? 'Salvo com sucesso' : 'Salvar Afinamento'}</span></button></div>
                </div>
              )}
            </div>
          )}
          {/* 15. DX (DIAGNÓSTICO E CONDUTA) */}
          {isSectionEnabled('dx') && (
            <div data-clinical-section="dx" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('dx')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['dx'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>15. DX (Diagnóstico e Conduta)</span>
                </div>
                {openSections['dx'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['dx'] && (
                <div className="p-5 sm:p-6 space-y-4 text-xs animate-fade-in bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="clinical-label">Refrativo</label>
                      <input type="text" value={anamneseData.dx.refrativo} onChange={(event) => updateClinicalSectionField('dx', 'refrativo', event.target.value)} className="clinical-input font-medium" />
                    </div>
                    <div>
                      <label className="clinical-label">Motor</label>
                      <input type="text" value={anamneseData.dx.motor} onChange={(event) => updateClinicalSectionField('dx', 'motor', event.target.value)} className="clinical-input font-medium" />
                    </div>
                    <div>
                      <label className="clinical-label">Ocular</label>
                      <input type="text" value={anamneseData.dx.patologico} onChange={(event) => updateClinicalSectionField('dx', 'patologico', event.target.value)} className="clinical-input font-medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5 shadow-hairline">
                      <span className="clinical-label">Conduta</span>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {["LC", "RX", "Encaminhamento", "Pleóptica", "Ortóptica"].map(c => (
                          <label key={c} className="flex items-center space-x-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-800 hover:bg-forest-50/60 hover:border-forest-200 transition-all shadow-hairline">
                            <input type="checkbox" checked={anamneseData.dx.conduta.includes(c)} onChange={() => toggleDxOption('conduta', c)} className="accent-forest-700" />
                            <span>{c}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5 shadow-hairline">
                      <span className="clinical-label">Controle</span>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {["1 Semana", "1 Mês", "6 Meses", "1 Ano"].map(c => (
                          <label key={c} className="flex items-center space-x-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-800 hover:bg-forest-50/60 hover:border-forest-200 transition-all shadow-hairline">
                            <input type="checkbox" checked={anamneseData.dx.controle.includes(c)} onChange={() => toggleDxOption('controle', c)} className="accent-forest-700" />
                            <span>{c}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="clinical-label">Observações DX</label>
                    <textarea rows={3} value={anamneseData.dx.observacoes} onChange={(event) => updateClinicalSectionField('dx', 'observacoes', event.target.value)} className="clinical-input h-auto min-h-20 py-2.5 text-xs font-medium resize-y" />
                  </div>
                  <div className="flex justify-end"><button type="button" onClick={saveDx} disabled={disabled || loadingDx || savingDx} className={saveButtonClass('dx')}>{savingDx ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'dx' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingDx ? 'Salvando...' : savedSection === 'dx' ? 'Salvo com sucesso' : 'Salvar DX'}</span></button></div>
                </div>
              )}
            </div>
          )}

          {/* 16. FLEXIBILIDADE E FACILIDADE DE ACOMODAÇÃO */}
          {isSectionEnabled('flexibilidadeAcomodacao') && (
            <div data-clinical-section="flexibilidadeAcomodacao" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('flexibilidadeAcomodacao')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['flexibilidadeAcomodacao'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>16. Flexibilidade e Facilidade de Acomodação</span>
                </div>
                {openSections['flexibilidadeAcomodacao'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['flexibilidadeAcomodacao'] && (
                <div className="p-5 space-y-4 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <label className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="font-semibold text-slate-700 sm:w-28 shrink-0">Técnica</span>
                    <input type="text" value={anamneseData.flexibilidadeAcomodacao.tecnica} onChange={(event) => updateClinicalSectionField('flexibilidadeAcomodacao', 'tecnica', event.target.value)} className="clinical-input h-9 font-medium" />
                  </label>
                  <div className="divide-y divide-slate-200 border-y border-slate-200">
                    {['od', 'oe'].map((eye) => (
                      <div key={eye} className="grid grid-cols-1 sm:grid-cols-[72px_minmax(0,1fr)_120px_minmax(0,1fr)] items-center gap-3 py-2">
                        <span className="px-2 font-semibold text-slate-700 uppercase">{eye}</span>
                        <input type="text" value={anamneseData.flexibilidadeAcomodacao[eye].resultado} onChange={(event) => updateClinicalEyeField('flexibilidadeAcomodacao', eye, 'resultado', event.target.value)} className="clinical-input h-9 font-medium" />
                        <span className="font-semibold text-slate-700">Ciclos / min</span>
                        <input type="text" value={anamneseData.flexibilidadeAcomodacao[eye].ciclosMinuto} onChange={(event) => updateClinicalEyeField('flexibilidadeAcomodacao', eye, 'ciclosMinuto', event.target.value)} className="clinical-input h-9 font-medium" />
                      </div>
                    ))}
                  </div>
                  <label className="block"><span className="block font-bold text-slate-700 mb-1">Observações</span><textarea rows={2} value={anamneseData.flexibilidadeAcomodacao.observacoes} onChange={(event) => updateClinicalSectionField('flexibilidadeAcomodacao', 'observacoes', event.target.value)} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" /></label>
                  <div className="flex justify-end"><button type="button" onClick={saveAccommodationFacility} disabled={disabled || loadingAccommodationFacility || savingAccommodationFacility} className={saveButtonClass('flexibilidadeAcomodacao')}>{savingAccommodationFacility ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'flexibilidadeAcomodacao' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingAccommodationFacility ? 'Salvando...' : savedSection === 'flexibilidadeAcomodacao' ? 'Salvo com sucesso' : 'Salvar Flexibilidade'}</span></button></div>
                </div>
              )}
            </div>
          )}

          {/* 17. ADIÇÃO */}
          {isSectionEnabled('adicao') && (
            <div data-clinical-section="adicao" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('adicao')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['adicao'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>17. Adição</span>
                </div>
                {openSections['adicao'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['adicao'] && (
                <div className="p-5 space-y-3 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <div className="divide-y divide-slate-200">
                    {['od', 'oe'].map((eye) => (
                      <div key={eye} className="grid grid-cols-1 sm:grid-cols-[72px_minmax(0,1fr)_72px_minmax(0,1fr)] items-center gap-3 py-2.5">
                        <span className="px-2 font-semibold text-slate-700 uppercase">{eye}</span>
                        <input type="text" value={anamneseData.adicao[eye].valor} onChange={(event) => updateClinicalEyeField('adicao', eye, 'valor', event.target.value)} className="clinical-input text-center font-mono font-bold h-9" />
                        <span className="font-semibold text-slate-700 text-center">AV</span>
                        <input type="text" value={anamneseData.adicao[eye].av} onChange={(event) => updateClinicalEyeField('adicao', eye, 'av', event.target.value)} className="clinical-input text-center font-mono font-bold h-9" />
                      </div>
                    ))}
                  </div>
                  <label className="block"><span className="block font-bold text-slate-700 mb-1">Observações</span><textarea rows={2} value={anamneseData.adicao.observacoes} onChange={(event) => updateClinicalSectionField('adicao', 'observacoes', event.target.value)} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" /></label>
                  <div className="flex justify-end"><button type="button" onClick={saveAddition} disabled={disabled || loadingAddition || savingAddition} className={saveButtonClass('adicao')}>{savingAddition ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'adicao' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingAddition ? 'Salvando...' : savedSection === 'adicao' ? 'Salvo com sucesso' : 'Salvar Adição'}</span></button></div>
                </div>
              )}
            </div>
          )}

          {/* 18. PPC */}
          {isSectionEnabled('ppc') && (
            <div data-clinical-section="ppc" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('ppc')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['ppc'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>18. PPC (Ponto Próximo de Convergência)</span>
                </div>
                {openSections['ppc'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['ppc'] && (
                <div className="p-5 space-y-4 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-hairline my-2"><table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200/80">
                          <th className="py-2.5 px-3 w-40 font-bold text-slate-500"></th>
                          <th className="py-2.5 px-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">
                            S/C
                          </th>
                          <th className="py-2.5 px-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">
                            C/C
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { label: 'Objeto Real (OR)', key: 'objetoReal' },
                          { label: 'Luz Pontual', key: 'luzPontual' },
                          { label: 'Filtro Vermelho', key: 'filtroVermelho' }
                        ].map(row => (
                          <tr key={row.label} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-semibold text-slate-700 align-middle">
                              {row.label}
                            </td>
                            <td className="py-1.5 px-3 w-1/2">
                              <input
                                type="text"
                                value={anamneseData.ppc[row.key].semCorrecao}
                                onChange={(event) => updateClinicalEyeField('ppc', row.key, 'semCorrecao', event.target.value)}
                                className="clinical-input h-9 font-medium"
                              />
                            </td>
                            <td className="py-1.5 px-3 w-1/2">
                              <input
                                type="text"
                                value={anamneseData.ppc[row.key].comCorrecao}
                                onChange={(event) => updateClinicalEyeField('ppc', row.key, 'comCorrecao', event.target.value)}
                                className="clinical-input h-9 font-medium"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <label className="block"><span className="block font-bold text-slate-700 mb-1">Observações</span><textarea rows={2} value={anamneseData.ppc.observacoes} onChange={(event) => updateClinicalSectionField('ppc', 'observacoes', event.target.value)} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" /></label>
                  <div className="flex justify-end"><button type="button" onClick={savePpc} disabled={disabled || loadingPpc || savingPpc} className={saveButtonClass('ppc')}>{savingPpc ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'ppc' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingPpc ? 'Salvando...' : savedSection === 'ppc' ? 'Salvo com sucesso' : 'Salvar PPC'}</span></button></div>
                </div>
              )}
            </div>
          )}

          {/* 19. REFLEXOS PUPILARES */}
          {isSectionEnabled('reflexosPupilares') && (
            <div data-clinical-section="reflexosPupilares" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('reflexosPupilares')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['reflexosPupilares'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>19. Reflexos Pupilares</span>
                </div>
                {openSections['reflexosPupilares'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['reflexosPupilares'] && (
                <div className="p-5 space-y-4 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-hairline my-2"><table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200/80">
                          <th className="py-2.5 px-3 w-40 font-bold text-slate-500"></th>
                          <th className="py-2.5 px-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">
                            OD
                          </th>
                          <th className="py-2.5 px-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">
                            OE
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { id: 'fotomotor', label: 'Fotomotor' },
                          { id: 'consensual', label: 'Consensual' },
                          { id: 'acomodativo', label: 'Acomodativo' }
                        ].map(row => (
                          <tr key={row.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-semibold text-slate-700 align-middle">
                              {row.label}
                            </td>
                            <td className="py-1.5 px-3 w-1/2">
                              <input
                                type="text"
                                value={anamneseData.reflexosPupilares.od[row.id] || ''}
                                onChange={(event) => updateClinicalEyeField('reflexosPupilares', 'od', row.id, event.target.value)}
                                className="clinical-input h-9 font-medium"
                              />
                            </td>
                            <td className="py-1.5 px-3 w-1/2">
                              <input
                                type="text"
                                value={anamneseData.reflexosPupilares.oe[row.id] || ''}
                                onChange={(event) => updateClinicalEyeField('reflexosPupilares', 'oe', row.id, event.target.value)}
                                className="clinical-input h-9 font-medium"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <label className="block"><span className="block font-bold text-slate-700 mb-1">Observações</span><textarea rows={2} value={anamneseData.reflexosPupilares.observacoes} onChange={(event) => updateClinicalSectionField('reflexosPupilares', 'observacoes', event.target.value)} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" /></label>
                  <div className="flex justify-end"><button type="button" onClick={savePupillaryReflexes} disabled={disabled || loadingPupillaryReflexes || savingPupillaryReflexes} className={saveButtonClass('reflexosPupilares')}>{savingPupillaryReflexes ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'reflexosPupilares' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingPupillaryReflexes ? 'Salvando...' : savedSection === 'reflexosPupilares' ? 'Salvo com sucesso' : 'Salvar Reflexos'}</span></button></div>
                </div>
              )}
            </div>
          )}

          {/* 20. RESERVAS FUSIONAIS */}
          {isSectionEnabled('reservasFusionais') && (
            <div data-clinical-section="reservasFusionais" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('reservasFusionais')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['reservasFusionais'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>20. Reservas Fusionais</span>
                </div>
                {openSections['reservasFusionais'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['reservasFusionais'] && (
                <div className="p-5 space-y-4 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  {/* Linha Superior Técnica */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="font-semibold text-slate-700 sm:w-28 shrink-0 text-xs">
                      Técnica
                    </label>
                    <input 
                      type="text" 
                      value={anamneseData.reservasFusionais.tecnica} 
                      onChange={(event) => updateClinicalSectionField('reservasFusionais', 'tecnica', event.target.value)}
                      className="clinical-input h-9 font-medium" 
                    />
                  </div>

                  <div className="overflow-x-auto pt-2 border-t border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200/80">
                          <th className="py-2.5 px-3 w-40 font-bold text-slate-500"></th>
                          <th className="py-2.5 px-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">
                            VL (Visão Longe)
                          </th>
                          <th className="py-2.5 px-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">
                            VP (Visão Perto)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { label: 'RFN (Reserva Fusional Negativa)', key: 'rfn' },
                          { label: 'RFP (Reserva Fusional Positiva)', key: 'rfp' }
                        ].map(row => (
                          <tr key={row.label} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-semibold text-slate-700 align-middle">
                              {row.label}
                            </td>
                            <td className="py-1.5 px-3 w-1/2">
                              <input
                                type="text"
                                value={anamneseData.reservasFusionais[row.key].vl}
                                onChange={(event) => updateClinicalEyeField('reservasFusionais', row.key, 'vl', event.target.value)}
                                className="clinical-input h-9 font-medium"
                              />
                            </td>
                            <td className="py-1.5 px-3 w-1/2">
                              <input
                                type="text"
                                value={anamneseData.reservasFusionais[row.key].vp}
                                onChange={(event) => updateClinicalEyeField('reservasFusionais', row.key, 'vp', event.target.value)}
                                className="clinical-input h-9 font-medium"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <label className="block"><span className="block font-bold text-slate-700 mb-1">Observações</span><textarea rows={2} value={anamneseData.reservasFusionais.observacoes} onChange={(event) => updateClinicalSectionField('reservasFusionais', 'observacoes', event.target.value)} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" /></label>
                  <div className="flex justify-end"><button type="button" onClick={saveFusionalReserves} disabled={disabled || loadingFusionalReserves || savingFusionalReserves} className={saveButtonClass('reservasFusionais')}>{savingFusionalReserves ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'reservasFusionais' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingFusionalReserves ? 'Salvando...' : savedSection === 'reservasFusionais' ? 'Salvo com sucesso' : 'Salvar Reservas'}</span></button></div>
                </div>
              )}
            </div>
          )}

          {/* 21. SUBJETIVO */}
          {isSectionEnabled('subjetivo') && (
            <div data-clinical-section="subjetivo" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('subjetivo')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['subjetivo'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>21. Subjetivo</span>
                </div>
                {openSections['subjetivo'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['subjetivo'] && (
                <div className="p-5 space-y-4 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-hairline my-2"><table className="w-full min-w-[680px] text-left border-collapse">
                      <thead><tr className="border-b border-slate-200/80"><th className="py-2 px-3 w-16"></th>{[['esferico', 'Esférico'], ['cilindrico', 'Cilíndrico'], ['eixo', 'Eixo'], ['av', 'AV']].map(([, label]) => <th key={label} className="py-2 px-3 text-center font-bold text-slate-700 uppercase">{label}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-200">
                        {['od', 'oe'].map((eye) => (
                          <tr key={eye}>
                            <td className="py-2 px-3 font-bold text-slate-700 uppercase">{eye}</td>
                            {['esferico', 'cilindrico', 'eixo', 'av'].map((field) => (
                              <td key={field} className="py-1.5 px-2"><input type={field === 'eixo' ? 'number' : 'text'} min={field === 'eixo' ? 0 : undefined} max={field === 'eixo' ? 180 : undefined} value={anamneseData.subjetivo[eye][field]} onChange={(event) => updateClinicalEyeField('subjetivo', eye, field, event.target.value)} className="clinical-input text-center font-mono font-bold h-9" /></td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <label className="block"><span className="block font-bold text-slate-700 mb-1">Observações</span><textarea rows={2} value={anamneseData.subjetivo.observacoes} onChange={(event) => updateClinicalSectionField('subjetivo', 'observacoes', event.target.value)} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" /></label>
                  <div className="flex justify-end"><button type="button" onClick={saveSubjective} disabled={disabled || loadingSubjective || savingSubjective} className={saveButtonClass('subjetivo')}>{savingSubjective ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'subjetivo' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingSubjective ? 'Salvando...' : savedSection === 'subjetivo' ? 'Salvo com sucesso' : 'Salvar Subjetivo'}</span></button></div>
                </div>
              )}
            </div>
          )}

          {/* 22. TESTE AMBULATORIAL */}
          {isSectionEnabled('testeAmbulatorial') && (
            <div data-clinical-section="testeAmbulatorial" className="border border-slate-200/90 rounded-2xl bg-white shadow-hairline overflow-hidden transition-all">
              <button
                onClick={() => toggleSection('testeAmbulatorial')}
                className="w-full p-3.5 flex items-center justify-between bg-slate-50 hover:bg-forest-50/50 text-left transition-colors font-extrabold text-xs uppercase text-slate-900"
              >
                <div className="flex items-center space-x-2">
                  {openSections['testeAmbulatorial'] ? <ChevronDown className="w-4 h-4 text-forest-700" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span>22. Teste Ambulatorial</span>
                </div>
                {openSections['testeAmbulatorial'] ? (
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200/80 uppercase">
                    Aberto
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Abrir
                  </span>
                )}
              </button>

              {openSections['testeAmbulatorial'] && (
                <div className="p-5 space-y-4 text-xs border-t border-slate-200 animate-fade-in bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-[220px_minmax(0,1fr)] gap-3">
                    <label className="block"><span className="block font-bold text-slate-700 mb-1">Tempo de Teste (minutos)</span><input type="number" min="0" value={anamneseData.testeAmbulatorial.tempoMinutos} onChange={(event) => updateClinicalSectionField('testeAmbulatorial', 'tempoMinutos', event.target.value)} className="clinical-input h-9 font-medium" /></label>
                    <label className="block"><span className="block font-bold text-slate-700 mb-1">Resultado e Tolerância</span><textarea rows={2} value={anamneseData.testeAmbulatorial.resultado} onChange={(event) => updateClinicalSectionField('testeAmbulatorial', 'resultado', event.target.value)} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" /></label>
                  </div>
                  <label className="block"><span className="block font-bold text-slate-700 mb-1">Observações</span><textarea rows={2} value={anamneseData.testeAmbulatorial.observacoes} onChange={(event) => updateClinicalSectionField('testeAmbulatorial', 'observacoes', event.target.value)} className="clinical-input h-auto min-h-20 py-2 text-xs font-medium resize-y" /></label>
                  <div className="flex justify-end"><button type="button" onClick={saveAmbulatoryTest} disabled={disabled || loadingAmbulatoryTest || savingAmbulatoryTest} className={saveButtonClass('testeAmbulatorial')}>{savingAmbulatoryTest ? <Clock className="w-3.5 h-3.5 animate-spin" /> : savedSection === 'testeAmbulatorial' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}<span>{savingAmbulatoryTest ? 'Salvando...' : savedSection === 'testeAmbulatorial' ? 'Salvo com sucesso' : 'Salvar Teste'}</span></button></div>
                </div>
              )}
            </div>
          )}

        </fieldset>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: HISTÓRICO DE FICHA CLÍNICA (LAYOUT DA IMAGEM 1)                */}
      {/* ========================================================================= */}
      {subTab === 'historico' && (
        <div className="space-y-4 pt-2">
          <h4 className="font-extrabold text-slate-700 text-sm uppercase tracking-wide">
            HISTÓRICO DE FICHA CLÍNICA
          </h4>

          <div className="border border-slate-200 overflow-x-auto bg-white">
            {previousSheetsError && <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">{previousSheetsError}</div>}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 font-bold text-slate-700 bg-slate-50/70 text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Título</th>
                  <th className="py-3 px-4">Cadastrado por</th>
                  <th className="py-3 px-4">Data Cadastro</th>
                  <th className="py-3 px-4 text-right">Opções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {previousSheets.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">#{row.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{row.procedure || 'Ficha Clínica & Anamnese'}</td>
                    <td className="py-3.5 px-4 text-slate-700">{row.doctor}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono">{row.date ? `${row.date.toLocaleDateString('pt-BR')} ${row.time}` : 'Data não informada'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        type="button"
                        onClick={() => navigate(`/consultas/${row.id}`, { state: { returnTo: `/consultas/${consultation.id}` } })}
                        className="px-3 py-1 bg-[#17A589] hover:bg-[#149177] text-white font-bold text-xs rounded-sm uppercase transition-colors"
                      >
                        Visualizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loadingPreviousSheets && <div className="py-10 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500"><Clock className="w-4 h-4 animate-spin text-forest-700" />Carregando fichas anteriores...</div>}
            {!loadingPreviousSheets && !previousSheetsError && previousSheets.length === 0 && <div className="py-10 text-center text-xs text-slate-500">Nenhuma ficha anterior encontrada para este paciente.</div>}
          </div>
        </div>
      )}

    </div>
  );
}
