'use client'

import { useState, useEffect } from 'react'

export const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date(0)) // Use epoch time as default
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date()) // Set actual current time after mount
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return currentTime
}