const DAY_NAMES = [
  { name: 'Domingo', short: 'Dom' },
  { name: 'Segunda', short: 'Seg' },
  { name: 'Terça', short: 'Ter' },
  { name: 'Quarta', short: 'Qua' },
  { name: 'Quinta', short: 'Qui' },
  { name: 'Sexta', short: 'Sex' },
  { name: 'Sábado', short: 'Sáb' },
];

export const STATUS_LABELS = {
  agendada: 'Agendado',
  confirmada: 'Confirmado',
  fila_espera: 'Fila de espera',
  em_atendimento: 'Em atendimento',
  realizada: 'Concluído',
  cancelada: 'Cancelado',
  faltou: 'Faltou',
};

export const STATUS_OPTIONS = [
  { code: 'agendada', label: 'Agendado' },
  { code: 'confirmada', label: 'Confirmado' },
  { code: 'fila_espera', label: 'Fila de espera' },
  { code: 'em_atendimento', label: 'Em atendimento' },
  { code: 'realizada', label: 'Concluído' },
  { code: 'faltou', label: 'Faltou' },
  { code: 'cancelada', label: 'Cancelado' },
];

const STATUS_TRANSITIONS = {
  fila_espera: ['agendada'],
  agendada: ['confirmada', 'fila_espera', 'cancelada', 'faltou'],
  confirmada: ['fila_espera', 'cancelada', 'faltou'],
};

export function getAllowedStatusTransitions(statusCode) {
  return STATUS_TRANSITIONS[statusCode] || [];
}

function pad(value) {
  return String(value).padStart(2, '0');
}

export function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseApiDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const text = String(value).trim();
  if (!text) return null;

  // 1. Formato ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss ou YYYY-MM-DD HH:mm:ss
  const isoMatch = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoMatch) {
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = isoMatch;
    const result = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    if (!Number.isNaN(result.getTime())) return result;
  }

  // 2. Formato com barra: D/M/YYYY ou M/D/YYYY (com ou sem horário e AM/PM)
  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (slashMatch) {
    const [, part1, part2, year, rawHour = '0', minute = '0', second = '0', period] = slashMatch;
    let hour = Number(rawHour);
    if (period?.toUpperCase() === 'PM' && hour < 12) hour += 12;
    if (period?.toUpperCase() === 'AM' && hour === 12) hour = 0;

    let day, month;
    const n1 = Number(part1);
    const n2 = Number(part2);

    if (period) {
      // Se possui AM/PM explícito, é padrão M/D/YYYY
      month = n1;
      day = n2;
    } else if (n1 > 12) {
      // Primeiro número > 12 -> é dia (DD/MM/YYYY)
      day = n1;
      month = n2;
    } else if (n2 > 12) {
      // Segundo número > 12 -> é dia (MM/DD/YYYY)
      month = n1;
      day = n2;
    } else {
      // Ambos <= 12: testa Date nativo primeiro
      const nativeDate = new Date(text);
      if (!Number.isNaN(nativeDate.getTime())) {
        return nativeDate;
      }
      day = n1;
      month = n2;
    }

    const result = new Date(Number(year), month - 1, day, hour, Number(minute), Number(second));
    if (!Number.isNaN(result.getTime())) return result;
  }

  // 3. Fallback nativo
  const fallback = new Date(text);
  if (!Number.isNaN(fallback.getTime())) return fallback;

  return null;
}

export function startOfAgendaWeek(reference = new Date()) {
  const date = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const day = date.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - daysSinceMonday);
  return date;
}

export function addDays(date, amount) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + amount);
  return result;
}

export function buildAgendaDays(weekStart, today = new Date()) {
  const todayIso = toIsoDate(today);
  return Array.from({ length: 6 }, (_, index) => {
    const date = addDays(weekStart, index);
    const labels = DAY_NAMES[date.getDay()];
    return {
      id: toIsoDate(date),
      name: labels.name,
      short: labels.short,
      dateStr: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`,
      isToday: toIsoDate(date) === todayIso,
      date,
    };
  });
}

export function formatAgendaRange(days) {
  if (!days.length) return '';
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long' });

  if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
    return `${first.getDate()} a ${last.getDate()} de ${monthFormatter.format(last)} de ${last.getFullYear()}`;
  }

  const shortFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
  return `${shortFormatter.format(first)} a ${shortFormatter.format(last)} de ${last.getFullYear()}`;
}

function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatBirthDate(date) {
  if (!date) return null;
  return toIsoDate(date);
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPending = today.getMonth() < birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (birthdayPending) age -= 1;
  return age >= 0 ? age : null;
}

export function adaptAppointment(item) {
  const start = parseApiDateTime(item?.inicio);
  const end = parseApiDateTime(item?.fim);
  if (!start || !end) return null;

  const birthDate = parseApiDateTime(item.paciente_nascimento);
  const rawStatusCode = String(item.status || 'agendada').trim().toLowerCase();
  const statusCode = rawStatusCode === 'aguardando_atendimento' ? 'fila_espera' : rawStatusCode;
  const duration = Math.max(5, Math.round((end.getTime() - start.getTime()) / 60000));

  return {
    id: String(item.id),
    patientId: item.paciente_id ? String(item.paciente_id) : null,
    patient: item.paciente || 'Paciente não informado',
    phone: item.paciente_whatsapp || '',
    birthDate: formatBirthDate(birthDate),
    age: calculateAge(birthDate),
    doctorId: item.profissional_id ? String(item.profissional_id) : null,
    doctor: item.profissional || 'Profissional não informado',
    procedureId: item.procedimento_id ? String(item.procedimento_id) : null,
    procedure: item.procedimento || 'Procedimento não informado',
    date: toIsoDate(start),
    startTime: formatTime(start),
    endTime: formatTime(end),
    duration,
    statusCode,
    status: STATUS_LABELS[statusCode] || item.status || 'Não informado',
    priority: item.prioridade || 'normal',
    partnershipId: item.parceria_id ? String(item.parceria_id) : null,
    partnership: item.parceria || (item.parceria_id ? `Parceria #${item.parceria_id}` : 'Não informada'),
    observations: item.observacao || '',
    paymentStatus: 'Não informado',
    createdAt: parseApiDateTime(item.criado_em),
    createdBy: item.criado_por || null,
  };
}

export function adaptProfessional(item) {
  return {
    id: String(item.id),
    name: item.nome || 'Profissional sem nome',
  };
}

export function getStatusStyle(statusCode) {
  if (statusCode === 'realizada') {
    return {
      badge: 'bg-forest-50 text-forest-900 border-forest-300',
      border: 'border-l-forest-700',
    };
  }
  if (statusCode === 'em_atendimento') {
    return {
      badge: 'bg-amber-100 text-amber-950 border-amber-300',
      border: 'border-l-amber-600',
    };
  }
  if (statusCode === 'confirmada') {
    return {
      badge: 'bg-forest-100 text-forest-950 border-forest-400',
      border: 'border-l-forest-600',
    };
  }
  if (statusCode === 'fila_espera') {
    return {
      badge: 'bg-amber-50 text-amber-900 border-amber-300',
      border: 'border-l-amber-500',
    };
  }
  if (statusCode === 'cancelada' || statusCode === 'faltou') {
    return {
      badge: 'bg-rose-50 text-rose-900 border-rose-200',
      border: 'border-l-rose-500',
    };
  }
  return {
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    border: 'border-l-slate-600',
  };
}
