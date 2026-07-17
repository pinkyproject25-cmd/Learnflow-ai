import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext.tsx';
import Loader from '../components/Loader.tsx';
import { Award, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Star, AlertCircle, HelpCircle } from 'lucide-react';

interface QuizWorkspaceProps {
  topicId: string | null;
  topicTitle: string | null;
}

interface QuestionReport {
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number;
  passed: boolean;
  explanation: string;
}

interface QuizData {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
  }>;
}

export default function QuizWorkspace({ topicId: initialTopicId, topicTitle: initialTopicTitle }: QuizWorkspaceProps) {
  const { bookmarks, addBookmark, setTab, refreshAllData, continuousSubject, setContinuousSubject } = useApp();

  const [activeTopicId, setActiveTopicId] = useState<string | null>(initialTopicId);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreReport, setScoreReport] = useState<{ score: number; total: number; report: QuestionReport[] } | null>(null);

  // Synchronize state when timeline selection changes
  useEffect(() => {
    setActiveTopicId(initialTopicId);
  }, [initialTopicId]);

  // Load quiz from API
  useEffect(() => {
    if (!activeTopicId) return;
    const fetchQuizChallenge = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedAnswers({});
        setScoreReport(null);

        const url = activeTopicId === 'continuous'
          ? `/api/practice/continuous?subject=${encodeURIComponent(continuousSubject)}`
          : `/api/practice/${activeTopicId}`;

        const res = await axios.get(url);
        setQuiz(res.data);
      } catch (err: any) {
        console.error('Error fetching quiz', err);
        setError(err.response?.data?.error || 'Failed to curate your AI quiz assessment.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizChallenge();
  }, [activeTopicId, continuousSubject]);

  if (!activeTopicId) {
    return (
      <div id="quiz-landing-container" className="p-6 max-w-4xl mx-auto space-y-8">
        <section className="relative rounded-3xl bg-slate-900 p-6 md:p-8 text-white overflow-hidden shadow-lg border border-slate-800">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-indigo-500 blur-3xl animate-pulse" />
            <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-purple-500 blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Award className="h-3.5 w-3.5 animate-bounce" />
              <span>Continuous Assessment Mode</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight font-sans">
              LearnFlow Infinite Practice Studio
            </h1>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Sharpen your knowledge in any tech stack. Gemini will craft dynamic questions testing core concepts, syntax, and real-world architectures.
            </p>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Config column */}
          <div className="md:col-span-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <span className="text-[10px] font-bold text-indigo-600 block uppercase tracking-wider">Configure Assessment</span>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-700 block">Select Technology / Language</label>
              <div className="grid grid-cols-2 gap-2">
                {['Python', 'React', 'Machine Learning', 'SQL', 'Cyber Security', 'JavaScript'].map((tech) => {
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
                  <Award className="h-4 w-4" />
                  <span>Start Practice Session</span>
                </button>
              </div>
            </div>
          </div>

          {/* Timeline redirect column */}
          <div className="md:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Curriculum Path</span>
              <h3 className="text-lg font-black text-gray-900">Syllabus-Directed Quizzes</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Take organized assessments paired directly with the active weeks of your customized AI Learning Roadmap to track exact lesson completion and unlock milestones.
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
    return <Loader message="Compiling conceptual questions and drafting distractors with Gemini..." />;
  }

  if (error || !quiz) {
    return (
      <div id="quiz-error-view" className="p-8 max-w-md mx-auto text-center space-y-4">
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-rose-700">
          <p className="text-sm font-semibold">{error || 'Could not load quiz'}</p>
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

  const isBookmarked = bookmarks.some((b) => b.itemId === activeTopicId && b.type === 'quiz');

  const handleBookmark = () => {
    if (isBookmarked) return;
    addBookmark('quiz', activeTopicId, quiz.title);
  };

  const handleOptionSelect = (qIdx: number, oIdx: number) => {
    if (scoreReport) return; // locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: oIdx,
    }));
  };

  const handleSubmitQuiz = async () => {
    const totalQuestions = quiz.questions.length;
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount < totalQuestions) {
      if (!confirm(`You have only answered ${answeredCount}/${totalQuestions} questions. Are you sure you want to submit?`)) {
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Build index array matching questions length
      const answersArray = Array.from({ length: totalQuestions }, (_, idx) =>
        selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1
      );

      const res = await axios.post('/api/quiz/submit', {
        topicId: quiz.id, // Submit using the generated ID so database can look it up correctly
        answers: answersArray,
      });

      setScoreReport(res.data);
      refreshAllData(); // Trigger progress and analytics updates
    } catch (err: any) {
      console.error(err);
      alert('Failed to submit quiz results.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="quiz-workspace" className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="space-y-1">
          <button
            onClick={() => setTab('journey')}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors mb-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Timeline
          </button>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">AI-Powered Assessment</span>
          <h1 className="text-xl font-black text-gray-900 font-sans tracking-tight">{quiz.title}</h1>
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
            {isBookmarked ? 'Saved quiz' : 'Bookmark Quiz'}
          </button>
        </div>
      </div>

      {/* Score report card display */}
      {scoreReport && (
        <div className="rounded-2xl border border-gray-100 bg-indigo-50/35 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-bold text-indigo-600 block uppercase tracking-widest">Assessment Complete</span>
            <h2 className="text-lg font-extrabold text-gray-900 font-sans">
              Performance Summary for {quiz.title}
            </h2>
            <p className="text-xs text-gray-400">
              Grade level score logged: <span className="text-gray-700 font-bold">{Math.round((scoreReport.score / scoreReport.total) * 100)}%</span>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-2xl shrink-0">
            <div className="text-center px-4">
              <span className="text-3xl font-black text-indigo-600 block tracking-tight">
                {scoreReport.score} <span className="text-sm text-gray-400 font-bold">/ {scoreReport.total}</span>
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold mt-1">Passed Items</span>
            </div>
          </div>
        </div>
      )}

      {/* Questions Stack */}
      <div className="space-y-6">
        {quiz.questions.map((q, idx) => {
          const userAns = selectedAnswers[idx];
          const reportItem = scoreReport?.report[idx];

          return (
            <div
              key={q.id}
              className={`rounded-2xl border bg-white p-6 shadow-sm space-y-4 transition-colors ${
                reportItem
                  ? reportItem.passed
                    ? 'border-emerald-100'
                    : 'border-rose-100'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex gap-2 items-start">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-50 text-[10px] font-bold text-indigo-600 shrink-0 mt-0.5">
                  Q{idx + 1}
                </span>
                <p className="text-xs font-bold text-gray-900 leading-relaxed font-sans">
                  {q.question}
                </p>
              </div>

              {/* Options array */}
              <div className="grid gap-2.5 pt-1.5">
                {q.options.map((opt, oIdx) => {
                  const isSelected = userAns === oIdx;
                  
                  // Style configurations for feedback
                  let optionStyle = 'border-gray-100 bg-white text-gray-700 hover:bg-gray-50';
                  if (isSelected && !scoreReport) {
                    optionStyle = 'border-indigo-600 bg-indigo-50/50 text-indigo-700';
                  }

                  if (scoreReport && reportItem) {
                    const isCorrectOption = oIdx === reportItem.correctAnswer;
                    const isUserSelectedAndWrong = isSelected && !reportItem.passed;

                    if (isCorrectOption) {
                      optionStyle = 'border-emerald-500 bg-emerald-50/55 text-emerald-700 font-semibold';
                    } else if (isUserSelectedAndWrong) {
                      optionStyle = 'border-rose-500 bg-rose-50/55 text-rose-700';
                    } else {
                      optionStyle = 'border-gray-100 bg-white text-gray-400 cursor-not-allowed';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={!!scoreReport}
                      onClick={() => handleOptionSelect(idx, oIdx)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-xs font-semibold text-left transition-all ${optionStyle}`}
                    >
                      <span>{opt}</span>
                      {scoreReport && reportItem && oIdx === reportItem.correctAnswer && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      )}
                      {scoreReport && isSelected && !reportItem.passed && (
                        <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation section block */}
              {scoreReport && reportItem && (
                <div className={`p-4 rounded-xl text-xs space-y-1.5 border leading-relaxed ${
                  reportItem.passed
                    ? 'bg-emerald-50/20 border-emerald-100/50 text-emerald-800'
                    : 'bg-rose-50/20 border-rose-100/50 text-rose-800'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    <span>AI Tutor Explanation</span>
                  </div>
                  <p>{reportItem.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submission Panel */}
      {!scoreReport && (
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSubmitQuiz}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-50"
          >
            Submit Quiz Coordinates
          </button>
        </div>
      )}

      {scoreReport && activeTopicId === 'continuous' && (
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => {
              setActiveTopicId(null);
              setTimeout(() => setActiveTopicId('continuous'), 50);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            Take Next Question
          </button>
          <button
            onClick={() => setActiveTopicId(null)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
          >
            Change Technology
          </button>
        </div>
      )}
    </div>
  );
}
