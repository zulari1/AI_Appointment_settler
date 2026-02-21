import React from 'react';

interface AppointmentSummaryProps {
  onConfirm: () => void;
  isProcessing: boolean;
  isConfirmed?: boolean;
  details?: {
    datetime?: string;
    channel?: string;
  };
}

export const AppointmentSummary: React.FC<AppointmentSummaryProps> = ({ 
  onConfirm, 
  isProcessing, 
  isConfirmed = false,
  details 
}) => {
  const hasDetails = details?.datetime || details?.channel;

  if (isConfirmed) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 animate-slide-up z-30">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <i className="fas fa-check text-white text-xs"></i>
                </div>
                <h3 className="text-sm font-bold text-green-800 dark:text-green-300 uppercase tracking-wide">
                  Appointment Confirmed
                </h3>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                An invitation has been sent to your email.
              </p>
              
              {hasDetails && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3 opacity-90">
                  {details.datetime && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800 shadow-sm">
                      <i className="fas fa-clock mr-1.5"></i>
                      {details.datetime}
                    </span>
                  )}
                  {details.channel && (
                     <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800 shadow-sm">
                      <i className="fas fa-video mr-1.5"></i>
                      {details.channel}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => alert("This feature would generate an .ics file or open Google Calendar in production.")}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white hover:bg-green-50 text-green-700 border border-green-200 dark:bg-slate-800 dark:border-slate-600 dark:text-green-400 dark:hover:bg-slate-700 px-6 py-3 rounded-xl font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap"
            >
              <i className="fas fa-calendar-plus"></i>
              <span>Add to Calendar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border-t border-brand-100 dark:border-slate-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 animate-slide-up z-30">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Appointment Ready
              </h3>
            </div>
            
            {hasDetails ? (
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                {details.datetime && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    <i className="fas fa-clock mr-1.5 opacity-70"></i>
                    {details.datetime}
                  </span>
                )}
                {details.channel && (
                   <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <i className="fas fa-video mr-1.5 opacity-70"></i>
                    {details.channel}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Atlas is gathering final details...
              </p>
            )}
          </div>
          
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? (
               <i className="fas fa-circle-notch fa-spin"></i>
            ) : (
               <i className="fas fa-check"></i>
            )}
            <span>Confirm Booking</span>
          </button>
        </div>
      </div>
    </div>
  );
};