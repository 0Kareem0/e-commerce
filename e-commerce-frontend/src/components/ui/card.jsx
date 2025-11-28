import { forwardRef } from 'react';

export const Card = forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
));

export const CardContent = forwardRef(({ className = '', children, ...props }, ref) => (
  <div ref={ref} className={`p-6 ${className}`} {...props}>
    {children}
  </div>
));