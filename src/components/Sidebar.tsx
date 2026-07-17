import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  LayoutDashboard,
  Compass,
  Code,
  BarChart3,
  Bookmark,
  User,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

export default function Sidebar() {
  const { user, currentTab, setTab } = useApp();

  if (!user) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'journey', label: 'Learning Journey', icon: Compass },
    { id: 'sandbox', label: 'Coding Sandbox', icon: Code },
    { id: 'analytics', label: 'Analytics & Streaks', icon: BarChart3 },
    { id: 'bookmarks', label: 'Saved Bookmarks', icon: Bookmark },
    { id: 'profile', label: 'Profile Goals', icon: User },
  ];

  // If user is admin, append Admin panel
  if (user.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Terminal', icon: ShieldAlert });
  }

  return (
    <aside id="app-sidebar" className="hidden w-64 shrink-0 border-r border-gray-100 bg-white p-4 md:flex md:flex-col justify-between h-[calc(100vh-64px)] sticky top-16">
      <div className="space-y-1">
        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Learn Workspace
        </span>
        
        <nav className="space-y-1 pt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Support section */}
      <div className="border-t border-gray-50 pt-4 px-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer">
          <HelpCircle className="h-4 w-4" />
          <span>Support & Quick Help</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 leading-normal">
          LearnFlow AI v1.0.0. Powered by Google Gemini 3.5 Flash.
        </p>
      </div>
    </aside>
  );
}
