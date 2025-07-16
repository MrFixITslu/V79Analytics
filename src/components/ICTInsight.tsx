import React from 'react';
import { Server, Wifi, Database, Shield, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const ICTInsight: React.FC = () => {
  const systemMetrics = [
    { name: 'Network Uptime', value: 99.8, unit: '%', status: 'healthy', icon: <Wifi className="h-4 w-4" /> },
    { name: 'Server Performance', value: 94.2, unit: '%', status: 'healthy', icon: <Server className="h-4 w-4" /> },
    { name: 'Database Health', value: 97.5, unit: '%', status: 'healthy', icon: <Database className="h-4 w-4" /> },
    { name: 'Security Score', value: 89.1, unit: '%', status: 'warning', icon: <Shield className="h-4 w-4" /> }
  ];

  const infrastructureAlerts = [
    {
      id: '1',
      title: 'High CPU Usage - Web Server 03',
      description: 'CPU utilization has exceeded 85% threshold for the past 15 minutes',
      severity: 'warning',
      timestamp: '5 minutes ago',
      status: 'active'
    },
    {
      id: '2',
      title: 'Database Connection Pool Optimization',
      description: 'Connection pool efficiency improved by 12% after recent optimization',
      severity: 'info',
      timestamp: '1 hour ago',
      status: 'resolved'
    },
    {
      id: '3',
      title: 'Network Latency Spike - Zone B',
      description: 'Temporary network latency increase detected in Zone B infrastructure',
      severity: 'critical',
      timestamp: '2 hours ago',
      status: 'investigating'
    }
  ];

  const performanceMetrics = [
    { name: 'API Response Time', current: 145, target: 200, unit: 'ms', trend: 'down' },
    { name: 'Throughput', current: 2847, target: 2500, unit: 'req/min', trend: 'up' },
    { name: 'Error Rate', current: 0.12, target: 0.5, unit: '%', trend: 'down' },
    { name: 'Active Connections', current: 1247, target: 1500, unit: '', trend: 'stable' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 transform rotate-180" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Server className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">ICT Infrastructure Insight</h2>
          </div>
          <div className="text-sm text-gray-500">
            Real-time monitoring • Auto-refreshing every 30s
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {systemMetrics.map((metric, index) => (
            <div key={index} className={`rounded-lg p-4 border ${getStatusColor(metric.status)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {metric.icon}
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                {metric.status === 'warning' && (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                {metric.status === 'healthy' && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {metric.value.toFixed(1)}
                <span className="text-sm font-normal text-gray-500 ml-1">{metric.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {metric.current.toLocaleString()}
                <span className="text-sm font-normal text-gray-500 ml-1">{metric.unit}</span>
              </div>
              <div className="text-xs text-gray-500">
                Target: {metric.target.toLocaleString()}{metric.unit}
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      metric.current <= metric.target ? 'bg-green-600' : 'bg-red-600'
                    }`}
                    style={{ 
                      width: `${Math.min((metric.current / metric.target) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Infrastructure Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Infrastructure Alerts & Events</h3>
        </div>
        <div className="space-y-4">
          {infrastructureAlerts.map((alert) => (
            <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                  </span>
                  <h4 className="font-medium text-gray-900">{alert.title}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">{alert.timestamp}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  alert.status === 'active' ? 'bg-red-100 text-red-800' :
                  alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                </span>
                <div className="flex items-center space-x-2">
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    View Details
                  </button>
                  {alert.status === 'active' && (
                    <button className="text-xs text-gray-500 hover:text-gray-700">
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Health Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Overall Health</h4>
            <p className="text-2xl font-bold text-green-600">95.2%</p>
            <p className="text-sm text-gray-500">All critical systems operational</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Performance Trend</h4>
            <p className="text-2xl font-bold text-blue-600">+8.3%</p>
            <p className="text-sm text-gray-500">Improvement over last week</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Security Status</h4>
            <p className="text-2xl font-bold text-purple-600">Secure</p>
            <p className="text-sm text-gray-500">No active threats detected</p>
          </div>
        </div>
      </div>
    </div>
  );
};