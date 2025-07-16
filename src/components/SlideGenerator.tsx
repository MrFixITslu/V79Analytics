import React, { useState } from 'react';
import { FileText, Download, Share2, Eye } from 'lucide-react';

interface SlideData {
  id: string;
  title: string;
  type: 'executive-summary' | 'kpi-dashboard' | 'trend-analysis' | 'predictive-insights';
  status: 'draft' | 'ready' | 'approved';
  lastModified: string;
}

export const SlideGenerator: React.FC = () => {
  const [slides] = useState<SlideData[]>([
    {
      id: '1',
      title: 'Executive Summary - Q1 2024',
      type: 'executive-summary',
      status: 'ready',
      lastModified: '2 hours ago'
    },
    {
      id: '2',
      title: 'KPI Performance Dashboard',
      type: 'kpi-dashboard',
      status: 'approved',
      lastModified: '1 day ago'
    },
    {
      id: '3',
      title: 'Service Delivery Trends',
      type: 'trend-analysis',
      status: 'draft',
      lastModified: '3 hours ago'
    },
    {
      id: '4',
      title: 'Predictive Analytics Report',
      type: 'predictive-insights',
      status: 'ready',
      lastModified: '5 hours ago'
    }
  ]);

  const getStatusColor = (status: SlideData['status']) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: SlideData['type']) => {
    switch (type) {
      case 'executive-summary': return 'Executive Summary';
      case 'kpi-dashboard': return 'KPI Dashboard';
      case 'trend-analysis': return 'Trend Analysis';
      case 'predictive-insights': return 'Predictive Insights';
      default: return 'Unknown Type';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">AI-Powered Slide Generation</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>Generate New Slide</span>
        </button>
      </div>

      <div className="grid gap-4">
        {slides.map((slide) => (
          <div key={slide.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">{slide.title}</h4>
                  <p className="text-sm text-gray-500">{getTypeLabel(slide.type)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(slide.status)}`}>
                  {slide.status.charAt(0).toUpperCase() + slide.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Modified {slide.lastModified}</span>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                  <Share2 className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};