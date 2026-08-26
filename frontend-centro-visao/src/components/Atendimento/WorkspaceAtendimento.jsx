import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Check,
  ClipboardList,
  Disc,
  FileText,
  Glasses,
  Loader2,
  Lock,
  MapPin,
  Paperclip,
  Stethoscope,
  User,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  finalizarConsulta,
  listarConsultas,
  obterConsulta,
} from '../../api/consultas';
import { adaptConsultation, isConsultationFinished } from '../../domain/consultas';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../constants/permissions';
import ConsultasListView from './components/ConsultasListView';
import AnamneseFichaClinica from './AnamneseFichaClinica';
import PrescricaoOculosTab from './components/PrescricaoOculosTab';
import DocumentosAtestadosTab from './components/DocumentosAtestadosTab';
import AnexosConsultaTab from './components/AnexosConsultaTab';
import RetornoConsultaModal from './components/RetornoConsultaModal';
import ToastNotification from '../Common/ToastNotification';

const WORKSPACE_TABS = [
  { id: 'ficha', label: 'Anamnese & Ficha Clínica', icon: ClipboardList, available: true },
  { id: 'oculos', label: 'Prescrição Óculos', icon: Glasses, available: true },
  { id: 'lentes', label: 'Lentes de Contato', icon: Disc, available: false },
  { id: 'documentos', label: 'Atestados & Laudos', icon: FileText, available: true },
  { id: 'anexos', label: 'Anexos & Exames', icon: Paperclip, available: true },
];

function getErrorMessage(error) {
  return error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || 'Não foi possível carregar a consulta.';
}

function formatDate(date) {
  return date ? date.toLocaleDateString('pt-BR') : 'Data não informada';
}

export default function WorkspaceAtendimento() {
  const navigate = useNavigate();
  const location = useLocation();
  const { consultationId } = useParams();
  const { can } = useAuth();
  const canViewClinical = can(PERMISSIONS.CLINICAL_VIEW);
  const canEditClinical = can(PERMISSIONS.CLINICAL_EDIT);
  const [consultationsList, setConsultationsList] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [filterTab, setFilterTab] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('ficha');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  const handleNotify = useCallback((type, message) => {
    setToast({ type, message });
  }, []);

  const loadList = useCallback(async (signal) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const items = await listarConsultas({ signal });
      setConsultationsList(items.map(adaptConsultation).filter(Boolean));
    } catch (error) {
      if (error?.code !== 'ERR_CANCELED') {
        setConsultationsList([]);
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id, signal) => {
    setLoading(true);
    setErrorMessage('');
    setSelectedConsultation(null);
    try {
      const detail = adaptConsultation(await obterConsulta(id, { signal }));
      if (!detail) throw new Error('Consulta não encontrada.');
      setSelectedConsultation(detail);
    } catch (error) {
      if (error?.code !== 'ERR_CANCELED') setErrorMessage(getErrorMessage(error));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (consultationId) loadDetail(consultationId, controller.signal);
    else loadList(controller.signal);
    return () => controller.abort();
  }, [consultationId, loadDetail, loadList, refreshKey]);

  const handleFinish = async () => {
    if (!selectedConsultation || !canEditClinical || saving) return;
    setShowReturnModal(true);
  };

  const handleConfirmFinish = async (returnPlan) => {
    if (!selectedConsultation || !canEditClinical || saving) return;
    setSaving(true);
    try {
      await finalizarConsulta(selectedConsultation.id, returnPlan);
      setShowReturnModal(false);
      setToast({ type: 'success', message: `Consulta #${selectedConsultation.id} finalizada.` });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setToast({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  if (!consultationId) {
    return (
      <ConsultasListView
        consultationsList={consultationsList}
        filterTab={filterTab}
        setFilterTab={setFilterTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenConsultation={(consultation) => navigate(`/consultas/${consultation.id}`)}
        onRefresh={() => setRefreshKey((value) => value + 1)}
        loading={loading}
        errorMessage={errorMessage}
        canOpenClinical={canViewClinical}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-64 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 shadow-sm">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
        <span>Carregando atendimento clínico...</span>
      </div>
    );
  }

  if (errorMessage || !selectedConsultation) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-xs text-rose-900 shadow-xs">
        <div className="flex items-start gap-2.5 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage || 'Consulta não encontrada.'}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate(location.state?.returnTo || '/consultas')}
          className="mt-4 px-4 py-2 bg-white hover:bg-slate-50 border border-rose-200 rounded-xl font-bold text-xs text-rose-900 transition-colors"
        >
          Voltar às consultas
        </button>
      </div>
    );
  }

  const finished = isConsultationFinished(selectedConsultation.statusCode);
  const inAttendance = selectedConsultation.statusCode === 'em_atendimento';
  const readOnly = (!inAttendance && !finished) || !canEditClinical;
  const canFinish = inAttendance && canEditClinical;

  return (
    <div className="space-y-4 animate-fade-in pb-12 text-xs">
      <div className="clinical-panel p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate(location.state?.returnTo || '/consultas')}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 transition-colors"
            title="Voltar às consultas"
            aria-label="Voltar às consultas"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                #{selectedConsultation.id}
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight break-words">
                {selectedConsultation.patientName}
              </h2>
              <span className={finished ? 'badge-finished' : 'badge-waiting'}>
                {selectedConsultation.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
              <span>{selectedConsultation.procedure}</span>
              <span>•</span>
              <span className="text-slate-700 font-semibold">{selectedConsultation.doctor}</span>
              <span>•</span>
              <span className="font-mono">{formatDate(selectedConsultation.date)} às {selectedConsultation.time}</span>
            </div>
          </div>
        </div>

        {canFinish && (
          <button
            type="button"
            onClick={handleFinish}
            disabled={saving}
            className="h-10 btn-primary px-4 self-start lg:self-auto"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Concluir Atendimento</span>
          </button>
        )}
      </div>

      <section className="clinical-panel overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-forest-700" />
          <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Identificação do Paciente</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-xs">
          <div className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nascimento</span>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{formatDate(selectedConsultation.patientBirthDate)}</p>
          </div>
          <div className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />Cidade
            </span>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedConsultation.patientCity || 'Não informada'}</p>
          </div>
          <div className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-slate-400" />Ocupação
            </span>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedConsultation.patientOccupation || 'Não informada'}</p>
          </div>
          <div className="p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sexo / Gênero</span>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedConsultation.patientSex || 'Não informado'}</p>
          </div>
        </div>
      </section>

      {canViewClinical && (
        <>
          <div className="clinical-panel p-1 flex gap-1 overflow-x-auto">
            {WORKSPACE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeWorkspaceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => tab.available && setActiveWorkspaceTab(tab.id)}
                  disabled={!tab.available}
                  title={tab.available ? tab.label : `${tab.label} indisponível`}
                  className={`py-2 px-3.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-forest-700 text-white shadow-hairline'
                      : tab.available
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-300 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {!tab.available && <Lock className="w-3 h-3 ml-1" />}
                </button>
              );
            })}
          </div>

          {activeWorkspaceTab === 'ficha' && (
            <AnamneseFichaClinica
              patient={{
                id: selectedConsultation.patientId,
                name: selectedConsultation.patientName,
                birthDate: selectedConsultation.patientBirthDate,
                city: selectedConsultation.patientCity,
              }}
              consultation={selectedConsultation}
              disabled={readOnly}
              onNotify={handleNotify}
            />
          )}

          {activeWorkspaceTab === 'oculos' && (
            <PrescricaoOculosTab
              consultation={selectedConsultation}
              disabled={readOnly}
              onNotify={handleNotify}
            />
          )}

          {activeWorkspaceTab === 'documentos' && (
            <DocumentosAtestadosTab
              consultation={selectedConsultation}
              disabled={readOnly}
              onNotify={handleNotify}
            />
          )}

          {activeWorkspaceTab === 'anexos' && (
            <AnexosConsultaTab
              consultation={selectedConsultation}
              disabled={readOnly}
              onNotify={handleNotify}
            />
          )}
        </>
      )}

      {!canViewClinical && (
        <div className="clinical-panel px-5 py-4 flex items-center gap-2.5 text-xs text-slate-600">
          <Stethoscope className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">Conteúdo clínico restrito ao Optometrista e Administrador.</span>
        </div>
      )}

      <RetornoConsultaModal
        open={showReturnModal}
        consultation={selectedConsultation}
        saving={saving}
        onClose={() => setShowReturnModal(false)}
        onConfirm={handleConfirmFinish}
      />

      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
