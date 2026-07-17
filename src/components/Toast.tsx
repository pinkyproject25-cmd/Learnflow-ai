import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Toast() {
  const { toast, clearToast } = useApp();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          id="global-toast"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-xl md:max-w-md"
        >
          {toast.type === 'success' && (
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          )}
          {toast.type === 'info' && (
            <Info className="h-5 w-5 text-indigo-500 shrink-0" />
          )}

          <div className="flex-1 text-sm font-medium text-gray-700">
            {toast.message}
          </div>

          <button
            onClick={clearToast}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
