export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  
  const str = String(value).trim();
  if (!str) return null;

  // Formato ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss ou YYYY-MM-DD HH:mm:ss
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const date = new Date(year, month, day);
    if (!Number.isNaN(date.getTime()) && date.getFullYear() === year) return date;
  }

  // Formato Brasileiro: DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  const brMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1;
    const year = parseInt(brMatch[3], 10);
    const date = new Date(year, month, day);
    if (!Number.isNaN(date.getTime()) && date.getFullYear() === year) return date;
  }

  const fallback = new Date(str);
  if (!Number.isNaN(fallback.getTime())) return fallback;

  return null;
}

export function dateOnly(value) {
  const d = parseDate(value);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function calculateAge(value) {
  const date = parseDate(value);
  if (!date) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function formatAge(value) {
  const age = calculateAge(value);
  if (age === null || age === undefined) return 'Não informada';
  return `${age} ${age === 1 ? 'ano' : 'anos'}`;
}

export function adaptPatient(item) {
  if (!item) return null;
  const rawId = item.id ?? item.ID ?? item.pac_id ?? item.PAC_ID;
  if (!rawId) return null;

  const rawBirthDate = item.data_nascimento 
    ?? item.dataNascimento 
    ?? item.DATA_NASCIMENTO 
    ?? item.birthDate 
    ?? item.birth_date 
    ?? item.pac_data_nascimento 
    ?? item.PAC_DATA_NASCIMENTO;

  const birthDate = dateOnly(rawBirthDate);
  const calculatedAge = calculateAge(rawBirthDate || birthDate);

  return {
    id: String(rawId),
    name: item.nome ?? item.NOME ?? item.pac_nome ?? item.PAC_NOME ?? item.name ?? '',
    socialName: item.nome_social ?? item.NOME_SOCIAL ?? item.pac_nome_social ?? item.PAC_NOME_SOCIAL ?? item.socialName ?? '',
    birthDate,
    age: calculatedAge,
    gender: item.sexo ?? item.SEXO ?? item.pac_sexo ?? item.PAC_SEXO ?? item.gender ?? '',
    phone: item.celular ?? item.CELULAR ?? item.pac_celular ?? item.PAC_CELULAR ?? item.phone ?? '',
    phone2: item.telefone2 ?? item.TELEFONE2 ?? item.pac_telefone2 ?? item.PAC_TELEFONE2 ?? item.phone2 ?? '',
    email: item.email ?? item.EMAIL ?? item.pac_email ?? item.PAC_EMAIL ?? '',
    occupation: item.ocupacao ?? item.OCUPACAO ?? item.pac_ocupacao ?? item.PAC_OCUPACAO ?? item.occupation ?? '',
    cpf: item.cpf ?? item.CPF ?? item.pac_cpf ?? item.PAC_CPF ?? '',
    rg: item.rg ?? item.RG ?? item.pac_rg ?? item.PAC_RG ?? '',
    origin: item.como_conheceu ?? item.COMO_CONHECEU ?? item.pac_como_conheceu ?? item.PAC_COMO_CONHECEU ?? item.origin ?? '',
    responsibleName: item.responsavel_nome ?? item.RESPONSAVEL_NOME ?? item.pac_responsavel_nome ?? item.PAC_RESPONSAVEL_NOME ?? item.responsibleName ?? '',
    responsibleCpf: item.responsavel_cpf ?? item.RESPONSAVEL_CPF ?? item.pac_responsavel_cpf ?? item.PAC_RESPONSAVEL_CPF ?? item.responsibleCpf ?? '',
    address: item.endereco ?? item.ENDERECO ?? item.pac_endereco ?? item.PAC_ENDERECO ?? item.address ?? '',
    complement: item.complemento ?? item.COMPLEMENTO ?? item.pac_complemento ?? item.PAC_COMPLEMENTO ?? item.complement ?? '',
    city: item.cidade ?? item.CIDADE ?? item.pac_cidade ?? item.PAC_CIDADE ?? item.city ?? '',
    state: item.estado ?? item.ESTADO ?? item.pac_estado ?? item.PAC_ESTADO ?? item.state ?? '',
    cep: item.cep ?? item.CEP ?? item.pac_cep ?? item.PAC_CEP ?? '',
    photo: item.foto ?? item.FOTO ?? item.pac_foto ?? item.PAC_FOTO ?? item.photo ?? '',
    active: Number(item.ativo ?? item.ATIVO ?? item.pac_ativo ?? item.PAC_ATIVO ?? 1) === 1,
    registrationDate: item.data_cadastro ?? item.DATA_CADASTRO ?? item.pac_data_cadastro ?? item.PAC_DATA_CADASTRO ?? item.registrationDate ?? '',
  };
}

export function patientPayload(patient) {
  return {
    nome: patient.name?.trim() || '',
    nome_social: patient.socialName?.trim() || '',
    data_nascimento: patient.birthDate || '',
    sexo: patient.gender || '',
    celular: patient.phone || '',
    telefone2: patient.phone2 || '',
    email: patient.email || '',
    ocupacao: patient.occupation || '',
    cpf: patient.cpf || '',
    rg: patient.rg || '',
    como_conheceu: patient.origin || '',
    responsavel_nome: patient.responsibleName || '',
    responsavel_cpf: patient.responsibleCpf || '',
    endereco: patient.address || '',
    complemento: patient.complement || '',
    cidade: patient.city || '',
    estado: patient.state || '',
    cep: patient.cep || '',
    foto: patient.photo || '',
  };
}
