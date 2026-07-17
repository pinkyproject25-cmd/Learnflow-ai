import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Sparkles, BrainCircuit, Code, Award, Target, ChevronRight, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  const { setTab, user } = useApp();

  return (
    <div id="landing-page" className="min-h-[calc(100vh-64px)] bg-gray-50/50">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-5xl px-6 py-16 text-center md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Intelligent Curriculum Synthesis Powered by Google Gemini 3.5 Flash</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 font-sans text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
        >
          Your Complete AI-Guided <br />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Personalized Learning Path
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-500 md:text-lg"
        >
          Draft structured weekly learning goals, read dynamic academic lessons, code in an interactive playground, and take assessments from a single intelligent workplace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          {user ? (
            <button
              onClick={() => setTab('dashboard')}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 font-semibold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Go to Workspace
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setTab('register')}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 font-semibold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
              >
                Start Learning Now
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => setTab('login')}
                className="rounded-2xl border border-gray-200 bg-white px-8 py-4 font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer"
              >
                Log In
              </button>
            </>
          )}
        </motion.div>
      </section>

      {/* Feature Bento Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-center font-sans text-2xl font-bold tracking-tight text-gray-900 md:text-3xl mb-12">
          Everything You Need, Synthesized in One Ecosystem
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h3 className="font-sans font-bold text-gray-900">Custom Roadmap</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              Enter any learning objective. The AI agent crafts week-by-week goals matching your level and available time.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="font-sans font-bold text-gray-900">Adaptive Lessons</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              Dynamic core text explanations, real-world metaphor notes, and flashcard summarizations curated on demand.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Code className="h-5 w-5" />
            </div>
            <h3 className="font-sans font-bold text-gray-900">Sandbox Playground</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              Write live Javascript in an embedded workspace, evaluating code algorithms against dynamic test suites.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="font-sans font-bold text-gray-900">Adaptive Assessments</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              Plausible MCQ quizzes testing technical depth. Review complete explanations, and receive custom coaching notes.
            </p>
          </div>
        </div>
      </section>

      {/* Social proof/roles banner */}
      <section className="bg-white border-t border-gray-100 py-12 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
            Tailored learning roles optimized for the future
          </p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
              <GraduationCap className="h-4 w-4" /> Academic Students
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
              <Sparkles className="h-4 w-4" /> Working Professionals
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
              <BrainCircuit className="h-4 w-4" /> Career Changers
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
              <Award className="h-4 w-4" /> Educational Mentors
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
