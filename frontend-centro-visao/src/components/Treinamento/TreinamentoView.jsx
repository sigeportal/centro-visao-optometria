import React from 'react';
import { PlayCircle, PhoneCall, ExternalLink } from 'lucide-react';

export default function TreinamentoView() {
  const videos = [
    { title: "Atendimento completo e emissão de receita de óculos", duration: "08:45", category: "Atendimento" },
    { title: "Preenchimento da Ficha Clínica Optométrica", duration: "12:20", category: "Ficha Clínica" },
    { title: "Gestão de Fluxo de Caixa e Parcerias com Óticas", duration: "10:15", category: "Financeiro" },
    { title: "Cadastramento de Pacientes e Prontuários", duration: "05:30", category: "Pacientes" },
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      
      {/* Banner */}
      <div className="bg-orange-600 text-white p-5 border border-orange-700 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase text-orange-200">Capacitação</span>
          <h2 className="text-xl font-extrabold text-white mt-0.5">Central de Treinamento Centro Visão</h2>
          <p className="text-xs text-orange-100 mt-1 max-w-xl">
            Vídeos explicativos para utilização rápida do sistema.
          </p>
        </div>

        <a 
          href="https://wa.me/5511987654321" 
          target="_blank" 
          rel="noreferrer"
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase flex items-center space-x-2 shadow-xs"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Suporte Direto</span>
        </a>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map((v, i) => (
          <div key={i} className="flat-card p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 bg-orange-100 text-orange-900 flex items-center justify-center shrink-0 font-bold">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-slate-100 border border-slate-300 uppercase text-slate-800">
                  {v.category}
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs mt-1.5">{v.title}</h4>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Duração: {v.duration}</span>
              <button 
                onClick={() => alert(`Assistindo: ${v.title}`)}
                className="font-bold text-orange-600 hover:text-orange-700 uppercase flex items-center space-x-1"
              >
                <span>Assistir</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
