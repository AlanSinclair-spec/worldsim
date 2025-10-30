import { HTMLAttributes } from 'react';

interface SkeletonLoaderProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'card' | 'text' | 'chart' | 'map' | 'custom';
  lines?: number;
  height?: string;
}

/**
 * Animated skeleton loader with shimmer effect
 * Variants match common content types in the app
 */
export function SkeletonLoader({
  variant = 'custom',
  lines = 3,
  height = 'h-4',
  className = '',
  ...props
}: SkeletonLoaderProps) {
  const shimmerClass = 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';

  if (variant === 'text') {
    return (
      <div className={`space-y-3 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${shimmerClass} rounded ${height} ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`rounded-lg border border-gray-200 p-6 space-y-4 ${className}`} {...props}>
        {/* Card header */}
        <div className="flex items-center gap-3">
          <div className={`${shimmerClass} rounded-full w-12 h-12`} />
          <div className="flex-1 space-y-2">
            <div className={`${shimmerClass} rounded h-4 w-1/2`} />
            <div className={`${shimmerClass} rounded h-3 w-1/3`} />
          </div>
        </div>
        {/* Card content */}
        <div className="space-y-2">
          <div className={`${shimmerClass} rounded h-3 w-full`} />
          <div className={`${shimmerClass} rounded h-3 w-5/6`} />
          <div className={`${shimmerClass} rounded h-3 w-4/6`} />
        </div>
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={`rounded-lg border border-gray-200 p-6 space-y-4 ${className}`} {...props}>
        {/* Chart title */}
        <div className={`${shimmerClass} rounded h-6 w-1/3`} />
        {/* Chart area */}
        <div className="flex items-end justify-between gap-2 h-48">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`${shimmerClass} rounded w-full`}
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-4">
          <div className={`${shimmerClass} rounded h-3 w-20`} />
          <div className={`${shimmerClass} rounded h-3 w-20`} />
        </div>
      </div>
    );
  }

  if (variant === 'map') {
    return (
      <div className={`relative rounded-lg overflow-hidden bg-gray-100 ${className}`} {...props}>
        {/* Map pattern */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${shimmerClass} w-3/4 h-3/4 rounded-full opacity-20`} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`${shimmerClass} rounded h-8 w-32 mx-auto mb-2`} />
            <div className={`${shimmerClass} rounded h-4 w-24 mx-auto`} />
          </div>
        </div>
      </div>
    );
  }

  // Custom variant
  return (
    <div className={`${shimmerClass} rounded ${height} ${className}`} {...props} />
  );
}

/**
 * Skeleton for statistics cards (used in ResultsPanel)
 */
export function SkeletonStatCard() {
  const shimmerClass = 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className={`${shimmerClass} rounded h-4 w-24 mb-3`} />
      <div className={`${shimmerClass} rounded h-8 w-32 mb-2`} />
      <div className={`${shimmerClass} rounded h-3 w-20`} />
    </div>
  );
}
