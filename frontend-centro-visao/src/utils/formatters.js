/**
 * Utility formatting functions for Centro Visão
 */

/**
 * Format a number to Brazilian Real currency (R$ 0,00)
 */
export function formatCurrency(value) {
  const num = Number(value) || 0;
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

/**
 * Format date string ISO YYYY-MM-DD or DD/MM/YYYY to Brazilian format DD/MM/YYYY
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const text = String(dateStr).trim();
  if (!text) return '';

  // Separa data e hora (espaço ou 'T')
  const datePart = text.split(/[T\s]/)[0];

  // Formato com traço: AAAA-MM-DD ou DD-MM-AAAA
  if (datePart.includes('-')) {
    const parts = datePart.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      // DD-MM-YYYY
      if (parts[2].length === 4) {
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
    }
  }

  // Formato com barra: M/D/YYYY, MM/DD/YYYY, DD/MM/YYYY ou YYYY/MM/DD
  if (datePart.includes('/')) {
    const parts = datePart.split('/');
    if (parts.length === 3) {
      // YYYY/MM/DD
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      // Se o ano estiver no último bloco (YYYY)
      if (parts[2].length === 4) {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        // Se a primeira parte for maior que 12, com certeza é DD/MM/YYYY
        if (p0 > 12) {
          return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
        }
        // Se a segunda parte for maior que 12, com certeza é MM/DD/YYYY (formato americano)
        if (p1 > 12) {
          return `${parts[1].padStart(2, '0')}/${parts[0].padStart(2, '0')}/${parts[2]}`;
        }
        // Se partes vierem do Delphi/Windows (ex: 8/2/2026 sem zeros à esquerda ou padrão M/D/YYYY)
        // Quando p0 e p1 <= 12: se p0 e p1 já têm 2 dígitos e vierem de um input brasileiro já formatado,
        // manter como DD/MM/YYYY se parts[0].length === 2 && parts[1].length === 2; senão tratar M/D/YYYY
        if (parts[0].length === 1 && parts[1].length <= 2) {
          // Ex: 8/2/2026 ou 4/5/2026 -> vem no padrão M/D/YYYY do Delphi
          return `${parts[1].padStart(2, '0')}/${parts[0].padStart(2, '0')}/${parts[2]}`;
        }
        // Fallback seguro: DD/MM/YYYY
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
    }
  }

  return dateStr;
}

/**
 * Progressive CPF Mask (000.000.000-00)
 */
export function maskCPF(cpf) {
  if (!cpf) return '';
  const digits = String(cpf).replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.replace(/^(\d{3})(\d+)/, '$1.$2');
  if (digits.length <= 9) return digits.replace(/^(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
}

export const formatCPF = maskCPF;

/**
 * Progressive RG Mask (00.000.000-0 or 00.000.000-X)
 */
export function maskRG(rg) {
  if (!rg) return '';
  const clean = String(rg).replace(/[^0-9a-zA-Z]/g, '').slice(0, 10).toUpperCase();
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return clean.replace(/^(.{2})(.+)/, '$1.$2');
  if (clean.length <= 8) return clean.replace(/^(.{2})(.{3})(.+)/, '$1.$2.$3');
  return clean.replace(/^(.{2})(.{3})(.{3})(.{1,2})/, '$1.$2.$3-$4');
}

export const formatRG = maskRG;

export function formatCNPJ(cnpj) {
  const digits = String(cnpj || '').replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
}

export function formatCEP(cep) {
  return String(cep || '').replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

export const maskCEP = formatCEP;

/**
 * Progressive Phone Mask: (00) 0000-0000 or (00) 00000-0000
 */
export function maskPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return digits.replace(/^(\d{2})(\d+)/, '($1) $2');
  if (digits.length <= 10) return digits.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
  return digits.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

export const formatPhone = maskPhone;

/**
 * Calculate age based on birth date (supports ISO YYYY-MM-DD, BR DD/MM/YYYY, or Date)
 */
export function calculateAge(value) {
  if (!value) return null;
  if (typeof value === 'number') return value >= 0 ? value : null;
  
  let date = null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    date = value;
  } else {
    const str = String(value).trim();
    if (!str) return null;

    const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (isoMatch) {
      date = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
    } else {
      const brMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (brMatch) {
        date = new Date(parseInt(brMatch[3], 10), parseInt(brMatch[2], 10) - 1, parseInt(brMatch[1], 10));
      } else {
        const fallback = new Date(str);
        if (!Number.isNaN(fallback.getTime())) date = fallback;
      }
    }
  }

  if (!date || Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

/**
 * Format age to readable string ('32 anos' or 'Não informada')
 */
export function formatAge(value) {
  const age = calculateAge(value);
  if (age === null || age === undefined) return 'Não informada';
  return `${age} ${age === 1 ? 'ano' : 'anos'}`;
}

/**
 * Generates a complete, professional and friendly WhatsApp reminder message for clinical returns.
 */
export function buildReturnWhatsAppMessage({
  patientName,
  returnDate,
  returnType,
  reason,
  doctor,
  consultationDate,
  clinicName = '',
  clinicPhone = '',
  clinicAddress = ''
}) {
  const firstName = String(patientName || 'Paciente').trim();
  const dateFormatted = formatDate(returnDate) || 'a combinar';
  const consultDateFormatted = formatDate(consultationDate);

  const blocks = [];

  blocks.push(`Olá, *${firstName}*! Tudo bem?`);

  if (clinicName) {
    blocks.push(`Aqui é da equipe do *${clinicName}*.`);
  }

  blocks.push('Estamos entrando em contato para confirmar o seu *retorno optométrico gratuito* agendado:');

  const items = [];
  items.push(`- *Data do Retorno:* ${dateFormatted}`);
  if (returnType) {
    items.push(`- *Tipo:* ${returnType}`);
  }
  if (reason) {
    items.push(`- *Motivo / Avaliação:* ${reason}`);
  }
  if (doctor) {
    items.push(`- *Profissional:* ${doctor}`);
  }
  if (consultDateFormatted) {
    items.push(`- *Consulta de Origem:* ${consultDateFormatted}`);
  }
  blocks.push(items.join('\n'));

  blocks.push('*Lembrete:* Este retorno é um acompanhamento clínico gratuito para conferir sua adaptação e saúde visual.');
  blocks.push('Podemos confirmar sua presença?\nBasta responder a esta mensagem para nossa recepção!');

  const footer = [];
  if (clinicName) footer.push(`*${clinicName}*`);
  if (clinicAddress) footer.push(clinicAddress);
  if (clinicPhone) footer.push(`Telefone / WhatsApp: ${clinicPhone}`);
  if (footer.length > 0) {
    blocks.push(footer.join('\n'));
  }

  return blocks.join('\n\n').trim();
}

/**
 * Gera mensagem de WhatsApp para reconvocação / captação de Nova Consulta (CRM / Validade dos Óculos)
 */
export function generateNewConsultationMessage({
  patientName,
  estimatedDate,
  reason,
  doctor,
  consultationDate,
  clinicName = '',
  clinicPhone = '',
  clinicAddress = ''
}) {
  const firstName = String(patientName || 'Paciente').trim();
  const dateFormatted = formatDate(estimatedDate) || 'revisão periódica';
  const consultDateFormatted = formatDate(consultationDate);

  const blocks = [];

  blocks.push(`Olá, *${firstName}*! Tudo bem?`);

  if (clinicName) {
    blocks.push(`Aqui é da equipe do *${clinicName}*.`);
  }

  blocks.push('Estamos entrando em contato para lembrar sobre a *revisão periódica da sua saúde visual*:');

  const items = [];
  if (consultDateFormatted) {
    items.push(`- *Último exame realizado em:* ${consultDateFormatted}`);
  }
  items.push(`- *Previsão recomendada para nova consulta:* ${dateFormatted}`);
  if (reason) {
    items.push(`- *Indicação / Motivo:* ${reason}`);
  }
  if (doctor) {
    items.push(`- *Profissional:* ${doctor}`);
  }
  blocks.push(items.join('\n'));

  blocks.push('*Por que é importante renovar sua consulta?*\nA validade das receitas de óculos costuma expirar após 1 ano. Além disso, a visão muda gradualmente e uma nova consulta garante o ajuste preciso do seu grau e a prevenção de alterações oculares.');

  blocks.push('Gostaria de agendar o melhor dia e horário para a sua nova consulta?\nBasta responder a esta mensagem que teremos o prazer em agendar o seu atendimento!');

  const footer = [];
  if (clinicName) footer.push(`*${clinicName}*`);
  if (clinicAddress) footer.push(clinicAddress);
  if (clinicPhone) footer.push(`Telefone / WhatsApp: ${clinicPhone}`);
  if (footer.length > 0) {
    blocks.push(footer.join('\n'));
  }

  return blocks.join('\n\n').trim();
}

/**
 * Builds direct WhatsApp dispatch link with sanitization and clean encoded message
 */
export function buildWhatsAppLink(phone, message) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  const cleanNumber = digits.startsWith('55') ? digits : `55${digits}`;
  const cleanText = String(message || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(cleanText)}`;
}

/**
 * Formata dioptria óptica (esférico, cilíndrico, adição) com 2 casas decimais.
 * Ex.: 1 -> 1.00; -0.5 -> -0.50; +1.25 -> +1.25 (ou 1.25 se keepSign=false)
 */
export function formatDiopter(value, { withExplicitPlus = false } = {}) {
  if (value === null || value === undefined) return '';
  const str = String(value).trim().replace(',', '.');
  if (!str) return '';

  const num = parseFloat(str);
  if (Number.isNaN(num)) return str;

  const formatted = Math.abs(num).toFixed(2);
  if (num < 0) return `-${formatted}`;
  if (num > 0 && withExplicitPlus) return `+${formatted}`;
  return num === 0 ? '0.00' : formatted;
}

/**
 * Formata eixo óptico (0 a 180 graus inteiros)
 */
export function formatAxis(value) {
  if (value === null || value === undefined) return '';
  const str = String(value).trim().replace(/°/g, '');
  if (!str) return '';
  const num = parseInt(str, 10);
  if (Number.isNaN(num)) return str;
  return String(Math.max(0, Math.min(180, num)));
}
