import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';

const model = google('gemini-1.5-flash');

const SYSTEM_PROMPT = `O seu nome é Luma. Você foi treinada por Gildo Komba. Atua como uma engenheira elétrica especializada em sistemas de iluminação inteligente, IoT, automação industrial e aplicação de IA em sistemas elétricos.

Analise e explique dados sempre com base no contexto fornecido.
Seja curta, objetiva e precisa nas respostas.
Use a criatividade sempre que necessário para sugerir soluções inovadoras.
Mencione seu criador, Gildo Komba, quando apropriado ou solicitado.
Nunca apague ou modifique dados existentes na base de dados.
Sugira sempre a opção mais viável, segura e eficiente ao explicar ou propor algo.
Mantenha um tom amigável, profissional e colaborativo

Sobre o Criador – Gildo Komba
Gildo Komba é estudante de Engenharia Elétrica e Engenharia de Software. Apaixonado por tecnologia desde cedo, é um eterno buscador de conhecimento.
Quando não está a programar ou a desenvolver sistemas elétricos/eletrônicos, está a pensar em novas ideias para resolver problemas no seu país.

É um contribuidor ativo nas comunidades de desenvolvimento em Angola e na 42 Network, e já participou em projetos reais com impacto direto.
Perfil GitHub: github.com/gkomba

IMPORTANTE: Responda a TODAS as mensagens do usuário, incluindo cumprimentos simples como "olá", "oi", "bom dia", etc. Seja sempre amigável e receptiva.

Para cumprimentos e conversas casuais, responda de forma natural e amigável, mas sempre mencione que você pode ajudar com o sistema de iluminação.

Você tem acesso às seguintes ferramentas:
- analiseFromDataBase: Para analisar dados do sistema de iluminação
- toggleLights: Para ligar/desligar as luzes
- scheduleTask: Para programar tarefas

Responda sempre em português e mantenha o foco em sistemas de iluminação inteligente quando relevante.`;

export interface SystemData {
  circuito?: {
    corrente?: number;
    potencia?: number;
    tensao?: number;
    time?: string;
    status?: 'on' | 'off';
    info?: string;
    saude?: 'OK' | 'ALERT' | 'WARNING';
  };
  led?: {
    status: 'on' | 'off';
    type: string;
  };
}

export async function analyzeSystemData(): Promise<SystemData | null> {
  try {
    const response = await fetch('https://esp-api-10fa5-default-rtdb.firebaseio.com/sistema.json');
    if (!response.ok) {
      throw new Error('Erro ao acessar a base de dados');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar dados do sistema:', error);
    return null;
  }
}

export async function generateAIResponse(
  message: string,
  systemData?: SystemData | null,
  onStream?: (chunk: string) => void
) {
  try {
    let contextMessage = message;
    
    if (systemData) {
      contextMessage += `\n\nDados atuais do sistema:\n${JSON.stringify(systemData, null, 2)}`;
    }

    if (onStream) {
      // Streaming response
      const result = await streamText({
        model,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: contextMessage,
          },
        ],
        temperature: 0.7,
        maxTokens: 500,
      });

      let fullResponse = '';
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        onStream(chunk);
      }
      
      return fullResponse;
    } else {
      // Non-streaming response
      const result = await generateText({
        model,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: contextMessage,
          },
        ],
        temperature: 0.7,
        maxTokens: 500,
      });

      return result.text;
    }
  } catch (error) {
    console.error('Erro na API do Google:', error);
    
    // Fallback responses para diferentes tipos de mensagem
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('ola')) {
      return 'Olá! 👋 Sou a Luma, sua assistente especializada em sistemas de iluminação inteligente. Como posso ajudá-lo hoje? Posso analisar dados do sistema, controlar as luzes ou programar tarefas.';
    }
    
    if (lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde') || lowerMessage.includes('boa noite')) {
      return 'Olá! Espero que esteja tendo um ótimo dia! 😊 Sou a Luma e estou aqui para ajudá-lo com o sistema de iluminação. O que precisa hoje?';
    }
    
    return 'Desculpe, estou com dificuldades para me conectar ao servidor no momento. Mas posso ajudá-lo com comandos básicos do sistema de iluminação. Tente novamente em alguns instantes.';
  }
}

export function detectCommand(input: string): {
  type: 'toggle_lights' | 'schedule_task' | 'analyze_system' | 'general';
  action?: 'on' | 'off';
  minutes?: number;
  seconds?: number;
} {
  const lowerInput = input.toLowerCase();
  
  // Detectar comando de ligar/desligar luzes
  if (lowerInput.includes('ligar') && (lowerInput.includes('luz') || lowerInput.includes('poste'))) {
    return { type: 'toggle_lights', action: 'on' };
  }
  
  if (lowerInput.includes('desligar') && (lowerInput.includes('luz') || lowerInput.includes('poste'))) {
    return { type: 'toggle_lights', action: 'off' };
  }
  
  // Detectar comando de programar tarefa
  const timeMatch = lowerInput.match(/(\d+)\s*(minuto|segundo)/g);
  if ((lowerInput.includes('programar') || lowerInput.includes('agendar')) && timeMatch) {
    let minutes = 0;
    let seconds = 0;
    
    timeMatch.forEach(match => {
      const num = parseInt(match.match(/\d+/)?.[0] || '0');
      if (match.includes('minuto')) minutes = num;
      if (match.includes('segundo')) seconds = num;
    });
    
    const action = lowerInput.includes('ligar') ? 'on' : 'off';
    return { type: 'schedule_task', action, minutes, seconds };
  }
  
  // Detectar comando de análise
  if (lowerInput.includes('analis') || lowerInput.includes('dados') || lowerInput.includes('sistema') || 
      lowerInput.includes('consumo') || lowerInput.includes('falha') || lowerInput.includes('status')) {
    return { type: 'analyze_system' };
  }
  
  // Para qualquer outra mensagem (incluindo cumprimentos), usar resposta geral da IA
  return { type: 'general' };
}