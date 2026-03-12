import React, { type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`relative bg-retro-panel border-2 border-retro-border shadow-solid p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};
