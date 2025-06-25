import React from 'react';
import { Activity, Clock, MapPin } from 'lucide-react';
import { CircuitData } from '../types';
import { StatusBadge } from './StatusBadge';

interface CircuitCardProps {
  data: CircuitData | null;
  loading: boolean;
  isOnline: boolean;
}

interface PosteStatus {
  id: number;
  status: 'OK' | 'ALERT';
}

export const CircuitCard: React.FC<CircuitCardProps> = ({ data, loading, isOnline }) => {
  const parsePostesStatus = (info: string): PosteStatus[] => {
    const postes = [
      { id: 1, status: 'OK' as const },
      { id: 2, status: 'OK' as const },
      { id: 3, status: 'OK' as const },
      { id: 4, status: 'OK' as const }
    ];

    if (info && info.includes('Falha(s) encontrada(s) na(s) Zona(s)')) {
      // Extract zone numbers from the string
      const match = info.match(/Zona\(s\)\s+([\d\s]+)/);
      if (match) {
        const failedZones = match[1].trim().split(/\s+/).map(Number);
        failedZones.forEach(zoneId => {
          const poste = postes.find(p => p.id === zoneId);
          if (poste) {
            poste.status = 'ALERT';
          }
        });
      }
    }

    return postes;
  };

  const getSystemStatus = (postes: PosteStatus[]): 'OK' | 'ALERT' => {
    return postes.some(poste => poste.status === 'ALERT') ? 'ALERT' : 'OK';
  };

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

  const postes = data ? parsePostesStatus(data.info) : [];
  const systemStatus = data ? getSystemStatus(postes) : 'OK';

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
        <div className="space-y-6">
          {/* Status Geral do Sistema */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status Geral do Sistema</h3>
              <StatusBadge status={systemStatus} size="sm" />
            </div>
            <p className="text-gray-900 dark:text-gray-100 text-sm">{data.info}</p>
          </div>

          {/* Status Individual dos Postes */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Status dos Postes</h3>
            <div className="space-y-2">
              {postes.map(poste => (
                <div 
                  key={poste.id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border-l-4 transition-colors
                    ${poste.status === 'OK' 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                      : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      p-2 rounded-lg
                      ${poste.status === 'OK' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-red-100 dark:bg-red-900/30'
                      }
                    `}>
                      <MapPin className={`
                        w-4 h-4
                        ${poste.status === 'OK' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                        }
                      `} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Poste {poste.id}
                      </p>
                      <p className={`
                        text-sm
                        ${poste.status === 'OK' 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-red-700 dark:text-red-300'
                        }
                      `}>
                        {poste.status === 'OK' ? 'Funcionando normalmente' : 'Falha detectada'}
                      </p>
                    </div>
                  </div>
                  <div className={`
                    w-3 h-3 rounded-full
                    ${poste.status === 'OK' ? 'bg-green-500' : 'bg-red-500'}
                  `}></div>
                </div>
              ))}
            </div>
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