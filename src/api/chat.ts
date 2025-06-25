import { google } from '@ai-sdk/google';
import { generateText, streamText, tool } from 'ai';
import { z } from 'zod';

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
Perfil GitHub: github.com/gkomba`;

const model = google('gemini-1.5-flash');

export async function POST(request: Request) {
  try {
    const { messages, data } = await request.json();

    const result = await streamText({
      model,
      system: SYSTEM_PROMPT,
      messages,
      tools: {
        analiseFromDataBase: tool({
          description: 'Analisa dados do sistema de iluminação da base de dados para fornecer insights sobre consumo de energia, falhas e estado geral',
          parameters: z.object({
            query: z.string().describe('Tipo de análise solicitada (consumo, falhas, estado, geral)')
          }),
          execute: async ({ query }) => {
            try {
              const response = await fetch('https://esp-api-10fa5-default-rtdb.firebaseio.com/sistema.json');
              if (!response.ok) {
                throw new Error('Erro ao acessar a base de dados');
              }
              const systemData = await response.json();
              
              return {
                success: true,
                data: systemData,
                query,
                timestamp: new Date().toISOString()
              };
            } catch (error) {
              return {
                success: false,
                error: 'Não foi possível acessar os dados do sistema',
                query
              };
            }
          }
        })
      },
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Erro interno do servidor', { status: 500 });
  }
}