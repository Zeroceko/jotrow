import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative bg-retro-panel border-2 border-retro-border shadow-solid p-6 ${className}`}>
      {children}
    </div>
  );
};
