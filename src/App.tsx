import React, { useState } from 'react';
import { Header } from './components/Header';
import { KPICard } from './components/KPICard';
import { AnalyticsChart } from './components/AnalyticsChart';
import { SlideGenerator } from './components/SlideGenerator';
import { PredictiveInsights } from './components/PredictiveInsights';
import { RealTimeMonitor } from './components/RealTimeMonitor';
import { ICTInsight } from './components/ICTInsight';
import { DPlusInsight } from './components/DPlusInsight';

function App() {
  const [activeInsight, setActiveInsight] = useState<'ict' | 'dplus'>('dplus');

  const kpiData = [
    {
      title: 'Service Response Time',
      value: '12.4 min',
      change: -8.2,
      trend: 'down' as const,
      status: 'good' as const,
      subtitle: 'Average response time improved'
    },
    {
      title: 'Customer Satisfaction',
      value: '94.2%',
      change: 5.7,
      trend: 'up' as const,
      status: 'good' as const,
      subtitle: 'Above target of 90%'
    },
    {
      title: 'Job Completion Rate',
      value: '87.3%',
      change: -2.1,
      trend: 'down' as const,
      status: 'warning' as const,
      subtitle: 'Below target of 90%'
    },
    {
      title: 'Resource Utilization',
      value: '78.9%',
      change: 3.4,
      trend: 'up' as const,
      status: 'good' as const,
      subtitle: 'Optimal efficiency range'
    }
  ];

  const chartData = [
    { name: 'Mon', value: 85, target: 90 },
    { name: 'Tue', value: 92, target: 90 },
    { name: 'Wed', value: 88, target: 90 },
    { name: 'Thu', value: 94, target: 90 },
    { name: 'Fri', value: 87, target: 90 },
    { name: 'Sat', value: 91, target: 90 },
    { name: 'Sun', value: 89, target: 90 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Analytics Insights */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Analytics Insights</h3>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveInsight('dplus')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activeInsight === 'dplus'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  D+ Insight
                </button>
                <button
                  onClick={() => setActiveInsight('ict')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activeInsight === 'ict'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ICT Insight
                </button>
              </div>
            </div>

            {/* Analytics Content */}
            {activeInsight === 'dplus' ? <DPlusInsight /> : <ICTInsight />}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>V79 Analytics Platform v2.0 • Processing accuracy: 99.7% • Last data sync: {new Date().toLocaleTimeString()}</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;