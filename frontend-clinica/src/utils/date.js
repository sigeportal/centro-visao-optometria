function pad2(value) {
  return String(value).padStart(2, '0');
}

function normalizeYear(value) {
  const year = Number(value);
  if (year >= 100) return year;
  return year <= 69 ? year + 2000 : year + 1900;
}

export function parseLocalDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  const text = String(value).trim();

  const iso = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/
  );
  if (iso) {
    const date = new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4] || 0),
      Number(iso[5] || 0),
      Number(iso[6] || 0)
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const br = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (br) {
    const date = new Date(
      normalizeYear(br[3]),
      Number(br[2]) - 1,
      Number(br[1]),
      Number(br[4] || 0),
      Number(br[5] || 0),
      Number(br[6] || 0)
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const nativeDate = new Date(text);
  return Number.isNaN(nativeDate.getTime()) ? null : nativeDate;
}

export function formatDate(value, fallback = '-') {
  const date = parseLocalDateTime(value);
  if (!date) return value || fallback;
  return date.toLocaleDateString('pt-BR');
}

export function formatDateTime(value, fallback = '-') {
  const date = parseLocalDateTime(value);
  if (!date) return value || fallback;
  return date.toLocaleString('pt-BR');
}

export function formatDateTimeShort(value, fallback = '-') {
  const date = parseLocalDateTime(value);
  if (!date) return value || fallback;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function toDateInputValue(value) {
  const date = parseLocalDateTime(value);
  if (!date) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toDateTimeInputValue(value) {
  const date = parseLocalDateTime(value);
  if (!date) return '';
  return `${toDateInputValue(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function toLocalDateTimeParam(value) {
  const date = parseLocalDateTime(value);
  if (!date) return '';
  return `${toDateInputValue(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}
