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
                <p className="text-sm text-gray-500 text-center mt-4 pt-4 border-t">
                  Currently available for El Salvador
                </p>
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

      {/* Singapore Transformation Story */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-green-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-semibold mb-6">
                Data-Driven Transformation
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                How Singapore went from poor to prosperous in 50 years
              </h2>
              <div className="space-y-4 text-blue-100 text-lg">
                <p className="leading-relaxed">
                  <span className="font-semibold text-white">Lee Kuan Yew</span> transformed Singapore from a poor developing nation to one of the world&apos;s richest countries through <span className="font-semibold text-white">relentless data-driven decision-making</span>.
                </p>
                <p className="leading-relaxed">
                  Every major policy - from water infrastructure to economic zones - was <span className="font-semibold text-white">tested, measured, and optimized</span> before implementation.
                </p>
                <p className="leading-relaxed">
                  <span className="font-semibold text-white">WorldSim gives your government the same power</span> - test critical decisions instantly instead of learning from expensive mistakes.
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🇸🇬</span>
                  </div>
                  <div>
                    <div className="font-bold text-xl mb-2">Singapore 1965</div>
                    <div className="text-blue-100">GDP per capita: $500</div>
                    <div className="text-blue-100">Unemployment: 14%</div>
                    <div className="text-blue-100">Status: Developing nation</div>
                  </div>
                </div>
                <div className="border-t border-white/20 my-6"></div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div>
                    <div className="font-bold text-xl mb-2">Singapore 2015</div>
                    <div className="text-white font-semibold">GDP per capita: $55,000 (110x growth)</div>
                    <div className="text-white font-semibold">Unemployment: 2%</div>
                    <div className="text-white font-semibold">Status: Top 5 richest in the world</div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="text-sm text-blue-100 italic">
                    &quot;Test ideas rigorously. Implement what works. Discard what doesn&apos;t. Never guess when you can measure.&quot;
                  </div>
                  <div className="text-sm text-white mt-2">— Lee Kuan Yew, Founding Prime Minister</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-xl text-blue-100 mb-6">
              <span className="font-bold text-white">El Salvador can follow the same path.</span> Test policies today that transform nations tomorrow.
            </p>
            <Link
              href="/interactive"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-900 font-bold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Try El Salvador Demo
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Why El Salvador First? Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Start with El Salvador?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-semibold mb-2">Complete Coverage</h3>
              <p className="text-gray-600">All 14 departments mapped with real infrastructure data</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🌡️</div>
              <h3 className="font-semibold mb-2">Climate Vulnerable</h3>
              <p className="text-gray-600">Highest stakes for testing scenarios (drought, flooding, migration)</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="font-semibold mb-2">Innovation-Friendly</h3>
              <p className="text-gray-600">Government open to data-driven policy tools</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-semibold mb-2">Perfect Proof Point</h3>
              <p className="text-gray-600">Small enough to model completely, large enough to matter</p>
            </div>
          </div>
          <p className="text-center text-gray-600 mt-8">
            Success here → Scale to 50+ similar nations
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              From Question to Decision in 3 Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Answer critical policy questions in seconds, not months
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
                  Import Government Data
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Upload your existing energy, water, and infrastructure data. Or use our pre-loaded El Salvador dataset to start immediately.
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
                  Test Your Policy
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Ask questions like &quot;What if drought reduces rainfall 30%?&quot; or &quot;Can we phase out coal by 2030?&quot; Adjust policy levers and run simulations.
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
                  Get Cabinet-Ready Recommendations
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  See which regions fail first, investment costs, ROI calculations, and action timelines. Download reports to share with your cabinet.
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
              Built for Decision-Makers
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to make billion-dollar decisions with confidence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Identify Crisis Zones Instantly',
                description: 'See which regions will fail first under different scenarios - before it happens',
                gradient: 'from-red-600 to-red-700',
              },
              {
                icon: '⚡',
                title: '10-Second Simulations',
                description: 'Test unlimited policy scenarios in seconds. No waiting for consultant reports',
                gradient: 'from-blue-600 to-blue-700',
              },
              {
                icon: '💰',
                title: 'ROI Calculations Built-In',
                description: 'Every recommendation shows investment cost, economic impact, and payback period',
                gradient: 'from-green-600 to-green-700',
              },
              {
                icon: '📋',
                title: 'Cabinet-Ready Reports',
                description: 'Download professional reports with action items, costs, and timelines for stakeholders',
                gradient: 'from-purple-600 to-purple-700',
              },
              {
                icon: '🌍',
                title: 'Multi-Domain Modeling',
                description: 'Test energy, water, climate, and economic scenarios - see how everything connects',
                gradient: 'from-orange-600 to-orange-700',
              },
              {
                icon: '🛡️',
                title: 'Prevent Expensive Mistakes',
                description: 'Test before you build. Avoid billions wasted on infrastructure that doesn\'t work',
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
            Don&apos;t guess. Don&apos;t wait. Test your policies now.
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join the data-driven government revolution in El Salvador.
          </p>
          <Link
            href="/interactive"
            className="inline-flex items-center px-10 py-5 bg-white text-blue-600 font-bold text-lg rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Try El Salvador Demo
            <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-sm text-blue-200 mt-6">
            No credit card required • Get results in 10 seconds • Used by policymakers
          </p>
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
