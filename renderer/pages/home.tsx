import { useEffect } from 'react';
import { EmailOtpModal } from '../components/otpModal'

import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase';

export default function HeroSection({ setIsAuth }) {
  const { push } = useRouter()

  useEffect(() => {
    supabase.auth.onAuthStateChange((e, session) => {
      if (session?.user) {
        push("/next")
      }
    })
  }, [push])

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-black via-slate-900 to-black overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-600/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left space-y-6">
            <div className="animate-fade-in-up">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-6">
                Finetic.AI : Automate Bill Management
                <span className="block mt-2">with AI Precision</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 opacity-0 animate-text-fade-in [animation-delay:200ms]">
                Finetic.AI instantly analyzes and categorizes bills using advanced machine learning. Eliminate manual data entry with our AI-powered financial automation system.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start opacity-0 animate-text-fade-in [animation-delay:400ms]">
                <EmailOtpModal />

              </div>
            </div>

            {/* Automation Features */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto lg:mx-0 opacity-0 animate-text-fade-in [animation-delay:600ms]">
              {[
                { label: 'Instant Processing', metric: '<2min' },
                { label: 'Accuracy Rate', metric: '99.8%' },
                { label: 'Formats Supported', metric: '200+' },
              ].map((stat, index) => (
                <div key={index} className="text-center p-4 bg-black/30 rounded-xl border border-slate-800">
                  <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                    {stat.metric}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Processing Demo */}
          <div className="flex-1 relative mt-16 lg:mt-0 opacity-0 animate-fade-in-up [animation-delay:800ms]">
            <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-1 shadow-2xl border border-slate-800">
              <div className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-black">
                {/* Mock AI bill processing interface */}
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg">
                    <div className="h-12 w-12 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-slate-700/30 rounded w-full animate-pulse" />
                      <div className="h-3 bg-slate-700/30 rounded w-3/4 mt-2 animate-pulse" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/20 rounded-lg">
                      <div className="text-sm text-cyan-400 mb-2">Vendor</div>
                      <div className="h-4 bg-slate-700/30 rounded w-2/3 animate-pulse" />
                    </div>
                    <div className="p-4 bg-slate-800/20 rounded-lg">
                      <div className="text-sm text-violet-400 mb-2">Amount</div>
                      <div className="h-4 bg-slate-700/30 rounded w-1/3 animate-pulse" />
                    </div>
                    <div className="p-4 bg-slate-800/20 rounded-lg">
                      <div className="text-sm text-cyan-400 mb-2">Due Date</div>
                      <div className="h-4 bg-slate-700/30 rounded w-1/2 animate-pulse" />
                    </div>
                    <div className="p-4 bg-slate-800/20 rounded-lg">
                      <div className="text-sm text-violet-400 mb-2">Category</div>
                      <div className="h-4 bg-slate-700/30 rounded w-1/4 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative AI elements */}
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-2xl shadow-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}