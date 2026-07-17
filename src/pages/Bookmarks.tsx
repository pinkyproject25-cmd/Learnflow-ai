import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { BookMarked, ArrowUpRight, Trash2, Calendar, HelpCircle, Code, Lightbulb, BookOpen, Map } from 'lucide-react';

export default function Bookmarks() {
  const { bookmarks, removeBookmark, setTab } = useApp();
  const [activeCategory, setActiveCategory] = useState<'all' | 'roadmap' | 'lesson' | 'notes' | 'code' | 'quiz'>('all');

  const handleVisitBookmark = () => {
    setTab('journey');
  };

  const categories = [
    { id: 'all', label: 'All Bookmarks', count: bookmarks.length, icon: BookMarked },
    { id: 'roadmap', label: 'Roadmaps', count: bookmarks.filter(b => b.type === 'roadmap' || b.type === 'topic').length, icon: Map },
    { id: 'lesson', label: 'Lessons', count: bookmarks.filter(b => b.type === 'lesson').length, icon: BookOpen },
    { id: 'notes', label: 'Notes', count: bookmarks.filter(b => b.type === 'notes').length, icon: Lightbulb },
    { id: 'code', label: 'Coding', count: bookmarks.filter(b => b.type === 'code' || b.type === 'coding').length, icon: Code },
    { id: 'quiz', label: 'Quiz', count: bookmarks.filter(b => b.type === 'quiz').length, icon: HelpCircle },
  ];

  const filteredBookmarks = bookmarks.filter((b) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'roadmap') return b.type === 'roadmap' || b.type === 'topic';
    if (activeCategory === 'lesson') return b.type === 'lesson';
    if (activeCategory === 'notes') return b.type === 'notes';
    if (activeCategory === 'code') return b.type === 'code' || b.type === 'coding';
    if (activeCategory === 'quiz') return b.type === 'quiz';
    return true;
  });

  return (
    <div id="bookmarks-workspace" className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 font-sans">
          Saved Revision Blocks
        </h1>
        <p className="text-sm text-gray-400 mt-1 font-medium">
          Review bookmarks saved during lesson explorations or coding exercises for quick, focused learning reviews.
        </p>
      </div>

      {/* Categories Filter Bar */}
      <div className="flex border-b border-gray-100 gap-2 overflow-x-auto pb-3 pt-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isActive ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredBookmarks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center max-w-sm mx-auto">
          <BookMarked className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-800">No bookmarks found</h3>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            {activeCategory === 'all'
              ? 'While going through custom lessons, coding practices, or quizzes, click the "Bookmark" icon to save blocks here.'
              : `You don't have any bookmarks saved under the "${categories.find(c => c.id === activeCategory)?.label}" category yet.`}
          </p>
          <button
            onClick={() => setTab('journey')}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Explore Active Roadmap
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredBookmarks.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-start justify-between gap-4 hover:border-indigo-100 transition-colors"
            >
              <div className="space-y-1.5 min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[9px] font-bold text-indigo-700 uppercase tracking-widest border border-indigo-100/50">
                  {b.type === 'topic' ? 'roadmap' : b.type === 'code' ? 'coding' : b.type}
                </span>

                <h3 className="text-sm font-extrabold text-gray-800 leading-snug truncate mt-1">
                  {b.title}
                </h3>

                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>Saved on {new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleVisitBookmark}
                  title="Visit Timeline Topic"
                  className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => removeBookmark(b.id)}
                  title="Delete Bookmark"
                  className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
