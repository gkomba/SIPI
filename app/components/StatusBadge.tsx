'use client'

import React from 'react'
import { AlertTriangle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react'

interface StatusBadgeProps {
  status: 'OK' | 'ALERT' | 'WARNING' | 'on' | 'off' | 'online' | 'offline'
  size?: 'sm' | 'md' | 'lg'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'OK':
        return {
          color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
          icon: CheckCircle,
          text: 'Saudável'
        }
      case 'ALERT':
        return {
          color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
          icon: AlertTriangle,
          text: 'Alerta'
        }
      case 'WARNING':
        return {
          color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
          icon: Clock,
          text: 'Atenção'
        }
      case 'on':
        return {
          color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
          icon: CheckCircle,
          text: 'Ligado'
        }
      case 'off':
        return {
          color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600',
          icon: Clock,
          text: 'Desligado'
        }
      case 'online':
        return {
          color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
          icon: Wifi,
          text: 'Online'
        }
      case 'offline':
        return {
          color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
          icon: WifiOff,
          text: 'Offline'
        }
      default:
        return {
          color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600',
          icon: Clock,
          text: 'Desconhecido'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full border font-medium
      ${config.color} ${sizeClasses[size]}
    `}>
      <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
      {config.text}
    </span>
  )
}