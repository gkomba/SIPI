import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Upload, X, Lightbulb, Timer, Database, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface LumaAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleLight: (status: 'on' | 'off') => Promise<void>;
  onScheduleTask: (minutes: number, seconds: number, action: 'on' | 'off') => void;
}

export const LumaAssistant: React.FC<LumaAssistantProps> = ({ 
  isOpen, 
  onClose, 
  onToggleLight, 
  onScheduleTask 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Eu sou a Luma, sua assistente de IA especializada em sistemas de iluminação inteligente. Fui criada por Gildo Komba para ajudá-lo com análises técnicas, diagnósticos e sugestões de otimização.\n\nPosso ajudá-lo a:\n• Analisar dados do sistema\n• Controlar as luzes\n• Programar tarefas\n• Diagnosticar problemas\n\nComo posso ajudá-lo hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const analyzeSystemData = async () => {
    try {
      const response = await fetch('https://esp-api-10fa5-default-rtdb.firebaseio.com/sistema.json');
      if (!response.ok) {
        throw new Error('Erro ao acessar a base de dados');
      }
      const systemData = await response.json();
      return systemData;
    } catch (error) {
      return null;
    }
  };

  const processCommand = async (userInput: string): Promise<string> => {
    const input = userInput.toLowerCase();
    
    // Comando para ligar luzes
    if (input.includes('ligar') && (input.includes('luz') || input.includes('poste'))) {
      try {
        await onToggleLight('on');
        return 'Luzes ligadas com sucesso! ✅';
      } catch (error) {
        return 'Erro ao ligar as luzes. Verifique a conexão com o sistema.';
      }
    }
    
    // Comando para desligar luzes
    if (input.includes('desligar') && (input.includes('luz') || input.includes('poste'))) {
      try {
        await onToggleLight('off');
        return 'Luzes desligadas com sucesso! ✅';
      } catch (error) {
        return 'Erro ao desligar as luzes. Verifique a conexão com o sistema.';
      }
    }
    
    // Comando para programar tarefa
    const timeMatch = input.match(/(\d+)\s*(minuto|segundo)/g);
    if ((input.includes('programar') || input.includes('agendar')) && timeMatch) {
      let minutes = 0;
      let seconds = 0;
      
      timeMatch.forEach(match => {
        const num = parseInt(match.match(/\d+/)?.[0] || '0');
        if (match.includes('minuto')) minutes = num;
        if (match.includes('segundo')) seconds = num;
      });
      
      const action = input.includes('ligar') ? 'on' : 'off';
      onScheduleTask(minutes, seconds, action);
      
      return `Tarefa programada: ${action === 'on' ? 'Ligar' : 'Desligar'} luzes em ${minutes}m${seconds}s ⏰`;
    }
    
    // Comando para análise de dados
    if (input.includes('analis') || input.includes('dados') || input.includes('sistema') || input.includes('consumo') || input.includes('falha')) {
      const systemData = await analyzeSystemData();
      
      if (!systemData) {
        return 'Não foi possível acessar os dados do sistema no momento. Verifique a conexão.';
      }
      
      let analysis = '📊 **Análise do Sistema:**\n\n';
      
      if (systemData.circuito) {
        analysis += `🔌 **Circuito:**\n`;
        analysis += `• Tensão: ${systemData.circuito.tensao || 'N/A'}V\n`;
        analysis += `• Corrente: ${systemData.circuito.corrente || 'N/A'}A\n`;
        analysis += `• Potência: ${systemData.circuito.potencia || 'N/A'}W\n`;
        analysis += `• Status: ${systemData.circuito.status === 'on' ? '✅ Ativo' : '❌ Inativo'}\n\n`;
      }
      
      if (systemData.led) {
        analysis += `💡 **Iluminação:**\n`;
        analysis += `• Status: ${systemData.led.status === 'on' ? '✅ Ligado' : '❌ Desligado'}\n`;
        analysis += `• Tipo: ${systemData.led.type || 'N/A'}\n\n`;
      }
      
      // Análise de falhas
      if (systemData.circuito?.info && systemData.circuito.info.includes('Falha')) {
        analysis += `⚠️ **Alertas Detectados:**\n`;
        analysis += `• ${systemData.circuito.info}\n\n`;
        analysis += `**Recomendações:**\n`;
        analysis += `• Verificar conexões dos postes afetados\n`;
        analysis += `• Inspecionar componentes elétricos\n`;
        analysis += `• Considerar manutenção preventiva\n`;
      } else {
        analysis += `✅ **Sistema Saudável** - Nenhuma falha detectada\n`;
      }
      
      return analysis;
    }
    
    // Resposta padrão da IA
    return generateAIResponse(userInput);
  };

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      'Como engenheira elétrica, posso ajudá-lo com análises técnicas do sistema. Use comandos como "analisar sistema", "ligar luzes" ou "programar tarefa".',
      'Baseado na minha experiência em IoT e automação, recomendo verificar os dados do sistema regularmente. Posso fazer isso para você!',
      'Gildo Komba me treinou para ser precisa e objetiva. Que tipo de análise ou controle você precisa?',
      'Para otimizar o sistema de iluminação, posso analisar padrões de consumo e sugerir melhorias. Quer que eu verifique os dados atuais?'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() && selectedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedFiles([]);
    setIsLoading(true);

    try {
      const response = await processCommand(input);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Luma</h3>
            <p className="text-xs text-white/80">Assistente de IA • Por Gildo Komba</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          <X size={18} />
        </button>
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
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                  e.preventDefault();
                  handleSubmit(e);
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
  );
};