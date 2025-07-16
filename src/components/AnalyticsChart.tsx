import React from 'react';

interface DataPoint {
  name: string;
  value: number;
  target?: number;
}

interface AnalyticsChartProps {
  title: string;
  data: DataPoint[];
  type: 'bar' | 'line' | 'area';
  height?: number;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  title,
  data,
  type,
  height = 300
}) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.target || 0)));
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" viewBox="0 0 400 300" className="overflow-visible">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="0"
              y1={i * 60}
              x2="400"
              y2={i * 60}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}
          
          {/* Data visualization */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 350 + 25;
            const y = 240 - (point.value / maxValue) * 200;
            const targetY = point.target ? 240 - (point.target / maxValue) * 200 : null;
            
            return (
              <g key={index}>
                {/* Bar chart */}
                {type === 'bar' && (
                  <rect
                    x={x - 15}
                    y={y}
                    width="30"
                    height={240 - y}
                    fill="#3b82f6"
                    className="hover:fill-blue-500 transition-colors duration-200"
                  />
                )}
                
                {/* Target line */}
                {targetY && (
                  <line
                    x1={x - 20}
                    y1={targetY}
                    x2={x + 20}
                    y2={targetY}
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                )}
                
                {/* Data point */}
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#1d4ed8"
                  className="hover:r-6 transition-all duration-200"
                />
                
                {/* Labels */}
                <text
                  x={x}
                  y={270}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {point.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>Actual</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-1 bg-red-500 rounded-full"></div>
            <span>Target</span>
          </div>
        </div>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};