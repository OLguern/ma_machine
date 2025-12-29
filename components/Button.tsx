
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "px-4 py-2 rounded transition-all duration-200 active:scale-95 font-medium flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-stone-800 text-stone-100 hover:bg-stone-700 shadow-md",
    secondary: "bg-stone-200 text-stone-800 hover:bg-stone-300 border border-stone-300",
    danger: "bg-red-800 text-red-50 hover:bg-red-700 shadow-md"
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
