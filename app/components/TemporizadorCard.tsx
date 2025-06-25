'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Timer, Power, PowerOff, Plus, Minus, Play, Pause, Trash2 } from 'lucide-react'
import { ScheduledTask } from '../types'
import { useFirebaseData } from '../hooks/useFirebaseData'

interface TemporizadorCardProps {
  onToggleLight: (status: 'on' | 'off') => Promise<void>
  currentStatus: 'on' | 'off' | null
  loading: boolean
}

export const TemporizadorCard: React.FC<TemporizadorCardProps> = ({ 
  onToggleLight, 
  currentStatus, 
  loading 
}) => {
  const { fetchScheduledTasks, saveScheduledTask, deleteScheduledTask } = useFirebaseData()
  const [isUpdating, setIsUpdating] = useState(false)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(30)
  const [action, setAction] = useState<'on' | 'off'>('on')
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  
  const tasksRef = useRef<ScheduledTask[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const executeAndDeleteTask = useCallback(async (task: ScheduledTask) => {
    try {
      console.log(`Executing task ${task.id}: ${task.action}`)
      
      await onToggleLight(task.action)
      await deleteScheduledTask(task.id)
      
      setTasks(prevTasks => {
        const newTasks = prevTasks.filter(t => t.id !== task.id)
        tasksRef.current = newTasks
        return newTasks
      })
      
      console.log(`Task ${task.id} executed and deleted successfully`)
    } catch (error) {
      console.error('Failed to execute and delete task:', error)
    }
  }, [onToggleLight, deleteScheduledTask])

  useEffect(() => {
    let isMounted = true
    
    const loadTasks = async () => {
      try {
        setIsLoadingTasks(true)
        const firebaseTasks = await fetchScheduledTasks()
        
        if (isMounted) {
          const tasksWithState = firebaseTasks.map(task => ({
            ...task,
            isActive: false,
            remainingTime: task.time
          }))
          
          setTasks(tasksWithState)
          tasksRef.current = tasksWithState
        }
      } catch (error) {
        console.error('Failed to load tasks:', error)
      } finally {
        if (isMounted) {
          setIsLoadingTasks(false)
        }
      }
    }
    
    loadTasks()
    
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setTasks(prevTasks => {
        const updatedTasks: ScheduledTask[] = []
        let hasChanges = false

        for (const task of prevTasks) {
          if (!task.isActive || !task.remainingTime) {
            updatedTasks.push(task)
            continue
          }

          const newRemainingTime = task.remainingTime - 1

          if (newRemainingTime <= 0) {
            executeAndDeleteTask(task)
            hasChanges = true
          } else {
            updatedTasks.push({ ...task, remainingTime: newRemainingTime })
            hasChanges = true
          }
        }

        tasksRef.current = updatedTasks
        
        return hasChanges ? updatedTasks : prevTasks
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [executeAndDeleteTask])

  const handleToggle = async (status: 'on' | 'off') => {
    setIsUpdating(true)
    try {
      await onToggleLight(status)
    } finally {
      setIsUpdating(false)
    }
  }

  const addTask = async () => {
    if (minutes === 0 && seconds === 0) return
    
    const newTask: ScheduledTask = {
      id: Date.now().toString(),
      action,
      device: 'Luz dos Postes',
      firebaseKey: 'led/status',
      time: minutes * 60 + seconds,
      isActive: false,
      remainingTime: minutes * 60 + seconds
    }
    
    try {
      await saveScheduledTask(newTask)
      setTasks(prevTasks => {
        const newTasks = [...prevTasks, newTask]
        tasksRef.current = newTasks
        return newTasks
      })
      setMinutes(0)
      setSeconds(30)
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  const startTask = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, isActive: true, remainingTime: task.remainingTime || task.time }
          : { ...task, isActive: false }
      )
      tasksRef.current = newTasks
      return newTasks
    })
  }, [])

  const pauseTask = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task => 
        task.id === taskId ? { ...task, isActive: false } : task
      )
      tasksRef.current = newTasks
      return newTasks
    })
  }, [])

  const removeTask = useCallback(async (taskId: string) => {
    try {
      await deleteScheduledTask(taskId)
      setTasks(prevTasks => {
        const newTasks = prevTasks.filter(task => task.id !== taskId)
        tasksRef.current = newTasks
        return newTasks
      })
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }, [deleteScheduledTask])

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Timer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Temporizador de Tarefas</h2>
      </div>
      
      <div className="space-y-6">
        {/* Status Atual */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status Atual</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              currentStatus === 'on' ? 'bg-green-500' : 
              currentStatus === 'off' ? 'bg-gray-400' : 'bg-yellow-500'
            }`}></div>
            <span className="text-gray-900 dark:text-gray-100">
              {loading ? 'Carregando...' : 
               currentStatus === 'on' ? 'Luzes Ligadas' : 
               currentStatus === 'off' ? 'Luzes Desligadas' : 'Status Desconhecido'}
            </span>
          </div>
        </div>

        {/* Controles Manuais */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleToggle('on')}
            disabled={isUpdating || loading || currentStatus === 'on'}
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium
              transition-all duration-200 ${
                currentStatus === 'on' 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <Power size={18} />
            {isUpdating && currentStatus !== 'on' ? 'Ligando...' : 'Ligar'}
          </button>

          <button
            onClick={() => handleToggle('off')}
            disabled={isUpdating || loading || currentStatus === 'off'}
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium
              transition-all duration-200 ${
                currentStatus === 'off' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-md'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <PowerOff size={18} />
            {isUpdating && currentStatus !== 'off' ? 'Desligando...' : 'Desligar'}
          </button>
        </div>

        {/* Configuração de Tarefa */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Programar Tarefa</h3>
          
          <div className="space-y-4">
            {/* Seleção de Ação */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300 mb-2 block">Ação</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAction('on')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    action === 'on' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Ligar
                </button>
                <button
                  onClick={() => setAction('off')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    action === 'off' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Desligar
                </button>
              </div>
            </div>

            {/* Configuração de Tempo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-2 block">Minutos</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMinutes(Math.max(0, minutes - 1))}
                    className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center text-gray-900 dark:text-gray-100 font-mono">
                    {minutes.toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setMinutes(Math.min(59, minutes + 1))}
                    className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-2 block">Segundos</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSeconds(Math.max(0, seconds - 1))}
                    className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center text-gray-900 dark:text-gray-100 font-mono">
                    {seconds.toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setSeconds(Math.min(59, seconds + 1))}
                    className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={addTask}
              disabled={minutes === 0 && seconds === 0}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              Adicionar Tarefa
            </button>
          </div>
        </div>

        {/* Lista de Tarefas */}
        {isLoadingTasks ? (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Tarefas Programadas</h3>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ) : tasks.length > 0 ? (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Tarefas Programadas</h3>
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.action === 'on' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {task.action === 'on' ? 'Ligar' : 'Desligar'} em {formatTime(task.remainingTime || task.time)}
                    </span>
                    {task.isActive && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Executando...
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {task.isActive ? (
                      <button
                        onClick={() => pauseTask(task.id)}
                        className="p-1 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded"
                      >
                        <Pause size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => startTask(task.id)}
                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                      >
                        <Play size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => removeTask(task.id)}
                      className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Controle manual e programado da iluminação dos postes
          <br />
          <span className="text-blue-600 dark:text-blue-400">
            Tarefas sincronizadas entre dispositivos • Auto-exclusão após execução
          </span>
        </div>
      </div>
    </div>
  )
}