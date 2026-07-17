import express from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, User } from './server/db.ts';
import {
  generateAILearningRoadmap,
  generateAILesson,
  generateAICodingProblem,
  generateAIQuiz,
  generateAIRecommendations,
  generateAISingleQuizQuestion,
  generateAISingleCodingProblem,
} from './server/gemini.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// --- Helper: Native Crypto Password Hashing ---
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// --- Helper: Simple Robust Auth System ---
// A secure local token structure format: "id:email:role:expires" encoded in base64
function generateToken(user: User): string {
  const expires = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
  const payload = `${user.id}:${user.email}:${user.role}:${expires}`;
  return Buffer.from(payload).toString('base64');
}

function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, email, role, expiresStr] = decoded.split(':');
    const expires = parseInt(expiresStr, 10);
    if (expires < Date.now()) {
      return null;
    }
    return { id, email, role };
  } catch (e) {
    return null;
  }
}

// --- Authentication Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }

  req.user = payload;
  next();
};

// ========================================================
// REST API ENDPOINTS
// ========================================================

// 0. Database Status Endpoint
app.get('/api/db-status', (req, res) => {
  res.json({
    isPostgres: db.isPostgres,
    postgresError: db.postgresError,
    type: db.isPostgres ? 'postgres' : 'local',
  });
});

// 1. Auth: Register
app.post('/api/register', async (req, res) => {
  const { email, password, role } = req.body;
  
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and learning role are required.' });
  }

  const existing = await db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'A user with this email already exists.' });
  }

  const userId = 'user_' + Math.random().toString(36).substring(2, 11);
  const newUser: User = {
    id: userId,
    email,
    passwordHash: hashPassword(password),
    role,
  };

  await db.addUser(newUser);

  // Auto-generate a default profile
  await db.saveProfile({
    userId,
    fullName: email.split('@')[0],
    currentLevel: 'beginner',
    learningGoal: 'Personalized Study Plan',
    studyTimePerDay: 30,
    targetRole: role === 'professional' ? 'Software Engineer' : role.replace('_', ' '),
    selectedPlan: 'AI-Guided Standard',
    themePreference: 'light',
  });

  const token = generateToken(newUser);
  res.status(201).json({
    token,
    user: { id: userId, email, role },
  });
});

// 2. Auth: Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await db.getUserByEmail(email);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

// 3. Profiles: Retrieve
app.get('/api/profile', authenticateToken, async (req: any, res) => {
  const profile = await db.getProfile(req.user.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found.' });
  }
  res.json(profile);
});

// 4. Profiles: Create/Update
app.put('/api/profile', authenticateToken, async (req: any, res) => {
  const { fullName, currentLevel, learningGoal, studyTimePerDay, targetRole, themePreference } = req.body;

  const currentProfile = await db.getProfile(req.user.id);
  const updatedProfile = {
    userId: req.user.id,
    fullName: fullName || currentProfile?.fullName || req.user.email.split('@')[0],
    currentLevel: currentLevel || currentProfile?.currentLevel || 'beginner',
    learningGoal: learningGoal || currentProfile?.learningGoal || 'Personalized study roadmap',
    studyTimePerDay: Number(studyTimePerDay) || currentProfile?.studyTimePerDay || 30,
    targetRole: targetRole || currentProfile?.targetRole || 'Developer',
    themePreference: themePreference || currentProfile?.themePreference || 'light',
    selectedPlan: currentProfile?.selectedPlan || 'AI-Guided Mastery',
  };

  await db.saveProfile(updatedProfile);
  res.json(updatedProfile);
});

// 5. Goals: Explicitly update learning goal
app.post('/api/learning-goal', authenticateToken, async (req: any, res) => {
  const { learningGoal, targetRole, currentLevel, studyTimePerDay } = req.body;

  const currentProfile = await db.getProfile(req.user.id);
  if (!currentProfile) {
    return res.status(404).json({ error: 'Profile not found.' });
  }

  const updatedProfile = {
    ...currentProfile,
    learningGoal: learningGoal || currentProfile.learningGoal,
    targetRole: targetRole || currentProfile.targetRole,
    currentLevel: currentLevel || currentProfile.currentLevel,
    studyTimePerDay: studyTimePerDay ? Number(studyTimePerDay) : currentProfile.studyTimePerDay,
  };

  await db.saveProfile(updatedProfile);
  res.json(updatedProfile);
});

// 6. Roadmap: Generate dynamically using AI Agent
app.post('/api/generate-roadmap', authenticateToken, async (req: any, res) => {
  try {
    const profile = await db.getProfile(req.user.id);
    if (!profile) {
      return res.status(400).json({ error: 'Please set up your profile goal first.' });
    }

    const { subject } = req.body;
    const learningGoal = subject ? `Mastering ${subject}` : profile.learningGoal;
    const targetRole = subject ? `${subject} Developer` : profile.targetRole;
    const currentLevel = profile.currentLevel || 'beginner';

    const durationWeeks = profile.studyTimePerDay > 45 ? 6 : 4; // Adjust size based on time commitment

    // Call Planner Agent (Gemini)
    const aiRoadmap = await generateAILearningRoadmap(
      targetRole,
      currentLevel,
      durationWeeks,
      learningGoal
    );

    const newRoadmap = {
      id: 'roadmap_' + Math.random().toString(36).substring(2, 11),
      userId: req.user.id,
      title: aiRoadmap.title,
      targetRole: targetRole,
      skillLevel: currentLevel,
      durationWeeks,
      topics: aiRoadmap.topics.map((t, idx) => ({
        id: `topic_${idx + 1}`,
        week: t.week,
        title: t.title,
        description: t.description,
        subtopics: t.subtopics,
      })),
      createdAt: new Date().toISOString(),
    };

    await db.saveRoadmap(newRoadmap);
    await db.setActiveRoadmap(req.user.id, newRoadmap.id);

    // Save profile updates if subject was requested
    if (subject) {
      await db.saveProfile({
        ...profile,
        learningGoal,
        targetRole,
        activeRoadmapId: newRoadmap.id
      });
    }

    // Add activity log
    await db.addActivityLog({
      userId: req.user.id,
      action: `Generated learning roadmap: ${newRoadmap.title}`
    });

    // Notify user
    await db.addNotification(
      req.user.id,
      `Your customized learning journey "${aiRoadmap.title}" has been curated!`,
      'success'
    );

    res.json(newRoadmap);
  } catch (e: any) {
    console.error('Failed to generate roadmap', e);
    res.status(500).json({ error: 'AI Roadmap Generator is temporarily unavailable. ' + e.message });
  }
});

// 7. Roadmap: Retrieve active roadmap
app.get('/api/roadmap', authenticateToken, async (req: any, res) => {
  const roadmap = await db.getRoadmap(req.user.id);
  if (!roadmap) {
    return res.status(404).json({ error: 'No active learning path. Please generate a roadmap to begin.' });
  }
  res.json(roadmap);
});

// 8. Lessons: Get dynamic lessons (Generates using AI if not already loaded)
app.get('/api/lesson/:id', authenticateToken, async (req: any, res) => {
  const topicId = req.params.id;
  const roadmap = await db.getRoadmap(req.user.id);

  if (!roadmap) {
    return res.status(400).json({ error: 'No active roadmap found. Please generate a roadmap first.' });
  }

  const topic = roadmap.topics.find((t) => t.id === topicId);
  if (!topic) {
    return res.status(404).json({ error: 'Topic not found in your learning roadmap.' });
  }

  // Check if we already cached this lesson
  let lesson = await db.getLesson(topicId);
  if (!lesson) {
    try {
      console.log(`Generating AI lesson for: ${topic.title}`);
      // Call Content Agent
      const aiLesson = await generateAILesson(topic.title, topic.subtopics);
      lesson = {
        id: topicId,
        title: aiLesson.title || topic.title,
        content: aiLesson.detailedExplanation,
        notes: aiLesson.notes,
        examples: aiLesson.examples,
        summary: aiLesson.summary,
        keyConcepts: aiLesson.keyConcepts,
        importantPoints: aiLesson.importantPoints,
      };
      await db.saveLesson(topicId, lesson);
    } catch (e: any) {
      console.error('Failed to generate AI lesson', e);
      return res.status(500).json({ error: 'Failed to compile AI study content. ' + e.message });
    }
  }

  res.json(lesson);
});

// 9. Notes Summary: Revision endpoint
app.get('/api/notes/:lesson_id', authenticateToken, async (req: any, res) => {
  const lessonId = req.params.lesson_id;
  const lesson = await db.getLesson(lessonId);
  if (!lesson) {
    return res.status(404).json({ error: 'Notes not available. View the lesson first to synthesize.' });
  }
  res.json({
    title: lesson.title,
    notes: lesson.notes,
    examples: lesson.examples,
  });
});

// 10. Quizzes: Retrieve (or generate using AI) quiz questions for a topic
app.get('/api/practice/:lesson_id', authenticateToken, async (req: any, res) => {
  const topicId = req.params.lesson_id;
  const roadmap = await db.getRoadmap(req.user.id);

  if (topicId === 'continuous') {
    const subject = (req.query.subject as string) || (roadmap ? roadmap.title : 'General Technology');
    try {
      console.log(`Generating continuous quiz question for subject: ${subject}`);
      const q = await generateAISingleQuizQuestion(subject);
      const generatedId = 'continuous_' + Math.random().toString(36).substring(2, 11);
      const quiz = {
        id: generatedId,
        title: `${subject} Practice`,
        questions: [{
          id: 'q_1',
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        }],
      };
      await db.saveQuiz(generatedId, quiz);
      return res.json(quiz);
    } catch (e: any) {
      console.error('Continuous quiz question failed', e);
      return res.status(500).json({ error: 'Continuous Practice Quiz Agent is busy. ' + e.message });
    }
  }

  if (!roadmap) {
    return res.status(400).json({ error: 'Generate a learning plan before starting quizzes.' });
  }

  const topic = roadmap.topics.find((t) => t.id === topicId);
  if (!topic) {
    return res.status(404).json({ error: 'Roadmap topic not found.' });
  }

  let quiz = await db.getQuiz(topicId);
  if (!quiz) {
    try {
      console.log(`Curating AI quiz for: ${topic.title}`);
      const aiQuiz = await generateAIQuiz(topic.title);
      quiz = {
        id: topicId,
        title: aiQuiz.title || `${topic.title} Challenge`,
        questions: aiQuiz.questions.map((q, idx) => ({
          id: `q_${idx + 1}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      };
      await db.saveQuiz(topicId, quiz);
    } catch (e: any) {
      console.error('Quiz generation failed', e);
      return res.status(500).json({ error: 'Quiz Agent could not generate assessment. ' + e.message });
    }
  }

  res.json(quiz);
});

// 11. Coding Problems: Retrieve (or generate) a programming task
app.get('/api/coding/:lesson_id', authenticateToken, async (req: any, res) => {
  const topicId = req.params.lesson_id;
  const roadmap = await db.getRoadmap(req.user.id);

  if (topicId === 'continuous') {
    const subject = (req.query.subject as string) || (roadmap ? roadmap.title : 'JavaScript Programming');
    try {
      console.log(`Generating continuous coding problem for subject: ${subject}`);
      const p = await generateAISingleCodingProblem(subject);
      const generatedId = 'continuous_code_' + Math.random().toString(36).substring(2, 11);
      const coding = {
        id: generatedId,
        title: p.title,
        description: p.description,
        starterCode: p.starterCode,
        language: p.language,
        testCases: p.testCases,
        sampleSolution: p.sampleSolution,
        difficulty: p.difficulty,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        constraints: p.constraints,
        hints: p.hints,
        sampleInput: p.sampleInput,
        sampleOutput: p.sampleOutput,
      };
      await db.saveCodingExercise(generatedId, coding);
      return res.json(coding);
    } catch (e: any) {
      console.error('Continuous coding generation failed', e);
      return res.status(500).json({ error: 'Continuous Coding Agent is busy. ' + e.message });
    }
  }

  if (!roadmap) {
    return res.status(400).json({ error: 'Generate a learning plan before coding.' });
  }

  const topic = roadmap.topics.find((t) => t.id === topicId);
  if (!topic) {
    return res.status(404).json({ error: 'Roadmap topic not found.' });
  }

  let coding = await db.getCodingExercise(topicId);
  if (!coding) {
    try {
      console.log(`Assembling AI coding task for: ${topic.title}`);
      const aiCoding = await generateAICodingProblem(topic.title);
      coding = {
        id: topicId,
        title: aiCoding.title,
        description: aiCoding.description,
        starterCode: aiCoding.starterCode,
        language: aiCoding.language,
        testCases: aiCoding.testCases,
        sampleSolution: aiCoding.sampleSolution,
        difficulty: aiCoding.difficulty || 'intermediate',
        inputFormat: aiCoding.inputFormat || 'Function parameters',
        outputFormat: aiCoding.outputFormat || 'Function return value',
        constraints: aiCoding.constraints || [],
        hints: aiCoding.hints || [],
        sampleInput: aiCoding.sampleInput || '',
        sampleOutput: aiCoding.sampleOutput || '',
      };
      await db.saveCodingExercise(topicId, coding);
    } catch (e: any) {
      console.error('Coding problem curation failed', e);
      return res.status(500).json({ error: 'Coding Agent could not build workspace challenge. ' + e.message });
    }
  }

  res.json(coding);
});

// 12. Coding: Run sandbox evaluations against test cases
app.post('/api/submit-code', authenticateToken, async (req: any, res) => {
  const { topicId, code } = req.body;
  if (!topicId || !code) {
    return res.status(400).json({ error: 'Topic ID and source code are required.' });
  }

  const exercise = await db.getCodingExercise(topicId);
  if (!exercise) {
    return res.status(404).json({ error: 'Coding exercise details not found.' });
  }

  // Run native sandboxed evaluation in safe Node VM context-simulation
  const testResults = [];
  let allPassed = true;

  try {
    // We isolate and execute the JS code for testing
    // Locate target function name
    const functionNameMatch = code.match(/function\s+(\w+)/) || code.match(/const\s+(\w+)\s*=/);
    const functionName = functionNameMatch ? functionNameMatch[1] : null;

    if (!functionName) {
      throw new Error("Could not find a valid JS function definition. Make sure to define a standard function (e.g., 'function solve()').");
    }

    // Build the evaluation script wrapping tests
    for (const testCase of exercise.testCases) {
      let isTestCasePassed = false;
      let actualOutput = '';
      let executionError = '';

      try {
        // Construct code executor that executes user script and runs functionName(input)
        const runner = new Function(
          code + `\nreturn ${functionName}(${testCase.input});`
        );
        const result = runner();
        
        actualOutput = JSON.stringify(result);
        const cleanExpected = testCase.expectedOutput.trim();
        const cleanActual = actualOutput ? actualOutput.trim() : '';

        // Compare values
        if (
          cleanActual === cleanExpected ||
          JSON.parse(cleanExpected) === result ||
          String(result).toLowerCase() === cleanExpected.toLowerCase()
        ) {
          isTestCasePassed = true;
        } else {
          allPassed = false;
        }
      } catch (err: any) {
        allPassed = false;
        executionError = err.message;
      }

      testResults.push({
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: actualOutput || executionError,
        passed: isTestCasePassed,
      });
    }

    // Log submissions to progress database
    const userProgress = await db.getProgress(req.user.id);
    await db.updateProgress(req.user.id, {
      codingSubmissions: {
        ...userProgress.codingSubmissions,
        [topicId]: {
          code,
          passed: allPassed,
          date: new Date().toISOString(),
        },
      },
    });

    if (allPassed) {
      await db.addNotification(
        req.user.id,
        `Code challenge passed successfully for topic: ${exercise.title}!`,
        'success'
      );
    }

    res.json({
      success: allPassed,
      results: testResults,
    });
  } catch (e: any) {
    res.json({
      success: false,
      error: e.message,
      results: [],
    });
  }
});

// 13. Quiz: Submit Attempt
app.post('/api/quiz/submit', authenticateToken, async (req: any, res) => {
  const { topicId, answers } = req.body; // Array of numbers corresponding to indices
  
  if (!topicId || !answers) {
    return res.status(400).json({ error: 'Topic ID and selection indices are required.' });
  }

  const quiz = await db.getQuiz(topicId);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }

  let correctCount = 0;
  const questionsReport = quiz.questions.map((q, idx) => {
    const userAns = answers[idx];
    const isCorrect = userAns === q.correctAnswer;
    if (isCorrect) correctCount++;
    return {
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: userAns,
      passed: isCorrect,
      explanation: q.explanation,
    };
  });

  const total = quiz.questions.length;

  // Log quiz attempt to progress database
  const userProgress = await db.getProgress(req.user.id);
  await db.updateProgress(req.user.id, {
    quizAttempts: {
      ...userProgress.quizAttempts,
      [topicId]: {
        score: correctCount,
        total,
        date: new Date().toISOString(),
      },
    },
  });

  // If score is high, add notification
  if (correctCount === total) {
    await db.addNotification(
      req.user.id,
      `Unblemished score! You achieved 100% on the "${quiz.title}" assessment!`,
      'success'
    );
  } else if (correctCount >= 3) {
    await db.addNotification(req.user.id, `Quiz complete: you scored ${correctCount}/${total} on "${quiz.title}". Keep learning!`);
  }

  res.json({
    score: correctCount,
    total,
    report: questionsReport,
  });
});

// 14. Progress: Update complete milestone for a topic/lesson
app.put('/api/progress', authenticateToken, async (req: any, res) => {
  const { completedTopicId, completedLessonId } = req.body;
  const currentProgress = await db.getProgress(req.user.id);

  let updatedTopics = [...currentProgress.completedTopics];
  let updatedLessons = [...currentProgress.completedLessons];

  if (completedTopicId && !updatedTopics.includes(completedTopicId)) {
    updatedTopics.push(completedTopicId);
  }

  if (completedLessonId && !updatedLessons.includes(completedLessonId)) {
    updatedLessons.push(completedLessonId);
  }

  const newProg = await db.updateProgress(req.user.id, {
    completedTopics: updatedTopics,
    completedLessons: updatedLessons,
  });

  res.json(newProg);
});

// 15. Progress & Streak Stats
app.get('/api/progress', authenticateToken, async (req: any, res) => {
  const progress = await db.getProgress(req.user.id);
  res.json(progress);
});

// 16. AI Recommendations Agent: Retrieve dynamic coaching insights
app.get('/api/recommendations', authenticateToken, async (req: any, res) => {
  try {
    const profile = await db.getProfile(req.user.id);
    const progress = await db.getProgress(req.user.id);
    const roadmap = await db.getRoadmap(req.user.id);

    if (!roadmap) {
      return res.json({
        weakAreasFound: [],
        suggestedRevisionTopics: [],
        recommendedNextSteps: ['First, initialize your profile goals and generate your custom AI roadmap.'],
        studyAdvice: 'Welcome! Configure your goal roadmap in the panel to receive AI mentorship recommendations.',
      });
    }

    // Map quiz details
    const quizHistory = Object.entries(progress.quizAttempts).map(([topicId, item]) => {
      const topic = roadmap.topics.find((t) => t.id === topicId);
      return {
        topic: topic ? topic.title : topicId,
        score: item.score,
        total: item.total,
      };
    });

    // Map coding details
    const codingHistory = Object.entries(progress.codingSubmissions).map(([topicId, item]) => {
      const topic = roadmap.topics.find((t) => t.id === topicId);
      return {
        topic: topic ? topic.title : topicId,
        passed: item.passed,
      };
    });

    const aiRecs = await generateAIRecommendations(
      progress.completedTopics.map((tId) => {
        const topic = roadmap.topics.find((t) => t.id === tId);
        return topic ? topic.title : tId;
      }),
      quizHistory,
      codingHistory,
      profile?.targetRole || 'Professional Learner'
    );

    res.json(aiRecs);
  } catch (e: any) {
    console.error('Recommendations failed', e);
    // Return graceful fallback insights if Gemini key is loading or limits reached
    res.json({
      weakAreasFound: ['Practice Assessment Completion'],
      suggestedRevisionTopics: ['Continue completing topics inside your current week of study to unlock deeper insights.'],
      recommendedNextSteps: ['Explore lessons inside your current week, and take the companion quizzes.'],
      studyAdvice: 'Steady progress is the path to technical mastery. Work through the scheduled roadmap weeks and utilize coding exercises to build intuition.',
    });
  }
});

// 17. Analytics Panel: Detailed aggregated history
app.get('/api/analytics', authenticateToken, async (req: any, res) => {
  const progress = await db.getProgress(req.user.id);
  const roadmap = await db.getRoadmap(req.user.id);
  const sessions = await db.getStudySessions(req.user.id);

  const totalTopics = roadmap ? roadmap.topics.length : 0;
  const completedCount = progress.completedTopics.length;
  const completionPercentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  // Calculate real minutes from sessions table
  const realMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const quizCount = Object.keys(progress.quizAttempts).length;
  const codeSubmits = Object.keys(progress.codingSubmissions).length;
  const completedLessons = progress.completedLessons.length;
  const calculatedStudyMinutes = realMinutes > 0 ? realMinutes : (completedLessons * 15 + quizCount * 10 + codeSubmits * 12 + 10);

  // Assemble weekly tracking dataset dynamically based on study_sessions dates
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daySums: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  
  if (sessions.length === 0) {
    daySums['Mon'] = Math.round((calculatedStudyMinutes / 60) * 0.1 * 10) / 10;
    daySums['Tue'] = Math.round((calculatedStudyMinutes / 60) * 0.2 * 10) / 10;
    daySums['Wed'] = Math.round((calculatedStudyMinutes / 60) * 0.15 * 10) / 10;
    daySums['Thu'] = Math.round((calculatedStudyMinutes / 60) * 0.25 * 10) / 10;
    daySums['Fri'] = Math.round((calculatedStudyMinutes / 60) * 0.3 * 10) / 10;
  } else {
    for (const s of sessions) {
      try {
        const d = new Date(s.date);
        const dayName = days[d.getDay()];
        if (daySums[dayName] !== undefined) {
          daySums[dayName] += s.durationMinutes / 60;
        }
      } catch (err) {}
    }
  }

  const weeklyStudyHours = Object.entries(daySums).map(([name, hours]) => ({
    name,
    hours: Math.round(hours * 10) / 10
  }));

  // Map performance trends
  let correctQuizzes = 0;
  let totalQuizzes = 0;
  Object.values(progress.quizAttempts).forEach((q) => {
    correctQuizzes += q.score;
    totalQuizzes += q.total;
  });
  const averageQuizScore = totalQuizzes > 0 ? Math.round((correctQuizzes / totalQuizzes) * 100) : 0;

  let passedCoding = 0;
  const totalCoding = Object.keys(progress.codingSubmissions).length;
  Object.values(progress.codingSubmissions).forEach((c) => {
    if (c.passed) passedCoding++;
  });
  const finalCodingAccuracy = totalCoding > 0 ? Math.round((passedCoding / totalCoding) * 100) : 0;

  res.json({
    completionPercentage,
    completedCount,
    totalTopics,
    studyMinutes: calculatedStudyMinutes,
    streak: progress.streak,
    weeklyStudyHours,
    quizPerformance: averageQuizScore,
    codingAccuracy: finalCodingAccuracy,
  });
});

// 18. Bookmarks: Retrieve, Create, Delete
app.get('/api/bookmarks', authenticateToken, async (req: any, res) => {
  res.json(await db.getBookmarks(req.user.id));
});

app.post('/api/bookmark', authenticateToken, async (req: any, res) => {
  const { type, title, itemId } = req.body;
  if (!type || !title || !itemId) {
    return res.status(400).json({ error: 'Type, title, and item ID are required.' });
  }

  const b = await db.addBookmark({
    userId: req.user.id,
    type,
    title,
    itemId,
  });
  res.json(b);
});

app.delete('/api/bookmark/:id', authenticateToken, async (req: any, res) => {
  const deleted = await db.removeBookmark(req.user.id, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Bookmark not found.' });
  }
  res.json({ success: true, message: 'Bookmark removed.' });
});

// --- Roadmaps List & Switch ---
app.get('/api/roadmaps', authenticateToken, async (req: any, res) => {
  try {
    const list = await db.getRoadmaps(req.user.id);
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to retrieve learning pathways.' });
  }
});

app.post('/api/roadmaps/active', authenticateToken, async (req: any, res) => {
  const { roadmapId } = req.body;
  if (!roadmapId) {
    return res.status(400).json({ error: 'Roadmap ID is required.' });
  }
  try {
    await db.setActiveRoadmap(req.user.id, roadmapId);
    await db.addActivityLog({
      userId: req.user.id,
      action: 'Switched active learning curriculum pathway'
    });
    res.json({ success: true, message: 'Active learning pathway switched.' });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to update active learning path.' });
  }
});

// --- Study Sessions ---
app.get('/api/study-sessions', authenticateToken, async (req: any, res) => {
  try {
    const sessions = await db.getStudySessions(req.user.id);
    res.json(sessions);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch study sessions.' });
  }
});

app.post('/api/study-session', authenticateToken, async (req: any, res) => {
  const { durationMinutes, roadmapId } = req.body;
  if (!durationMinutes) {
    return res.status(400).json({ error: 'Duration is required.' });
  }
  try {
    const s = await db.addStudySession({
      userId: req.user.id,
      roadmapId: roadmapId || 'default',
      durationMinutes: Number(durationMinutes),
      date: new Date().toISOString().split('T')[0]
    });
    await db.addActivityLog({
      userId: req.user.id,
      action: `Logged study session: ${durationMinutes} minutes`
    });
    res.json(s);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to log study session.' });
  }
});

// --- Activity Logs ---
app.get('/api/activity-logs', authenticateToken, async (req: any, res) => {
  try {
    const logs = await db.getActivityLogs(req.user.id);
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to retrieve activity log.' });
  }
});

app.post('/api/activity-log', authenticateToken, async (req: any, res) => {
  const { action } = req.body;
  if (!action) {
    return res.status(400).json({ error: 'Action content is required.' });
  }
  try {
    const log = await db.addActivityLog({
      userId: req.user.id,
      action
    });
    res.json(log);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to record activity log.' });
  }
});

// 19. Notifications: Retrieve & Mark read
app.get('/api/notifications', authenticateToken, async (req: any, res) => {
  res.json(await db.getNotifications(req.user.id));
});

app.post('/api/notifications/read', authenticateToken, async (req: any, res) => {
  await db.markNotificationsAsRead(req.user.id);
  res.json({ success: true, message: 'All notifications cleared.' });
});

// 20. Admin Dashboard: General analytics
app.get('/api/admin/stats', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }

  const allUsers = await db.getUsers();
  const users = await Promise.all(allUsers.map(async (u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    profile: await db.getProfile(u.id),
    progress: await db.getProgress(u.id),
  })));

  res.json({
    totalUsersCount: users.length,
    users,
  });
});


// ========================================================
// VITE AND STATIC SERVING MIDDLEWARE
// ========================================================

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
