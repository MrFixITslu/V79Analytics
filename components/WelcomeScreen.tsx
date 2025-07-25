import React from 'react';

export const WelcomeScreen: React.FC = () => {
  const message = "Upload one or more CSV files to generate an interactive performance report.";

  return (
    <div className="text-center p-8 mt-10 bg-white rounded-lg shadow-lg max-w-3xl mx-auto border border-slate-200">
      <h2 className="text-3xl font-bold text-slate-800">Welcome to the Service Delivery Performance Report Generator</h2>
      <p className="mt-4 text-lg text-slate-600">{message}</p>
    </div>
  );
};