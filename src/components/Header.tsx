import React from 'react';
import { BarChart3, Bell, Settings, User } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">V79 Analytics</h1>
            <p className="text-sm text-gray-500">Platform v2.0</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </div>
          <Settings className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
          <div className="flex items-center space-x-2">
            <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1" />
            <span className="text-sm font-medium text-gray-700">Executive Dashboard</span>
          </div>
        </div>
      </div>
    </header>
  );
};