import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Mail, Lock, Sparkles, GraduationCap, ChevronRight, Briefcase, Award } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthPages() {
  const { currentTab, setTab, login, register, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'professional' | 'job_seeker'>('student');
  
  // Forgot Password flow mock
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill out all credentials.', 'error');
      return;
    }

    if (isForgotPassword) {
      showToast('A secure password reset link has been dispatched to your email!', 'success');
      setIsForgotPassword(false);
      return;
    }

    if (currentTab === 'login') {
      const ok = await login(email, password);
      if (ok) setTab('dashboard');
    } else {
      const ok = await register(email, password, role);
      if (ok) setTab('profile'); // Send new user to Profile page to set details
    }
  };

  return (
    <div id="auth-panel" className="flex min-h-[calc(100vh-64px)] items-stretch">
      {/* Visual Showcase Block */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-indigo-500 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500 blur-3xl animate-pulse" />
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg">
            <Sparkles className="h-5.5 w-5.5" />
          </div>
          <span className="font-sans text-xl font-bold tracking-tight">LearnFlow AI</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold font-sans tracking-tight leading-tight">
            Deploy Gemini 3.5 Flash to tutor your technical career.
          </h2>
          <p className="text-sm text-gray-400 mt-4 leading-relaxed">
            Configure target job roles, define study milestones, practice scripting in safe JavaScript sandboxes, and compile complete student reports.
          </p>
        </div>

        <div className="relative z-10 text-xs text-gray-400">
          © 2026 LearnFlow AI Inc. All systems nominal.
        </div>
      </div>

      {/* Inputs Form Block */}
      <div className="flex-1 bg-white flex flex-col justify-center px-8 py-12 md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 font-sans">
            {isForgotPassword 
              ? 'Reset Account Password' 
              : currentTab === 'login' 
                ? 'Welcome Back Learner' 
                : 'Create LearnFlow Account'
            }
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {isForgotPassword
              ? 'Enter email to receive secure recovery coordinates.'
              : currentTab === 'login'
                ? 'Sign in to access your customized learning roadmap.'
                : 'Formulate an account to draft custom weekly curriculums.'
            }
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Email Field */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Password Field (Hidden during forgot password) */}
            {!isForgotPassword && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Password
                  </label>
                  {currentTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 focus:outline-none"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Role selection only on signup */}
            {currentTab === 'register' && !isForgotPassword && (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Learning Persona / Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'student', label: 'Student', icon: GraduationCap },
                    { id: 'professional', label: 'Professional', icon: Briefcase },
                    { id: 'job_seeker', label: 'Job Seeker', icon: ChevronRight },
                    { id: 'teacher', label: 'Teacher', icon: Award },
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSel = role === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setRole(p.id as any)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                          isSel
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                            : 'border-gray-100 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              {isForgotPassword 
                ? 'Send Reset Credentials' 
                : currentTab === 'login' 
                  ? 'Access Workspace' 
                  : 'Synthesize Account'
              }
            </button>
          </form>

          {/* Toggle Flow Links */}
          <div className="mt-6 text-center text-xs">
            {isForgotPassword ? (
              <button
                onClick={() => setIsForgotPassword(false)}
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Back to Sign In
              </button>
            ) : currentTab === 'login' ? (
              <span className="text-gray-400">
                New to LearnFlow AI?{' '}
                <button
                  onClick={() => setTab('register')}
                  className="font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Create free account
                </button>
              </span>
            ) : (
              <span className="text-gray-400">
                Already registered?{' '}
                <button
                  onClick={() => setTab('login')}
                  className="font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
