import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext.tsx';
import Loader from '../components/Loader.tsx';
import { ShieldCheck, Users, Flame, LayoutDashboard, Award, GraduationCap } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  profile?: {
    fullName: string;
    targetRole: string;
    currentLevel: string;
  };
  progress?: {
    streak: number;
    completedTopics: string[];
  };
}

interface AdminStats {
  totalUsersCount: number;
  users: AdminUser[];
}

export default function AdminDashboard() {
  const { user } = useApp();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get('/api/admin/stats');
        setStats(res.data);
      } catch (err: any) {
        console.error('Error fetching admin statistics', err);
        setError(err.response?.data?.error || 'Failed to sync administrator reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <div id="admin-forbidden-view" className="p-12 text-center max-w-sm mx-auto">
        <ShieldCheck className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-base font-bold text-gray-800">Administrator access denied</h3>
        <p className="text-xs text-gray-400 mt-1">
          You must be logged in as an administrator to inspect backend database statistics.
        </p>
      </div>
    );
  }

  if (loading) {
    return <Loader message="Accessing secure student metrics logs..." />;
  }

  if (error || !stats) {
    return (
      <div id="admin-error-view" className="p-8 max-w-md mx-auto text-center">
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-rose-700">
          <p className="text-sm font-semibold">{error || 'Could not load admin panel.'}</p>
        </div>
      </div>
    );
  }

  // Calculate some counts
  const studentCount = stats.users.filter((u) => u.role === 'student').length;
  const professionalCount = stats.users.filter((u) => u.role === 'professional').length;
  const educatorCount = stats.users.filter((u) => u.role === 'teacher').length;

  return (
    <div id="admin-terminal-dashboard" className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <ShieldCheck className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 font-sans">
            Administrative Control Panel
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time enrollment summaries, learner persona charts, and progress logs database.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
          <Users className="h-5 w-5 text-indigo-500" />
          <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">Enrolled Learners</span>
          <span className="text-xl font-black text-gray-800 block">{stats.totalUsersCount} Enrolled</span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
          <GraduationCap className="h-5 w-5 text-indigo-500" />
          <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">Students Count</span>
          <span className="text-xl font-black text-gray-800 block">{studentCount} Students</span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
          <Users className="h-5 w-5 text-indigo-500" />
          <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">Professionals</span>
          <span className="text-xl font-black text-gray-800 block">{professionalCount} Career Pros</span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
          <Award className="h-5 w-5 text-indigo-500" />
          <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">Educators</span>
          <span className="text-xl font-black text-gray-800 block">{educatorCount} Teachers</span>
        </div>
      </div>

      {/* Learner Index Table */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Learner Database Registry</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/25 text-gray-400 uppercase font-bold tracking-widest">
                <th className="px-6 py-3.5">User Email</th>
                <th className="px-6 py-3.5">Persona Role</th>
                <th className="px-6 py-3.5">Full Name</th>
                <th className="px-6 py-3.5">Target Job Objective</th>
                <th className="px-6 py-3.5 text-center">Active Streak</th>
                <th className="px-6 py-3.5 text-center">Completed Modules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.users.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-700">{item.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider border border-indigo-100/50">
                      {item.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {item.profile?.fullName || 'Not set'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {item.profile?.targetRole || 'Not set'}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-amber-600 font-mono">
                    {item.progress?.streak || 0} days
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-gray-600">
                    {item.progress?.completedTopics.length || 0} completed
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
