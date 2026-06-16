'use client'

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  FormEvent,
} from 'react'
import {
  Bot,
  Send,
  Upload,
  X,
  Lightbulb,
  Timer,
  Mic,
} from 'lucide-react'

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
  onScheduleTask,
}) => {
  /* ------------------------------ quick actions ----------------------------- */
  const quickActions = [
    {
      label: 'Ligar Luz',
      icon: Lightbulb,
      action: async () => onToggleLight('on'),
    },
    {
      label: 'Desligar Luz',
      icon: Lightbulb,
      action: async () => onToggleLight('off'),
    },
    {
      label: 'Agendar Ligar',
      icon: Timer,
      action: () => onScheduleTask(1, 0, 'on'),
    },
    {
      label: 'Agendar Desligar',
      icon: Timer,
      action: () => onScheduleTask(1, 0, 'off'),
    },
  ]

  /* --------------------------------- state --------------------------------- */
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Sou a Luma, sua assistente Engenheira elétrica, criada por Gildo Komba para ajudá‑lo com análises técnicas, diagnósticos e otimizações.\n\nPosso ajudá‑lo a:\n• Analisar dados do sistema\n• Controlar as luzes\n• Programar tarefas\n• Diagnosticar problemas\n• Configurar ESP32 e sensores\n\nComo posso ajudá‑lo?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isListening, setIsListening] = useState(false)

  /* ------------------------------- references ------------------------------- */
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)

  /* ---------------------------- helpers/utilities --------------------------- */
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(scrollToBottom, [messages])

  /** Função genérica para adicionar mensagem do usuário e obter resposta da IA */
  const submitMessage = useCallback(
    async (messageContent: string) => {
      if (!messageContent.trim() && selectedFiles.length === 0) return

      if (streamingTimeoutRef.current) clearTimeout(streamingTimeoutRef.current)

      /* ----- adiciona mensagem do usuário ----- */
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: messageContent,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, userMessage])
      setInput('')
      setSelectedFiles([])
      setIsLoading(true)

      /* ----- placeholder da IA enquanto “digita” ----- */
      const assistantId = (Date.now() + 1).toString()
      const assistantPlaceholder: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      }
      setMessages(prev => [...prev, assistantPlaceholder])

      /* ----------------------- chamada real à sua API ----------------------- */
      try {
        const response = await fetch('https://api-lsts.onrender.com/prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messageContent }),
        })

        if (!response.ok)
          throw new Error(`HTTP Error: ${response.status.toString()}`)

        const { message: aiResponse = 'Sem resposta da IA' } =
          await response.json()

        /* ------------- animação de “streaming” caractere a caractere ------------- */
        let idx = 0
        const streamNext = () => {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? {
                    ...m,
                    content: aiResponse.slice(0, ++idx),
                    isStreaming: idx < aiResponse.length,
                  }
                : m,
            ),
          )
          if (idx < aiResponse.length) {
            streamingTimeoutRef.current = setTimeout(streamNext, 20)
          }
        }
        streamNext()
      } catch (err) {
        console.error(err)
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: 'Erro ao gerar resposta.', isStreaming: false }
              : m,
          ),
        )
      } finally {
        setIsLoading(false)
      }
    },
    [selectedFiles],
  )

  /* ---------------------------- envio manual (Enter) ---------------------------- */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    submitMessage(input)
  }

  /* ----------------------- reconhecimento de voz (WebSpeech) ---------------------- */
  useEffect(() => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window))
      return

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'pt-BR'

    recognition.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript
      setIsListening(false)
      submitMessage(transcript) // <‑‑ envio imediato após captar voz
    }

    recognition.onerror = (_event: any) => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    return () => recognition.stop()
  }, [submitMessage])

  const toggleListening = () => {
    const rec = recognitionRef.current
    if (!rec) {
      alert('Reconhecimento de voz não suportado neste navegador')
      return
    }
    if (isListening) rec.stop()
    else rec.start()
    setIsListening(!isListening)
  }

  /* ----------------------------- file management ---------------------------- */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const removeFile = (idx: number) =>
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx))

  /* ------------------------------ time display ------------------------------ */
  const formatTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    const now = new Date()
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`
    return isToday
      ? `Hoje às ${timeStr}`
      : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${timeStr}`
  }

  /* -------------------------------------------------------------------------- */
  /*                                  RENDER                                   */
  /* -------------------------------------------------------------------------- */
  if (!isOpen) return null
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-700 flex flex-col z-50">
      {/* ---------------------------- HEADER ---------------------------- */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Luma</h3>
            <p className="text-xs text-white/80">Luma&nbsp;AI</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* ------------------------- QUICK ACTIONS ------------------------ */}
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Ações Rápidas</h4>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex items-center gap-2 p-2 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* --------------------------- MESSAGES --------------------------- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {m.content}
              </p>
              {m.isStreaming && (
                <div className="flex gap-1 mt-2">
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
                  <div
                    className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <div
                    className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
              )}
              <p
                className={`text-xs mt-2 ${
                  m.role === 'user'
                    ? 'text-white/70'
                    : 'text-gray-400'
                }`}
              >
                {formatTime(m.timestamp)}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-4 py-3">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ------------------------- FILE PREVIEW ------------------------- */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-700">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-1 text-sm"
              >
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button
                  onClick={() => removeFile(idx)}
                  className="text-red-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------- INPUT ---------------------------- */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-700 flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digite sua pergunta ou comando..."
          rows={2}
          className="flex-1 resize-none rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-lg ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Mic size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
            className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-500 text-white rounded-lg"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}

/* --------------------------- EXEMPLOS DE USO --------------------------- */
export async function onToggleLight(status: 'on' | 'off') {
  try {
    await fetch('https://api-3caj.onrender.com/controlLigth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    console.log(`Luz ${status === 'on' ? 'ligada' : 'desligada'}`)
  } catch (err) {
    console.error(err)
  }
}

export function onScheduleTask(
  minutes: number,
  seconds: number,
  action: 'on' | 'off',
) {
  fetch('/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minutes, seconds, action }),
  })
    .then(() =>
      console.log(
        `Tarefa agendada: ${action === 'on' ? 'Ligar' : 'Desligar'} em ${minutes}m ${seconds}s`,
      ),
    )
    .catch(err => console.error(err))
}
