'use client'

import { useState, useEffect } from 'react'
import { DashboardData, CircuitData, PosteData, ScheduledTask, FirebaseScheduledTask } from '../types'

const FIREBASE_BASE_URL = 'https://esp-api-10fa5-default-rtdb.firebaseio.com'

const mockCircuitData: CircuitData = {
  corrente: 2.5,
  potencia: 550,
  tensao: 220,
  time: new Date().toISOString()
}

const mockLedData: PosteData = {
  status: 'off',
  type: 'root'
}

export const useFirebaseData = () => {
  const [data, setData] = useState<DashboardData>({
    circuito: null,
    led: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)

  const checkSystemStatus = (lastUpdateTime: string) => {
    const lastUpdate = new Date(lastUpdateTime)
    const now = new Date()
    const diffInMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)
    return diffInMinutes <= 2
  }

  const fetchData = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const [circuitResponse, ledResponse] = await Promise.all([
        fetch(`${FIREBASE_BASE_URL}/circuito.json`, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${FIREBASE_BASE_URL}/led.json`, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
      ])

      clearTimeout(timeoutId)

      if (!circuitResponse.ok || !ledResponse.ok) {
        throw new Error(`HTTP Error: ${circuitResponse.status} / ${ledResponse.status}`)
      }

      const circuitData: CircuitData = await circuitResponse.json()
      const ledData: PosteData = await ledResponse.json()

      if (circuitData?.time) {
        setIsOnline(checkSystemStatus(circuitData.time))
      }

      setData({
        circuito: circuitData,
        led: ledData
      })
      setError(null)
      setUsingMockData(false)
    } catch (err) {
      console.warn('Firebase unavailable, using mock data:', err)
      
      setData({
        circuito: mockCircuitData,
        led: mockLedData
      })
      
      setError('Conectado em modo offline - usando dados simulados')
      setIsOnline(false)
      setUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }

  const updateLedStatus = async (status: 'on' | 'off') => {
    try {
      if (usingMockData) {
        setData(prev => ({
          ...prev,
          led: { ...prev.led!, status }
        }))
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${FIREBASE_BASE_URL}/led.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status, 
          type: 'root'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }

      await fetchData()
    } catch (err) {
      console.warn('Failed to update LED status, updating locally:', err)
      
      setData(prev => ({
        ...prev,
        led: { ...prev.led!, status }
      }))
      
      setError('Atualização local - Firebase indisponível')
    }
  }

  const fetchScheduledTasks = async (): Promise<ScheduledTask[]> => {
    try {
      if (usingMockData) {
        return []
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${FIREBASE_BASE_URL}/agendamentos.json`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }
      
      const tasksData: Record<string, FirebaseScheduledTask> | null = await response.json()
      
      if (!tasksData) return []
      
      return Object.values(tasksData).map(task => ({
        ...task,
        isActive: false,
        remainingTime: task.time
      }))
    } catch (err) {
      console.warn('Failed to fetch scheduled tasks:', err)
      return []
    }
  }

  const saveScheduledTask = async (task: ScheduledTask): Promise<void> => {
    try {
      if (usingMockData) {
        console.log('Mock mode: Task would be saved:', task)
        return
      }

      const firebaseTask: FirebaseScheduledTask = {
        action: task.action,
        device: task.device,
        firebaseKey: task.firebaseKey,
        id: task.id,
        time: task.time
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${FIREBASE_BASE_URL}/agendamentos/${task.id}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firebaseTask),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }
    } catch (err) {
      console.warn('Failed to save scheduled task:', err)
    }
  }

  const deleteScheduledTask = async (taskId: string): Promise<void> => {
    try {
      if (usingMockData) {
        console.log('Mock mode: Task would be deleted:', taskId)
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${FIREBASE_BASE_URL}/agendamentos/${taskId}.json`, {
        method: 'DELETE',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }
    } catch (err) {
      console.warn('Failed to delete scheduled task:', err)
    }
  }

  useEffect(() => {
    fetchData()
    
    const interval = setInterval(fetchData, 5000)
    
    return () => clearInterval(interval)
  }, [])

  return { 
    data, 
    loading, 
    error, 
    isOnline: isOnline && !usingMockData, 
    updateLedStatus, 
    refetch: fetchData,
    fetchScheduledTasks,
    saveScheduledTask,
    deleteScheduledTask,
    usingMockData
  }
}