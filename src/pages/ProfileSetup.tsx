import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { User, Target, BookOpen, Clock, RefreshCw, Compass, Sparkles } from 'lucide-react';

export default function ProfileSetup() {
  const { profile, updateProfile, generateRoadmap, roadmap } = useApp();

  const [fullName, setFullName] = useState('');
  const [currentLevel, setCurrentLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [learningGoal, setLearningGoal] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [studyTimePerDay, setStudyTimePerDay] = useState(30);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setCurrentLevel(profile.currentLevel || 'beginner');
      setLearningGoal(profile.learningGoal || '');
      setTargetRole(profile.targetRole || '');
      setStudyTimePerDay(profile.studyTimePerDay || 30);
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await updateProfile({
      fullName,
      currentLevel,
      learningGoal,
      targetRole,
      studyTimePerDay,
    });
    setIsUpdating(false);
  };

  const handleGenerateRoadmap = async () => {
    setIsGenerating(true);
    await generateRoadmap();
    setIsGenerating(false);
  };

  return (
    <div id="profile-setup-page" className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 font-sans">
          Study Goals & Personalization
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Adjust your target roles and study levels. LearnFlow AI uses these credentials to tailor your curriculum.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Settings Form */}
        <form onSubmit={handleSaveProfile} className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-50 mb-2">
            <User className="h-5 w-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900">Demographic Profile</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-3 px-4 text-sm outline-none transition-colors focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Target Role / Career Destination
              </label>
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Frontend Engineer, Python Specialist"
                className="w-full rounded-xl border border-gray-200 py-3 px-4 text-sm outline-none transition-colors focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Specific Study Objective
            </label>
            <textarea
              required
              rows={3}
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              placeholder="e.g. I want to build standard React apps, deploy with Vite, understand hooks, APIs, and responsive CSS grids."
              className="w-full rounded-xl border border-gray-200 py-3 px-4 text-sm outline-none transition-colors focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Current Skill Level
              </label>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value as any)}
                className="w-full rounded-xl border border-gray-200 py-3 px-4 text-sm outline-none transition-colors focus:border-indigo-500 bg-white"
              >
                <option value="beginner">Beginner (No prior exposure)</option>
                <option value="intermediate">Intermediate (Understand syntax & foundations)</option>
                <option value="advanced">Advanced (Deep expertise, seeking polishing)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Daily Study Allotment
              </label>
              <select
                value={studyTimePerDay}
                onChange={(e) => setStudyTimePerDay(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 py-3 px-4 text-sm outline-none transition-colors focus:border-indigo-500 bg-white"
              >
                <option value="30">30 Minutes (Casual Speed)</option>
                <option value="45">45 Minutes (Balanced Learning)</option>
                <option value="60">60 Minutes (Accelerated Pace)</option>
                <option value="90">90 Minutes (Deep Immersion Mastery)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-50"
          >
            {isUpdating ? 'Saving Profile...' : 'Save Objectives'}
          </button>
        </form>

        {/* AI Generator Action Card */}
        <div className="flex flex-col justify-between bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500 blur-2xl" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/25 text-indigo-400 mb-4">
              <Compass className="h-5 w-5" />
            </div>

            <h3 className="font-sans font-bold text-lg leading-tight">AI Roadmap Architect</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Based on your target role (<span className="text-indigo-400 font-semibold">{targetRole || 'Developer'}</span>) and skill level, our Planner Agent will construct a week-by-week curriculum timeline.
            </p>

            {roadmap ? (
              <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-3.5">
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Active Curriculum</span>
                <span className="text-xs font-bold text-white block mt-1 truncate">{roadmap.title}</span>
                <span className="text-[10px] text-indigo-400 font-semibold block mt-1">{roadmap.durationWeeks} Weeks of Study</span>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 text-xs text-amber-300">
                You have not compiled a study timeline yet. Trigger the draft generator below.
              </div>
            )}
          </div>

          <div className="relative z-10 pt-6">
            <button
              onClick={handleGenerateRoadmap}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-md shadow-indigo-900/30 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating Study Path...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  {roadmap ? 'Reconstruct Study Roadmap' : 'Draft Learning Roadmap'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
