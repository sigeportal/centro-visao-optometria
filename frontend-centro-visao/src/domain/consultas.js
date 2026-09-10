import { parseApiDateTime, toIsoDate } from './agenda';

const STATUS_LABELS = {
  em_atendimento: 'Em atendimento',
  realizada: 'Finalizada',
  atendida: 'Finalizada',
};

function formatTime(date) {
  if (!date) return '--:--';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function adaptConsultation(item) {
  if (!item?.id) return null;
  const date = parseApiDateTime(item.data);
  const statusCode = String(item.status || 'em_atendimento').trim().toLowerCase();
  return {
    id: String(item.id),
    patientId: item.paciente_id ? String(item.paciente_id) : null,
    patientName: item.paciente_nome || item.paciente || 'Paciente não informado',
    doctor: item.profissional || 'Profissional não informado',
    procedure: item.procedimento || 'Consulta',
    statusCode,
    status: STATUS_LABELS[statusCode] || item.status || 'Não informado',
    date,
    dateIso: date ? toIsoDate(date) : '',
    time: formatTime(date),
    finishedAt: parseApiDateTime(item.finalizada_em),
    appointmentId: item.agendamento_id ? String(item.agendamento_id) : null,
    origem: item.origem || item.origin || '',
    observacao: item.observacao || item.observacoes || '',
    patientBirthDate: parseApiDateTime(item.paciente_data_nascimento),
    patientSex: item.paciente_sexo || '',
    patientOccupation: item.paciente_ocupacao || '',
    patientCpf: item.paciente_cpf || '',
    patientRg: item.paciente_rg || '',
    patientResponsible: item.paciente_responsavel || '',
    patientAddress: item.paciente_endereco || '',
    patientAddressComplement: item.paciente_complemento || '',
    patientCity: item.paciente_cidade || '',
    patientState: item.paciente_estado || '',
    patientCep: item.paciente_cep || '',
  };
}

export function isConsultationFinished(statusCode) {
  return statusCode === 'realizada' || statusCode === 'atendida';
}
