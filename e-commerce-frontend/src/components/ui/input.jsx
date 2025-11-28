import { forwardRef } from 'react';

export const Input = forwardRef(({ className = '', type = 'text', ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={`border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full ${className}`}
    {...props}
  />
));