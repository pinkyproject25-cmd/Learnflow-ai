import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Ensure the API key is set or fallback to avoid server crash, fail gracefully on first use if missing
const apiKey = process.env.GEMINI_API_KEY;

export function getGeminiAI(): GoogleGenAI {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required. Please set it in your environment or Settings Secrets panel.');
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Ensure the model is the approved 'gemini-3.5-flash'
const MODEL_NAME = 'gemini-3.5-flash';

// --- Types for AI outputs ---
export interface AIRoadmapResponse {
  title: string;
  topics: Array<{
    week: number;
    title: string;
    description: string;
    subtopics: string[];
  }>;
}

export interface AILessonResponse {
  title: string;
  detailedExplanation: string; // Rich markdown lesson body
  beginnerExplanation: string; // Beginner-friendly explanation
  intermediateExplanation: string; // Intermediate explanation
  advancedExplanation: string; // Advanced explanation
  keyConcepts: string[]; // List of core concepts
  notes: string[]; // Key takeaways bullet notes
  examples: Array<{
    title: string;
    code?: string;
    explanation: string;
  }>;
  summary: string;
  importantPoints: string[]; // Important points / Key warnings
  bestPractices: string[]; // Best practices
  commonMistakes: string[]; // Common mistakes
  nextTopic: string; // Suggestions for next topic

  // Course Notes fields
  definitions: Array<{ term: string; definition: string }>;
  interviewQuestions: Array<{ question: string; answer: string }>;
  faqs: Array<{ question: string; answer: string }>;
  revisionNotes: string[];
}

export interface AICodingResponse {
  title: string;
  description: string;
  starterCode: string;
  language: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
  sampleSolution: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string[];
  hints?: string[];
  sampleInput?: string;
  sampleOutput?: string;
}

export interface AIQuizResponse {
  title: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number; // 0-indexed
    explanation: string;
  }>;
}

export interface AISingleQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface AISingleCodingProblem {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  starterCode: string;
  language: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  hints: string[];
  sampleInput: string;
  sampleOutput: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
  sampleSolution: string;
}

export interface AIRecommendationResponse {
  weakAreasFound: string[];
  suggestedRevisionTopics: string[];
  recommendedNextSteps: string[];
  studyAdvice: string;
}

// --- AI Service Implementations ---

/**
 * 1. Planner Agent: Generates personalized roadmap
 */
export async function generateAILearningRoadmap(
  targetRole: string,
  currentLevel: string,
  durationWeeks: number,
  goal: string
): Promise<AIRoadmapResponse> {
  const ai = getGeminiAI();
  const prompt = `Create a highly structured personalized learning roadmap to learn ${goal} as a ${targetRole}.
User Profile:
- Current Skill Level: ${currentLevel}
- Duration: ${durationWeeks} weeks
- Personalized Focus Goal: "${goal}"

Ensure each week has an explicit list of core subtopics to cover. Make the progression logical, from fundamentals to advanced skills.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: 'You are an elite Tech Career Coach & Curriculum Designer. Your job is to output extremely realistic learning plans tailored to the user profile.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Title of the roadmap' },
          topics: {
            type: Type.ARRAY,
            description: 'Array of roadmap topic structures matching the weekly schedule',
            items: {
              type: Type.OBJECT,
              properties: {
                week: { type: Type.INTEGER, description: 'The week number, starting at 1' },
                title: { type: Type.STRING, description: 'The main topic for this week' },
                description: { type: Type.STRING, description: 'Brief description of the skills gained' },
                subtopics: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of specific subtopics, concepts, or tools covered',
                },
              },
              required: ['week', 'title', 'description', 'subtopics'],
            },
          },
        },
        required: ['title', 'topics'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('AI failed to return any text response for roadmap generation.');
  return JSON.parse(text) as AIRoadmapResponse;
}

/**
 * 2. Content Agent: Generates lesson, explanations, notes, and examples
 */
export async function generateAILesson(
  topicTitle: string,
  subtopics: string[]
): Promise<AILessonResponse> {
  const ai = getGeminiAI();
  const prompt = `Create a comprehensive, engaging lesson and study notes about: "${topicTitle}".
Subtopics to cover in-depth:
${subtopics.map((s) => `- ${s}`).join('\n')}

Generate the complete lesson guide. Provide the following sections:
1. Title: The title of the lesson
2. Detailed Explanation: In-depth technical lesson body in elegant Markdown with clear headings, code syntax highlights where applicable, real-world analogies.
3. Beginner Explanation: A gentle, clear, step-by-step introduction for absolute beginners.
4. Intermediate Explanation: Practical implementation, mechanics, and usage for intermediate practitioners.
5. Advanced Explanation: Deep-dive architecture, advanced optimizations, edge cases, and scaling details.
6. Key Concepts: An array of 3-5 core concepts/definitions covered.
7. Notes: Bullet-point array of short, highly readable key notes/summaries for quick revision/flashcards.
8. Examples: Array of practical real-world code or technical application examples.
9. Summary: A descriptive 2-3 sentence overview of the lesson.
10. Important Points: List of 3-5 crucial key takeaways or warnings.
11. Best Practices: List of 3-5 highly practical recommendations for using this technology/topic.
12. Common Mistakes: List of 3-5 typical mistakes developers make with this topic and how to avoid them.
13. Next Topic: A suggested title for the next logical topic to study.
14. Definitions: Array of core terms and their clear definitions.
15. Interview Questions: Array of top technical interview questions and their answers for this topic.
16. FAQs: Array of frequently asked questions and clear answers.
17. Revision Notes: Highly actionable revision points for students.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: 'You are an elite Senior Educator and Technical Writer. Generate thorough, crisp academic/technical content containing no fluff, utilizing easy-to-understand real-world metaphors.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'The title of the lesson' },
          detailedExplanation: { type: Type.STRING, description: 'Detailed lesson body in rich Markdown formatting' },
          beginnerExplanation: { type: Type.STRING, description: 'Beginner-friendly explanation' },
          intermediateExplanation: { type: Type.STRING, description: 'Intermediate implementation' },
          advancedExplanation: { type: Type.STRING, description: 'Advanced optimization/edge cases' },
          keyConcepts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of 3-5 core concepts or definitions',
          },
          notes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Bullet-point array of short, highly readable key notes/summaries for quick revision',
          },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'The title/scenario for the example' },
                code: { type: Type.STRING, description: 'Optional code block or schematic illustrating the concept' },
                explanation: { type: Type.STRING, description: 'Step-by-step technical explanation' },
              },
              required: ['title', 'explanation'],
            },
            description: 'Practical real-world code or technical application examples',
          },
          summary: { type: Type.STRING, description: 'A highly descriptive 2-3 sentence overview of the lesson' },
          importantPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of 3-5 core takeaways/key points/important rules of the lesson'
          },
          bestPractices: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Best practices list'
          },
          commonMistakes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Common mistakes list'
          },
          nextTopic: { type: Type.STRING, description: 'Suggested next topic' },
          definitions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING }
              },
              required: ['term', 'definition']
            }
          },
          interviewQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ['question', 'answer']
            }
          },
          faqs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ['question', 'answer']
            }
          },
          revisionNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Quick revision bullet points'
          }
        },
        required: [
          'title',
          'detailedExplanation',
          'beginnerExplanation',
          'intermediateExplanation',
          'advancedExplanation',
          'keyConcepts',
          'notes',
          'examples',
          'summary',
          'importantPoints',
          'bestPractices',
          'commonMistakes',
          'nextTopic',
          'definitions',
          'interviewQuestions',
          'faqs',
          'revisionNotes'
        ],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('AI failed to return a lesson response.');
  return JSON.parse(text) as AILessonResponse;
}

/**
 * 3. Coding Agent: Generates interactive coding exercise with test cases
 */
export async function generateAICodingProblem(topicTitle: string): Promise<AICodingResponse> {
  const ai = getGeminiAI();
  const prompt = `Design an interactive coding exercise matching the topic: "${topicTitle}".
Provide a clear, engaging challenge. It must be solvable in JavaScript or Python. Return starter code, language details, test cases for standard inputs, and the correct sample solution.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: 'You are a veteran technical interviewer. Design problems that test clean execution, boundary conditions, and algorithmic thinking.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Name of the coding problem' },
          description: { type: Type.STRING, description: 'Detailed problem description, constraints, and inputs/outputs' },
          starterCode: { type: Type.STRING, description: 'The code boilerplate (e.g. function skeleton) for the user to edit' },
          language: { type: Type.STRING, description: 'Target language (e.g. javascript, python)' },
          testCases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                input: { type: Type.STRING, description: 'String representing the test input parameter(s)' },
                expectedOutput: { type: Type.STRING, description: 'String representing the exact expected output' },
              },
              required: ['input', 'expectedOutput'],
            },
            description: 'Array of at least 3 distinct test cases',
          },
          sampleSolution: { type: Type.STRING, description: 'The reference code that passes all test cases' },
        },
        required: ['title', 'description', 'starterCode', 'language', 'testCases', 'sampleSolution'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('AI failed to return a coding problem response.');
  return JSON.parse(text) as AICodingResponse;
}

/**
 * 4. Quiz Agent: Generates adaptive multiple-choice quizzes
 */
export async function generateAIQuiz(topicTitle: string): Promise<AIQuizResponse> {
  const ai = getGeminiAI();
  const prompt = `Generate a 5-question multiple-choice quiz testing the user's comprehension of the topic: "${topicTitle}".
Ensure questions are balanced in difficulty, covering basic terminology, core concepts, syntax, and complex reasoning.
Include exactly 4 options per question. Specify the correct answer as a 0-based index. Provide a constructive explanation of why that option is correct.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: 'You are an educational assessment expert. Craft questions with plausible distractors (incorrect answers) that test true understanding, avoiding obvious giveaways.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Title of the assessment quiz' },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: 'The question text' },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Exactly 4 multiple choice options',
                },
                correctAnswer: { type: Type.INTEGER, description: '0-based index of the correct option' },
                explanation: { type: Type.STRING, description: 'Detailed explanation of why the answer is correct and others are not' },
              },
              required: ['question', 'options', 'correctAnswer', 'explanation'],
            },
          },
        },
        required: ['title', 'questions'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('AI failed to return a quiz response.');
  return JSON.parse(text) as AIQuizResponse;
}

/**
 * 5. Recommendation & Progress Agent: Aggregates history and offers smart feedback
 */
export async function generateAIRecommendations(
  completedTopics: string[],
  quizHistory: Array<{ topic: string; score: number; total: number }>,
  codingHistory: Array<{ topic: string; passed: boolean }>,
  targetRole: string
): Promise<AIRecommendationResponse> {
  const ai = getGeminiAI();
  const prompt = `Analyze the student's study performance data and formulate intelligent, constructive, hyper-personalized study suggestions.

Core Information:
- Target Career Role: ${targetRole}
- Completed Topics: ${completedTopics.length > 0 ? completedTopics.join(', ') : 'None yet'}
- Quiz History: ${JSON.stringify(quizHistory)}
- Practical Coding History: ${JSON.stringify(codingHistory)}

Identify weak areas where scores are low (below 80%) or coding test cases failed. Highlight custom action items, suggest specific revision concepts, and outline the recommended next steps in their roadmap. Offer an encouraging yet direct piece of mentor advice.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: 'You are an empathetic, insightful Senior Mentor and AI Success Lead. Provide highly constructive recommendations based strictly on their learning patterns.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          weakAreasFound: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of specific weak conceptual areas or skills detected from failed/low-scoring tasks',
          },
          suggestedRevisionTopics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Key revision topics with action item descriptors',
          },
          recommendedNextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Strategic next topics or problems they should take immediately',
          },
          studyAdvice: {
            type: Type.STRING,
            description: 'Short personalized letter from the AI mentor summarizing their current phase of training',
          },
        },
        required: ['weakAreasFound', 'suggestedRevisionTopics', 'recommendedNextSteps', 'studyAdvice'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('AI failed to return recommendations.');
  return JSON.parse(text) as AIRecommendationResponse;
}

/**
 * 6. Continuous Practice Agent: Generates a single continuous multiple-choice question
 */
export async function generateAISingleQuizQuestion(
  subject: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
  exclude: string[] = []
): Promise<AISingleQuizQuestion> {
  const ai = getGeminiAI();
  const prompt = `Generate a single multiple-choice question testing the user's comprehension of: "${subject}".
The question difficulty MUST be strictly: "${difficulty}".
Do NOT generate any of the following questions (which have been previously asked in this session):
${exclude.map((q) => `- ${q}`).join('\n')}

Provide exactly 4 options. Specify the correct answer as a 0-based index. Provide a helpful constructive explanation of why that option is correct. Make sure it is highly relevant and educational.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: 'You are an educational assessment expert. Craft questions with plausible distractors (incorrect answers) that test true understanding, avoiding obvious giveaways.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: 'The question text' },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exactly 4 multiple choice options',
          },
          correctAnswer: { type: Type.INTEGER, description: '0-based index of the correct option' },
          explanation: { type: Type.STRING, description: 'Detailed explanation of why the answer is correct' },
        },
        required: ['question', 'options', 'correctAnswer', 'explanation'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('AI failed to return a quiz question response.');
  return JSON.parse(text) as AISingleQuizQuestion;
}

/**
 * 7. Continuous Practice Agent: Generates a single dynamic coding problem
 */
export async function generateAISingleCodingProblem(
  subject: string
): Promise<AISingleCodingProblem> {
  const ai = getGeminiAI();
  const prompt = `Design an interactive coding exercise matching the subject: "${subject}".
Provide a clear, engaging challenge. It must be solvable in JavaScript. Return a descriptive title, deep description, difficulty level, inputs/outputs formats, constraints, helpful hints, sample inputs, sample outputs, starter code boilerplate, standard test cases for inputs, and the correct reference sample solution.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: 'You are a veteran technical interviewer. Design problems that test clean execution, boundary conditions, and algorithmic thinking.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Name of the coding problem' },
          description: { type: Type.STRING, description: 'Detailed problem description, constraints, and inputs/outputs' },
          difficulty: { type: Type.STRING, enum: ['beginner', 'intermediate', 'advanced'], description: 'Difficulty tier' },
          starterCode: { type: Type.STRING, description: 'The code boilerplate (e.g. function skeleton) for the user to edit' },
          language: { type: Type.STRING, description: 'Target language, e.g. javascript' },
          inputFormat: { type: Type.STRING, description: 'Description of the function parameter inputs' },
          outputFormat: { type: Type.STRING, description: 'Description of the expected return values' },
          constraints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Array of constraints (e.g. time/space limits, value ranges)'
          },
          hints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of 2-3 hints to help guide the student'
          },
          sampleInput: { type: Type.STRING, description: 'Sample call input' },
          sampleOutput: { type: Type.STRING, description: 'Sample return output value' },
          testCases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                input: { type: Type.STRING, description: 'String representing the test input parameter(s)' },
                expectedOutput: { type: Type.STRING, description: 'String representing the exact expected output' },
              },
              required: ['input', 'expectedOutput'],
            },
            description: 'Array of at least 3 distinct test cases',
          },
          sampleSolution: { type: Type.STRING, description: 'The reference code that passes all test cases' },
        },
        required: [
          'title', 'description', 'difficulty', 'starterCode', 'language',
          'inputFormat', 'outputFormat', 'constraints', 'hints',
          'sampleInput', 'sampleOutput', 'testCases', 'sampleSolution'
        ],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('AI failed to return a coding problem response.');
  return JSON.parse(text) as AISingleCodingProblem;
}
