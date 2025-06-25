'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, Upload, X, Lightbulb, Timer, Database, Zap, Key, AlertCircle } from 'lucide-react'
import { useChat } from 'ai/react'

interface LumaAssistantProps {
  isOpen: boolean
  onClose: () => void
  onToggleLight: (status: 'on' | 'off') => Promise<void>
  onScheduleTask: (minutes: number, seconds: number, action: 'on' | 'off') => void
}

export const LumaAssistant: React.FC<LumaAssistantProps> = ({ 
  isOpen, 
  onClose, 
  onToggleLight, 
  onScheduleTask 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKeyError, setApiKeyError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput
  } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Sou a Luma, sua assistente especializada em sistemas de iluminação inteligente. Criada por Gildo Komba para ajudá-lo com análises técnicas, diagnósticos e otimizações.\n\nPosso ajudá-lo a:\n• Analisar dados do sistema\n• Controlar as luzes\n• Programar tarefas\n• Diagnosticar problemas\n• Configurar ESP32 e sensores\n\nComo posso ajudá-lo?'
      }
    ],
    body: {
      apiKey,
      systemData: null
    },
    onError: (error) => {
      console.error('Chat error:', error)
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    } else {
      setShowApiKeyInput(true)
    }
  }, [])

  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      setApiKeyError('Por favor, insira uma API key válida')
      return
    }
    
    if (!apiKey.startsWith('AIza')) {
      setApiKeyError('API key do Google deve começar com "AIza"')
      return
    }

    localStorage.setItem('gemini_api_key', apiKey)
    setShowApiKeyInput(false)
    setApiKeyError('')
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const detectCommand = (input: string): {
    type: 'toggle_lights' | 'schedule_task' | 'analyze_system' | 'general'
    action?: 'on' | 'off'
    minutes?: number
    seconds?: number
  } => {
    const lower = input.toLowerCase()

    if (lower.includes('ligar') && (lower.includes('luz') || lower.includes('poste'))) {
      return { type: 'toggle_lights', action: 'on' }
    }

    if (lower.includes('desligar') && (lower.includes('luz') || lower.includes('poste'))) {
      return { type: 'toggle_lights', action: 'off' }
    }

    const match = lower.match(/(\d+)\s*(minuto|min|segundo|seg)/g)
    if ((lower.includes('programar') || lower.includes('agendar')) && match) {
      let minutes = 0
      let seconds = 0

      match.forEach(item => {
        const num = parseInt(item.match(/\d+/)?.[0] || '0')
        if (item.includes('min')) minutes = num
        if (item.includes('seg')) seconds = num
      })

      const action = lower.includes('ligar') ? 'on' : 'off'
      return { type: 'schedule_task', action, minutes, seconds }
    }

    if (lower.includes('analis') || lower.includes('dados') || lower.includes('sistema')) {
      return { type: 'analyze_system' }
    }

    return { type: 'general' }
  }

  const enhancedHandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() && selectedFiles.length === 0) return
    
    if (!apiKey) {
      setShowApiKeyInput(true)
      return
    }

    const currentInput = input
    
    try {
      // Detectar tipo de comando
      const command = detectCommand(currentInput)
      let actionResult = ''

      // Executar ações específicas primeiro
      switch (command.type) {
        case 'toggle_lights':
          try {
            await onToggleLight(command.action!)
            actionResult = `✅ Luzes ${command.action === 'on' ? 'ligadas' : 'desligadas'} com sucesso!\n\n`
          } catch (error) {
            actionResult = `❌ Erro ao ${command.action === 'on' ? 'ligar' : 'desligar'} as luzes.\n\n`
          }
          break

        case 'schedule_task':
          onScheduleTask(command.minutes!, command.seconds!, command.action!)
          actionResult = `⏰ Tarefa programada: ${command.action === 'on' ? 'Ligar' : 'Desligar'} luzes em ${command.minutes}m${command.seconds}s\n\n`
          break
      }

      // Buscar dados do sistema se necessário
      let systemData = null
      if (command.type === 'analyze_system' || currentInput.toLowerCase().includes('sistema')) {
        try {
          const response = await fetch('/api/system-data')
          if (response.ok) {
            systemData = await response.json()
          }
        } catch (error) {
          console.warn('Erro ao buscar dados do sistema:', error)
        }
      }

      // Se há resultado de ação, adicionar ao input
      if (actionResult) {
        setInput(actionResult + currentInput)
      }

      // Usar o handleSubmit nativo do useChat
      handleSubmit(e, {
        body: {
          apiKey,
          systemData
        }
      })

      setSelectedFiles([])

    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
    }
  }

  const quickActions = [
    {
      icon: Lightbulb,
      label: 'Ligar Luzes',
      action: () => setInput('Ligar as luzes dos postes')
    },
    {
      icon: Zap,
      label: 'Desligar Luzes',
      action: () => setInput('Desligar as luzes dos postes')
    },
    {
      icon: Database,
      label: 'Analisar Sistema',
      action: () => setInput('Analisar dados do sistema')
    },
    {
      icon: Timer,
      label: 'Programar Tarefa',
      action: () => setInput('Programar tarefa para ligar luzes em 5 minutos')
    }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col">
      {/* API Key Modal */}
      {showApiKeyInput && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 m-4 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar API Key
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Para usar a IA real do Google Gemini, você precisa de uma API key. 
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline ml-1"
              >
                Obtenha aqui
              </a>
            </p>
            
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole sua API key aqui..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-3"
            />
            
            {apiKeyError && (
              <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
                <AlertCircle size={16} />
                {apiKeyError}
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleApiKeySubmit}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setShowApiKeyInput(false)
                  setApiKeyError('')
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Luma</h3>
            <p className="text-xs text-white/80">
              IA Real • Google Gemini • Por Gildo Komba
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="p-1.5 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors"
            title="Configurar API Key"
          >
            <Key size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Ações Rápidas</h4>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="flex items-center gap-2 p-2 text-xs bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
            >
              <action.icon size={14} />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </div>
              <p className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatTime(new Date(message.createdAt || Date.now()))}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1 text-sm"
              >
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={enhancedHandleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Digite sua pergunta ou comando..."
              className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  enhancedHandleSubmit(e)
                }
              }}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Upload size={18} />
          </button>
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
            className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}