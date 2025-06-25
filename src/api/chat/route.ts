import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { message, systemData } = await req.json();
    
    // Obter API key do header Authorization
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
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

    // ✅ IMPLEMENTAÇÃO CORRETA: usar result.toAIStreamResponse()
    const result = await streamText({
      model: google('gemini-1.5-flash', { apiKey }),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      maxTokens: 1024
    });

    // 🔥 ESSENCIAL: retornar stream response do AI SDK
    return result.toAIStreamResponse();

  } catch (error: any) {
    console.error('Erro no endpoint de chat:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}