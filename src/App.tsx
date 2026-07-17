/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import Navbar from './components/Navbar.tsx';
import Sidebar from './components/Sidebar.tsx';
import Toast from './components/Toast.tsx';

// Pages
import Landing from './pages/Landing.tsx';
import AuthPages from './pages/AuthPages.tsx';
import ProfileSetup from './pages/ProfileSetup.tsx';
import Dashboard from './pages/Dashboard.tsx';
import LearningJourney from './pages/LearningJourney.tsx';
import LessonViewer from './pages/LessonViewer.tsx';
import CodingPlayground from './pages/CodingPlayground.tsx';
import QuizWorkspace from './pages/QuizWorkspace.tsx';
import Analytics from './pages/Analytics.tsx';
import Bookmarks from './pages/Bookmarks.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';

function MainWorkspaceRouter() {
  const { currentTab, user } = useApp();

  // State coordinates to synchronize active syllabus topic for lessons, playgrounds, and quizzes
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string | null>(null);
  const [selectedTopicSubtopics, setSelectedTopicSubtopics] = useState<string[]>([]);

  const handleSelectTopic = (topicId: string, title: string, subtopics: string[]) => {
    setSelectedTopicId(topicId);
    setSelectedTopicTitle(title);
    setSelectedTopicSubtopics(subtopics);
  };

  // Switch between view tabs
  const renderTabContent = () => {
    switch (currentTab) {
      case 'landing':
        return <Landing />;
      case 'login':
      case 'register':
        return <AuthPages />;
      case 'profile':
        return <ProfileSetup />;
      case 'dashboard':
        return <Dashboard />;
      case 'journey':
        return <LearningJourney onSelectTopic={handleSelectTopic} />;
      case 'lesson_viewer':
        return <LessonViewer topicId={selectedTopicId} topicTitle={selectedTopicTitle} />;
      case 'sandbox':
        return <CodingPlayground topicId={selectedTopicId} topicTitle={selectedTopicTitle} />;
      case 'quiz_workspace':
        return <QuizWorkspace topicId={selectedTopicId} topicTitle={selectedTopicTitle} />;
      case 'analytics':
        return <Analytics />;
      case 'bookmarks':
        return <Bookmarks />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <div className="p-12 text-center text-sm text-gray-400">
            <h3>404 - Viewport Coordinates Not Found</h3>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/25">
      {/* Top Header */}
      <Navbar />

      <div className="flex flex-1">
        {/* Left Drawer Sidebar (Only visible when user is logged in) */}
        {user && <Sidebar />}

        {/* Dynamic central visual window */}
        <main className="flex-1 overflow-x-hidden">
          {renderTabContent()}
        </main>
      </div>

      {/* Global notifications toast overlay */}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainWorkspaceRouter />
    </AppProvider>
  );
}
