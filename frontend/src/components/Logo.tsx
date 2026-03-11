import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
    return (
        <div className={`relative group inline-block ${className}`} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible"
            >
                {/* Background Shape is removed for this sleek concept to blend with Navbar naturally (or we can keep of course? Navbar has its own styling) */}
                {/* Concept 3 is an abstract letter J with emerald green shape. Let's make it sharp and beautiful */}
                
                {/* The "J" Body: Concept 3 flat geometry */}
                {/* A top left bar, down the right stem, curving elegantly on the bottom left */}
                <path
                    d="M 14 8 H 26 V 26 C 26 31.5 21.5 36 16 36 C 10.5 36 6 31.5 6 26"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    fill="none"
                    className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                />

                {/* The Distinct Dot inside the curve */}
                <circle 
                    cx="16" 
                    cy="26" 
                    r="4.5" 
                    fill="#10b981"
                    className="dot group-hover:fill-[#34d399]"
                />
                
                <style>
                    {`
                        /* Custom jumping animation for the dot */
                        .group:hover .dot {
                            /* The ball jumps up, falls down, and settles */
                            animation: jumpDot 1s cubic-bezier(0.28, 0.84, 0.42, 1) forwards;
                        }

                        @keyframes jumpDot {
                            0% { 
                                transform: translateY(0); 
                            }
                            40% { 
                                transform: translateY(-13px); /* Shoots up, safely below top bar */
                                animation-timing-function: cubic-bezier(0.8, 0, 0.8, 1);
                            }
                            75% { 
                                transform: translateY(0); /* Hits the ground */
                                animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
                            }
                            88% { 
                                transform: translateY(-3px); /* Small bounce up */
                                animation-timing-function: cubic-bezier(0.8, 0, 0.8, 1);
                            }
                            100% { 
                                transform: translateY(0); /* Settles */
                            }
                        }
                    `}
                </style>
            </svg>
        </div>
    );
};

export default Logo;
