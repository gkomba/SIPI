'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, Upload, X, Lightbulb, Timer, Database, Zap, Key, AlertCircle } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

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
// Define quickActions array
const quickActions = [
  {
    label: 'Ligar Luz',
    icon: Lightbulb,
    action: async () => {
      await onToggleLight('on')
    }
  },
  {
    label: 'Desligar Luz',
    icon: Lightbulb,
    action: async () => {
      await onToggleLight('off')
    }
  },
  {
    label: 'Agendar Ligar',
    icon: Timer,
    action: () => {
      // Exemplo: agenda para ligar em 1 minuto
      onScheduleTask(1, 0, 'on')
    }
  },
  {
    label: 'Agendar Desligar',
    icon: Timer,
    action: () => {
      // Exemplo: agenda para desligar em 1 minuto
      onScheduleTask(1, 0, 'off')
    }
  }
]


  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Sou a Luma, sua assistente Engenheira eletrica. Criada por Gildo Komba para ajudá-lo com análises técnicas, diagnósticos e otimizações.\n\nPosso ajudá-lo a:\n• Analisar dados do sistema\n• Controlar as luzes\n• Programar tarefas\n• Diagnosticar problemas\n• Configurar ESP32 e sensores\n\nComo posso ajudá-lo?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKeyError, setApiKeyError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() && selectedFiles.length === 0) return

    if (!apiKey) {
      setShowApiKeyInput(true)
      return
    }

    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setSelectedFiles([])
    setIsLoading(true)

    const assistantMessageId = (Date.now() + 1).toString()
    // Função para limpar e formatar a resposta da IA
    function formatAIResponse(text: string): string {
      // Remove asteriscos, marcadores de lista e excesso de espaços
      let cleaned = text
      .replace(/[*•\-]+/g, '') // Remove asteriscos, bullets e traços
      .replace(/^\s*[\d]+\.\s*/gm, '') // Remove listas numeradas
      .replace(/`{1,3}([\s\S]*?)`{1,3}/g, '$1') // Remove backticks de blocos de código
      .replace(/\n{3,}/g, '\n\n') // Limita múltiplas quebras de linha
      .replace(/[ ]{2,}/g, ' ') // Remove espaços duplos
      .trim()

      // Tenta formatar JSON se for detectado
      try {
      if (
        (cleaned.startsWith('{') && cleaned.endsWith('}')) ||
        (cleaned.startsWith('[') && cleaned.endsWith(']'))
      ) {
        const parsed = JSON.parse(cleaned)
        cleaned = JSON.stringify(parsed, null, 2)
      }
      } catch {
      // Não é JSON válido, ignora
      }

      // Formata títulos Markdown (#, ##, ###) para negrito simples
      cleaned = cleaned.replace(/^#{1,6}\s*(.*)$/gm, (_, title) => `**${title.trim()}**`)

      return cleaned
    }

    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch(`https://api-lsts.onrender.com/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentInput,
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }

      const result = await response.json()
      const aiResponse = result.message || 'Sem resposta da IA'

      simulateTextStreaming(aiResponse, assistantMessageId)

    } catch (error) {
      console.error('Erro ao processar mensagem:', error)

      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: 'Erro ao gerar resposta.', isStreaming: false }
          : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const simulateTextStreaming = (text: string, messageId: string, initialContent: string = '') => {
    let currentIndex = 0
    let displayedContent = initialContent

    const streamNextChar = () => {
      if (currentIndex < text.length) {
        displayedContent += text[currentIndex]
        currentIndex++

        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: displayedContent, isStreaming: true }
            : msg
        ))

        streamingTimeoutRef.current = setTimeout(streamNextChar, 20)
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: displayedContent, isStreaming: false }
            : msg
        ))
      }
    }

    streamNextChar()
  }

  // Handle API Key submit
  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      setApiKeyError('A API key não pode estar vazia.')
      return
    }
    try {
      localStorage.setItem('gemini_api_key', apiKey)
      setShowApiKeyInput(false)
      setApiKeyError('')
    } catch (error) {
      setApiKeyError('Erro ao salvar a API key.')
    }
  }

  
  
  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files
    if (!files) return
    const fileArray = Array.from(files)
    setSelectedFiles(prev => [...prev, ...fileArray])
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  function removeFile(index: number): void {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }
  function formatTime(timestamp: Date): React.ReactNode {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    const pad = (n: number) => n.toString().padStart(2, '0')
    const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`

    if (isToday) {
      return `Hoje às ${timeStr}`
    } else {
      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${timeStr}`
    }
  }
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
              Luma AI
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
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              {message.isStreaming && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
              <p className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatTime(message.timestamp)}
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
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta ou comando..."
              className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
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
// Função de exemplo para onToggleLight, pode ser substituída por lógica real
async function onToggleLight(status: 'on' | 'off'): Promise<void> {
  // Aqui você pode integrar com seu sistema de automação real
  // Por exemplo, enviar uma requisição para um endpoint que controla a luz
  try {
    await fetch(`https://api-lsts.onrender.com/controlLigth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    // Opcional: mostrar feedback ao usuário
    console.log(`Luz ${status === 'on' ? 'ligada' : 'desligada'}`)
  } catch (error) {
    console.error('Erro ao alternar luz:', error)
  }
}
function onScheduleTask(minutes: number, seconds: number, action: 'on' | 'off') {
  // Exemplo: Integração com sistema de automação para agendar tarefa
  // Aqui você pode substituir por lógica real, como chamada de API ou manipulação de estado
  fetch('/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      minutes,
      seconds,
      action,
    }),
  })
    .then(() => {
      console.log(
        `Tarefa agendada: ${action === 'on' ? 'Ligar' : 'Desligar'} em ${minutes}m ${seconds}s`
      )
    })
    .catch((error) => {
      console.error('Erro ao agendar tarefa:', error)
    })
}