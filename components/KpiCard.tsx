
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  unit: string;
  isPoor: boolean;
  helpText: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, unit, isPoor, helpText }) => {
  const cardClasses = `p-4 bg-white rounded-lg shadow-sm border ${isPoor ? 'metric-card-poor' : 'border-slate-200'}`;
  const valueClasses = `metric-value text-3xl font-bold ${isPoor ? '' : 'text-blue-600'}`;
  
  return (
    <div className={cardClasses}>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
      <div className="mt-2 flex items-baseline space-x-2">
        <p className={valueClasses}>{value}</p>
        <span className="text-sm text-slate-500">{unit}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{helpText}</p>
    </div>
  );
};
