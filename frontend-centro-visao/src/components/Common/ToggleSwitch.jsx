import React from 'react';

/**
 * Reusable accessible toggle switch button
 */
export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  activeColor = 'bg-forest-700',
  inactiveColor = 'bg-slate-300',
  size = 'md', // 'sm' | 'md'
  ariaLabel
}) {
  const isSm = size === 'sm';
  const containerClass = isSm ? 'h-5 w-9' : 'h-6 w-11';
  const knobClass = isSm ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const translateClass = isSm 
    ? (checked ? 'translate-x-4' : 'translate-x-0') 
    : (checked ? 'translate-x-5' : 'translate-x-0');

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      aria-label={ariaLabel}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex ${containerClass} shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-forest-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? (activeColor === 'bg-[#17A589]' || activeColor === 'bg-emerald-600' ? 'bg-forest-700' : activeColor) : inactiveColor
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block ${knobClass} transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${translateClass}`}
      />
    </button>
  );
}

