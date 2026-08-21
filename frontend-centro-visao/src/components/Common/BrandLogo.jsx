import React from 'react';
import logoImage from '../../assets/logo-centro-visao.png';

/**
 * Logotipo oficial e marca registrada do Centro Visão Optometria.
 */
export default function BrandLogo({ 
  theme = 'light', // 'light' | 'dark'
  size = 'md', // 'sm' | 'md' | 'lg'
  showSubtitle = true,
  collapsed = false 
}) {
  const isDark = theme === 'dark';

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg sm:text-xl',
  };

  return (
    <div className="flex items-center space-x-3 select-none">
      {/* Símbolo Óptico Oficial */}
      <div 
        className={`${iconSizes[size]} shrink-0 rounded-xl relative flex items-center justify-center p-0.5 overflow-hidden transition-all ${
          isDark 
            ? 'bg-white shadow-sm ring-1 ring-white/20' 
            : 'bg-white border border-slate-200/80 shadow-hairline'
        }`}
        aria-hidden="true"
      >
        <img 
          src={logoImage} 
          alt="Centro Visão Optometria" 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Tipografia da Marca */}
      {!collapsed && (
        <div className="min-w-0 flex flex-col justify-center">
          <span className={`font-extrabold ${titleSizes[size]} tracking-tight font-sans leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Centro <span className={isDark ? 'text-forest-400' : 'text-forest-700'}>Visão</span>
          </span>
          {showSubtitle && (
            <span className={`block text-[10px] uppercase font-bold tracking-[0.16em] mt-1 leading-none ${
              isDark ? 'text-forest-300/80' : 'text-forest-700'
            }`}>
              Optometria
            </span>
          )}
        </div>
      )}
    </div>
  );
}
