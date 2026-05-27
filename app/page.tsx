'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Zap, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: 'Questions',
      description: 'Curated questions designed for deep learning and retention'
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Get immediate feedback on your answers to reinforce learning'
    },
    {
      icon: MessageCircle,
      title: 'Explanation & Discussion',
      description: 'Learn from detailed explanations and community discussions'
    }
  ];

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl space-y-12 text-center">
          {/* Label */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDelay: '100ms' }}
          >
            <span className="inline-block rounded-full bg-slate-800/50 px-4 py-1.5 text-xs font-medium tracking-wide text-cyan-400 ring-1 ring-cyan-500/30">
              AI-powered exam learning
            </span>
          </div>

          {/* Headline */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-50 leading-tight">
              Learn Smarter.
              <br />
              Practice Faster.
            </h1>
          </div>

          {/* Supporting text */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '300ms' }}
          >
            <p className="text-lg text-slate-400 leading-relaxed">
              Study certification questions in a focused and modern learning environment. Master concepts through intelligent practice and detailed explanations.
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className={`transition-all duration-700 flex flex-col sm:flex-row items-center justify-center gap-4 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-8 py-3 font-semibold text-slate-900 transition-all hover:bg-cyan-400 active:scale-95"
            >
              Start Learning (Dashboard)
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/mock-test"
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 px-8 py-3 font-semibold text-cyan-400 transition-all hover:bg-slate-800/50 hover:border-cyan-500/60"
            >
              Làm Đề Thi Thử (Mock Test)
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t border-slate-800 bg-slate-900/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-16">
          {/* Section heading */}
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-50">
              Everything you need to succeed
            </h2>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 transition-all hover:border-slate-600 hover:bg-slate-800/50"
                >
                  <div className="mb-4 inline-block rounded-lg bg-slate-800 p-3 text-cyan-400 transition-colors group-hover:bg-slate-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-50">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-slate-800 bg-gradient-to-b from-slate-900/50 to-slate-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-slate-50">
            Ready to start learning?
          </h2>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-8 py-3 font-semibold text-slate-900 transition-all hover:bg-cyan-400 active:scale-95"
          >
            Start Learning (Dashboard)
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
