import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext.tsx';
import Loader from '../components/Loader.tsx';
import { BookOpen, Award, CheckCircle2, Bookmark, Star, Sparkles, Code, ChevronLeft, Lightbulb, Info, AlertTriangle, HelpCircle } from 'lucide-react';

interface LessonViewerProps {
  topicId: string | null;
  topicTitle: string | null;
}

interface Example {
  title: string;
  code?: string;
  explanation: string;
}

interface LessonData {
  id: string;
  title: string;
  content: string; // Detailed Explanation
  notes: string[];
  examples: Example[];
  summary?: string;
  keyConcepts?: string[];
  importantPoints?: string[];
}

export default function LessonViewer({ topicId, topicTitle }: LessonViewerProps) {
  const { progress, completeLesson, addBookmark, bookmarks, setTab } = useApp();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'concepts' | 'notes' | 'examples' | 'important'>('content');

  // Load lesson from API
  useEffect(() => {
    if (!topicId) return;
    const fetchLesson = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/lesson/${topicId}`);
        setLesson(res.data);
      } catch (err: any) {
        console.error('Error fetching lesson text', err);
        setError(err.response?.data?.error || 'Failed to curate your AI study content.');
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [topicId]);

  if (!topicId) {
    return (
      <div id="no-lesson-view" className="flex flex-col items-center justify-center p-12 text-center max-w-sm mx-auto min-h-[calc(100vh-120px)]">
        <BookOpen className="h-12 w-12 text-gray-300 mb-4 animate-pulse" />
        <h3 className="text-base font-bold text-gray-800">No active study selected</h3>
        <p className="text-xs text-gray-400 mt-1">
          Open the Timeline and click 'Read Lesson Notes' to start.
        </p>
        <button
          onClick={() => setTab('journey')}
          className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          Open Study Timeline →
        </button>
      </div>
    );
  }

  if (loading) {
    return <Loader message="Analyzing syllabus and writing study materials with Gemini..." />;
  }

  if (error || !lesson) {
    return (
      <div id="lesson-error-view" className="p-8 max-w-md mx-auto text-center space-y-4">
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-rose-700">
          <p className="text-sm font-semibold">{error || 'Could not load lesson'}</p>
        </div>
        <button
          onClick={() => setTab('journey')}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
        >
          Return to Timeline
        </button>
      </div>
    );
  }

  const isCompleted = progress?.completedLessons.includes(topicId);
  const isBookmarked = bookmarks.some((b) => b.itemId === topicId && b.type === 'lesson');

  const handleBookmark = () => {
    if (isBookmarked) return;
    addBookmark('lesson', topicId, lesson.title);
  };

  const handleMarkComplete = () => {
    completeLesson(topicId);
  };

  // Safe and beautiful Client Markdown syntax helper for clean presentation without dependencies
  const renderSimpleMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-gray-900 font-sans mt-4 mb-2 tracking-tight">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-base font-extrabold text-gray-900 font-sans mt-6 mb-3 tracking-tight border-b border-gray-100 pb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-lg font-black text-gray-900 font-sans mt-8 mb-4 tracking-tight">
            {line.replace('# ', '')}
          </h2>
        );
      }
      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="text-xs text-gray-600 list-disc ml-5 mb-1.5 leading-relaxed">
            {line.substring(2)}
          </li>
        );
      }
      // Simple bold text highlights
      if (line.trim() === '') {
        return <div key={idx} className="h-3" />;
      }

      return (
        <p key={idx} className="text-xs text-gray-600 leading-relaxed mb-3">
          {line}
        </p>
      );
    });
  };

  return (
    <div id="lesson-viewer-workspace" className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <button
          onClick={() => setTab('journey')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Timeline
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBookmark}
            disabled={isBookmarked}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
              isBookmarked
                ? 'border-indigo-100 bg-indigo-50/50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Star className={`h-4 w-4 ${isBookmarked ? 'fill-indigo-600 text-indigo-600' : ''}`} />
            {isBookmarked ? 'Saved' : 'Save Notes'}
          </button>

          <button
            onClick={handleMarkComplete}
            disabled={isCompleted}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
              isCompleted
                ? 'bg-emerald-50 border border-emerald-100 text-emerald-700 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 cursor-pointer'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isCompleted ? 'Topic Complete' : 'Mark Lesson Complete'}
          </button>
        </div>
      </div>

      {/* Lesson Metadata */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">AI-Generated Core Lesson</span>
        <h1 className="text-2xl font-black text-gray-900 font-sans tracking-tight">{lesson.title}</h1>
      </div>

      {/* Summary Banner */}
      {lesson.summary && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 flex items-start gap-3.5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">AI Coach Summary</span>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{lesson.summary}</p>
          </div>
        </div>
      )}

      {/* Sub-tab arrays */}
      <div className="flex border-b border-gray-100 gap-4 overflow-x-auto pb-px">
        {[
          { id: 'content', label: 'Detailed Explanation', icon: BookOpen },
          { id: 'concepts', label: 'Key Concepts', icon: HelpCircle },
          { id: 'notes', label: 'Notes', icon: Lightbulb },
          { id: 'examples', label: 'Examples', icon: Code },
          { id: 'important', label: 'Important Points', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-3 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 font-extrabold'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main tab viewer content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm min-h-64">
        {activeTab === 'content' && (
          <div className="prose max-w-none prose-sm leading-relaxed text-gray-700">
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest mb-3">Topic Walkthrough</span>
            {renderSimpleMarkdown(lesson.content)}
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest mb-2">Core Technical Concepts</span>
            <div className="grid gap-4 sm:grid-cols-2">
              {lesson.keyConcepts && lesson.keyConcepts.length > 0 ? (
                lesson.keyConcepts.map((concept, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-black text-slate-700">{idx + 1}</span>
                      <span className="text-xs font-bold text-gray-900">Concept Definition</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed pt-1.5">{concept}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 col-span-2 text-center py-4">No key concepts defined. See study notes for structured core terms.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest mb-2">Key Summaries & Insights</span>
            <div className="grid gap-4 sm:grid-cols-2">
              {lesson.notes.map((note, idx) => (
                <div key={idx} className="bg-indigo-50/20 border border-indigo-100/50 rounded-2xl p-4 space-y-1 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-100 text-[10px] font-black text-indigo-700">{idx + 1}</span>
                    <span className="text-xs font-bold text-gray-900">Takeaway</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pt-1.5">{note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="space-y-6">
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest mb-2">Practical Applications</span>
            {lesson.examples.map((ex, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                  <Code className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-extrabold text-gray-800">{ex.title}</span>
                </div>

                <div className="p-4 space-y-4">
                  {ex.code && (
                    <pre className="rounded-xl bg-slate-950 p-4 text-xs font-mono text-slate-100 overflow-x-auto">
                      <code>{ex.code}</code>
                    </pre>
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 block uppercase tracking-wider">Concept walkthrough</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{ex.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'important' && (
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest mb-2">Crucial Takeaways & Rules</span>
            <div className="space-y-3">
              {lesson.importantPoints && lesson.importantPoints.length > 0 ? (
                lesson.importantPoints.map((pt, idx) => (
                  <div key={idx} className="bg-amber-50/30 border border-amber-100/50 rounded-2xl p-4 flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                      <Info className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold text-amber-800 block uppercase tracking-widest">Rule {idx + 1}</span>
                      <p className="text-xs text-gray-700 leading-relaxed">{pt}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 text-center py-4">Read carefully to discover advanced edge cases and patterns.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
