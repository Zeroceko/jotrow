import React from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
          {label}
        </label>
      )}
      <input
        className={`
          bg-retro-bg text-retro-text border-2 border-retro-border 
          py-3 px-4 font-mono outline-none transition-colors
          focus:border-retro-accent focus:shadow-solid-accent
          ${error ? 'border-retro-danger focus:border-retro-danger focus:shadow-[4px_4px_0_0_rgba(239,68,68,0.4)]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <span className="mt-1 text-sm text-retro-danger font-mono">{error}</span>}
    </div>
  );
};
