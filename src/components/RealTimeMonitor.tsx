import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Database, Cpu, AlertCircle } from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ReactNode;
}

export const RealTimeMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    { name: 'Data Processing', value: 99.2, unit: '%', status: 'healthy', icon: <Database className="h-4 w-4" /> },
    { name: 'API Response', value: 145, unit: 'ms', status: 'healthy', icon: <Wifi className="h-4 w-4" /> },
    { name: 'CPU Usage', value: 67, unit: '%', status: 'warning', icon: <Cpu className="h-4 w-4" /> },
    { name: 'Active Jobs', value: 1247, unit: '', status: 'healthy', icon: <Activity className="h-4 w-4" /> }
  ]);

  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 5
      })));
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: SystemMetric['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Real-Time System Monitor</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Live • {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className={`p-4 rounded-lg border ${getStatusColor(metric.status)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {metric.icon}
                <span className="text-sm font-medium text-gray-700">{metric.name}</span>
              </div>
              {metric.status === 'warning' && (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              {metric.status === 'critical' && (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metric.value.toFixed(metric.unit === 'ms' ? 0 : 1)}
              <span className="text-sm font-normal text-gray-500 ml-1">{metric.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Activity className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">System Health Summary</span>
        </div>
        <p className="text-sm text-blue-700">
          All critical systems operational. One minor performance warning detected in CPU usage. 
          Automatic scaling initiated to handle increased load.
        </p>
      </div>
    </div>
  );
};