import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Bell, Flame, User as UserIcon, LogOut, CheckCheck, Sparkles, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, progress, notifications, clearNotifications, logout, setTab, dbStatus } = useApp();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header id="app-header" className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-6 shadow-sm">
      {/* Brand Label */}
      <div 
        onClick={() => setTab(user ? 'dashboard' : 'landing')} 
        className="flex cursor-pointer items-center gap-2"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="font-sans text-lg font-bold tracking-tight text-gray-900">
          LearnFlow <span className="text-indigo-600">AI</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Database Connection Status */}
        {dbStatus && (
          <div 
            title={dbStatus.postgresError ? `PostgreSQL Connection Failed: ${dbStatus.postgresError}` : dbStatus.type === 'postgres' ? 'Securely persisted via PostgreSQL database' : 'Persisted via local JSON engine'}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border shadow-sm transition-all ${
              dbStatus.postgresError 
                ? 'bg-rose-50 text-rose-700 border-rose-100' 
                : dbStatus.type === 'postgres' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}
          >
            <Database className={`h-3.5 w-3.5 ${
              dbStatus.postgresError 
                ? 'text-rose-500' 
                : dbStatus.type === 'postgres' 
                  ? 'text-emerald-500' 
                  : 'text-amber-500'
            }`} />
            <span className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${
                dbStatus.postgresError 
                  ? 'bg-rose-500 animate-pulse' 
                  : dbStatus.type === 'postgres' 
                    ? 'bg-emerald-500 animate-pulse' 
                    : 'bg-amber-500 animate-pulse'
              }`} />
              {dbStatus.postgresError 
                ? 'PG Failed (Local Backup)' 
                : dbStatus.type === 'postgres' 
                  ? 'PostgreSQL Connected' 
                  : 'Local JSON backup'}
            </span>
          </div>
        )}

        {user ? (
          <div className="flex items-center gap-4">
            {/* Active Study Streak */}
          <div 
            title="Your Daily Study Streak!"
            className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 shadow-sm border border-amber-100"
          >
            <Flame className="h-4.5 w-4.5 fill-amber-500 text-amber-600" />
            <span className="text-sm font-bold tracking-tight">
              {progress?.streak || 1} Days
            </span>
          </div>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative rounded-xl p-2.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            <AnimatePresence>
              {showNotifDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifDropdown(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 z-50 w-80 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5"
                  >
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50 mb-1">
                      <span className="text-xs font-bold text-gray-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            clearNotifications();
                            setShowNotifDropdown(false);
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                          <CheckCheck className="h-3 w-3" /> Clear unread
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice().reverse().map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-xl mb-1 text-xs transition-colors ${
                              n.read ? 'bg-white text-gray-500' : 'bg-indigo-50/50 text-gray-800 font-medium'
                            }`}
                          >
                            <p className="leading-relaxed mb-1">{n.text}</p>
                            <span className="text-[10px] text-gray-400 font-normal">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Meta & Logout */}
          <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
            <div className="hidden flex-col text-right md:flex">
              <span className="text-xs font-semibold text-gray-900">
                {user.email.split('@')[0]}
              </span>
              <span className="text-[10px] font-medium text-gray-400 capitalize">
                {user.role.replace('_', ' ')}
              </span>
            </div>
            
            <button
              onClick={logout}
              title="Logout"
              className="rounded-xl p-2.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-150"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTab('login')}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            Login
          </button>
          <button
            onClick={() => setTab('register')}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Sign Up
          </button>
        </div>
      )}
      </div>
    </header>
  );
}
