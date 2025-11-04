'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapView } from '@/components/MapView';

/**
 * WorldSim Landing Page
 *
 * Professional SaaS-style homepage featuring:
 * - Hero section with interactive map preview
 * - Value proposition and CTA
 * - "How it Works" section
 * - Feature highlights
 * - Modern gradient design
 */
export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              {/* Mobile: Icon only */}
              <div className="sm:hidden">
                <Image
                  src="/logo-icon.svg"
                  alt="WorldSim"
                  width={40}
                  height={40}
                  className="transition-transform group-hover:scale-105"
                />
              </div>
              {/* Desktop: Full logo */}
              <div className="hidden sm:block">
                <Image
                  src="/logo.svg"
                  alt="WorldSim - El Salvador Digital Twin"
                  width={180}
                  height={48}
                  className="h-10 w-auto transition-transform group-hover:scale-105"
                />
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/demo"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                About
              </Link>
              <Link
                href="/interactive"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Try Demo
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] bg-top"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Value Prop */}
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                Policy Flight Simulator for Governments
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                Test El Salvador&apos;s Policy Decisions in
                <span className="block bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  10 Seconds
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed font-medium">
                Instead of 6 months and $100K+ on consultants. See which regions fail first before spending millions on infrastructure.
              </p>

              <p className="text-lg text-gray-600 mt-4">
                Complete digital twin of all 14 departments
              </p>

              {/* Value Comparison Card */}
              <div className="bg-white rounded-xl shadow-lg border-2 border-blue-100 p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Traditional Approach</div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="text-red-500">✕</span>
                        <span>6 months timeline</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-red-500">✕</span>
                        <span>$100K+ consultants</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-red-500">✕</span>
                        <span>One scenario only</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-red-500">✕</span>
                        <span>Static reports</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-blue-600 mb-2">WorldSim</div>
                    <div className="space-y-2 text-sm text-gray-900 font-medium">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span>10 seconds</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span>Real-time testing</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span>Unlimited what-ifs</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span>Interactive maps</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/interactive"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  Try El Salvador Demo
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>

                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:shadow-lg transition-all duration-200"
                >
                  See How It Works
                </Link>
              </div>

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Complete Digital Twin</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Instant Results</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Cabinet-Ready Reports</span>
                </div>
              </div>
            </div>

            {/* Right: Map Preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl blur-2xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="p-2">
                  <div className="h-[300px] sm:h-[400px] lg:h-[500px]">
                    <MapView height="100%" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center space-x-3 mb-4 group inline-block">
                <Image
                  src="/logo-icon.svg"
                  alt="WorldSim"
                  width={32}
                  height={32}
                  className="transition-transform group-hover:scale-105"
                />
                <span className="text-2xl font-bold text-white">WorldSim</span>
              </Link>
              <p className="text-gray-400 mb-4">
                Digital twin simulation platform for El Salvador&apos;s infrastructure, energy, and climate planning.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/interactive" className="hover:text-white transition-colors">Interactive Demo</Link></li>
                <li><Link href="/demo" className="hover:text-white transition-colors">About</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="https://github.com/AlanSinclair-spec/worldsim" className="hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p className="text-gray-500 mb-4">&copy; 2024 WorldSim. Empowering decision-makers with data-driven insights.</p>
            <div className="flex items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white text-xs font-semibold shadow-lg animate-pulse-glow">
                <span className="text-base">🤖</span>
                <span>Built with GPT-4 & Claude</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
