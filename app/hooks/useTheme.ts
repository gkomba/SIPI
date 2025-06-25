'use client'

import { useState, useEffect } from 'react'

export const useTheme = () => {
  const [isDark, setIsDark] = useState(false) // Default to false to match server
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Only access browser APIs after component mounts
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = saved ? saved === 'dark' : prefersDark
    
    setIsDark(shouldBeDark)
    
    // Apply theme to document
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [isDark, isClient])

  const toggleTheme = () => setIsDark(!isDark)

  return { isDark, toggleTheme }
}