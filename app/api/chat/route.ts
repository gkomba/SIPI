import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { tool } from "ai";

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

export const fetchAllSystemData = () => {
  return {
    fetchAllData: tool({
      name: "get_system_data",
      description: "Busca todos os dados do sistema de iluminação inteligente (inclui circuito, LED e status geral)",
      parameters: z.object({}),
      execute: async () => {
        try {
          const response = await fetch(`${baseUrl}/api/system-data`);

          if (!response.ok) {
            throw new Error(`Erro ao consultar /api/system-data: ${response.status}`);
          }

          const data = await response.json();
          return data;
        } catch (error) {
          console.error("Erro na tool get_system_data:", error);
          return {
            error: "Não foi possível buscar os dados do sistema no momento."
          };
        }
      }
    })
  };
};

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

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
- Seja sempre curta e objectiva em perguntas simples.

QUANDO HOUVER INFORMAÇÕES DE STATUS DO SISTEMA (como info, status, saúde ou time):

• Seja clara, concisa e criativa na apresentação
• Destaque falhas, alertas ou anomalias com ícones e blocos visuais
• Use cabeçalhos como: "⚠️ FALHAS DETECTADAS", "✅ SISTEMA ESTÁVEL", "🟡 ALERTA DETECTADO"
• Interprete o campo "info" e destaque zonas afetadas de forma legível
• Converta datas e horas para o formato DD/MM/YYYY às HH:MM
• NÃO apresente os dados como JSON
• NUNCA use markdown, asteriscos ou formatação técnica — apenas texto direto

Exemplo esperado:

⚠️ FALHAS DETECTADAS

🟡 Estado do Sistema: ON  
🕒 Última verificação: 25/06/2025 às 15:26  

📍 Zona com alerta:
• Zona 3

📋 Detalhes:
• Falha(s) encontrada(s) na(s) Zona(s) 3  
• Saúde do sistema: ALERTA

Responda sempre em português e seja útil e eficiente.`

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      tools: {
        ...fetchAllSystemData(),
      },
      toolCallStreaming: true,
      toolChoice: "auto",
      maxSteps: 7,
    })

    return result.toAIStreamResponse()
  } catch (error) {
    console.error('Erro na API de chat:', error)
    return new Response('Erro interno do servidor', { status: 500 })
  }
}
