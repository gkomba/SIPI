import { useState, useEffect } from 'react';
import { DashboardData, CircuitData, PosteData, ScheduledTask, FirebaseScheduledTask } from '../types';

const FIREBASE_BASE_URL = 'https://esp-api-10fa5-default-rtdb.firebaseio.com';

export const useFirebaseData = () => {
  const [data, setData] = useState<DashboardData>({
    circuito: null,
    led: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const checkSystemStatus = (lastUpdateTime: string) => {
    const lastUpdate = new Date(lastUpdateTime);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    return diffInMinutes <= 2; // Sistema online se última atualização foi há menos de 2 minutos
  };

  const fetchData = async () => {
    try {
      const [circuitResponse, ledResponse] = await Promise.all([
        fetch(`${FIREBASE_BASE_URL}/circuito.json`),
        fetch(`${FIREBASE_BASE_URL}/led.json`)
      ]);

      if (!circuitResponse.ok || !ledResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const circuitData: CircuitData = await circuitResponse.json();
      const ledData: PosteData = await ledResponse.json();

      // Verificar status online/offline baseado na última atualização
      if (circuitData?.time) {
        setIsOnline(checkSystemStatus(circuitData.time));
      }

      setData({
        circuito: circuitData,
        led: ledData
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsOnline(false);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateLedStatus = async (status: 'on' | 'off') => {
    try {
      const response = await fetch(`${FIREBASE_BASE_URL}/led.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status, 
          type: 'root'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update LED status');
      }

      // Refresh data after successful update
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update LED');
      console.error('Error updating LED:', err);
    }
  };

  const fetchScheduledTasks = async (): Promise<ScheduledTask[]> => {
    try {
      const response = await fetch(`${FIREBASE_BASE_URL}/agendamentos.json`);
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled tasks');
      }
      
      const tasksData: Record<string, FirebaseScheduledTask> | null = await response.json();
      
      if (!tasksData) return [];
      
      return Object.values(tasksData).map(task => ({
        ...task,
        isActive: false,
        remainingTime: task.time
      }));
    } catch (err) {
      console.error('Error fetching scheduled tasks:', err);
      return [];
    }
  };

  const saveScheduledTask = async (task: ScheduledTask): Promise<void> => {
    try {
      const firebaseTask: FirebaseScheduledTask = {
        action: task.action,
        device: task.device,
        firebaseKey: task.firebaseKey,
        id: task.id,
        time: task.time
      };

      const response = await fetch(`${FIREBASE_BASE_URL}/agendamentos/${task.id}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firebaseTask),
      });

      if (!response.ok) {
        throw new Error('Failed to save scheduled task');
      }
    } catch (err) {
      console.error('Error saving scheduled task:', err);
      throw err;
    }
  };

  const deleteScheduledTask = async (taskId: string): Promise<void> => {
    try {
      const response = await fetch(`${FIREBASE_BASE_URL}/agendamentos/${taskId}.json`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete scheduled task');
      }
    } catch (err) {
      console.error('Error deleting scheduled task:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchData, 2000); // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, []);

  return { 
    data, 
    loading, 
    error, 
    isOnline, 
    updateLedStatus, 
    refetch: fetchData,
    fetchScheduledTasks,
    saveScheduledTask,
    deleteScheduledTask
  };
};