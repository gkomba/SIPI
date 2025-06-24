import React from 'react';
import { Activity, Clock } from 'lucide-react';
import { CircuitData } from '../types';
import { StatusBadge } from './StatusBadge';

interface CircuitCardProps {
  data: CircuitData | null;
  loading: boolean;
  isOnline: boolean;
}

export const CircuitCard: React.FC<CircuitCardProps> = ({ data, loading, isOnline }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Circuito</h2>
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
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Circuito</h2>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={isOnline ? 'online' : 'offline'} size="sm" />
          {data && <StatusBadge status={data.saude} />}
        </div>
      </div>
      
      {data ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status do Sistema</h3>
            <p className="text-gray-900 dark:text-gray-100">{data.info}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Estado</h3>
              <p className="text-gray-900 dark:text-gray-100 capitalize">{data.status === 'on' ? 'Ativo' : 'Inativo'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Última Atualização</h3>
              <div className="flex items-center gap-1 text-gray-900 dark:text-gray-100">
                <Clock size={14} />
                <span className="text-sm">{data.time}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível</p>
      )}
    </div>
  );
};