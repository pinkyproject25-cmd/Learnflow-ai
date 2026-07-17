import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { BarChart3, Clock, Flame, Award, HelpCircle, ArrowUpRight, GraduationCap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Analytics() {
  const { analytics, progress } = useApp();

  // Recharts Line Chart for Weekly Study Distribution
  const renderWeeklyLineChart = () => {
    if (!analytics?.weeklyStudyHours) return null;

    const data = analytics.weeklyStudyHours.map((d) => ({
      name: d.name,
      hours: d.hours,
    }));

    return (
      <div className="space-y-4">
        <span className="text-[10px] font-black text-gray-400 block uppercase tracking-widest">Weekly Study Distribution (Hours)</span>
        
        <div className="h-56 w-full bg-slate-50/50 p-3 rounded-2xl border border-gray-100 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={10} 
                fontWeight={700}
                tickLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                fontWeight={700}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  borderRadius: '12px', 
                  border: 'none', 
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="hours" 
                stroke="#4f46e5" 
                strokeWidth={3} 
                activeDot={{ r: 6 }} 
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Recharts Donut Pie Chart for Syllabus Completion Progress
  const renderProgressPieChart = () => {
    const completed = analytics?.completedCount || 0;
    const remaining = Math.max(0, (analytics?.totalTopics || 0) - completed);
    
    const data = [
      { name: 'Completed Topics', value: completed, color: '#4f46e5' },
      { name: 'Remaining Topics', value: remaining === 0 && completed === 0 ? 1 : remaining, color: '#f1f5f9' },
    ];

    return (
      <div className="space-y-4 flex flex-col justify-between items-center text-center w-full h-full">
        <div className="w-full text-left">
          <span className="text-[10px] font-black text-gray-400 block uppercase tracking-widest">Syllabus Progress</span>
        </div>

        <div className="relative h-44 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  borderRadius: '12px', 
                  border: 'none', 
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xl font-black text-gray-900 tracking-tight">{analytics?.completionPercentage || 0}%</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase">Syllabus</span>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-semibold leading-relaxed">
          {analytics?.completedCount || 0} of {analytics?.totalTopics || 0} Topics Complete
        </div>
      </div>
    );
  };

  return (
    <div id="analytics-dashboard" className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 font-sans">
          Analytics & Streaks Log
        </h1>
        <p className="text-sm text-gray-400 mt-1 font-medium">
          Detailed metrics showcasing completed milestones, study session logs, and assessment metrics.
        </p>
      </div>

      {/* Grid of primary performance stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">Study Hours Curated</span>
            <span className="text-2xl font-black text-gray-800 block tracking-tight mt-0.5">
              {analytics ? Math.round((analytics.studyMinutes / 60) * 10) / 10 : 0.5} hours
            </span>
          </div>
          <p className="text-[11px] text-gray-400 leading-normal font-medium">Total study investment in weeks</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Flame className="h-4.5 w-4.5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">Active Learning Streak</span>
            <span className="text-2xl font-black text-gray-800 block tracking-tight mt-0.5">
              {progress?.streak || 1} Days
            </span>
          </div>
          <p className="text-[11px] text-gray-400 leading-normal font-medium">Consecutive days actively learning</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Award className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">Assessment Average</span>
            <span className="text-2xl font-black text-gray-800 block tracking-tight mt-0.5">
              {analytics?.quizPerformance || 0}%
            </span>
          </div>
          <p className="text-[11px] text-gray-400 leading-normal font-medium">Overall score logged across quizzes</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Weekly hours diagram */}
        <div className="md:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {renderWeeklyLineChart()}
        </div>

        {/* Circular Progress Gauge */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between items-center text-center">
          {renderProgressPieChart()}
        </div>
      </div>

      {/* Strengths Board */}
      <div className="rounded-2xl border border-gray-100 bg-indigo-50/20 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-indigo-600" />
          <h3 className="font-sans font-bold text-sm text-gray-900">Syllabus Comprehension Breakdown</h3>
        </div>

        <div className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-medium">
              <span className="text-gray-500">Conceptual Comprehension (Quiz Performance)</span>
              <span className="font-bold text-gray-800">{analytics?.quizPerformance || 0}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-indigo-100">
              <div
                style={{ width: `${analytics?.quizPerformance || 0}%` }}
                className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-medium">
              <span className="text-gray-500">Coding Algorithm Accuracy</span>
              <span className="font-bold text-gray-800">{analytics?.codingAccuracy || 0}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-indigo-100">
              <div
                style={{ width: `${analytics?.codingAccuracy || 0}%` }}
                className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
