import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = "px-6 py-2 font-bold transition-all duration-100 border-2";

  const variants = {
    primary: "bg-retro-accent text-retro-bg border-retro-accent shadow-solid hover:shadow-solid-hover hover:translate-y-[2px] hover:translate-x-[2px] active:shadow-solid-active active:translate-y-[4px] active:translate-x-[4px] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:hover:shadow-solid",
    secondary: "bg-retro-panel text-retro-text border-white/20 shadow-solid hover:shadow-solid-hover hover:translate-y-[2px] hover:translate-x-[2px] active:shadow-solid-active active:translate-y-[4px] active:translate-x-[4px] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:hover:shadow-solid",
    danger: "bg-retro-danger text-white border-retro-danger shadow-solid hover:shadow-solid-hover hover:translate-y-[2px] hover:translate-x-[2px] active:shadow-solid-active active:translate-y-[4px] active:translate-x-[4px] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:hover:shadow-solid",
    ghost: "border-transparent text-retro-muted hover:text-retro-text hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
