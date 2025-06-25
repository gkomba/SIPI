import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

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

export async function getSystemData(): Promise<SystemData | null> {
  try {
    const [circuitResponse, ledResponse] = await Promise.all([
      fetch('https://esp-api-10fa5-default-rtdb.firebaseio.com/circuito.json'),
      fetch('https://esp-api-10fa5-default-rtdb.firebaseio.com/led.json')
    ]);

    if (!circuitResponse.ok || !ledResponse.ok) {
      throw new Error('Erro ao acessar dados do sistema');
    }

    const circuito = await circuitResponse.json();
    const led = await ledResponse.json();

    return { circuito, led };
  } catch (error) {
    console.error('Erro ao buscar dados do sistema:', error);
    return null;
  }
}

export async function generateAIResponse(
  message: string,
  systemData: SystemData | null,
  apiKey: string,
  onStream: (chunk: string) => void
): Promise<void> {
  try {
    // Preparar contexto do sistema
    const systemContext = systemData ? `
Dados atuais do sistema de iluminação:
- Circuito: ${JSON.stringify(systemData.circuito, null, 2)}
- LED/Postes: ${JSON.stringify(systemData.led, null, 2)}
` : 'Dados do sistema não disponíveis no momento.';

    const systemPrompt = `Você é Luma, uma assistente de IA especializada em sistemas de iluminação pública inteligente, criada por Gildo Komba.

PERSONALIDADE:
- Profissional mas amigável
- Especialista em engenharia elétrica e sistemas IoT
- Focada em soluções práticas e eficiência energética
- Sempre disposta a ajudar com análises técnicas

CAPACIDADES:
- Analisar dados do sistema de iluminação em tempo real
- Fornecer diagnósticos técnicos precisos
- Sugerir otimizações de eficiência energética
- Explicar conceitos de engenharia elétrica
- Interpretar falhas e problemas do sistema

CONTEXTO ATUAL:
${systemContext}

INSTRUÇÕES:
- Responda sempre em português
- Use emojis apropriados para tornar as respostas mais visuais
- Para análises técnicas, seja detalhada e precisa
- Para cumprimentos, seja calorosa mas profissional
- Sempre mencione que foi criada por Gildo Komba quando perguntado
- Foque em soluções práticas para problemas de iluminação`;

    const result = await streamText({
      model: google('gemini-1.5-flash-latest', {
        apiKey: apiKey
      }),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      maxTokens: 1000
    });

    // Stream da resposta
    for await (const chunk of result.textStream) {
      onStream(chunk);
    }

  } catch (error) {
    console.error('Erro na API do Google:', error);
    
    // Fallback para resposta local se a API falhar
    const fallbackResponse = getFallbackResponse(message, systemData);
    
    // Simular streaming do fallback
    const words = fallbackResponse.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      onStream(chunk);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

function getFallbackResponse(message: string, systemData: SystemData | null): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('olá') || lowerMessage.includes('oi')) {
    return 'Olá! 👋 Sou a Luma, sua assistente de IA especializada em sistemas de iluminação inteligente, criada por Gildo Komba. Como posso ajudá-lo hoje?';
  }
  
  if (lowerMessage.includes('analis') || lowerMessage.includes('sistema')) {
    if (systemData?.circuito) {
      const { saude, status, corrente, potencia, tensao } = systemData.circuito;
      return `📊 **Análise do Sistema:**\n\n${saude === 'OK' ? '✅ Sistema Saudável' : '🚨 Alerta Detectado'}\n\n**Parâmetros:**\n• Status: ${status === 'on' ? 'Ativo' : 'Inativo'}\n• Corrente: ${corrente}A\n• Potência: ${potencia}W\n• Tensão: ${tensao}V`;
    }
    return '📊 Analisando sistema... Dados não disponíveis no momento.';
  }
  
  return 'Como sua assistente especializada em iluminação inteligente, estou aqui para ajudá-lo! Posso analisar o sistema, controlar luzes ou responder questões técnicas. O que precisa?';
}

export function detectCommand(input: string): {
  type: 'toggle_lights' | 'schedule_task' | 'analyze_system' | 'general';
  action?: 'on' | 'off';
  minutes?: number;
  seconds?: number;
} {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('ligar') && (lowerInput.includes('luz') || lowerInput.includes('poste'))) {
    return { type: 'toggle_lights', action: 'on' };
  }
  
  if (lowerInput.includes('desligar') && (lowerInput.includes('luz') || lowerInput.includes('poste'))) {
    return { type: 'toggle_lights', action: 'off' };
  }
  
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
  
  if (lowerInput.includes('analis') || lowerInput.includes('dados') || lowerInput.includes('sistema')) {
    return { type: 'analyze_system' };
  }
  
  return { type: 'general' };
}