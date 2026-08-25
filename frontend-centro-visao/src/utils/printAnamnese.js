import { formatCPF, formatCNPJ, formatCEP, formatPhone } from './formatters';

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function formatDate(value) {
  if (!value) return '—';
  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
  return text;
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toLocaleString('pt-BR');
  return String(value);
}

function ageFrom(birthDate) {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1;
  return `${age} ${age === 1 ? 'ano' : 'anos'}`;
}

function parseList(value) {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (!value) return [];
  const str = String(value).trim();
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
    } catch {}
  }
  return str.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
}

function renderBadgeList(items, other = '', fallback = 'Nenhum relato registrado') {
  const combined = [...items, ...(other ? [other] : [])].filter(Boolean);
  if (combined.length === 0) {
    return `<span style="color: #64748b; font-style: italic; font-size: 11px;">${fallback}</span>`;
  }
  return `
    <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px;">
      ${combined.map((item) => `
        <span style="display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 8px; font-size: 10.5px; font-weight: 600; color: #1e293b;">
          ${escapeHtml(item)}
        </span>
      `).join('')}
    </div>
  `;
}

function asBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return ['1', 'true', 'sim', 'yes'].includes(String(value || '').trim().toLowerCase());
}

export function generateAnamnesisHtml(data = {}, patient = {}, clinicInfo = {}, consultation = {}) {
  // Unifica campos se vier do formato form ou do formato API
  const motivoPrincipal = data.motivoPrincipal || data.motivo_principal || data.queixa_principal || '—';
  const dataUltimoExame = data.dataUltimoExame || data.data_ultimo_exame;
  const observacoesGerais = data.observacoesGerais || data.observacoes_gerais || data.historico || '';
  const observacoesFinais = data.observacoesAnamnese || data.observacoes_finais || data.observacoes || '';

  const sintomas = parseList(data.sintomas);
  const outrosSintomas = data.outrosSintomas || data.outros_sintomas || '';

  const doencasOculares = parseList(data.doencasOculares || data.doencas_oculares);
  const outrasDoencasOculares = data.outrasDoencasOculares || data.outras_doencas_oculares || '';

  const doencasSistemicas = parseList(data.doencasSistemicas || data.doencas_sistemicas);
  const outrasDoencasSistemicas = data.outrasDoencasSistemicas || data.outras_doencas_sistemicas || '';

  const medicamentos = parseList(data.medicamentos);
  const outrosMedicamentos = data.outrosMedicamentos || data.outros_medicamentos || '';

  const antecedentes = parseList(data.antecedentes || data.antecedentes_familiares || data.antecedentesFamiliares);
  const antecedentesOutros = data.antecedentesOutros || data.antecedentes_outros || '';

  // Flags de óculos e lentes
  const usoOculos = Array.isArray(data.usoOculos)
    ? data.usoOculos.includes('Usa Óculos')
    : asBoolean(data.uso_oculos);
  const usoLentes = Array.isArray(data.usoLentes)
    ? data.usoLentes.includes('Usa Lente de Contato?')
    : asBoolean(data.uso_lente);
  const difLonge = Array.isArray(data.usoOculos) || Array.isArray(data.usoLentes)
    ? (data.usoOculos || []).includes('Dificuldade Longe') || (data.usoLentes || []).includes('Dificuldade Longe')
    : asBoolean(data.dificuldade_longe);
  const difPerto = Array.isArray(data.usoOculos) || Array.isArray(data.usoLentes)
    ? (data.usoOculos || []).includes('Dificuldade Perto') || (data.usoLentes || []).includes('Dificuldade Perto')
    : asBoolean(data.dificuldade_perto);

  // Cefaleia
  const cefaleia = Array.isArray(data.cefaleia)
    ? data.cefaleia.includes('Dor de cabeça')
    : asBoolean(data.cefaleia);
  const cefaleiaLocal = parseList(data.cefaleia_local || (Array.isArray(data.cefaleia) ? data.cefaleia.filter(i => ['Frontal', 'Temporal', 'Occipital', 'Parietal'].includes(i)) : []));
  const cefaleiaLocalOutro = data.cefaleiaLocalOutro || data.cefaleia_local_outro || '';
  const cefaleiaFreq = parseList(data.cefaleia_frequencia || (Array.isArray(data.cefaleia) ? data.cefaleia.filter(i => !['Dor de cabeça', 'Frontal', 'Temporal', 'Occipital', 'Parietal'].includes(i)) : []));
  const cefaleiaFreqOutro = data.cefaleiaFrequenciaOutro || data.cefaleia_frequencia_outro || '';

  const patientName = patient?.name || patient?.nome || consultation?.patientName || 'Paciente';
  const patientCpf = patient?.cpf || consultation?.patientCpf;
  const patientRg = patient?.rg || consultation?.patientRg;
  const patientBirth = patient?.birthDate || patient?.data_nascimento || consultation?.patientBirthDate;
  const patientPhone = patient?.phone || patient?.telefone || patient?.celular || consultation?.patientPhone;
  const doctorName = consultation?.doctor || consultation?.profissional || 'Optometrista Responsável';
  const dataRegistro = data.criado_em || data.data || consultation?.date || new Date();

  const addressLine = [
    clinicInfo?.address || clinicInfo?.endereco,
    clinicInfo?.city && clinicInfo?.state ? `${clinicInfo.city} - ${clinicInfo.state}` : (clinicInfo?.city || clinicInfo?.cidade || clinicInfo?.state || clinicInfo?.estado),
    clinicInfo?.cep ? `CEP: ${formatCEP(clinicInfo.cep)}` : null,
    clinicInfo?.phone || clinicInfo?.telefone ? `Tel/WhatsApp: ${formatPhone(clinicInfo.phone || clinicInfo.telefone)}` : null,
  ].filter(Boolean).join(' • ');

  const checkBadge = (val, label) => `
    <div style="padding: 6px 10px; border: 1px solid ${val ? '#86efac' : '#e2e8f0'}; background: ${val ? '#f0fdf4' : '#f8fafc'}; border-radius: 6px; font-size: 11px;">
      <span style="font-weight: bold; color: ${val ? '#166534' : '#64748b'};">${val ? '✓ SIM' : '✗ NÃO'}</span>
      <span style="margin-left: 6px; color: #1e293b;">${escapeHtml(label)}</span>
    </div>
  `;

  return `<!doctype html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <title>Anamnese Clínica - ${escapeHtml(patientName)}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
        background: #ffffff;
        padding: 24px;
        font-size: 11.5px;
        line-height: 1.45;
      }
      .section-card {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 10px 14px;
        margin-bottom: 12px;
        background: #ffffff;
      }
      .section-title {
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        color: #064e3b;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 4px;
      }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
      .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; }
      @page {
        margin: 12mm 15mm 15mm 15mm;
        size: auto;
      }
      @media print {
        body { padding: 0; background: #ffffff !important; }
        .section-card { break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <!-- Cabeçalho Institucional -->
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #065f46; padding-bottom: 12px; margin-bottom: 14px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="/logo-centro-visao.png" alt="Centro Visão" style="width: 48px; height: 48px; object-fit: contain;" />
        <div>
          <h1 style="font-size: 16px; font-weight: bold; text-transform: uppercase; color: #064e3b; letter-spacing: 0.5px;">
            ${escapeHtml(clinicInfo?.name || clinicInfo?.nome || 'CENTRO VISÃO OPTOMETRIA')}
          </h1>
          ${(clinicInfo?.cnpj) ? `<div style="font-size: 10px; color: #334155; font-family: monospace; font-weight: bold; margin-top: 2px;">CNPJ: ${escapeHtml(formatCNPJ(clinicInfo.cnpj))}</div>` : ''}
          ${addressLine ? `<div style="font-size: 9.5px; color: #64748b; font-family: monospace; margin-top: 2px;">${escapeHtml(addressLine)}</div>` : ''}
        </div>
      </div>
      <div style="text-align: right; font-size: 10px; color: #64748b;">
        <div style="font-weight: bold; color: #0f172a; text-transform: uppercase; font-size: 11px;">Anamnese Clínica</div>
        <div>Emissão: ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
    </div>

    <!-- Título Principal -->
    <div style="text-align: center; margin-bottom: 12px;">
      <h2 style="font-size: 13px; font-weight: bold; text-transform: uppercase; color: #0f172a; letter-spacing: 1px;">
        Ficha de Anamnese e Histórico Clínico Visual
      </h2>
    </div>

    <!-- Dados do Paciente -->
    <div class="section-card" style="background: #f8fafc; border-color: #e2e8f0; margin-bottom: 12px;">
      <div class="grid-3" style="margin-bottom: 6px;">
        <div>
          <span style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; color: #64748b; display: block;">Paciente</span>
          <strong style="font-size: 12.5px; color: #0f172a;">${escapeHtml(patientName)}</strong>
        </div>
        <div>
          <span style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; color: #64748b; display: block;">CPF / RG</span>
          <span style="font-family: monospace; color: #334155; font-weight: bold;">
            ${escapeHtml(patientCpf ? formatCPF(patientCpf) : '—')}${patientRg ? ` • RG: ${escapeHtml(patientRg)}` : ''}
          </span>
        </div>
        <div>
          <span style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; color: #64748b; display: block;">Nascimento / Idade</span>
          <span style="color: #334155;">
            ${formatDate(patientBirth)}${patientBirth ? ` (${ageFrom(patientBirth)})` : ''}
          </span>
        </div>
      </div>
      <div class="grid-3" style="border-top: 1px dashed #cbd5e1; padding-top: 6px; font-size: 10.5px;">
        <div>
          <span style="color: #64748b; font-weight: bold;">Telefone / WhatsApp:</span>
          <span style="font-family: monospace; margin-left: 4px;">${escapeHtml(patientPhone ? formatPhone(patientPhone) : 'Não informado')}</span>
        </div>
        <div>
          <span style="color: #64748b; font-weight: bold;">Data da Anamnese:</span>
          <span style="margin-left: 4px;">${formatDateTime(dataRegistro)}</span>
        </div>
        <div>
          <span style="color: #64748b; font-weight: bold;">Profissional:</span>
          <span style="margin-left: 4px; font-weight: 600;">${escapeHtml(doctorName)}</span>
        </div>
      </div>
    </div>

    <!-- 1. Motivo Principal da Consulta & Histórico -->
    <div class="section-card">
      <div class="section-title">1. Queixa Principal e Histórico da Consulta</div>
      <div class="grid-2">
        <div>
          <strong style="color: #0f172a; font-size: 11px;">Motivo Principal:</strong>
          <div style="margin-top: 3px; font-size: 12px; color: #1e293b; font-weight: 600; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
            ${escapeHtml(motivoPrincipal)}
          </div>
        </div>
        <div>
          <strong style="color: #0f172a; font-size: 11px;">Data do Último Exame Visual:</strong>
          <div style="margin-top: 3px; font-size: 12px; color: #1e293b; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
            ${formatDate(dataUltimoExame)}
          </div>
        </div>
      </div>
      ${observacoesGerais ? `
        <div style="margin-top: 8px;">
          <strong style="color: #0f172a; font-size: 10.5px;">Observações Gerais / Histórico:</strong>
          <div style="margin-top: 2px; color: #334155; font-size: 11px; white-space: pre-wrap; line-height: 1.4;">${escapeHtml(observacoesGerais)}</div>
        </div>
      ` : ''}
    </div>

    <!-- 2. Correção Atual & Dificuldades Visuais -->
    <div class="section-card">
      <div class="section-title">2. Correção Óptica e Dificuldades Visuais Relatadas</div>
      <div class="grid-4">
        ${checkBadge(usoOculos, 'Usa Óculos')}
        ${checkBadge(usoLentes, 'Usa Lente de Contato')}
        ${checkBadge(difLonge, 'Dificuldade para Longe')}
        ${checkBadge(difPerto, 'Dificuldade para Perto')}
      </div>
    </div>

    <!-- 3. Sintomas Oculares e Visuais -->
    <div class="section-card">
      <div class="section-title">3. Sintomas Oculares e Visuais Relatados</div>
      ${renderBadgeList(sintomas, outrosSintomas, 'Nenhum sintoma ocular ou queixa visual relatada.')}
    </div>

    <!-- 4. Histórico Ocular e Doenças Sistêmicas -->
    <div class="grid-2">
      <div class="section-card">
        <div class="section-title">4. Doenças Oculares / Patologias</div>
        ${renderBadgeList(doencasOculares, outrasDoencasOculares, 'Nenhuma doença ocular informada.')}
      </div>

      <div class="section-card">
        <div class="section-title">5. Doenças Sistêmicas / Saúde Geral</div>
        ${renderBadgeList(doencasSistemicas, outrasDoencasSistemicas, 'Nenhuma doença sistêmica informada.')}
      </div>
    </div>

    <!-- 5. Medicamentos & Antecedentes Familiares -->
    <div class="grid-2">
      <div class="section-card">
        <div class="section-title">6. Medicamentos em Uso Contínuo</div>
        ${renderBadgeList(medicamentos, outrosMedicamentos, 'Nenhum medicamento informado.')}
      </div>

      <div class="section-card">
        <div class="section-title">7. Antecedentes Familiares Oculares / Sistêmicos</div>
        ${renderBadgeList(antecedentes, antecedentesOutros, 'Nenhum antecedente relevante relatado.')}
      </div>
    </div>

    <!-- 6. Cefaleia / Dores de Cabeça -->
    <div class="section-card">
      <div class="section-title">8. Investigação de Cefaleia (Dor de Cabeça)</div>
      <div class="grid-3" style="align-items: center;">
        <div>
          ${checkBadge(cefaleia, 'Apresenta Cefaleia')}
        </div>
        <div>
          <strong style="font-size: 10.5px; color: #475569; display: block;">Localização:</strong>
          ${renderBadgeList(cefaleiaLocal, cefaleiaLocalOutro, 'Não especificada')}
        </div>
        <div>
          <strong style="font-size: 10.5px; color: #475569; display: block;">Frequência / Horário:</strong>
          ${renderBadgeList(cefaleiaFreq, cefaleiaFreqOutro, 'Não especificada')}
        </div>
      </div>
    </div>

    <!-- 7. Observações Clínicas Finais -->
    ${observacoesFinais ? `
      <div class="section-card">
        <div class="section-title">9. Observações Clínicas Finais / Parecer da Anamnese</div>
        <div style="font-size: 11px; color: #1e293b; white-space: pre-wrap; line-height: 1.4;">${escapeHtml(observacoesFinais)}</div>
      </div>
    ` : ''}

    <!-- Rodapé e Assinatura -->
    <div style="margin-top: 36px; display: flex; align-items: flex-end; justify-content: space-between; font-size: 9.5px; break-inside: avoid;">
      <div style="color: #64748b; max-width: 420px; line-height: 1.35;">
        <div>Documento clínico gerado eletronicamente no sistema Centro Visão Optometria.</div>
        <div>As informações acima foram coletadas e confirmadas durante o atendimento optométrico.</div>
      </div>
      <div style="text-align: center; width: 240px;">
        <div style="border-bottom: 1px solid #0f172a; margin-bottom: 6px;"></div>
        <div style="font-weight: bold; color: #0f172a; font-size: 11px;">Optometrista Responsável</div>
      </div>
    </div>
  </body>
  </html>`;
}

export function printAnamneseViaIframe(html) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 250);
}
