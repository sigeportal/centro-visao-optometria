import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  X, 
  User, 
  Phone, 
  Building2, 
  DollarSign, 
  MessageSquare, 
  Files, 
  Clock, 
  CheckCircle2, 
  Check, 
  Ban, 
  Info,
  Stethoscope,
  Pencil,
} from 'lucide-react';
import { calculateEndTime } from '../../../utils/timeUtils';
import { formatDate, formatPhone } from '../../../utils/formatters';
import { getAllowedStatusTransitions, STATUS_OPTIONS } from '../../../domain/agenda';

export default function AppointmentQuickDetailsModal({
  appointment,
  onClose,
  onUpdateStatus,
  onLaunchPayment,
  onStartAttendance,
  onEdit,
  saving = false,
  readOnly = false,
}) {
  const [currentStatusCode, setCurrentStatusCode] = useState('agendada');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (appointment?.statusCode) {
      setCurrentStatusCode(appointment.statusCode);
      setActionError('');
    }
  }, [appointment]);

  if (!appointment) return null;

  const handleStatusClick = async (statusCode) => {
    if (readOnly || saving || !onUpdateStatus) return;
    setActionError('');
    try {
      await onUpdateStatus(appointment.id, statusCode);
      setCurrentStatusCode(statusCode);
    } catch (error) {
      setActionError(
        error?.response?.data?.error?.message
          || error?.response?.data?.message
          || error?.message
          || 'Não foi possível atualizar o status.',
      );
    }
  };

  // Formatting values
  const patientName = appointment.patient || appointment.name || 'Paciente não informado';
  const initial = patientName.trim().charAt(0).toUpperCase();
  const phone = appointment.phone ? formatPhone(appointment.phone) : '';
  const cleanPhone = phone.replace(/\D/g, '');
  const age = appointment.age ?? null;
  const birthDate = appointment.birthDate ? formatDate(appointment.birthDate) : '';
  const patientDetails = [age !== null ? `${age} anos` : null, birthDate || null].filter(Boolean).join(' • ');
  
  const formattedDate = appointment.date ? formatDate(appointment.date) : 'Data não informada';
  const startTime = appointment.startTime || '--:--';
  const endTime = appointment.endTime || calculateEndTime(startTime, appointment.duration || 30);
  const doctor = appointment.doctor || 'Profissional não informado';
  const procedure = appointment.procedure || 'Procedimento não informado';
  const partnership = appointment.partnership || 'Não informada';
  const paymentStatus = appointment.paymentStatus || 'Não informado';
  const observations = appointment.observations || appointment.notes || '—';
  const auditText = appointment.createdAtText || (appointment.createdAt
    ? `Agendamento criado em ${appointment.createdAt.toLocaleString('pt-BR')}`
    : 'Informações de criação não disponíveis.');

  const allowedTransitions = getAllowedStatusTransitions(currentStatusCode);
  const statusIcons = {
    agendada: CalendarIcon,
    confirmada: CheckCircle2,
    fila_espera: Clock,
    em_atendimento: Stethoscope,
    realizada: Check,
    faltou: X,
    cancelada: Ban,
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-2xl border border-slate-200/90 w-full max-w-2xl shadow-modal flex flex-col max-h-[90vh] my-auto animate-fade-in text-xs overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#022b22] to-[#033b2e] text-white p-4 sm:p-5 flex items-center justify-between border-b border-forest-700/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center text-amber-400 font-bold shadow-hairline">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">
                Detalhes do Agendamento
              </h3>
              <p className="text-[11px] text-forest-200/80">
                Consulte os dados registrados para este atendimento
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-forest-200/70 hover:text-white transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Patient Top Bar */}
          <div className="border border-slate-200/80 p-3.5 rounded-xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-1 text-slate-400 font-bold text-[9.5px] uppercase tracking-wider">
                <User className="w-3 h-3 text-forest-700" />
                <span>Paciente</span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 tracking-tight mt-0.5">
                {patientName}
              </h4>
              {patientDetails && (
                <div className="flex items-center space-x-1.5 text-slate-500 font-medium text-[11px] mt-0.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{patientDetails}</span>
                </div>
              )}
            </div>

            {phone && (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block w-px h-8 bg-slate-200" />
                <div className="flex flex-col items-start sm:items-end">
                  <a
                    href={`https://wa.me/55${cleanPhone}?text=Olá ${encodeURIComponent(patientName)}, tudo bem? Entramos em contato do Centro Visão.`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-forest-700 hover:bg-forest-800 text-white px-3 py-1.5 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-hairline transition-colors"
                  >
                    <Phone className="w-3 h-3 fill-current" />
                    <span>{phone}</span>
                  </a>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                    WhatsApp direto
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2-Column Details Box */}
          <div className="border border-slate-200/80 p-4 sm:p-5 rounded-xl bg-white shadow-hairline grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 gap-4 md:gap-6">
            
            {/* Left Column */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-forest-50 text-forest-700 border border-forest-200/60 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Agendado para
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {formattedDate} das {startTime} às {endTime}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Profissional
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {doctor}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  <Files className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Procedimento
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {procedure}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3 pt-3 md:pt-0 md:pl-6">
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Parceria / Convênio
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {partnership}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Situação do Pagamento
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {paymentStatus}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Observações
                  </span>
                  <span className="font-medium text-slate-700 text-xs">
                    {observations}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Status Box */}
          <div className="border border-slate-200/80 p-4 rounded-xl bg-white shadow-hairline space-y-2.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700 block">
              Status do Agendamento
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUS_OPTIONS.map((option) => {
                const Icon = statusIcons[option.code] || CalendarIcon;
                const isSelected = currentStatusCode === option.code;
                const isAllowed = allowedTransitions.includes(option.code);
                const isDisabled = readOnly || saving || isSelected || !isAllowed;

                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => handleStatusClick(option.code)}
                    disabled={isDisabled}
                    className={`py-2 px-2 text-center text-xs leading-tight rounded-xl flex items-center justify-center space-x-1.5 transition-all font-bold ${
                      isSelected
                        ? 'bg-forest-700 text-white shadow-hairline'
                        : isDisabled
                          ? 'bg-slate-50 text-slate-400 border border-slate-200/60 cursor-default opacity-40'
                          : 'bg-white text-slate-700 border border-slate-200/90 hover:border-forest-400 hover:bg-forest-50/50 hover:text-forest-900 cursor-pointer'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>

            {actionError && (
              <div className="border border-rose-200 bg-rose-50 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-800" role="alert">
                {actionError}
              </div>
            )}

            <div className="flex items-center space-x-1.5 text-[10.5px] text-slate-400 font-medium pt-1">
              <Info className="w-3.5 h-3.5 text-forest-700 shrink-0" />
              <span className="truncate">{auditText}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between">
          {!readOnly && onStartAttendance && (
            <button
              type="button"
              onClick={() => {
                if (onStartAttendance) onStartAttendance();
              }}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Stethoscope className="w-3.5 h-3.5" />}
              <span>{saving ? 'Iniciando...' : 'Iniciar atendimento'}</span>
            </button>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            {!readOnly && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(appointment)}
                disabled={saving}
                className="btn-accent"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}

            {!readOnly && onLaunchPayment && (
              <button
                type="button"
                onClick={() => {
                  if (onLaunchPayment) {
                    onLaunchPayment(appointment);
                  }
                }}
                className="btn-secondary"
              >
                <DollarSign className="w-3.5 h-3.5 text-slate-600" />
                <span>Lançar pagamento</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}

