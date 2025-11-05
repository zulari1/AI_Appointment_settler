import React from 'react';

interface ProgressBarProps {
  stages: string[];
  currentStage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ stages, currentStage }) => {
  const progressPercentage = (currentStage / (stages.length - 1)) * 100;

  return (
    <div className="w-full px-4 sm:px-0">
        <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-blue-300 font-display uppercase tracking-wider">
                {stages[currentStage]}
            </span>
            <span className="text-sm font-medium text-blue-300">
                {Math.round(progressPercentage)}% Complete
            </span>
        </div>
      <div className="w-full bg-black/30 rounded-full h-2.5">
        <div
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;