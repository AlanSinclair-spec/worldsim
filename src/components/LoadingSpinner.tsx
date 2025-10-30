import { HTMLAttributes } from 'react';

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  center?: boolean;
}

/**
 * Professional loading spinner with smooth animation
 * Sizes: sm (16px), md (24px), lg (40px)
 */
export function LoadingSpinner({
  size = 'md',
  color = 'text-blue-600',
  text,
  center = false,
  className = '',
  ...props
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  const spinnerClass = `inline-block rounded-full border-t-transparent border-current animate-spin ${sizeClasses[size]} ${color}`;

  const containerClass = `${center ? 'flex items-center justify-center' : 'inline-flex items-center gap-2'} ${className}`;

  return (
    <div className={containerClass} {...props}>
      <div
        className={spinnerClass}
        role="status"
        aria-label={text || 'Loading'}
      />
      {text && (
        <span className={`${color} font-medium`}>
          {text}
        </span>
      )}
    </div>
  );
}
