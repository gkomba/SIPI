import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

interface SystemData {
  circuito?: {
    corrente?: number
    potencia?: number
    tensao?: number
    time?: string
    status?: 'on' | 'off'
    info?: string
    saude?: 'OK' | 'ALERT' | 'WARNING'
  }
  led?: {
    status: 'on' | 'off'
    type: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, systemData, apiKey } = await req.json()

    if (!apiKey) {
      return new Response('API key is required', { status: 400 })
    }

    const systemContext = systemData ? `
📡 **Dados do Sistema**:
- Circuito: ${JSON.stringify(systemData.circuito, null, 2)}
- LED: ${JSON.stringify(systemData.led, null, 2)}
` : '⚠️ Dados do sistema não disponíveis no momento.'

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
- Seja detalhada em análises técnicas`

    const result = await streamText({
      model: google('gemini-1.5-flash', { apiKey }),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      maxTokens: 1024
    })

    return result.toAIStreamResponse()
  } catch (error) {
    console.error('Erro na API de chat:', error)
    return new Response('Erro interno do servidor', { status: 500 })
  }
}