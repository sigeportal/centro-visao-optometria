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
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
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
  
  let msg = `Olá, *${firstName}*! Tudo bem? 😊\n\n`;
  if (clinicName) {
    msg += `Aqui é da equipe do *${clinicName}*.\n\n`;
  }
  msg += `Estamos entrando em contato porque seu profissional indicou um retorno optométrico para o período abaixo:\n\n`;
  msg += `📅 *Data prevista para o retorno:* ${dateFormatted}\n`;
  if (returnType) {
    msg += `📋 *Tipo de Acompanhamento:* ${returnType}\n`;
  }
  if (reason) {
    msg += `🎯 *Motivo / Conduta Clínica:* ${reason}\n`;
  }
  if (doctor) {
    msg += `👨‍⚕️ *Profissional:* ${doctor}\n`;
  }
  if (consultDateFormatted) {
    msg += `🗓️ *Última Consulta:* ${consultDateFormatted}\n`;
  }
  
  msg += `\n💡 *Por que o retorno é importante?*\n`;
  msg += `O acompanhamento preventivo é indispensável para avaliar a evolução da sua acuidade visual, adaptação às lentes/óculos e garantir a saúde dos seus olhos.\n\n`;
  msg += `Gostaria de agendar o melhor dia e horário para o seu atendimento?\n`;
  msg += `_Basta responder a esta mensagem que nossa recepção confirma para você!_ ✨\n\n`;
  if (clinicName) {
    msg += `📍 *${clinicName}*\n`;
  }
  if (clinicAddress) {
    msg += `${clinicAddress}\n`;
  }
  if (clinicPhone) {
    msg += `📞 Telefone / WhatsApp: ${clinicPhone}\n`;
  }

  return msg.trim();
}

/**
 * Builds direct wa.me link with sanitization and encoded message
 */
export function buildWhatsAppLink(phone, message) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  const cleanNumber = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
