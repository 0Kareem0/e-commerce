import { forwardRef } from 'react';

export const Label = forwardRef(({ className = '', children, ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium text-gray-700 mb-1 block ${className}`}
    {...props}
  >
    {children}
  </label>
));