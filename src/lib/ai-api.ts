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
    console.error('⚠️ Erro ao buscar dados do sistema:', error);
    return null;
  }
}

// ✅ FUNÇÃO CORRIGIDA: Agora usa fetch para endpoint API que retorna stream real
export async function generateAIResponse(
  message: string,
  systemData: SystemData | null,
  apiKey: string,
  onStream: (chunk: string) => void
): Promise<void> {
  try {
    // ✅ Fazer requisição para endpoint API que usa result.toAIStreamResponse()
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // Passar API key no header
      },
      body: JSON.stringify({
        message,
        systemData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    // ✅ Processar stream real do endpoint
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available');
    }

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      
      // Processar chunks do AI SDK (formato específico)
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('0:')) {
          try {
            const data = JSON.parse(line.slice(2));
            if (data.type === 'text-delta' && data.textDelta) {
              onStream(data.textDelta);
            }
          } catch (e) {
            // Ignorar linhas malformadas
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro na IA real:', error);

    // Fallback para resposta simulada
    const fallbackResponse = getFallbackResponse(message, systemData);
    const words = fallbackResponse.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      onStream(chunk);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
  }
}

function getFallbackResponse(message: string, systemData: SystemData | null): string {
  const lower = message.toLowerCase();

  if (lower.includes('olá') || lower.includes('oi')) {
    return 'Olá! 👋 Sou a Luma, assistente de IA criada por Gildo Komba. Posso analisar o sistema, controlar luzes ou explicar detalhes técnicos. Em que posso ajudar?';
  }

  if (lower.includes('analis') || lower.includes('sistema')) {
    if (systemData?.circuito) {
      const { saude, status, corrente, potencia, tensao } = systemData.circuito;
      return `📊 Análise Rápida:\n• Saúde: ${saude}\n• Status: ${status}\n• Corrente: ${corrente}A\n• Potência: ${potencia}W\n• Tensão: ${tensao}V`;
    }
    return '🔍 Analisando... mas não consegui acessar os dados do sistema agora.';
  }

  return 'Sou a Luma, criada por Gildo Komba para apoiar na gestão de iluminação inteligente. Posso fazer análises técnicas, sugerir melhorias e interagir com o sistema. O que deseja saber ou controlar?';
}

export function detectCommand(input: string): {
  type: 'toggle_lights' | 'schedule_task' | 'analyze_system' | 'general';
  action?: 'on' | 'off';
  minutes?: number;
  seconds?: number;
} {
  const lower = input.toLowerCase();

  if (lower.includes('ligar') && (lower.includes('luz') || lower.includes('poste'))) {
    return { type: 'toggle_lights', action: 'on' };
  }

  if (lower.includes('desligar') && (lower.includes('luz') || lower.includes('poste'))) {
    return { type: 'toggle_lights', action: 'off' };
  }

  const match = lower.match(/(\d+)\s*(minuto|min|segundo|seg)/g);
  if ((lower.includes('programar') || lower.includes('agendar')) && match) {
    let minutes = 0;
    let seconds = 0;

    match.forEach(item => {
      const num = parseInt(item.match(/\d+/)?.[0] || '0');
      if (item.includes('min')) minutes = num;
      if (item.includes('seg')) seconds = num;
    });

    const action = lower.includes('ligar') ? 'on' : 'off';
    return { type: 'schedule_task', action, minutes, seconds };
  }

  if (lower.includes('analis') || lower.includes('dados') || lower.includes('sistema')) {
    return { type: 'analyze_system' };
  }

  return { type: 'general' };
}