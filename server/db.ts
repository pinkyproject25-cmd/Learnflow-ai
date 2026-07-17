import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

const DB_FILE = path.join(process.cwd(), 'db.json');

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'teacher' | 'professional' | 'job_seeker' | 'admin';
}

export interface Profile {
  userId: string;
  fullName: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  learningGoal: string;
  studyTimePerDay: number; // in minutes
  targetRole: string;
  selectedPlan?: string;
  themePreference?: 'light' | 'dark';
  activeRoadmapId?: string;
  education?: string;
  profilePicture?: string;
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
  id: string; // matches topicId or topicTitle key
  title: string;
  content: string; // Markdown
  notes: string[];
  examples: Array<{ title: string; code?: string; explanation: string }>;
  summary?: string;
  keyPoints?: string[];
  keyConcepts?: string[];
  importantPoints?: string[];

  // Advanced lesson and notes fields
  completeExplanation?: string;
  beginnerExplanation?: string;
  intermediateExplanation?: string;
  advancedExplanation?: string;
  detailedNotes?: string[];
  realWorldExamples?: string[];
  codeExamples?: Array<{ title: string; code?: string; explanation: string }>;
  bestPractices?: string[];
  commonMistakes?: string[];
  nextTopic?: string;
  definitions?: Array<{ term: string; definition: string }>;
  interviewQuestions?: Array<{ question: string; answer: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  revisionNotes?: string[];
}

export interface CodingExercise {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  language: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
  sampleSolution: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string[];
  hints?: string[];
  sampleInput?: string;
  sampleOutput?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation: string;
}

export interface Quiz {
  id: string; // matches topicId
  title: string;
  questions: QuizQuestion[];
}

export interface UserProgress {
  userId: string;
  completedTopics: string[]; // List of topic IDs
  completedLessons: string[]; // List of lesson IDs / subtopic names
  quizAttempts: Record<string, { score: number; total: number; date: string }>;
  codingSubmissions: Record<string, { code: string; passed: boolean; date: string }>;
  streak: number;
  lastActive: string; // YYYY-MM-DD
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

export interface StudySession {
  id: string;
  userId: string;
  roadmapId: string;
  durationMinutes: number;
  date: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  profiles: Profile[];
  roadmaps: Roadmap[];
  lessons: Record<string, Lesson>; // Key: topic_id/name
  codingExercises: Record<string, CodingExercise>; // Key: topic_id/name
  quizzes: Record<string, Quiz>; // Key: topic_id/name
  progress: UserProgress[];
  bookmarks: Bookmark[];
  notifications: Notification[];
  studySessions: StudySession[];
  activityLogs: ActivityLog[];
}

const defaultDb: DatabaseSchema = {
  users: [
    {
      id: 'demo-user',
      email: 'demo@learnflow.ai',
      // Password hash for 'password123'
      passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
      role: 'professional',
    },
    {
      id: 'demo-admin',
      email: 'admin@learnflow.ai',
      passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
      role: 'admin',
    },
  ],
  profiles: [
    {
      userId: 'demo-user',
      fullName: 'Demo Learner',
      currentLevel: 'beginner',
      learningGoal: 'Master Modern Web Development and AI Integration',
      studyTimePerDay: 45,
      targetRole: 'Full Stack Engineer',
      selectedPlan: 'AI-Guided Mastery',
      themePreference: 'light',
      education: 'Bachelor of Computer Science',
      profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  ],
  roadmaps: [],
  lessons: {},
  codingExercises: {},
  quizzes: {},
  progress: [
    {
      userId: 'demo-user',
      completedTopics: [],
      completedLessons: [],
      quizAttempts: {},
      codingSubmissions: {},
      streak: 3,
      lastActive: new Date().toISOString().split('T')[0],
    },
  ],
  bookmarks: [],
  notifications: [
    {
      id: 'notif-1',
      userId: 'demo-user',
      text: 'Welcome to LearnFlow AI! Generate your first roadmap to start learning.',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ],
  studySessions: [],
  activityLogs: [],
};

class LocalDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = { ...defaultDb };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        if (!this.data.studySessions) this.data.studySessions = [];
        if (!this.data.activityLogs) this.data.activityLogs = [];
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading database, using defaults', e);
      this.data = { ...defaultDb };
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database', e);
    }
  }

  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user: User): void {
    this.data.users.push(user);
    this.data.progress.push({
      userId: user.id,
      completedTopics: [],
      completedLessons: [],
      quizAttempts: {},
      codingSubmissions: {},
      streak: 1,
      lastActive: new Date().toISOString().split('T')[0],
    });
    this.data.notifications.push({
      id: Math.random().toString(36).substring(7),
      userId: user.id,
      text: `Welcome ${user.email}! Set up your learning profile to configure AI personalization.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    });
    this.save();
  }

  getProfile(userId: string): Profile | undefined {
    return this.data.profiles.find((p) => p.userId === userId);
  }

  saveProfile(profile: Profile): void {
    const index = this.data.profiles.findIndex((p) => p.userId === profile.userId);
    if (index >= 0) {
      this.data.profiles[index] = { ...this.data.profiles[index], ...profile };
    } else {
      this.data.profiles.push(profile);
    }
    this.save();
  }

  getRoadmap(userId: string): Roadmap | undefined {
    const profile = this.getProfile(userId);
    if (profile?.activeRoadmapId) {
      const active = this.data.roadmaps.find((r) => r.id === profile.activeRoadmapId && r.userId === userId);
      if (active) return active;
    }
    const userRoadmaps = this.data.roadmaps.filter((r) => r.userId === userId);
    if (userRoadmaps.length === 0) return undefined;
    return userRoadmaps.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }

  getRoadmaps(userId: string): Roadmap[] {
    return this.data.roadmaps.filter((r) => r.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  setActiveRoadmap(userId: string, roadmapId: string): void {
    const prof = this.getProfile(userId);
    if (prof) {
      prof.activeRoadmapId = roadmapId;
      this.saveProfile(prof);
    }
  }

  saveRoadmap(roadmap: Roadmap): void {
    this.data.roadmaps.push(roadmap);
    this.save();
  }

  deleteRoadmap(userId: string, roadmapId: string): void {
    // 1. Delete bookmarks
    this.data.bookmarks = this.data.bookmarks.filter(
      (b) => !(b.userId === userId && b.itemId.startsWith(roadmapId + '_'))
    );
    // 2. Delete study sessions
    this.data.studySessions = this.data.studySessions.filter(
      (s) => !(s.userId === userId && s.roadmapId === roadmapId)
    );
    // 3. Delete lessons, quizzes, coding exercises
    for (const key of Object.keys(this.data.lessons)) {
      if (key.startsWith(roadmapId + '_')) {
        delete this.data.lessons[key];
      }
    }
    for (const key of Object.keys(this.data.quizzes)) {
      if (key.startsWith(roadmapId + '_')) {
        delete this.data.quizzes[key];
      }
    }
    for (const key of Object.keys(this.data.codingExercises)) {
      if (key.startsWith(roadmapId + '_')) {
        delete this.data.codingExercises[key];
      }
    }
    // 4. Update user progress
    const progIndex = this.data.progress.findIndex((p) => p.userId === userId);
    if (progIndex >= 0) {
      const prog = this.data.progress[progIndex];
      prog.completedTopics = prog.completedTopics.filter(id => !id.startsWith(roadmapId + '_'));
      prog.completedLessons = prog.completedLessons.filter(id => !id.startsWith(roadmapId + '_'));
      
      const quizAttempts: Record<string, any> = {};
      for (const [key, val] of Object.entries(prog.quizAttempts)) {
        if (!key.startsWith(roadmapId + '_')) {
          quizAttempts[key] = val;
        }
      }
      prog.quizAttempts = quizAttempts;

      const codingSubmissions: Record<string, any> = {};
      for (const [key, val] of Object.entries(prog.codingSubmissions)) {
        if (!key.startsWith(roadmapId + '_')) {
          codingSubmissions[key] = val;
        }
      }
      prog.codingSubmissions = codingSubmissions;
    }
    // 5. Delete roadmap itself
    this.data.roadmaps = this.data.roadmaps.filter(
      (r) => !(r.userId === userId && r.id === roadmapId)
    );
    // 6. Update profile active_roadmap_id
    const profile = this.getProfile(userId);
    if (profile && profile.activeRoadmapId === roadmapId) {
      profile.activeRoadmapId = undefined;
      this.saveProfile(profile);
    }
    this.save();
  }

  getLesson(topicId: string): Lesson | undefined {
    return this.data.lessons[topicId];
  }

  saveLesson(topicId: string, lesson: Lesson): void {
    this.data.lessons[topicId] = lesson;
    this.save();
  }

  getCodingExercise(topicId: string): CodingExercise | undefined {
    return this.data.codingExercises[topicId];
  }

  saveCodingExercise(topicId: string, exercise: CodingExercise): void {
    this.data.codingExercises[topicId] = exercise;
    this.save();
  }

  getQuiz(topicId: string): Quiz | undefined {
    return this.data.quizzes[topicId];
  }

  saveQuiz(topicId: string, quiz: Quiz): void {
    this.data.quizzes[topicId] = quiz;
    this.save();
  }

  getProgress(userId: string): UserProgress {
    let prog = this.data.progress.find((p) => p.userId === userId);
    if (!prog) {
      prog = {
        userId,
        completedTopics: [],
        completedLessons: [],
        quizAttempts: {},
        codingSubmissions: {},
        streak: 1,
        lastActive: new Date().toISOString().split('T')[0],
      };
      this.data.progress.push(prog);
      this.save();
    }
    return prog;
  }

  updateProgress(userId: string, update: Partial<UserProgress>): UserProgress {
    const prog = this.getProgress(userId);
    const index = this.data.progress.indexOf(prog);
    
    let streak = prog.streak;
    const todayStr = new Date().toISOString().split('T')[0];
    if (prog.lastActive && prog.lastActive !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (prog.lastActive === yesterdayStr) {
        streak += 1;
      } else {
        streak = 1;
      }
    }

    const updatedProg = {
      ...prog,
      ...update,
      streak,
      lastActive: todayStr,
    };
    
    this.data.progress[index] = updatedProg;
    this.save();
    return updatedProg;
  }

  getBookmarks(userId: string): Bookmark[] {
    return this.data.bookmarks.filter((b) => b.userId === userId);
  }

  addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
    };
    this.data.bookmarks.push(newBookmark);
    this.save();
    return newBookmark;
  }

  removeBookmark(userId: string, bookmarkId: string): boolean {
    const initialLen = this.data.bookmarks.length;
    this.data.bookmarks = this.data.bookmarks.filter(
      (b) => !(b.userId === userId && b.id === bookmarkId)
    );
    const removed = this.data.bookmarks.length < initialLen;
    if (removed) this.save();
    return removed;
  }

  getNotifications(userId: string): Notification[] {
    return this.data.notifications.filter((n) => n.userId === userId);
  }

  addNotification(userId: string, text: string, type: 'info' | 'success' | 'alert' = 'info'): Notification {
    const newNotif: Notification = {
      id: Math.random().toString(36).substring(7),
      userId,
      text,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.push(newNotif);
    this.save();
    return newNotif;
  }

  markNotificationsAsRead(userId: string): void {
    this.data.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    this.save();
  }

  getStudySessions(userId: string): StudySession[] {
    return this.data.studySessions.filter((s) => s.userId === userId);
  }

  addStudySession(session: Omit<StudySession, 'id'>): StudySession {
    const newS: StudySession = {
      ...session,
      id: Math.random().toString(36).substring(7),
    };
    this.data.studySessions.push(newS);
    this.save();
    return newS;
  }

  getActivityLogs(userId: string): ActivityLog[] {
    return this.data.activityLogs.filter((l) => l.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  addActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): ActivityLog {
    const newL: ActivityLog = {
      ...log,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
    };
    this.data.activityLogs.push(newL);
    this.save();
    return newL;
  }
}

class DualDatabase {
  private localDb: LocalDatabase;
  private pool: pg.Pool | null = null;
  public isPostgres = false;
  public postgresError: string | null = null;

  constructor() {
    this.localDb = new LocalDatabase();
    this.initPostgres();
  }

  private async initPostgres() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    const hasConfig = !!(connectionString || process.env.PGHOST);

    if (!hasConfig) {
      console.log('PostgreSQL database config not found. Operating in local JSON mode.');
      return;
    }

    try {
      this.pool = new Pool(
        connectionString 
          ? { connectionString, ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false } }
          : {
              host: process.env.PGHOST,
              user: process.env.PGUSER,
              password: process.env.PGPASSWORD,
              database: process.env.PGDATABASE,
              port: Number(process.env.PGPORT || 5432),
              ssl: { rejectUnauthorized: false }
            }
      );

      // Verify connection
      const client = await this.pool.connect();
      client.release();

      console.log('PostgreSQL database connected successfully!');
      this.isPostgres = true;
      this.postgresError = null;

      // Initialize database schema
      await this.runMigrations();
    } catch (e: any) {
      console.error('Failed to connect to PostgreSQL. Falling back to local JSON database.', e.message);
      this.isPostgres = false;
      this.postgresError = e.message;
    }
  }

  private async runMigrations() {
    if (!this.pool) return;

    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS profiles (
        user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        current_level VARCHAR(50) NOT NULL,
        learning_goal TEXT NOT NULL,
        study_time_per_day INT NOT NULL,
        target_role VARCHAR(255) NOT NULL,
        selected_plan VARCHAR(255),
        theme_preference VARCHAR(50)
      );`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_roadmap_id VARCHAR(255);`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education VARCHAR(255);`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture TEXT;`,
      `CREATE TABLE IF NOT EXISTS roadmaps (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        target_role VARCHAR(255) NOT NULL,
        skill_level VARCHAR(50) NOT NULL,
        duration_weeks INT NOT NULL,
        topics JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS lessons (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        notes JSONB NOT NULL,
        examples JSONB NOT NULL,
        summary TEXT,
        key_points JSONB
      );`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS key_concepts JSONB;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS important_points JSONB;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS complete_explanation TEXT;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS beginner_explanation TEXT;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS intermediate_explanation TEXT;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS advanced_explanation TEXT;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS detailed_notes JSONB;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS real_world_examples JSONB;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS code_examples JSONB;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS best_practices JSONB;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS common_mistakes JSONB;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS revision_notes JSONB;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS next_topic TEXT;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS definitions JSONB;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS interview_questions JSONB;`,
      `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS faqs JSONB;`,
      `CREATE TABLE IF NOT EXISTS coding_exercises (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        starter_code TEXT NOT NULL,
        language VARCHAR(50) NOT NULL,
        test_cases JSONB NOT NULL,
        sample_solution TEXT NOT NULL,
        difficulty VARCHAR(50),
        input_format TEXT,
        output_format TEXT,
        constraints JSONB,
        hints JSONB,
        sample_input TEXT,
        sample_output TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS quizzes (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        questions JSONB NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS progress (
        user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        completed_topics JSONB NOT NULL,
        completed_lessons JSONB NOT NULL,
        quiz_attempts JSONB NOT NULL,
        coding_submissions JSONB NOT NULL,
        streak INT NOT NULL DEFAULT 1,
        last_active VARCHAR(50) NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS bookmarks (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        item_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS study_sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        roadmap_id VARCHAR(255),
        duration_minutes INT NOT NULL,
        date VARCHAR(50) NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      // Seed Demo User in PostgreSQL if table is empty
      `INSERT INTO users (id, email, password_hash, role)
       VALUES ('demo-user', 'demo@learnflow.ai', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'professional')
       ON CONFLICT (id) DO NOTHING;`,
      `INSERT INTO profiles (user_id, full_name, current_level, learning_goal, study_time_per_day, target_role, selected_plan, theme_preference, education, profile_picture)
       VALUES ('demo-user', 'Demo Learner', 'beginner', 'Master Modern Web Development and AI Integration', 45, 'Full Stack Engineer', 'AI-Guided Mastery', 'light', 'Bachelor of Computer Science', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
       ON CONFLICT (user_id) DO NOTHING;`,
      `INSERT INTO progress (user_id, completed_topics, completed_lessons, quiz_attempts, coding_submissions, streak, last_active)
       VALUES ('demo-user', '[]'::jsonb, '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, 3, '${new Date().toISOString().split('T')[0]}')
       ON CONFLICT (user_id) DO NOTHING;`,
      `INSERT INTO notifications (id, user_id, text, type, read, created_at)
       VALUES ('notif-1', 'demo-user', 'Welcome to LearnFlow AI! Generate your first roadmap to start learning.', 'info', FALSE, NOW())
       ON CONFLICT (id) DO NOTHING;`
    ];

    for (const q of queries) {
      await this.pool.query(q);
    }
    console.log('PostgreSQL schema migrations finished.');
  }

  // --- Users & Auth ---
  async getUsers(): Promise<User[]> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('SELECT id, email, password_hash AS "passwordHash", role FROM users');
      return res.rows;
    }
    return this.localDb.getUsers();
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('SELECT id, email, password_hash AS "passwordHash", role FROM users WHERE id = $1', [id]);
      return res.rows[0];
    }
    return this.localDb.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('SELECT id, email, password_hash AS "passwordHash", role FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      return res.rows[0];
    }
    return this.localDb.getUserByEmail(email);
  }

  async addUser(user: User): Promise<void> {
    if (this.isPostgres && this.pool) {
      await this.pool.query('INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)', [user.id, user.email, user.passwordHash, user.role]);
      
      // Add default progress and notifications
      await this.pool.query(
        'INSERT INTO progress (user_id, completed_topics, completed_lessons, quiz_attempts, coding_submissions, streak, last_active) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [user.id, JSON.stringify([]), JSON.stringify([]), JSON.stringify({}), JSON.stringify({}), 1, new Date().toISOString().split('T')[0]]
      );

      const notifId = Math.random().toString(36).substring(7);
      await this.pool.query(
        'INSERT INTO notifications (id, user_id, text, type, read, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [notifId, user.id, `Welcome ${user.email}! Set up your learning profile to configure AI personalization.`, 'success', false]
      );
      return;
    }
    return this.localDb.addUser(user);
  }

  // --- Profiles ---
  async getProfile(userId: string): Promise<Profile | undefined> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        'SELECT user_id AS "userId", full_name AS "fullName", current_level AS "currentLevel", learning_goal AS "learningGoal", study_time_per_day AS "studyTimePerDay", target_role AS "targetRole", selected_plan AS "selectedPlan", theme_preference AS "themePreference", active_roadmap_id AS "activeRoadmapId", education, profile_picture AS "profilePicture" FROM profiles WHERE user_id = $1',
        [userId]
      );
      return res.rows[0];
    }
    return this.localDb.getProfile(userId);
  }

  async saveProfile(profile: Profile): Promise<void> {
    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `INSERT INTO profiles (user_id, full_name, current_level, learning_goal, study_time_per_day, target_role, selected_plan, theme_preference, active_roadmap_id, education, profile_picture)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (user_id) DO UPDATE SET 
           full_name = EXCLUDED.full_name,
           current_level = EXCLUDED.current_level,
           learning_goal = EXCLUDED.learning_goal,
           study_time_per_day = EXCLUDED.study_time_per_day,
           target_role = EXCLUDED.target_role,
           selected_plan = EXCLUDED.selected_plan,
           theme_preference = EXCLUDED.theme_preference,
           active_roadmap_id = EXCLUDED.active_roadmap_id,
           education = EXCLUDED.education,
           profile_picture = EXCLUDED.profile_picture`,
        [
          profile.userId,
          profile.fullName,
          profile.currentLevel,
          profile.learningGoal,
          profile.studyTimePerDay,
          profile.targetRole,
          profile.selectedPlan || 'AI-Guided Mastery',
          profile.themePreference || 'light',
          profile.activeRoadmapId || null,
          profile.education || null,
          profile.profilePicture || null
        ]
      );
      return;
    }
    return this.localDb.saveProfile(profile);
  }

  // --- Roadmaps ---
  async getRoadmap(userId: string): Promise<Roadmap | undefined> {
    if (this.isPostgres && this.pool) {
      const profile = await this.getProfile(userId);
      if (profile?.activeRoadmapId) {
        const res = await this.pool.query(
          'SELECT id, user_id AS "userId", title, target_role AS "targetRole", skill_level AS "skillLevel", duration_weeks AS "durationWeeks", topics, created_at AS "createdAt" FROM roadmaps WHERE id = $1 AND user_id = $2',
          [profile.activeRoadmapId, userId]
        );
        if (res.rows[0]) {
          const row = res.rows[0];
          return { ...row, createdAt: new Date(row.createdAt).toISOString() };
        }
      }
      const res = await this.pool.query(
        'SELECT id, user_id AS "userId", title, target_role AS "targetRole", skill_level AS "skillLevel", duration_weeks AS "durationWeeks", topics, created_at AS "createdAt" FROM roadmaps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      const row = res.rows[0];
      if (!row) return undefined;
      return {
        ...row,
        createdAt: new Date(row.createdAt).toISOString()
      };
    }
    return this.localDb.getRoadmap(userId);
  }

  async getRoadmaps(userId: string): Promise<Roadmap[]> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        'SELECT id, user_id AS "userId", title, target_role AS "targetRole", skill_level AS "skillLevel", duration_weeks AS "durationWeeks", topics, created_at AS "createdAt" FROM roadmaps WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return res.rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt).toISOString()
      }));
    }
    return this.localDb.getRoadmaps(userId);
  }

  async setActiveRoadmap(userId: string, roadmapId: string): Promise<void> {
    if (this.isPostgres && this.pool) {
      await this.pool.query('UPDATE profiles SET active_roadmap_id = $1 WHERE user_id = $2', [roadmapId, userId]);
      return;
    }
    return this.localDb.setActiveRoadmap(userId, roadmapId);
  }

  async saveRoadmap(roadmap: Roadmap): Promise<void> {
    if (this.isPostgres && this.pool) {
      await this.pool.query(
        'INSERT INTO roadmaps (id, user_id, title, target_role, skill_level, duration_weeks, topics, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          roadmap.id,
          roadmap.userId,
          roadmap.title,
          roadmap.targetRole,
          roadmap.skillLevel,
          roadmap.durationWeeks,
          JSON.stringify(roadmap.topics),
          roadmap.createdAt
        ]
      );
      return;
    }
    return this.localDb.saveRoadmap(roadmap);
  }

  async deleteRoadmap(userId: string, roadmapId: string): Promise<void> {
    if (this.isPostgres && this.pool) {
      // 1. Delete bookmarks
      await this.pool.query('DELETE FROM bookmarks WHERE user_id = $1 AND item_id LIKE $2', [userId, `${roadmapId}_%`]);
      // 2. Delete study sessions
      await this.pool.query('DELETE FROM study_sessions WHERE user_id = $1 AND roadmap_id = $2', [userId, roadmapId]);
      // 3. Delete lessons, quizzes, coding exercises associated with this roadmap
      await this.pool.query('DELETE FROM lessons WHERE id LIKE $1', [`${roadmapId}_%`]);
      await this.pool.query('DELETE FROM quizzes WHERE id LIKE $1', [`${roadmapId}_%`]);
      await this.pool.query('DELETE FROM coding_exercises WHERE id LIKE $1', [`${roadmapId}_%`]);
      
      // 4. Update user progress
      const prog = await this.getProgress(userId);
      const completedTopics = prog.completedTopics.filter(id => !id.startsWith(roadmapId + '_'));
      const completedLessons = prog.completedLessons.filter(id => !id.startsWith(roadmapId + '_'));
      
      const quizAttempts: Record<string, any> = {};
      for (const [key, val] of Object.entries(prog.quizAttempts)) {
        if (!key.startsWith(roadmapId + '_')) {
          quizAttempts[key] = val;
        }
      }
      
      const codingSubmissions: Record<string, any> = {};
      for (const [key, val] of Object.entries(prog.codingSubmissions)) {
        if (!key.startsWith(roadmapId + '_')) {
          codingSubmissions[key] = val;
        }
      }
      
      await this.pool.query(
        `UPDATE progress SET 
          completed_topics = $1, 
          completed_lessons = $2, 
          quiz_attempts = $3, 
          coding_submissions = $4 
         WHERE user_id = $5`,
        [JSON.stringify(completedTopics), JSON.stringify(completedLessons), JSON.stringify(quizAttempts), JSON.stringify(codingSubmissions), userId]
      );

      // 5. Delete the roadmap itself
      await this.pool.query('DELETE FROM roadmaps WHERE id = $1 AND user_id = $2', [roadmapId, userId]);

      // 6. Update active roadmap if it was this one
      const profile = await this.getProfile(userId);
      if (profile && profile.activeRoadmapId === roadmapId) {
        await this.pool.query('UPDATE profiles SET active_roadmap_id = NULL WHERE user_id = $1', [userId]);
      }
      return;
    }
    return this.localDb.deleteRoadmap(userId, roadmapId);
  }

  // --- Lessons ---
  async getLesson(topicId: string): Promise<Lesson | undefined> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        `SELECT id, title, content, notes, examples, summary, 
                key_points AS "keyPoints", key_concepts AS "keyConcepts", important_points AS "importantPoints",
                complete_explanation AS "completeExplanation", beginner_explanation AS "beginnerExplanation",
                intermediate_explanation AS "intermediateExplanation", advanced_explanation AS "advancedExplanation",
                detailed_notes AS "detailedNotes", real_world_examples AS "realWorldExamples",
                code_examples AS "codeExamples", best_practices AS "bestPractices",
                common_mistakes AS "commonMistakes", next_topic AS "nextTopic",
                definitions, interview_questions AS "interviewQuestions", faqs,
                revision_notes AS "revisionNotes"
         FROM lessons WHERE id = $1`,
        [topicId]
      );
      return res.rows[0];
    }
    return this.localDb.getLesson(topicId);
  }

  async saveLesson(topicId: string, lesson: Lesson): Promise<void> {
    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `INSERT INTO lessons (
          id, title, content, notes, examples, summary, key_points, key_concepts, important_points,
          complete_explanation, beginner_explanation, intermediate_explanation, advanced_explanation,
          detailed_notes, real_world_examples, code_examples, best_practices, common_mistakes,
          next_topic, definitions, interview_questions, faqs, revision_notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )
         ON CONFLICT (id) DO UPDATE SET 
          title = EXCLUDED.title, content = EXCLUDED.content, notes = EXCLUDED.notes, examples = EXCLUDED.examples, 
          summary = EXCLUDED.summary, key_points = EXCLUDED.key_points, key_concepts = EXCLUDED.key_concepts, 
          important_points = EXCLUDED.important_points, complete_explanation = EXCLUDED.complete_explanation, 
          beginner_explanation = EXCLUDED.beginner_explanation, intermediate_explanation = EXCLUDED.intermediate_explanation, 
          advanced_explanation = EXCLUDED.advanced_explanation, detailed_notes = EXCLUDED.detailed_notes, 
          real_world_examples = EXCLUDED.real_world_examples, code_examples = EXCLUDED.code_examples, 
          best_practices = EXCLUDED.best_practices, common_mistakes = EXCLUDED.common_mistakes, 
          next_topic = EXCLUDED.next_topic, definitions = EXCLUDED.definitions, 
          interview_questions = EXCLUDED.interview_questions, faqs = EXCLUDED.faqs, revision_notes = EXCLUDED.revision_notes`,
        [
          lesson.id, 
          lesson.title, 
          lesson.content, 
          JSON.stringify(lesson.notes), 
          JSON.stringify(lesson.examples), 
          lesson.summary || null, 
          lesson.keyPoints ? JSON.stringify(lesson.keyPoints) : null,
          lesson.keyConcepts ? JSON.stringify(lesson.keyConcepts) : null,
          lesson.importantPoints ? JSON.stringify(lesson.importantPoints) : null,
          lesson.completeExplanation || null,
          lesson.beginnerExplanation || null,
          lesson.intermediateExplanation || null,
          lesson.advancedExplanation || null,
          lesson.detailedNotes ? JSON.stringify(lesson.detailedNotes) : null,
          lesson.realWorldExamples ? JSON.stringify(lesson.realWorldExamples) : null,
          lesson.codeExamples ? JSON.stringify(lesson.codeExamples) : null,
          lesson.bestPractices ? JSON.stringify(lesson.bestPractices) : null,
          lesson.commonMistakes ? JSON.stringify(lesson.commonMistakes) : null,
          lesson.nextTopic || null,
          lesson.definitions ? JSON.stringify(lesson.definitions) : null,
          lesson.interviewQuestions ? JSON.stringify(lesson.interviewQuestions) : null,
          lesson.faqs ? JSON.stringify(lesson.faqs) : null,
          lesson.revisionNotes ? JSON.stringify(lesson.revisionNotes) : null
        ]
      );
      return;
    }
    return this.localDb.saveLesson(topicId, lesson);
  }

  // --- Coding Exercises ---
  async getCodingExercise(topicId: string): Promise<CodingExercise | undefined> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        'SELECT id, title, description, starter_code AS "starterCode", language, test_cases AS "testCases", sample_solution AS "sampleSolution", difficulty, input_format AS "inputFormat", output_format AS "outputFormat", constraints, hints, sample_input AS "sampleInput", sample_output AS "sampleOutput" FROM coding_exercises WHERE id = $1',
        [topicId]
      );
      return res.rows[0];
    }
    return this.localDb.getCodingExercise(topicId);
  }

  async saveCodingExercise(topicId: string, exercise: CodingExercise): Promise<void> {
    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `INSERT INTO coding_exercises (id, title, description, starter_code, language, test_cases, sample_solution, difficulty, input_format, output_format, constraints, hints, sample_input, sample_output)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET 
           title = EXCLUDED.title, 
           description = EXCLUDED.description, 
           starter_code = EXCLUDED.starter_code, 
           language = EXCLUDED.language, 
           test_cases = EXCLUDED.test_cases, 
           sample_solution = EXCLUDED.sample_solution,
           difficulty = EXCLUDED.difficulty,
           input_format = EXCLUDED.input_format,
           output_format = EXCLUDED.output_format,
           constraints = EXCLUDED.constraints,
           hints = EXCLUDED.hints,
           sample_input = EXCLUDED.sample_input,
           sample_output = EXCLUDED.sample_output`,
        [
          exercise.id,
          exercise.title,
          exercise.description,
          exercise.starterCode,
          exercise.language,
          JSON.stringify(exercise.testCases),
          exercise.sampleSolution,
          exercise.difficulty || null,
          exercise.inputFormat || null,
          exercise.outputFormat || null,
          exercise.constraints ? JSON.stringify(exercise.constraints) : null,
          exercise.hints ? JSON.stringify(exercise.hints) : null,
          exercise.sampleInput || null,
          exercise.sampleOutput || null
        ]
      );
      return;
    }
    return this.localDb.saveCodingExercise(topicId, exercise);
  }

  // --- Quizzes ---
  async getQuiz(topicId: string): Promise<Quiz | undefined> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('SELECT id, title, questions FROM quizzes WHERE id = $1', [topicId]);
      return res.rows[0];
    }
    return this.localDb.getQuiz(topicId);
  }

  async saveQuiz(topicId: string, quiz: Quiz): Promise<void> {
    if (this.isPostgres && this.pool) {
      await this.pool.query(
        `INSERT INTO quizzes (id, title, questions) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, questions = EXCLUDED.questions`,
        [quiz.id, quiz.title, JSON.stringify(quiz.questions)]
      );
      return;
    }
    return this.localDb.saveQuiz(topicId, quiz);
  }

  // --- Progress ---
  async getProgress(userId: string): Promise<UserProgress> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        'SELECT user_id AS "userId", completed_topics AS "completedTopics", completed_lessons AS "completedLessons", quiz_attempts AS "quizAttempts", coding_submissions AS "codingSubmissions", streak, last_active AS "lastActive" FROM progress WHERE user_id = $1',
        [userId]
      );
      const row = res.rows[0];
      if (!row) {
        const defaultProg: UserProgress = {
          userId,
          completedTopics: [],
          completedLessons: [],
          quizAttempts: {},
          codingSubmissions: {},
          streak: 1,
          lastActive: new Date().toISOString().split('T')[0],
        };
        await this.pool.query(
          'INSERT INTO progress (user_id, completed_topics, completed_lessons, quiz_attempts, coding_submissions, streak, last_active) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (user_id) DO NOTHING',
          [userId, JSON.stringify([]), JSON.stringify([]), JSON.stringify({}), JSON.stringify({}), 1, defaultProg.lastActive]
        );
        return defaultProg;
      }
      return row;
    }
    return this.localDb.getProgress(userId);
  }

  async updateProgress(userId: string, update: Partial<UserProgress>): Promise<UserProgress> {
    if (this.isPostgres && this.pool) {
      const prog = await this.getProgress(userId);
      
      let streak = prog.streak;
      const todayStr = new Date().toISOString().split('T')[0];
      if (prog.lastActive && prog.lastActive !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (prog.lastActive === yesterdayStr) {
          streak += 1;
        } else {
          streak = 1;
        }
      }

      const merged = {
        completedTopics: update.completedTopics !== undefined ? update.completedTopics : prog.completedTopics,
        completedLessons: update.completedLessons !== undefined ? update.completedLessons : prog.completedLessons,
        quizAttempts: update.quizAttempts !== undefined ? update.quizAttempts : prog.quizAttempts,
        codingSubmissions: update.codingSubmissions !== undefined ? update.codingSubmissions : prog.codingSubmissions,
      };

      await this.pool.query(
        `INSERT INTO progress (user_id, completed_topics, completed_lessons, quiz_attempts, coding_submissions, streak, last_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET
           completed_topics = EXCLUDED.completed_topics,
           completed_lessons = EXCLUDED.completed_lessons,
           quiz_attempts = EXCLUDED.quiz_attempts,
           coding_submissions = EXCLUDED.coding_submissions,
           streak = EXCLUDED.streak,
           last_active = EXCLUDED.last_active`,
        [
          userId,
          JSON.stringify(merged.completedTopics),
          JSON.stringify(merged.completedLessons),
          JSON.stringify(merged.quizAttempts),
          JSON.stringify(merged.codingSubmissions),
          streak,
          todayStr
        ]
      );

      return {
        userId,
        ...merged,
        streak,
        lastActive: todayStr
      };
    }
    return this.localDb.updateProgress(userId, update);
  }

  // --- Bookmarks ---
  async getBookmarks(userId: string): Promise<Bookmark[]> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        'SELECT id, user_id AS "userId", type, title, item_id AS "itemId", created_at AS "createdAt" FROM bookmarks WHERE user_id = $1',
        [userId]
      );
      return res.rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt).toISOString()
      }));
    }
    return this.localDb.getBookmarks(userId);
  }

  async addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> {
    if (this.isPostgres && this.pool) {
      const id = Math.random().toString(36).substring(7);
      const createdAt = new Date().toISOString();
      await this.pool.query(
        'INSERT INTO bookmarks (id, user_id, type, title, item_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, bookmark.userId, bookmark.type, bookmark.title, bookmark.itemId, createdAt]
      );
      return {
        id,
        userId: bookmark.userId,
        type: bookmark.type,
        title: bookmark.title,
        itemId: bookmark.itemId,
        createdAt
      };
    }
    return this.localDb.addBookmark(bookmark);
  }

  async removeBookmark(userId: string, bookmarkId: string): Promise<boolean> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('DELETE FROM bookmarks WHERE user_id = $1 AND id = $2', [userId, bookmarkId]);
      return (res.rowCount ?? 0) > 0;
    }
    return this.localDb.removeBookmark(userId, bookmarkId);
  }

  // --- Notifications ---
  async getNotifications(userId: string): Promise<Notification[]> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query(
        'SELECT id, user_id AS "userId", text, type, read, created_at AS "createdAt" FROM notifications WHERE user_id = $1',
        [userId]
      );
      return res.rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt).toISOString()
      }));
    }
    return this.localDb.getNotifications(userId);
  }

  async addNotification(userId: string, text: string, type: 'info' | 'success' | 'alert' = 'info'): Promise<Notification> {
    if (this.isPostgres && this.pool) {
      const id = Math.random().toString(36).substring(7);
      const createdAt = new Date().toISOString();
      await this.pool.query(
        'INSERT INTO notifications (id, user_id, text, type, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, userId, text, type, false, createdAt]
      );
      return {
        id,
        userId,
        text,
        type,
        read: false,
        createdAt
      };
    }
    return this.localDb.addNotification(userId, text, type);
  }

  async markNotificationsAsRead(userId: string): Promise<void> {
    if (this.isPostgres && this.pool) {
      await this.pool.query('UPDATE notifications SET read = TRUE WHERE user_id = $1', [userId]);
      return;
    }
    return this.localDb.markNotificationsAsRead(userId);
  }

  async getStudySessions(userId: string): Promise<StudySession[]> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('SELECT id, user_id AS "userId", roadmap_id AS "roadmapId", duration_minutes AS "durationMinutes", date FROM study_sessions WHERE user_id = $1', [userId]);
      return res.rows;
    }
    return this.localDb.getStudySessions(userId);
  }

  async addStudySession(session: Omit<StudySession, 'id'>): Promise<StudySession> {
    if (this.isPostgres && this.pool) {
      const id = Math.random().toString(36).substring(7);
      await this.pool.query('INSERT INTO study_sessions (id, user_id, roadmap_id, duration_minutes, date) VALUES ($1, $2, $3, $4, $5)', [id, session.userId, session.roadmapId, session.durationMinutes, session.date]);
      return { id, ...session };
    }
    return this.localDb.addStudySession(session);
  }

  async getActivityLogs(userId: string): Promise<ActivityLog[]> {
    if (this.isPostgres && this.pool) {
      const res = await this.pool.query('SELECT id, user_id AS "userId", action, created_at AS "createdAt" FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return res.rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt).toISOString()
      }));
    }
    return this.localDb.getActivityLogs(userId);
  }

  async addActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    if (this.isPostgres && this.pool) {
      const id = Math.random().toString(36).substring(7);
      const createdAt = new Date().toISOString();
      await this.pool.query('INSERT INTO activity_logs (id, user_id, action, created_at) VALUES ($1, $2, $3, $4)', [id, log.userId, log.action, createdAt]);
      return { id, userId: log.userId, action: log.action, createdAt };
    }
    return this.localDb.addActivityLog(log);
  }
}

export const db = new DualDatabase();
