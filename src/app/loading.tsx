import { LoadingSpinner } from '@/components/LoadingSpinner';

/**
 * Next.js Loading UI
 *
 * Automatically displayed during route transitions and Suspense boundaries.
 * Provides a professional full-page loading experience.
 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="text-center">
        {/* Logo or Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl shadow-lg">
            <span className="text-4xl">🌍</span>
          </div>
        </div>

        {/* Loading Spinner */}
        <LoadingSpinner
          size="lg"
          color="text-blue-600"
          center
          className="mb-4"
        />

        {/* Loading Text */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">Loading WorldSim</h2>
        <p className="text-sm text-gray-500">Preparing your simulation environment...</p>
      </div>
    </div>
  );
}
