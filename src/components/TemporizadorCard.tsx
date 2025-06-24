import React, { useState, useEffect } from 'react';
import { Timer, Power, PowerOff, Play, Pause, Trash2, Edit3, Check, X } from 'lucide-react';
import { ScheduledTask } from '../types';
import { useFirebaseData } from '../hooks/useFirebaseData';

interface TemporizadorCardProps {
  onToggleLight: (status: 'on' | 'off') => Promise<void>;
  currentStatus: 'on' | 'off' | null;
  loading: boolean;
}

export const TemporizadorCard: React.FC<TemporizadorCardProps> = ({ 
  onToggleLight, 
  currentStatus, 
  loading 
}) => {
  const { fetchScheduledTasks, saveScheduledTask, deleteScheduledTask } = useFirebaseData();
  const [isUpdating, setIsUpdating] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [action, setAction] = useState<'on' | 'off'>('on');
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [editingMinutes, setEditingMinutes] = useState(false);
  const [editingSeconds, setEditingSeconds] = useState(false);
  const [tempMinutes, setTempMinutes] = useState('0');
  const [tempSeconds, setTempSeconds] = useState('30');

  // Load tasks from Firebase on component mount
  useEffect(() => {
    const loadTasks = async () => {
      const firebaseTasks = await fetchScheduledTasks();
      setTasks(firebaseTasks);
    };
    loadTasks();
  }, [fetchScheduledTasks]);

  const handleToggle = async (status: 'on' | 'off') => {
    setIsUpdating(true);
    try {
      await onToggleLight(status);
    } finally {
      setIsUpdating(false);
    }
  };

  const addTask = async () => {
    if (minutes === 0 && seconds === 0) return;
    
    const newTask: ScheduledTask = {
      id: Date.now().toString(),
      action,
      device: 'Luz dos Postes',
      firebaseKey: 'led/status',
      time: minutes * 60 + seconds,
      isActive: false,
      remainingTime: minutes * 60 + seconds
    };
    
    try {
      await saveScheduledTask(newTask);
      setTasks([...tasks, newTask]);
      setMinutes(0);
      setSeconds(30);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const startTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, isActive: true, remainingTime: task.time }
        : { ...task, isActive: false }
    ));
  };

  const pauseTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, isActive: false } : task
    ));
  };

  const removeTask = async (taskId: string) => {
    try {
      await deleteScheduledTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const executeAndDeleteTask = async (task: ScheduledTask) => {
    try {
      // Execute the task
      await handleToggle(task.action);
      
      // Delete the task from Firebase and local state
      await deleteScheduledTask(task.id);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
      
      console.log(`Task ${task.id} executed and deleted successfully`);
    } catch (error) {
      console.error('Failed to execute and delete task:', error);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMinutesEdit = () => {
    setTempMinutes(minutes.toString());
    setEditingMinutes(true);
  };

  const handleSecondsEdit = () => {
    setTempSeconds(seconds.toString());
    setEditingSeconds(true);
  };

  const confirmMinutesEdit = () => {
    const value = Math.max(0, Math.min(59, parseInt(tempMinutes) || 0));
    setMinutes(value);
    setEditingMinutes(false);
  };

  const confirmSecondsEdit = () => {
    const value = Math.max(0, Math.min(59, parseInt(tempSeconds) || 0));
    setSeconds(value);
    setEditingSeconds(false);
  };

  const cancelMinutesEdit = () => {
    setTempMinutes(minutes.toString());
    setEditingMinutes(false);
  };

  const cancelSecondsEdit = () => {
    setTempSeconds(seconds.toString());
    setEditingSeconds(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks => 
        prevTasks.map(task => {
          if (!task.isActive || !task.remainingTime) return task;
          
          const newRemainingTime = task.remainingTime - 1;
          
          if (newRemainingTime <= 0) {
            // Execute the task and delete it
            executeAndDeleteTask(task);
            // Return null to indicate this task should be removed
            return null;
          }
          
          return { ...task, remainingTime: newRemainingTime };
        }).filter(task => task !== null) as ScheduledTask[]
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
                <div className="flex items-center justify-center">
                  {editingMinutes ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={tempMinutes}
                        onChange={(e) => setTempMinutes(e.target.value)}
                        className="w-16 text-center text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm font-mono"
                        min="0"
                        max="59"
                        autoFocus
                      />
                      <button
                        onClick={confirmMinutesEdit}
                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelMinutesEdit}
                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleMinutesEdit}
                      className="w-16 text-center text-gray-900 dark:text-gray-100 font-mono hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 group border border-gray-300 dark:border-gray-600"
                    >
                      <span className="group-hover:hidden">{minutes.toString().padStart(2, '0')}</span>
                      <Edit3 size={14} className="hidden group-hover:inline mx-auto" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-2 block">Segundos</label>
                <div className="flex items-center justify-center">
                  {editingSeconds ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={tempSeconds}
                        onChange={(e) => setTempSeconds(e.target.value)}
                        className="w-16 text-center text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm font-mono"
                        min="0"
                        max="59"
                        autoFocus
                      />
                      <button
                        onClick={confirmSecondsEdit}
                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelSecondsEdit}
                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSecondsEdit}
                      className="w-16 text-center text-gray-900 dark:text-gray-100 font-mono hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 group border border-gray-300 dark:border-gray-600"
                    >
                      <span className="group-hover:hidden">{seconds.toString().padStart(2, '0')}</span>
                      <Edit3 size={14} className="hidden group-hover:inline mx-auto" />
                    </button>
                  )}
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
        {tasks.length > 0 && (
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
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Controle manual e programado da iluminação dos postes
          <br />
          <span className="text-blue-600 dark:text-blue-400">
            Tarefas sincronizadas entre dispositivos • Auto-exclusão após execução
          </span>
        </div>
      </div>
    </div>
  );
};