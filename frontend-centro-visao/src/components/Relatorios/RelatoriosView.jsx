import React, { useState } from 'react';
import { FileBarChart, Download, Printer, Calendar, Users, DollarSign, Cake, AlertCircle } from 'lucide-react';
import { MOCK_PATIENTS, MOCK_BIRTHDAYS, MOCK_EXPIRING_EXAMS } from '../../data/mockData';

export default function RelatoriosView() {
  const [activeReport, setActiveReport] = useState('pacientes');

  const reportsList = [
    { id: 'pacientes', title: 'Pacientes', icon: Users, count: MOCK_PATIENTS.length },
    { id: 'agendamentos', title: 'Agendamentos', icon: Calendar, count: 18 },
    { id: 'atendimentos', title: 'Atendimentos', icon: FileBarChart, count: 14 },
    { id: 'financeiro', title: 'Financeiro', icon: DollarSign, count: 6 },
    { id: 'aniversariantes', title: 'Aniversariantes', icon: Cake, count: MOCK_BIRTHDAYS.length },
    { id: 'vencidos', title: 'Exames Vencidos', icon: AlertCircle, count: MOCK_EXPIRING_EXAMS.length },
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="bg-white p-4 border border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-orange-600 text-white flex items-center justify-center font-bold shadow-xs">
            <FileBarChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase leading-tight">Relatórios Operacionais</h2>
            <p className="text-xs text-slate-600">Exportação em CSV e formato impresso</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => alert("Exportando relatório...")}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase flex items-center space-x-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button 
            onClick={() => alert("Gerando folha de impressão...")}
            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase flex items-center space-x-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Grid selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {reportsList.map((r) => {
          const Icon = r.icon;
          const isActive = activeReport === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className={`p-3 border text-left flex flex-col justify-between h-20 transition-all ${
                isActive 
                  ? 'bg-orange-600 text-white border-orange-700 font-bold shadow-xs' 
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4" />
                <span className={`text-[10px] font-mono font-bold px-1 ${isActive ? 'bg-orange-800 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {r.count}
                </span>
              </div>
              <p className="text-xs font-bold uppercase truncate">{r.title}</p>
            </button>
          );
        })}
      </div>

      {/* Table preview */}
      <div className="flat-card p-4 space-y-3">
        <h3 className="font-extrabold text-slate-900 text-sm uppercase border-b border-slate-200 pb-2">
          Visualização de Dados — {reportsList.find(r => r.id === activeReport)?.title}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-extrabold text-slate-700 uppercase">
                <th className="py-2.5 px-3">Cód</th>
                <th className="py-2.5 px-3">Nome do Paciente</th>
                <th className="py-2.5 px-3">CPF / Contato</th>
                <th className="py-2.5 px-3">Origem</th>
                <th className="py-2.5 px-3">Data Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {MOCK_PATIENTS.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{p.id}</td>
                  <td className="py-2.5 px-3 font-extrabold text-slate-900">{p.name}</td>
                  <td className="py-2.5 px-3 text-slate-700">{p.cpf} • {p.phone}</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-800">{p.origin}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{p.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
