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

// ✅ IMPLEMENTAÇÃO CORRIGIDA PARA VITE: Usar AI SDK diretamente no frontend
export async function generateAIResponse(
  message: string,
  systemData: SystemData | null,
  apiKey: string,
  onStream: (chunk: string) => void
): Promise<void> {
  try {
    if (!apiKey || !apiKey.startsWith('AIza')) {
      throw new Error('API key inválida');
    }

    const systemContext = systemData ? `
📡 **Dados do Sistema**:
- Circuito: ${JSON.stringify(systemData.circuito, null, 2)}
- LED: ${JSON.stringify(systemData.led, null, 2)}
` : '⚠️ Dados do sistema não disponíveis no momento.';

    const systemPrompt = `Você é Luma, uma IA especializada em sistemas de iluminação pública inteligente, criada por Gildo Komba.

🧠 PERSONALIDADE:
- Profissional e amigável
- Especialista em engenharia elétrica, IoT e IA aplicada
- Direta, mas criativa quando necessário

🎯 CAPACIDADES:
- Diagnosticar e interpretar falhas no sistema de iluminação
- Sugerir otimizações de energia
- Controlar luzes e agendar tarefas
- Explicar conceitos técnicos com clareza

📍 CONTEXTO:
${systemContext}

🎓 INSTRUÇÕES:
- Responda sempre em português
- Use emojis relevantes para clareza
- Seja detalhada em análises técnicas`;

    // ✅ Usar AI SDK diretamente no frontend (funciona no Vite)
    const result = await streamText({
      model: google('gemini-1.5-flash', { apiKey }),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      maxTokens: 1024
    });

    // ✅ Processar stream diretamente
    for await (const chunk of result.textStream) {
      onStream(chunk);
    }

  } catch (error: any) {
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
      return `📊 **Análise do Sistema:**

🔋 **Status Geral:** ${saude === 'OK' ? '✅ Saudável' : '⚠️ Atenção necessária'}
⚡ **Estado:** ${status === 'on' ? '🟢 Ativo' : '🔴 Inativo'}

📈 **Parâmetros Elétricos:**
• Corrente: ${corrente}A
• Potência: ${potencia}W  
• Tensão: ${tensao}V

💡 **Recomendações:**
${saude === 'OK' ? 
  '• Sistema funcionando dentro dos parâmetros normais\n• Monitoramento contínuo ativo' : 
  '• Verificar possíveis falhas nos postes\n• Investigar anomalias detectadas'
}`;
    }
    return '🔍 Analisando... mas não consegui acessar os dados do sistema agora. Verifique a conexão com o Firebase.';
  }

  if (lower.includes('ligar') || lower.includes('desligar')) {
    return '💡 Comando de controle detectado! Use os botões de controle manual ou me diga exatamente o que deseja fazer com as luzes.';
  }

  if (lower.includes('programar') || lower.includes('agendar')) {
    return '⏰ Para programar tarefas, especifique:\n• Ação: ligar ou desligar\n• Tempo: em minutos e/ou segundos\n\nExemplo: "Programar para ligar as luzes em 5 minutos"';
  }

  return `🤖 Sou a Luma, criada por Gildo Komba para apoiar na gestão de iluminação inteligente. 

🎯 **Posso ajudar com:**
• Análise técnica do sistema
• Diagnóstico de falhas
• Sugestões de otimização
• Controle de dispositivos
• Programação de tarefas

💬 **Como posso ajudá-lo hoje?**`;
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