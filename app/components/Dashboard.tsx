'use client'

import React, { useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useFirebaseData } from '../hooks/useFirebaseData'
import { useTheme } from '../hooks/useTheme'
import { Header } from './Header'
import { CircuitCard } from './CircuitCard'
import { PostesCard } from './PostesCard'
import { TemporizadorCard } from './TemporizadorCard'
import { LumaAssistant } from './LumaAssistant'

export const Dashboard: React.FC = () => {
  const { data, loading, error, isOnline, updateLedStatus, refetch } = useFirebaseData()
  const { isDark, toggleTheme } = useTheme()
  const [isLumaOpen, setIsLumaOpen] = useState(false)

  const handleScheduleTask = (minutes: number, seconds: number, action: 'on' | 'off') => {
    console.log(`Scheduling task: ${action} in ${minutes}m ${seconds}s`)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Erro de Conexão</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  async function onToggleLight(status: 'on' | 'off'): Promise<void> {
    try {
      await updateLedStatus(status)
    } catch (err) {
      console.error('Failed to toggle light:', err)
    }
  }

  function onScheduleTask(minutes: number, seconds: number, action: 'on' | 'off'): void {
    const totalMs = (minutes * 60 + seconds) * 1000
    console.log(`Task scheduled: Turn ${action} in ${minutes}m ${seconds}s (${totalMs}ms)`)

    setTimeout(() => {
      onToggleLight(action)
      console.log(`Task executed: Light turned ${action}`)
    }, totalMs)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header 
        isDark={isDark} 
        onToggleTheme={toggleTheme} 
        onToggleLuma={() => setIsLumaOpen(!isLumaOpen)}
        isLumaOpen={isLumaOpen}
      />
      
      <div className={`container mx-auto px-4 py-8 transition-all duration-300 ${
        isLumaOpen ? 'mr-96' : ''
      }`}>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300">
                Monitoramento em tempo real do sistema de iluminação Pública Inteligente
              </p>
            </div>
            <button
              onClick={refetch}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CircuitCard data={data.circuito} loading={loading} isOnline={isOnline} />
          <PostesCard data={data.led} loading={loading} />
          <TemporizadorCard 
            onToggleLight={updateLedStatus}
            currentStatus={data.led?.status || null}
            loading={loading}
          />
        </div>

        <div className="mt-8 text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isOnline 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {isOnline ? 'Sistema Online - Atualizações em Tempo Real' : 'Sistema Offline - Verificando Conexão'}
          </div>
        </div>
      </div>

      {/* Renderização condicional do LumaAssistant */}
      {isLumaOpen && (
        <LumaAssistant 
          isOpen={isLumaOpen}
          onClose={() => setIsLumaOpen(false)}
          onToggleLight={onToggleLight}
          onScheduleTask={onScheduleTask}
        />
      )}
    </div>
  )
}