import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import {
  User,
  Profile,
  Roadmap,
  UserProgress,
  Bookmark,
  Notification,
  AnalyticsStats,
  AIRecommendations,
  DbStatus,
} from '../types.ts';

interface AppContextType {
  token: string | null;
  user: User | null;
  profile: Profile | null;
  roadmap: Roadmap | null;
  progress: UserProgress | null;
  bookmarks: Bookmark[];
  notifications: Notification[];
  analytics: AnalyticsStats | null;
  recommendations: AIRecommendations | null;
  currentTab: string;
  loading: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  dbStatus: DbStatus | null;
  continuousSubject: string;

  // Actions
  setTab: (tab: string) => void;
  setContinuousSubject: (subject: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string, role: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<Profile>) => Promise<boolean>;
  generateRoadmap: (subject?: string) => Promise<boolean>;
  completeLesson: (topicId: string, subtopicName?: string) => Promise<void>;
  addBookmark: (type: 'lesson' | 'topic' | 'quiz' | 'code', itemId: string, title: string) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  setThemePreference: (theme: 'light' | 'dark') => void;
  refreshDbStatus: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('lf_token'));
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [loading, setLoading] = useState<boolean>(false);
  const [continuousSubject, setContinuousSubject] = useState<string>('React');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

  // Apply authorization header globally
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('lf_token', token);
      
      // Parse user metadata out of encoded token safely
      try {
        const decoded = atob(token).split(':');
        setUser({
          id: decoded[0],
          email: decoded[1],
          role: decoded[2] as any,
        });
      } catch (e) {
        logout();
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('lf_token');
      setUser(null);
      setProfile(null);
      setRoadmap(null);
      setProgress(null);
      setBookmarks([]);
      setNotifications([]);
      setAnalytics(null);
      setRecommendations(null);
    }
  }, [token]);

  // Load all context data when user changes
  useEffect(() => {
    if (user) {
      refreshAllData();
      if (currentTab === 'landing') {
        setCurrentTab('dashboard');
      }
    } else {
      if (currentTab !== 'landing' && currentTab !== 'login' && currentTab !== 'register') {
        setCurrentTab('landing');
      }
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const clearToast = () => setToast(null);

  const refreshDbStatus = async () => {
    try {
      const res = await axios.get('/api/db-status');
      setDbStatus(res.data);
    } catch (e) {
      console.error('Failed to fetch DB status', e);
      setDbStatus({ isPostgres: false, postgresError: 'Failed to query db status API', type: 'local' });
    }
  };

  useEffect(() => {
    refreshDbStatus();
  }, []);

  const refreshAllData = async () => {
    refreshDbStatus();
    if (!token) return;
    try {
      setLoading(true);
      
      // Fetch profile
      const profRes = await axios.get('/api/profile').catch(() => null);
      if (profRes) setProfile(profRes.data);

      // Fetch active roadmap
      const roadRes = await axios.get('/api/roadmap').catch(() => null);
      if (roadRes) setRoadmap(roadRes.data);

      // Fetch progress tracking
      const progRes = await axios.get('/api/progress').catch(() => null);
      if (progRes) setProgress(progRes.data);

      // Fetch bookmarks
      const bRes = await axios.get('/api/bookmarks').catch(() => null);
      if (bRes) setBookmarks(bRes.data);

      // Fetch notifications
      const nRes = await axios.get('/api/notifications').catch(() => null);
      if (nRes) setNotifications(nRes.data);

      // Fetch analytics summary
      const aRes = await axios.get('/api/analytics').catch(() => null);
      if (aRes) setAnalytics(aRes.data);

      // Fetch AI suggestions
      const rRes = await axios.get('/api/recommendations').catch(() => null);
      if (rRes) setRecommendations(rRes.data);

    } catch (e) {
      console.error('Error refreshing study ecosystem data', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await axios.post('/api/login', { email, password: pass });
      setToken(res.data.token);
      showToast('Successfully logged into LearnFlow AI!', 'success');
      return true;
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Login failed. Please check credentials.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, role: string): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await axios.post('/api/register', { email, password: pass, role });
      setToken(res.data.token);
      showToast('Account successfully provisioned!', 'success');
      return true;
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Registration failed.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setCurrentTab('landing');
    showToast('Securely logged out.', 'info');
  };

  const updateProfile = async (data: Partial<Profile>): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await axios.put('/api/profile', data);
      setProfile(res.data);
      showToast('Learning objectives synced successfully!', 'success');
      refreshAllData();
      return true;
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Failed to update profile.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async (subject?: string): Promise<boolean> => {
    try {
      setLoading(true);
      showToast(subject ? `AI Planner is drafting your personalized ${subject} Pathway...` : 'AI Planner is drafting your personalized Roadmap... Please wait.', 'info');
      const res = await axios.post('/api/generate-roadmap', { subject });
      setRoadmap(res.data);
      showToast('Personalized AI learning path generated!', 'success');
      refreshAllData();
      return true;
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Error building dynamic learning timeline.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeLesson = async (topicId: string, subtopicName?: string) => {
    try {
      await axios.put('/api/progress', {
        completedTopicId: topicId,
        completedLessonId: subtopicName || topicId,
      });
      showToast('Topic completed! Streak updated.', 'success');
      refreshAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const addBookmark = async (type: 'lesson' | 'topic' | 'quiz' | 'code', itemId: string, title: string) => {
    try {
      const res = await axios.post('/api/bookmark', { type, title, itemId });
      setBookmarks((prev) => [...prev, res.data]);
      showToast('Added to bookmarks!', 'success');
    } catch (e) {
      showToast('Failed to save bookmark.', 'error');
    }
  };

  const removeBookmark = async (bookmarkId: string) => {
    try {
      await axios.delete(`/api/bookmark/${bookmarkId}`);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      showToast('Removed from bookmarks.', 'info');
    } catch (e) {
      showToast('Failed to delete bookmark.', 'error');
    }
  };

  const clearNotifications = async () => {
    try {
      await axios.post('/api/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast('Notifications marked as read.', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  const setThemePreference = (theme: 'light' | 'dark') => {
    if (profile) {
      updateProfile({ themePreference: theme });
    }
  };

  const setTab = (tab: string) => {
    setCurrentTab(tab);
    // Auto-scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        token,
        user,
        profile,
        roadmap,
        progress,
        bookmarks,
        notifications,
        analytics,
        recommendations,
        currentTab,
        loading,
        toast,
        setTab,
        showToast,
        clearToast,
        login,
        register,
        logout,
        updateProfile,
        generateRoadmap,
        completeLesson,
        addBookmark,
        removeBookmark,
        clearNotifications,
        refreshAllData,
        setThemePreference,
        dbStatus,
        refreshDbStatus,
        continuousSubject,
        setContinuousSubject,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
