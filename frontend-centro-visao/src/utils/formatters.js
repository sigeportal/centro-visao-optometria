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
 * Format a CPF string to standard format (000.000.000-00)
 */
export function formatCPF(cpf) {
  if (!cpf) return '';
  const digits = String(cpf).replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return cpf;
}

export function formatCNPJ(cnpj) {
  const digits = String(cnpj || '').replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function formatCEP(cep) {
  return String(cep || '').replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Format a phone string to (00) 00000-0000
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

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
