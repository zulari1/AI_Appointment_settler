import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ServiceCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    link: string;
    status: 'available' | 'coming-soon';
    onClick: () => void;
    isLoading?: boolean;
}

// FIX: Cast motion.div to 'any' to work around a probable type conflict with React/Framer Motion versions.
const MotionDiv = motion.div as any;

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, icon, status, onClick, isLoading = false }) => {
  const isAvailable = status === 'available';

  const content = (
    <div 
        className={`relative bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col h-full transition-all duration-300 group ${isAvailable ? 'hover:border-brand-primary hover:shadow-lg hover:shadow-brand-primary/10 cursor-pointer' : 'opacity-60'}`}
        aria-label={title}
        onClick={isAvailable && !isLoading ? onClick : undefined}
        role={isAvailable ? "button" : undefined}
        tabIndex={isAvailable ? 0 : -1}
        onKeyDown={isAvailable && !isLoading ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
    >
      <AnimatePresence>
        {isLoading && (
            <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-dark-card/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10"
            >
                <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-3 text-sm font-semibold text-dark-text-secondary">Verifying access...</p>
            </MotionDiv>
        )}
        </AnimatePresence>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-dark-bg rounded-lg text-brand-accent">{icon}</div>
        {isAvailable ? 
          <span className="text-xs font-bold uppercase text-green-400 bg-green-900/50 px-2 py-1 rounded-full">Available</span> : 
          <span className="text-xs font-bold uppercase text-yellow-400 bg-yellow-900/50 px-2 py-1 rounded-full">🚧 Coming Soon</span>}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-dark-text-secondary flex-grow">{description}</p>
      {isAvailable && (
        <div className="mt-6">
          <span className="font-semibold text-brand-primary group-hover:text-brand-accent transition-colors">
            Manage Agent &rarr;
          </span>
        </div>
      )}
    </div>
  );

  return <div>{content}</div>;
};

export default ServiceCard;
