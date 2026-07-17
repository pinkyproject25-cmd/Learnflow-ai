import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { BookOpen, Code, Award, CheckCircle2, ChevronRight, HelpCircle, Compass, Sparkles } from 'lucide-react';

interface LearningJourneyProps {
  onSelectTopic: (topicId: string, title: string, subtopics: string[]) => void;
}

export default function LearningJourney({ onSelectTopic }: LearningJourneyProps) {
  const { roadmap, progress, setTab } = useApp();

  const handleStudyAction = (topicId: string, title: string, subtopics: string[], action: 'lesson' | 'code' | 'quiz') => {
    onSelectTopic(topicId, title, subtopics);
    if (action === 'lesson') {
      setTab('lesson_viewer');
    } else if (action === 'code') {
      setTab('sandbox');
    } else {
      setTab('quiz_workspace');
    }
  };

  if (!roadmap) {
    return (
      <div id="no-roadmap-view" className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto min-h-[calc(100vh-120px)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6">
          <Compass className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-gray-900 font-sans">
          No Active Curriculum Roadmap
        </h2>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          Before starting lessons, you must customize your study level and generate a personalized roadmap using our AI agents.
        </p>
        <button
          onClick={() => setTab('profile')}
          className="mt-6 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
        >
          Configure Goals & Profile
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div id="journey-roadmap-page" className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Active Learning Roadmap</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 font-sans mt-0.5">
            {roadmap.title}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Skill Level: <span className="font-semibold text-gray-700 capitalize">{roadmap.skillLevel}</span> • Target: <span className="font-semibold text-gray-700">{roadmap.targetRole}</span>
          </p>
        </div>

        <button
          onClick={() => setTab('profile')}
          className="rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
        >
          Reconfigure Goal
        </button>
      </div>

      {/* Week Timeline Section */}
      <section className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-50">
        {roadmap.topics.map((topic, idx) => {
          const isCompleted = progress?.completedTopics.includes(topic.id);
          const activeWeek = topic.week;

          return (
            <div key={topic.id} className="relative group">
              {/* Timeline bubble bullet indicator */}
              <div
                className={`absolute -left-[24px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold border transition-all ${
                  isCompleted
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
              </div>

              {/* Weekly Panel Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4 hover:border-indigo-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-50">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Week {activeWeek}
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 font-sans mt-0.5">
                      {topic.title}
                    </h3>
                  </div>

                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                      Completed
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  {topic.description}
                </p>

                {/* Subtopics Checklist block */}
                <div className="space-y-1.5 bg-gray-50 p-3 rounded-xl">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Skills Covered
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {topic.subtopics.map((sub, sIdx) => {
                      const isSubCompleted = progress?.completedLessons.includes(sub) || isCompleted;
                      return (
                        <div key={sIdx} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className={`h-4 w-4 shrink-0 ${isSubCompleted ? 'text-indigo-600' : 'text-gray-300'}`} />
                          <span className={`truncate ${isSubCompleted ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{sub}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action steps array */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => handleStudyAction(topic.id, topic.title, topic.subtopics, 'lesson')}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
                  >
                    <BookOpen className="h-4 w-4 text-indigo-500" />
                    Read Lesson Notes
                  </button>

                  <button
                    onClick={() => handleStudyAction(topic.id, topic.title, topic.subtopics, 'code')}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
                  >
                    <Code className="h-4 w-4 text-indigo-500" />
                    Coding Workspace
                  </button>

                  <button
                    onClick={() => handleStudyAction(topic.id, topic.title, topic.subtopics, 'quiz')}
                    className="flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50/20 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50/50 transition-all"
                  >
                    <Award className="h-4 w-4 text-indigo-600" />
                    Assess Quiz
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
