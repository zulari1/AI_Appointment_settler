import React, { useState } from 'react';
import { Lead } from '../types';

interface LeadFormProps {
  onSubmit: (lead: Lead) => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      onSubmit({ name, email });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-brand-50 to-white dark:from-slate-900 dark:to-slate-800 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-brand-100 dark:border-slate-700 transition-colors duration-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="fas fa-calendar-check text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to Atlas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Let's get your appointment scheduled.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              id="name"
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95"
          >
            Start Scheduling
          </button>
        </form>
      </div>
    </div>
  );
};