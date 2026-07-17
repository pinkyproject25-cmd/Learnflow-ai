import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import axios from 'axios';
import {
  Sparkles,
  Flame,
  Award,
  Clock,
  Compass,
  CheckCircle,
  HelpCircle,
  Code,
  Calendar,
  ChevronRight,
  BookMarked,
  ArrowUpRight,
  UserCheck2,
  BookOpen,
  ArrowRight,
  History,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { user, profile, roadmap, progress, bookmarks, recommendations, analytics, setTab, generateRoadmap, refreshAllData, showToast, removeBookmark } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [allRoadmaps, setAllRoadmaps] = useState<any[]>([]);
  const [dashboardBookmarkCat, setDashboardBookmarkCat] = useState<'all' | 'roadmap' | 'lesson' | 'notes' | 'code' | 'quiz'>('all');

  // Fetch all pathways
  const fetchAllRoadmaps = async () => {
    try {
      const res = await axios.get('/api/roadmaps');
      setAllRoadmaps(res.data);
    } catch (e) {
      console.error('Failed to fetch roadmaps', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllRoadmaps();
    }
  }, [user, roadmap]);

  const handleGenerateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setIsGenerating(true);
      const success = await generateRoadmap(searchQuery.trim());
      if (success) {
        setSearchQuery('');
        fetchAllRoadmaps();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPreset = async (preset: string) => {
    try {
      setIsGenerating(true);
      const success = await generateRoadmap(preset);
      if (success) {
        fetchAllRoadmaps();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSwitchRoadmap = async (id: string) => {
    try {
      showToast('Switching active learning pathway...', 'info');
      await axios.post('/api/roadmaps/active', { roadmapId: id });
      await refreshAllData();
      showToast('Active learning pathway updated!', 'success');
    } catch (err) {
      showToast('Failed to switch active pathway.', 'error');
    }
  };

  // Pick up where we left off: find first incomplete topic
  const getNextIncompleteTopic = () => {
    if (!roadmap || !progress) return null;
    return roadmap.topics.find((t) => !progress.completedTopics.includes(t.id));
  };

  const nextTopic = getNextIncompleteTopic();

  // Calendar streak simulation
  const today = new Date();
  const calendarDays = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - idx));
    return {
      name: d.toLocaleDateString([], { weekday: 'narrow' }),
      date: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
      completed: progress?.lastActive === d.toISOString().split('T')[0] || idx % 3 === 0,
    };
  });

  return (
    <div id="dashboard-page" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Welcoming Hero Banner */}
      <section className="relative rounded-3xl bg-slate-900 p-6 md:p-8 text-white overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-indigo-500 blur-3xl animate-pulse" />
          <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-purple-500 blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Workspace Active</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight font-sans">
              Welcome back, {profile?.fullName || user?.email.split('@')[0]}!
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Today's personal coaching objective: <span className="text-indigo-400 font-semibold">{profile?.learningGoal || 'Personalized milestones'}</span>. Complete your daily lesson to maintain your study streak.
            </p>
          </div>

          <div className="flex gap-4 items-center bg-white/5 border border-white/10 p-4 rounded-2xl shrink-0">
            <div className="text-center px-2">
              <span className="text-2xl font-black text-indigo-400 block tracking-tight">
                {analytics?.completionPercentage || 0}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mt-1">Completion</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center px-2">
              <span className="text-2xl font-black text-indigo-400 block tracking-tight flex items-center justify-center gap-1">
                <Flame className="h-5 w-5 fill-amber-500 text-amber-500 shrink-0" />
                {progress?.streak || 1}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mt-1">Day Streak</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid widgets */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column - Learning Roadmap & Bookmarks */}
        <div className="md:col-span-2 space-y-6">
          {allRoadmaps.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 md:p-12 text-center space-y-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100">
                <Compass className="h-7 w-7" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg font-extrabold text-gray-900 font-sans tracking-tight">Create Your First Learning Roadmap</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  Welcome to LearnFlow AI! You do not have any learning roadmaps designed yet. 
                  Enter any topic you would like to master below (such as Python, Java, React, Machine Learning, Data Science, or SQL) 
                  and our AI Planner will draft a personalized roadmap, lessons, coding exercises, and quizzes.
                </p>
              </div>

              {/* Form inside Empty State */}
              <form onSubmit={handleGenerateCustom} className="max-w-md mx-auto flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter a topic (e.g., Python, SQL, React...)"
                  disabled={isGenerating}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
                <button
                  type="submit"
                  disabled={isGenerating || !searchQuery.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-indigo-100 shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Curating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Design Path</span>
                    </>
                  )}
                </button>
              </form>

              {/* Fast Presets */}
              <div className="flex flex-wrap justify-center gap-1.5 max-w-md mx-auto pt-2">
                {['Python', 'React', 'Machine Learning', 'SQL', 'Cyber Security'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleSelectPreset(preset)}
                    disabled={isGenerating}
                    className="rounded-full bg-slate-50 border border-slate-100 hover:border-indigo-300 px-3 py-1 text-[10px] font-bold text-slate-600 hover:text-indigo-600 cursor-pointer transition-all"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* AI On-Demand Curated Pathway Search */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-sm text-gray-900">What do you want to learn today?</h3>
                    <p className="text-[11px] text-gray-400">Generate a custom AI curriculum on demand, stored instantly in PostgreSQL.</p>
                  </div>
                </div>

                <form onSubmit={handleGenerateCustom} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="E.g., Python, Machine Learning, React, Cyber Security, SQL..."
                    disabled={isGenerating}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !searchQuery.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    {isGenerating ? (
                      <>
                        <RotateCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Curating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Design Path</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="flex flex-wrap gap-1.5">
                  {['Python', 'React', 'Machine Learning', 'SQL', 'Cyber Security'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleSelectPreset(preset)}
                      disabled={isGenerating}
                      className="rounded-full bg-slate-50 border border-slate-100 hover:border-indigo-300 px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:text-indigo-600 cursor-pointer transition-all"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                {/* Pathway switcher list */}
                {allRoadmaps.length > 1 && (
                  <div className="pt-3 border-t border-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                        <History className="h-3.5 w-3.5" />
                        <span>Switch Learning Pathways ({allRoadmaps.length})</span>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {allRoadmaps.map((r) => {
                        const isActive = roadmap?.id === r.id;
                        return (
                          <button
                            key={r.id}
                            onClick={() => handleSwitchRoadmap(r.id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isActive
                                ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 ring-1 ring-indigo-200'
                                : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-[10px] font-bold block truncate">{r.title}</span>
                              <span className="text-[9px] text-gray-400 block mt-0.5 capitalize">{r.skillLevel} · {r.durationWeeks} weeks</span>
                            </div>
                            {isActive ? (
                              <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[8px] font-extrabold text-white uppercase tracking-wider shrink-0">Active</span>
                            ) : (
                              <span className="text-[9px] text-indigo-600 font-bold hover:underline shrink-0">Switch</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Continue Study Widget */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-600 block uppercase tracking-wider">Continue Active Path</span>
                  <h2 className="text-lg font-extrabold text-gray-900 font-sans">
                    {roadmap ? roadmap.title : 'No Active Study Timeline'}
                  </h2>
                  {nextTopic ? (
                    <p className="text-xs text-gray-400">
                      Next Up: <span className="text-gray-700 font-semibold">{nextTopic.title}</span> (Week {nextTopic.week})
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      {roadmap ? '🎉 All topics completed!' : 'Configure goals and draft an AI roadmap to start.'}
                    </p>
                  )}
                </div>

                {roadmap ? (
                  <button
                    onClick={() => setTab('journey')}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Open Timeline
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setTab('profile')}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Set Goals
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-2">
                  <Clock className="h-5 w-5 text-indigo-500" />
                  <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">Study Time</span>
                  <span className="text-lg font-black text-gray-800 block tracking-tight">
                    {analytics?.studyMinutes || 10} min
                  </span>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">Completed</span>
                  <span className="text-lg font-black text-gray-800 block tracking-tight">
                    {analytics?.completedCount || 0} / {analytics?.totalTopics || 0}
                  </span>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">Quiz Average</span>
                  <span className="text-lg font-black text-gray-800 block tracking-tight">
                    {analytics?.quizPerformance || 0}%
                  </span>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-2">
                  <Code className="h-5 w-5 text-indigo-500" />
                  <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">Coding Acc</span>
                  <span className="text-lg font-black text-gray-800 block tracking-tight">
                    {analytics?.codingAccuracy || 0}%
                  </span>
                </div>
              </div>

              {/* AI Mentor Recommendations Panel */}
              <div className="rounded-2xl border border-gray-100 bg-indigo-50/20 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="font-sans font-bold text-sm text-gray-900">AI Mentor Personalized Guidance</h3>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed italic bg-white p-4 rounded-xl border border-gray-100">
                  "{recommendations?.studyAdvice || 'Configure your weekly goals and take practice quizzes to receive tailored AI recommendations!'}"
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Identified Weak Areas</span>
                    {recommendations?.weakAreasFound && recommendations.weakAreasFound.length > 0 ? (
                      recommendations.weakAreasFound.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <span>{item}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400">No core conceptual weakness detected. Excellent work!</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Next Suggested Steps</span>
                    {recommendations?.recommendedNextSteps && recommendations.recommendedNextSteps.length > 0 ? (
                      recommendations.recommendedNextSteps.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                          <ChevronRight className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400">Complete topics in your roadmap to unlock milestones.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column - Study Calendar, Streaks, Bookmarks */}
        <div className="space-y-6">
          {/* Calendar Streak tracker */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-gray-500" />
                <h3 className="text-xs font-bold text-gray-900">Weekly Habits</h3>
              </div>
              <span className="text-[10px] text-indigo-600 font-bold">{progress?.streak || 1} day streak</span>
            </div>

            <div className="flex justify-between">
              {calendarDays.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{day.name}</span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      day.isToday
                        ? 'ring-2 ring-indigo-600 ring-offset-2'
                        : ''
                    } ${
                      day.completed
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                        : 'bg-gray-50 text-gray-400 border border-gray-100'
                    }`}
                  >
                    {day.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Bookmarks */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <BookMarked className="h-4.5 w-4.5 text-gray-500" />
                <h3 className="text-xs font-bold text-gray-900">Bookmarks ({bookmarks.length})</h3>
              </div>
              <button
                onClick={() => setTab('bookmarks')}
                className="text-[10px] text-indigo-600 font-extrabold hover:underline cursor-pointer"
              >
                View Shelf
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-thin">
              {(['all', 'roadmap', 'lesson', 'notes', 'code', 'quiz'] as const).map((cat) => {
                const count = cat === 'all' 
                  ? bookmarks.length 
                  : cat === 'roadmap' 
                    ? bookmarks.filter(b => b.type === 'roadmap' || b.type === 'topic').length
                    : bookmarks.filter(b => b.type === cat || (cat === 'code' && b.type === 'coding')).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setDashboardBookmarkCat(cat)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                      dashboardBookmarkCat === cat
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="capitalize">{cat === 'code' ? 'coding' : cat}</span> ({count})
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 overflow-y-auto max-h-52 pr-1">
              {bookmarks.length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-4">
                  No saved revision blocks. Bookmark any lesson text or coding problem!
                </div>
              ) : bookmarks.filter((b) => {
                  if (dashboardBookmarkCat === 'all') return true;
                  if (dashboardBookmarkCat === 'roadmap') return b.type === 'roadmap' || b.type === 'topic';
                  if (dashboardBookmarkCat === 'lesson') return b.type === 'lesson';
                  if (dashboardBookmarkCat === 'notes') return b.type === 'notes';
                  if (dashboardBookmarkCat === 'code') return b.type === 'code' || b.type === 'coding';
                  if (dashboardBookmarkCat === 'quiz') return b.type === 'quiz';
                  return true;
                }).length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-4">
                  No bookmarks in this category.
                </div>
              ) : (
                bookmarks
                  .filter((b) => {
                    if (dashboardBookmarkCat === 'all') return true;
                    if (dashboardBookmarkCat === 'roadmap') return b.type === 'roadmap' || b.type === 'topic';
                    if (dashboardBookmarkCat === 'lesson') return b.type === 'lesson';
                    if (dashboardBookmarkCat === 'notes') return b.type === 'notes';
                    if (dashboardBookmarkCat === 'code') return b.type === 'code' || b.type === 'coding';
                    if (dashboardBookmarkCat === 'quiz') return b.type === 'quiz';
                    return true;
                  })
                  .map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-gray-50 hover:bg-gray-50 transition-all group"
                    >
                      <div 
                        className="min-w-0 pr-2 cursor-pointer flex-grow"
                        onClick={() => setTab('journey')}
                      >
                        <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest block">
                          {b.type === 'topic' ? 'roadmap' : b.type === 'code' ? 'coding' : b.type}
                        </span>
                        <span className="text-xs font-semibold text-gray-700 block truncate mt-0.5">
                          {b.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => removeBookmark(b.id)}
                          title="Delete Bookmark"
                          className="p-1 rounded-md text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setTab('journey')}
                          className="p-1 rounded-md text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
