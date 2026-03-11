import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background Shape - Subtle rounded square */}
            <rect width="40" height="40" rx="10" fill="#111827" />

            {/* The "J" Hook - Balanced and proportional */}
            {/* Color: #10b981 (Jotrow Emerald) */}
            <path
                d="M25 12V24C25 28.4183 21.4183 32 17 32C14.2386 32 12 29.7614 12 27"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Accent dot - Aligned with the stem of the J */}
            <circle cx="15.5" cy="15.5" r="3.5" fill="#10b981" />
        </svg>
    );
};

export default Logo;
