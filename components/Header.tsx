import React from 'react';

interface HeaderProps {
    onReset: () => void;
    hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasData }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zM13 8a1 1 0 11-2 0 1 1 0 012 0zM5 8a1 1 0 100-2 1 1 0 000 2zm1 1a1 1 0 11-2 0 1 1 0 012 0zm1 1a1 1 0 100-2 1 1 0 000 2zm1-1a1 1 0 11-2 0 1 1 0 012 0zm1 1a1 1 0 100-2 1 1 0 000 2zm1-1a1 1 0 11-2 0 1 1 0 012 0zm1 1a1 1 0 100-2 1 1 0 000 2zm1-1a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Service Delivery Performance Report Generator</h1>
        </div>
        
        <div className="w-40 text-right">
          {hasData && (
              <button onClick={onReset} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors text-sm font-semibold">
                  Upload New File
              </button>
          )}
        </div>
      </div>
    </header>
  );
};