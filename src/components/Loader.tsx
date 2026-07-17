import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const LOADING_PHRASES = [
  'Drafting personalized learning milestones...',
  'Analyzing syllabus concepts with Gemini AI...',
  'Synthesizing step-by-step revision flashcards...',
  'Assembling automated sandbox code challenges...',
  'Formulating targeted multi-choice quizzes...',
  'Refining active streaks & progress parameters...',
];

export default function Loader({ message }: { message?: string }) {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="loading-spinner" className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="h-6 w-6 animate-pulse text-indigo-500" />
        </div>
      </div>
      
      <h3 className="mb-2 text-lg font-semibold text-gray-800">
        Curating Custom Content
      </h3>
      <p className="text-sm font-medium text-gray-500 max-w-sm animate-pulse">
        {message || LOADING_PHRASES[phraseIdx]}
      </p>
    </div>
  );
}
