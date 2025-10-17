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
                El Salvador Digital Twin
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
                Test the future
                <span className="block bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  before living it
                </span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Simulate infrastructure, energy, and climate scenarios for El Salvador.
                Make data-driven decisions with confidence.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/interactive"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  Try Interactive Demo
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>

                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:shadow-lg transition-all duration-200"
                >
                  Learn More
                </Link>
              </div>

              {/* Social Proof */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>14 Departments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time Simulation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>AI-Powered Insights</span>
                </div>
              </div>
            </div>

            {/* Right: Map Preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl blur-2xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="p-2">
                  <MapView height="500px" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to simulate and analyze infrastructure scenarios
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Upload Your Data
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Import historical energy, rainfall, and infrastructure data in CSV format.
                  Our system validates and processes your data automatically.
                </p>
              </div>
              {/* Connector line */}
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-600 to-green-600 opacity-20"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Configure Scenarios
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Adjust parameters like solar growth, rainfall changes, and infrastructure capacity.
                  Choose from preset scenarios or create custom simulations.
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-600 to-green-600 opacity-20"></div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Analyze Results
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  View interactive charts, stress maps, and AI-generated insights.
                  Export data and share findings with stakeholders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for infrastructure planning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🗺️',
                title: 'Interactive Maps',
                description: 'Explore El Salvador\'s 14 departments with interactive Mapbox visualizations',
                gradient: 'from-blue-600 to-blue-700',
              },
              {
                icon: '📊',
                title: 'Real-time Analytics',
                description: 'Track infrastructure stress, energy demand, and climate impacts in real-time',
                gradient: 'from-green-600 to-green-700',
              },
              {
                icon: '🤖',
                title: 'AI Insights',
                description: 'Get bilingual summaries and recommendations powered by GPT-4 and Claude',
                gradient: 'from-purple-600 to-purple-700',
              },
              {
                icon: '📈',
                title: 'Scenario Planning',
                description: 'Model multiple futures with customizable parameters and preset scenarios',
                gradient: 'from-orange-600 to-orange-700',
              },
              {
                icon: '💾',
                title: 'Data Export',
                description: 'Download results as CSV or PNG for reports and presentations',
                gradient: 'from-pink-600 to-pink-700',
              },
              {
                icon: '🌍',
                title: 'Climate Modeling',
                description: 'Simulate rainfall changes and temperature trends to predict impacts',
                gradient: 'from-teal-600 to-teal-700',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center text-3xl mb-6 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to test the future?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Start simulating infrastructure scenarios for El Salvador today.
            No credit card required.
          </p>
          <Link
            href="/interactive"
            className="inline-flex items-center px-10 py-5 bg-white text-blue-600 font-bold text-lg rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Launch Interactive Demo
            <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
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

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 WorldSim. Empowering decision-makers with data-driven insights.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
