import React from 'react';
import { Lightbulb } from 'lucide-react';
import { PosteData } from '../types';
import { StatusBadge } from './StatusBadge';

interface PostesCardProps {
  data: PosteData | null;
  loading: boolean;
}

export const PostesCard: React.FC<PostesCardProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Postes</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Postes</h2>
        </div>
        {data && <StatusBadge status={data.status} />}
      </div>
      
      {data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h3>
              <p className="text-gray-900 dark:text-gray-100 capitalize">
                {data.status === 'on' ? 'Ligado' : 'Desligado'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo de Sensor</h3>
              <p className="text-gray-900 dark:text-gray-100 uppercase">{data.type}</p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Iluminação automática</span>
              <div className={`w-3 h-3 rounded-full ${data.status === 'on' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível</p>
      )}
    </div>
  );
};