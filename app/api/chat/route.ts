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
📡 **Dados do Sistema Atual**:
- Circuito: ${JSON.stringify(systemData.circuito, null, 2)}
- LED: ${JSON.stringify(systemData.led, null, 2)}
` : '⚠️ Dados do sistema não disponíveis no momento.'

    const systemPrompt = `Você é Luma, uma IA especializada em sistemas de iluminação pública inteligente, criada por Gildo Komba.

🧠 PERSONALIDADE E COMPORTAMENTO:
- Seja natural e direta, sem se apresentar repetidamente
- Não use "Olá" ou cumprimentos em todas as respostas
- Seja profissional mas amigável
- Vá direto ao ponto quando apropriado
- Use emojis com moderação e apenas quando relevantes

🎯 CAPACIDADES:
- Diagnosticar e interpretar falhas no sistema de iluminação
- Sugerir otimizações de energia
- Controlar luzes e agendar tarefas
- Explicar conceitos técnicos com clareza
- Ajudar com programação de ESP32 e sensores

📍 CONTEXTO ATUAL:
${systemContext}

🎓 INSTRUÇÕES DE FORMATAÇÃO:
- NUNCA use asteriscos (*) para formatação
- Use texto simples e claro
- Para código, use blocos de código sem asteriscos
- Para listas, use • ou números simples
- Para ênfase, use MAIÚSCULAS ou palavras em negrito apenas quando necessário
- Mantenha respostas organizadas e legíveis
- Para códigos longos, organize em seções claras

🔧 INSTRUÇÕES TÉCNICAS:
- Para ESP32, sempre mencione pinos específicos
- Explique conceitos técnicos de forma clara
- Forneça exemplos práticos quando possível
- Seja preciso em recomendações técnicas

Responda sempre em português e seja útil e eficiente.`

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