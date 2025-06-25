import React from 'react';
import { Moon, Sun, Clock, Bot } from 'lucide-react';
import { useCurrentTime } from '../hooks/useCurrentTime';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onToggleLuma: () => void;
  isLumaOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isDark, onToggleTheme, onToggleLuma, isLumaOpen }) => {
  const currentTime = useCurrentTime();

  const formatTime = (date: Date) => {
    return date.toLocaleString('pt-PT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Sistema de Iluminação Pública Inteligente
            </h1>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Clock size={16} />
              <span className="text-sm font-medium">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLuma}
              className={`p-2 rounded-lg transition-colors ${
                isLumaOpen 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}
              aria-label="Toggle Luma Assistant"
            >
              <Bot className="w-5 h-5" />
            </button>
            
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};