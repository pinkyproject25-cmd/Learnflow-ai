export interface User {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'professional' | 'job_seeker' | 'admin';
}

export interface Profile {
  userId: string;
  fullName: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  learningGoal: string;
  studyTimePerDay: number;
  targetRole: string;
  selectedPlan?: string;
  themePreference?: 'light' | 'dark';
}

export interface RoadmapTopic {
  id: string;
  week: number;
  title: string;
  description: string;
  subtopics: string[];
}

export interface Roadmap {
  id: string;
  userId: string;
  title: string;
  targetRole: string;
  skillLevel: string;
  durationWeeks: number;
  topics: RoadmapTopic[];
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string; // Markdown formatted
  notes: string[];
  examples: Array<{
    title: string;
    code?: string;
    explanation: string;
  }>;
}

export interface CodingExercise {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  language: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface UserProgress {
  userId: string;
  completedTopics: string[];
  completedLessons: string[];
  quizAttempts: Record<string, { score: number; total: number; date: string }>;
  codingSubmissions: Record<string, { code: string; passed: boolean; date: string }>;
  streak: number;
  lastActive: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  type: 'lesson' | 'topic' | 'quiz' | 'code';
  title: string;
  itemId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  type: 'info' | 'success' | 'alert';
  read: boolean;
  createdAt: string;
}

export interface AIRecommendations {
  weakAreasFound: string[];
  suggestedRevisionTopics: string[];
  recommendedNextSteps: string[];
  studyAdvice: string;
}

export interface AnalyticsStats {
  completionPercentage: number;
  completedCount: number;
  totalTopics: number;
  studyMinutes: number;
  streak: number;
  weeklyStudyHours: Array<{ name: string; hours: number }>;
  quizPerformance: number;
  codingAccuracy: number;
}

export interface DbStatus {
  isPostgres: boolean;
  postgresError: string | null;
  type: 'postgres' | 'local';
}

