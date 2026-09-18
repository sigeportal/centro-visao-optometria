import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle,
  User, 
  DollarSign, 
  Lock,
  ArrowLeft, 
  Phone, 
  MapPin, 
  Calendar,
  CalendarClock,
  Loader2,
  ClipboardList,
  Files,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { formatCPF, formatPhone } from '../../utils/formatters';
import { atualizarPaciente, obterPaciente } from '../../api/pacientes';
import {
  criarAgendamento,
  listarProfissionais,
  listarProcedimentosAgenda,
  listarParceriasAgenda,
} from '../../api/agenda';
import { adaptPatient, calculateAge, patientPayload } from '../../domain/pacientes';

import DadosPessoaisTab from './components/DadosPessoaisTab';
import HistoricoConsultasTab from './components/HistoricoConsultasTab';
import RetornosPacienteTab from './components/RetornosPacienteTab';
import AnamnesesPacienteTab from './components/AnamnesesPacienteTab';
import DocumentosPacienteTab from './components/DocumentosPacienteTab';
import NovoAgendamentoModal from '../Agenda/NovoAgendamentoModal';
import ToastNotification from '../Common/ToastNotification';

const EMPTY_FORM = {
  name: '', socialName: '', phone: '', phone2: '', email: '', gender: '', cpf: '', rg: '',
  birthDate: '', age: null, occupation: '', registrationDate: '', origin: '', address: '',
  complement: '', city: '', state: '', cep: '', responsibleName: '', responsibleCpf: '', photo: '',
};

export default function PacienteHistoricoView({ 
  patient: initialPatient,
  initialTab = 'pessoais', 
  setActiveModule, 
  onSavePatient 
}) {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(initialPatient?.id === patientId ? initialPatient : null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [patientError, setPatientError] = useState('');

  const [professionals, setProfessionals] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [partnerships, setPartnerships] = useState([]);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      listarProfissionais({ signal: controller.signal }),
      listarProcedimentosAgenda({ signal: controller.signal }),
      listarParceriasAgenda({ signal: controller.signal }),
    ])
      .then(([profData, procData, partData]) => {
        if (!controller.signal.aborted) {
          setProfessionals((profData || []).map((p) => ({
            id: String(p.id),
            name: p.name || p.nome || 'Profissional sem nome',
          })));
          setProcedures(Array.isArray(procData) ? procData : []);
          setPartnerships(Array.isArray(partData) ? partData : []);
        }
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') {
          // Silencioso em caso de erro secundário
        }
      });
    return () => controller.abort();
  }, []);

  const handleSaveAppointment = async (payload) => {
    try {
      await criarAgendamento(payload);
      setIsAppointmentModalOpen(false);
      showToast(`Agendamento cadastrado com sucesso para ${patient.name}!`);
    } catch (error) {
      const message = error?.response?.data?.error?.message
        || error?.response?.data?.message
        || error?.message
        || 'Não foi possível cadastrar o agendamento.';
      showToast(message, 'error');
      throw error;
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Form State: Cadastro
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingPatient(true);
    setPatientError('');
    obterPaciente(patientId, { signal: controller.signal })
      .then((data) => {
        const loadedPatient = adaptPatient(data);
        if (!loadedPatient) throw new Error('Paciente não encontrado.');
        setPatient(loadedPatient);
        onSavePatient?.(loadedPatient, { silent: true });
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') setPatientError(error?.response?.data?.error?.message || error?.message || 'Não foi possível carregar o paciente.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingPatient(false); });
    return () => controller.abort();
  }, [patientId, onSavePatient]);

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        socialName: patient.socialName || '',
        phone: patient.phone || '',
        phone2: patient.phone2 || '',
        email: patient.email || '',
        gender: patient.gender || '',
        cpf: patient.cpf || '',
        rg: patient.rg || '', birthDate: patient.birthDate || '', age: patient.age,
        occupation: patient.occupation || '', registrationDate: patient.registrationDate || '',
        origin: patient.origin || '', address: patient.address || '', complement: patient.complement || '',
        city: patient.city || '', state: patient.state || '', cep: patient.cep || '',
        responsibleName: patient.responsibleName || '', responsibleCpf: patient.responsibleCpf || '', photo: patient.photo || '',
      });
    }
  }, [patient]);

  const handleSaveCadastro = async () => {
    try {
      await atualizarPaciente(patient.id, patientPayload(formData));
      const updatedPatient = { ...patient, ...formData };
      setPatient(updatedPatient);
      onSavePatient?.(updatedPatient);
      setIsEditing(false);
      showToast('Dados cadastrais do paciente atualizados!');
    } catch (error) {
      showToast(error?.response?.data?.error?.message || error?.message || 'Não foi possível atualizar o paciente.', 'error');
    }
  };

  const navTabs = [
    { id: 'pessoais', label: 'Dados Pessoais', icon: User },
    { id: 'anamnese', label: 'Anamnese', icon: ClipboardList },
    { id: 'consultas', label: 'Consultas', icon: Calendar },
    { id: 'retornos', label: 'Retornos', icon: CalendarClock },
    { id: 'documentos', label: 'Documentos', icon: Files },
    { id: 'financeiro', label: 'Financeiro do Paciente', icon: DollarSign, available: false }
  ];

  if (loadingPatient) return (
    <div className="min-h-56 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-center gap-2.5 text-xs font-semibold text-slate-600 shadow-sm">
      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
      <span>Carregando dados do paciente...</span>
    </div>
  );

  if (patientError || !patient) return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-xs text-rose-900 shadow-xs">
      <div className="flex items-start gap-2.5 font-semibold">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
        <span>{patientError || 'Paciente não encontrado.'}</span>
      </div>
      <button
        type="button"
        onClick={() => setActiveModule('pacientes')}
        className="mt-4 px-4 py-2 bg-white hover:bg-slate-50 border border-rose-200 rounded-xl font-bold text-xs text-rose-900 transition-colors"
      >
        Voltar para a lista de pacientes
      </button>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in pb-12 text-xs">
      
      {/* Top Patient ID Header */}
      <div className="clinical-panel p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            type="button"
            onClick={() => setActiveModule('pacientes')}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
            title="Voltar para a Lista de Pacientes"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {patient?.name || 'Paciente'}
              </h2>
              <span className="font-mono text-[10.5px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 font-bold">
                CPF: {formatCPF(patient?.cpf) || 'Não informado'}
              </span>
              {patient?.birthDate && calculateAge(patient.birthDate) !== null && (
                <span className="text-[10.5px] bg-forest-50 text-forest-800 px-2.5 py-0.5 rounded-md border border-forest-200/80 font-bold">
                  {calculateAge(patient.birthDate)} {calculateAge(patient.birthDate) === 1 ? 'ano' : 'anos'}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
              <div className="flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatPhone(patient?.phone) || 'Sem celular cadastrado'}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{patient?.city || 'Cidade não informada'}{patient?.state ? ` - ${patient.state}` : ''}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAppointmentModalOpen(true)}
          className="h-10 btn-primary px-4 self-start md:self-auto"
        >
          <Calendar className="w-4 h-4" aria-hidden="true" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="clinical-panel p-1 flex space-x-1 overflow-x-auto">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isAvailable = tab.available !== false;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => isAvailable && setActiveTab(tab.id)}
              disabled={!isAvailable}
              title={!isAvailable ? `${tab.label} indisponível` : tab.label}
              className={`py-2 px-3.5 text-xs font-bold rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-forest-700 text-white shadow-hairline'
                  : isAvailable
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-300 cursor-not-allowed opacity-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {!isAvailable && <Lock className="w-3 h-3 ml-1" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'pessoais' && (
        <DadosPessoaisTab
          formData={formData}
          setFormData={setFormData}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          onSave={handleSaveCadastro}
        />
      )}

      {activeTab === 'consultas' && (
        <HistoricoConsultasTab
          patient={patient}
        />
      )}

      {activeTab === 'retornos' && (
        <RetornosPacienteTab patient={patient} setActiveModule={setActiveModule} />
      )}

      {activeTab === 'anamnese' && (
        <AnamnesesPacienteTab patient={patient} onNotify={(type, message) => showToast(message, type)} />
      )}

      {activeTab === 'documentos' && (
        <DocumentosPacienteTab patient={patient} onNotify={(type, message) => showToast(message, type)} />
      )}

      {/* Toast */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {patient && (
        <NovoAgendamentoModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          initialData={{
            patientId: patient.id,
            patient: patient.name,
            phone: patient.phone,
            lockPatient: true,
          }}
          professionals={professionals}
          procedures={procedures}
          partnerships={partnerships}
          onSave={handleSaveAppointment}
        />
      )}

    </div>
  );
}
