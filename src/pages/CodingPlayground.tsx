import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext.tsx';
import Loader from '../components/Loader.tsx';
import { Code, Play, RefreshCw, Star, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Terminal, AlertCircle } from 'lucide-react';

interface CodingPlaygroundProps {
  topicId: string | null;
  topicTitle: string | null;
}

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

interface CodingData {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  language: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
}

export default function CodingPlayground({ topicId: initialTopicId, topicTitle: initialTopicTitle }: CodingPlaygroundProps) {
  const { bookmarks, addBookmark, setTab, progress, continuousSubject, setContinuousSubject } = useApp();

  const [activeTopicId, setActiveTopicId] = useState<string | null>(initialTopicId);
  const [coding, setCoding] = useState<CodingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userCode, setUserCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);

  useEffect(() => {
    setActiveTopicId(initialTopicId);
  }, [initialTopicId]);

  // Load coding exercise from API
  useEffect(() => {
    if (!activeTopicId) return;
    const fetchCodingChallenge = async () => {
      try {
        setLoading(true);
        setError(null);
        setTestResults([]);
        setAllPassed(null);
        setSubmitError(null);

        const url = activeTopicId === 'continuous'
          ? `/api/coding/continuous?subject=${encodeURIComponent(continuousSubject)}`
          : `/api/coding/${activeTopicId}`;

        const res = await axios.get(url);
        setCoding(res.data);
        setUserCode(res.data.starterCode || '');
      } catch (err: any) {
        console.error('Error fetching coding challenge', err);
        setError(err.response?.data?.error || 'Failed to curate your AI coding challenge.');
      } finally {
        setLoading(false);
      }
    };
    fetchCodingChallenge();
  }, [activeTopicId, continuousSubject]);

  if (!activeTopicId) {
    return (
      <div id="coding-landing-container" className="p-6 max-w-4xl mx-auto space-y-8">
        <section className="relative rounded-3xl bg-slate-900 p-6 md:p-8 text-white overflow-hidden shadow-lg border border-slate-800">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-indigo-500 blur-3xl animate-pulse" />
            <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-purple-500 blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Code className="h-3.5 w-3.5 animate-bounce" />
              <span>Workspace Challenges Mode</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight font-sans">
              LearnFlow Dynamic Coding Lab
            </h1>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Test your algorithmic logic and scripting syntax on the fly. Select a programming language or framework below and let Gemini curate a target verification challenge.
            </p>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Config column */}
          <div className="md:col-span-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <span className="text-[10px] font-bold text-indigo-600 block uppercase tracking-wider">Configure Lab Sandbox</span>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-700 block">Select Coding Technology</label>
              <div className="grid grid-cols-2 gap-2">
                {['Python', 'React', 'JavaScript', 'SQL', 'TypeScript', 'HTML/CSS'].map((tech) => {
                  const isSelected = continuousSubject === tech;
                  return (
                    <button
                      key={tech}
                      onClick={() => setContinuousSubject(tech)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                          : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {tech}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTopicId('continuous')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  <Code className="h-4 w-4" />
                  <span>Launch Workspace Lab</span>
                </button>
              </div>
            </div>
          </div>

          {/* Timeline redirect column */}
          <div className="md:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Curriculum Path</span>
              <h3 className="text-lg font-black text-gray-900">Syllabus-Directed Labs</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Work through customized sandbox scripting tasks aligned precisely with your roadmap to practice, complete lessons, and unlock progress points.
              </p>
            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">Needs an active generated path.</span>
              <button
                onClick={() => setTab('journey')}
                className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 transition-all cursor-pointer"
              >
                Go to Timeline
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loader message="Curating algorithm instructions and boilerplate workspace with Gemini..." />;
  }

  if (error || !coding) {
    return (
      <div id="coding-error-view" className="p-8 max-w-md mx-auto text-center space-y-4">
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-rose-700">
          <p className="text-sm font-semibold">{error || 'Could not load coding task'}</p>
        </div>
        <button
          onClick={() => {
            setActiveTopicId(null);
            setTab('dashboard');
          }}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isBookmarked = bookmarks.some((b) => b.itemId === activeTopicId && b.type === 'code');

  const handleBookmark = () => {
    if (isBookmarked) return;
    addBookmark('code', activeTopicId, coding.title);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to restore the starter boilerplate? Any current changes will be lost.')) {
      setUserCode(coding.starterCode);
      setTestResults([]);
      setAllPassed(null);
      setSubmitError(null);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setTestResults([]);
      setAllPassed(null);

      const res = await axios.post('/api/submit-code', {
        topicId: coding.id, // Submit using the generated ID so database can look it up correctly
        code: userCode,
      });

      if (res.data.error) {
        setSubmitError(res.data.error);
        setAllPassed(false);
      } else {
        setTestResults(res.data.results);
        setAllPassed(res.data.success);
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError('An unexpected server error occurred during compilation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="coding-playground" className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="space-y-1">
          <button
            onClick={() => setTab('journey')}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors mb-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Timeline
          </button>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Coding Workspace Playground</span>
          <h1 className="text-xl font-black text-gray-900 font-sans tracking-tight">{coding.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBookmark}
            disabled={isBookmarked}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all ${
              isBookmarked
                ? 'border-indigo-100 bg-indigo-50/50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Star className={`h-4 w-4 ${isBookmarked ? 'fill-indigo-600 text-indigo-600' : ''}`} />
            {isBookmarked ? 'Saved Challenge' : 'Bookmark Task'}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Reset code
          </button>
        </div>
      </div>

      {/* Main Column Split */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Challenge Description */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <div>
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest mb-1.5">Challenge Objective</span>
            <div className="prose prose-sm text-gray-600 leading-relaxed text-xs space-y-3">
              <p className="whitespace-pre-wrap">{coding.description}</p>
            </div>
          </div>

          <div className="border-t border-gray-50 pt-4">
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest mb-3">Verification Targets</span>
            <div className="space-y-2">
              {coding.testCases.map((tc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 font-mono text-[11px]">
                  <div>
                    <span className="text-gray-400">Input:</span> <span className="text-gray-700 font-bold">{tc.input}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Expected:</span> <span className="text-indigo-600 font-bold">{tc.expectedOutput}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Editor Work space */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            {/* Window chrome horizontal bar */}
            <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 block" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 block" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 block" />
                <span className="text-[10px] font-mono text-slate-400 font-bold ml-2">solution.{coding.language === 'javascript' ? 'js' : 'py'}</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 capitalize tracking-widest font-black">{coding.language}</span>
            </div>

            {/* Code Textarea editor container */}
            <div className="relative">
              <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                spellCheck={false}
                rows={16}
                className="w-full bg-slate-900 text-slate-100 font-mono text-xs p-6 outline-none border-none resize-none leading-relaxed"
              />
            </div>

            {/* Editor Action panel */}
            <div className="bg-slate-950 border-t border-slate-800 px-4 py-3 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">Press Run to evaluate test cases</span>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                {isSubmitting ? 'Evaluating...' : 'Run Test Suites'}
              </button>
            </div>
          </div>

          {/* Test Case Outputs Panel */}
          {(allPassed !== null || submitError) && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
                <Terminal className="h-4.5 w-4.5 text-gray-500" />
                <h3 className="text-xs font-bold text-gray-900">Sandbox Console Output</h3>
              </div>

              {submitError ? (
                <div className="flex gap-2 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">Execution Error</span>
                    <p className="mt-1 font-mono">{submitError}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {allPassed ? (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-100 shadow-sm">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                        All Test Cases Passed Successfully!
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-100 shadow-sm">
                        <XCircle className="h-4.5 w-4.5" />
                        Some Test Cases Failed. Check outputs below.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {testResults.map((tr, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-gray-50 bg-gray-50/50 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-500">Test Case {idx + 1}</span>
                          {tr.passed ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Pass</span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">Fail</span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-gray-600 bg-white p-2.5 rounded-lg border border-gray-50">
                          <div>
                            <span className="text-gray-400 block font-sans">Input</span>
                            <span className="font-bold">{tr.input}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-sans">Expected</span>
                            <span className="font-bold text-indigo-600">{tr.expected}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-sans">Actual</span>
                            <span className={`font-bold ${tr.passed ? 'text-emerald-600' : 'text-rose-500'}`}>{tr.actual}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {allPassed && activeTopicId === 'continuous' && (
                    <div className="pt-4 border-t border-gray-100 flex gap-2.5">
                      <button
                        onClick={() => {
                          setActiveTopicId(null);
                          setTimeout(() => setActiveTopicId('continuous'), 50);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Solve Next Challenge</span>
                      </button>
                      <button
                        onClick={() => setActiveTopicId(null)}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        Change Technology
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
