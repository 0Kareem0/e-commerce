import { forwardRef } from 'react';

export const Badge = forwardRef(({ className = '', variant = 'secondary', children, ...props }, ref) => {
  const variants = {
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'bg-transparent border border-gray-300 text-gray-800',
  };

  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors';

  return (
    <span
      ref={ref}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
});