import React from 'react';
import { Brain, TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface InsightData {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: 'performance' | 'risk' | 'opportunity' | 'forecast';
  timestamp: string;
}

export const PredictiveInsights: React.FC = () => {
  const insights: InsightData[] = [
    {
      id: '1',
      title: 'Service Response Time Deterioration',
      description: 'AI models predict a 15% increase in average response times over the next 2 weeks due to increased workload patterns.',
      confidence: 87,
      impact: 'high',
      category: 'risk',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      title: 'Optimal Resource Allocation Opportunity',
      description: 'Machine learning analysis suggests reallocating 3 technicians from Zone A to Zone C could improve overall efficiency by 12%.',
      confidence: 92,
      impact: 'medium',
      category: 'opportunity',
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      title: 'Customer Satisfaction Forecast',
      description: 'Predictive models indicate customer satisfaction scores will increase by 8% next quarter based on current service improvements.',
      confidence: 78,
      impact: 'high',
      category: 'forecast',
      timestamp: '6 hours ago'
    },
    {
      id: '4',
      title: 'Equipment Maintenance Alert',
      description: 'Anomaly detection identifies potential equipment failures in 2 service vehicles within the next 72 hours.',
      confidence: 94,
      impact: 'high',
      category: 'risk',
      timestamp: '1 hour ago'
    }
  ];

  const getImpactColor = (impact: InsightData['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: InsightData['category']) => {
    switch (category) {
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <Target className="h-4 w-4" />;
      case 'forecast': return <Brain className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Predictive Insights</h3>
        </div>
        <div className="text-sm text-gray-500">
          Real-time intelligence • Auto-refreshing
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className={`border-l-4 ${getImpactColor(insight.impact)} bg-white rounded-lg p-4 shadow-sm`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(insight.category)}
                <h4 className="font-medium text-gray-900">{insight.title}</h4>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{insight.timestamp}</span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-medium text-gray-600">Confidence:</span>
                  <span className="text-xs font-bold text-blue-600">{insight.confidence}%</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(insight.impact)}`}>
                  {insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)} Impact
                </span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  View Details
                </button>
                <button className="text-xs text-gray-500 hover:text-gray-700">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};