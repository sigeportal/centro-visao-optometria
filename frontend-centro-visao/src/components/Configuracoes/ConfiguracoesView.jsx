import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  DollarSign, 
  CheckCircle2, 
  SlidersHorizontal, 
  FileSpreadsheet,
  ShieldCheck,
  Briefcase as BriefcaseBusiness,
} from 'lucide-react';
import { getStoredClinicalSections } from '../../data/clinicalSectionsConfig';
import { atualizarDadosClinica, obterDadosClinica } from '../../api/configuracoes';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../constants/permissions';

import FichaClinicaConfigTab from './components/FichaClinicaConfigTab';
import ParceriasTab from './components/ParceriasTab';
import DadosClinicaTab from './components/DadosClinicaTab';
import ProcedimentosPrecosTab from './components/ProcedimentosPrecosTab';
import UsuariosPermissoesTab from './components/UsuariosPermissoesTab';
import FuncionariosTab from './components/FuncionariosTab';
import ToastNotification from '../Common/ToastNotification';

export default function ConfiguracoesView() {
  const { can } = useAuth();
  const canAdminister = can(PERMISSIONS.SYSTEM_ADMIN);
  const [activeSubTab, setActiveSubTab] = useState('fichaClinica');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Clinic info state
  const [clinicData, setClinicData] = useState({ name: '', cnpj: '', phone: '', address: '', city: '', state: '', cep: '' });
  const [clinicLoading, setClinicLoading] = useState(false);
  const [clinicSaving, setClinicSaving] = useState(false);
  const [clinicError, setClinicError] = useState('');

  // Clinical sections state
  const [clinicalSections, setClinicalSections] = useState(() => getStoredClinicalSections());

  const [employeeForAccess, setEmployeeForAccess] = useState(null);

  const triggerSuccessToast = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  useEffect(() => {
    if (!canAdminister && activeSubTab !== 'fichaClinica') {
      setActiveSubTab('fichaClinica');
    }
  }, [activeSubTab, canAdminister]);

  useEffect(() => {
    if (!canAdminister) return undefined;
    const controller = new AbortController();
    setClinicLoading(true);
    setClinicError('');
    obterDadosClinica({ signal: controller.signal })
      .then((data) => setClinicData({
        name: data.nome || '', cnpj: data.cnpj || '', phone: data.telefone || '',
        address: data.endereco || '', city: data.cidade || '', state: data.estado || '', cep: data.cep || '',
      }))
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') setClinicError(error?.response?.data?.error?.message || error?.message || 'Não foi possível carregar os dados da clínica.');
      })
      .finally(() => { if (!controller.signal.aborted) setClinicLoading(false); });
    return () => controller.abort();
  }, [canAdminister]);

  const saveClinicData = async () => {
    setClinicSaving(true);
    setClinicError('');
    try {
      const data = await atualizarDadosClinica({
        nome: clinicData.name, cnpj: clinicData.cnpj, telefone: clinicData.phone,
        endereco: clinicData.address, cidade: clinicData.city, estado: clinicData.state, cep: clinicData.cep,
      });
      setClinicData({
        name: data.nome || '', cnpj: data.cnpj || '', phone: data.telefone || '',
        address: data.endereco || '', city: data.cidade || '', state: data.estado || '', cep: data.cep || '',
      });
      triggerSuccessToast();
    } catch (error) {
      setClinicError(error?.response?.data?.error?.message || error?.message || 'Não foi possível salvar os dados da clínica.');
    } finally {
      setClinicSaving(false);
    }
  };

  const navTabs = [
    { id: 'fichaClinica', label: 'Ficha Clínica', icon: FileSpreadsheet },
    ...(canAdminister ? [
      { id: 'parcerias', label: 'Parcerias', icon: Building2 },
      { id: 'clinica', label: 'Dados da Clínica', icon: SlidersHorizontal },
      { id: 'precos', label: 'Procedimentos & Preços', icon: DollarSign },
      { id: 'funcionarios', label: 'Funcionários', icon: BriefcaseBusiness },
      { id: 'usuarios', label: 'Usuários & Permissões', icon: ShieldCheck },
    ] : []),
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-12 text-xs">
      
      {/* Top Banner */}
      <div className="clinical-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-forest-800">
            Administração do Sistema
          </span>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            Configurações Gerais
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Gerencie regras da ficha clínica, parcerias, catálogo de preços e dados institucionais.
          </p>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="clinical-panel p-1 flex items-center space-x-1 overflow-x-auto">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`py-2 px-3.5 text-xs font-bold rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-forest-700 text-white shadow-hairline'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'fichaClinica' && (
        <FichaClinicaConfigTab
          clinicalSections={clinicalSections}
          setClinicalSections={setClinicalSections}
          onShowSuccess={triggerSuccessToast}
        />
      )}

      {activeSubTab === 'parcerias' && (
        <ParceriasTab onShowSuccess={triggerSuccessToast} />
      )}

      {activeSubTab === 'clinica' && (
        <DadosClinicaTab
          clinicData={clinicData}
          setClinicData={setClinicData}
          onSave={saveClinicData}
          loading={clinicLoading}
          saving={clinicSaving}
          errorMessage={clinicError}
        />
      )}

      {activeSubTab === 'precos' && (
        <ProcedimentosPrecosTab onShowSuccess={triggerSuccessToast} />
      )}

      {activeSubTab === 'funcionarios' && canAdminister && (
        <FuncionariosTab
          onShowSuccess={triggerSuccessToast}
          onCreateAccess={(employeeId) => {
            setEmployeeForAccess({ id: employeeId, requestId: Date.now() });
            setActiveSubTab('usuarios');
          }}
        />
      )}

      {activeSubTab === 'usuarios' && canAdminister && (
        <UsuariosPermissoesTab
          onShowSuccess={triggerSuccessToast}
          accessEmployeeRequest={employeeForAccess}
          onAccessRequestHandled={() => setEmployeeForAccess(null)}
        />
      )}

      {/* Floating Success Toast */}
      {savedSuccess && (
        <ToastNotification
          message="Configurações atualizadas com sucesso!"
          type="success"
          onClose={() => setSavedSuccess(false)}
        />
      )}

    </div>
  );
}
