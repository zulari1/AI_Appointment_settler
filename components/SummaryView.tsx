import React from 'react';
import type { FormData } from '../types';
import { LoadingSpinner } from './Icons';

interface SummaryViewProps {
  data: FormData;
  onConfirm: () => void;
  onEdit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const SummaryView: React.FC<SummaryViewProps> = ({ data, onConfirm, onEdit, isSubmitting, error }) => {
  
  const Section: React.FC<{title: string; data: Record<string, string>}> = ({ title, data }) => {
    // Filter out empty values so they don't clutter the summary
    // FIX: Add a type guard to ensure value is a string before calling .trim()
    const filteredData = Object.entries(data).filter(([, value]) => typeof value === 'string' && value.trim() !== '');
    if (filteredData.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-blue-300 border-b-2 border-blue-400/30 pb-2 mb-3">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {filteredData.map(([key, value]) => (
            <div key={key}>
              <p className="font-medium text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-gray-200 whitespace-pre-wrap">{value}</p>
            </div>
          ))}
        </div>
      </div>
    )
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-8 bg-black/20 backdrop-blur-xl rounded-lg shadow-lg text-gray-200 animate-fade-in border border-white/10">
      <h2 className="text-3xl font-bold font-display mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Project Blueprint</h2>
      <p className="text-center mb-8 text-gray-400">Amazing work! Here’s the complete blueprint for your new website. Please review the details below. If everything looks perfect, let's bring this vision to life!</p>
      
      <div className="bg-black/30 rounded-lg p-6 max-h-[50vh] overflow-y-auto">
        {data.clientName && <Section title="Client" data={{ Name: data.clientName }} />}
        <Section title="Business Essence" data={data.business} />
        <Section title="Products & Commerce" data={data.products} />
        <Section title="Brand Identity" data={data.branding} />
        <Section title="Website Structure" data={data.website} />
        <Section title="Content Strategy" data={data.content} />
        <Section title="Technical Details" data={data.technical} />
        <Section title="Project Goals & Logistics" data={data.project} />
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-lg">
          <p><strong>Oops!</strong> {error}</p>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
        <button
          onClick={onEdit}
          disabled={isSubmitting}
          className="px-6 py-3 bg-gray-600/50 text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-gray-500/50 transition-all transform hover:scale-105 disabled:opacity-50"
        >
          Make a Change
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center disabled:opacity-70 disabled:scale-100"
        >
          {isSubmitting ? <LoadingSpinner /> : "Confirm & Build My Site! 🚀"}
        </button>
      </div>
    </div>
  );
};

export default SummaryView;
