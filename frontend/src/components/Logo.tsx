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
            <rect width="40" height="40" rx="8" fill="#0c0c0c" />

            {/* The "J" Hook - Ultra minimalist 3-line path */}
            {/* Color: #10b981 (Jotrow Emerald) */}
            <path
                d="M12 12H28V28C28 32.4183 24.4183 36 20 36H16"
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Accent dot - representing a note or focus point */}
            <rect x="12" y="22" width="6" height="6" rx="1" fill="#10b981" />
        </svg>
    );
};

export default Logo;
