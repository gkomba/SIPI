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

// Sistema de IA local inteligente
export async function generateAIResponse(
  message: string,
  systemData?: SystemData | null,
  onStream?: (chunk: string) => void
): Promise<string> {
  const lowerMessage = message.toLowerCase();
  
  // Simular streaming se callback fornecido
  const streamResponse = async (response: string) => {
    if (onStream) {
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        onStream(chunk);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simular delay de streaming
      }
    }
    return response;
  };

  // Respostas para cumprimentos
  if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('ola')) {
    return streamResponse('Olá! 👋 Sou a Luma, sua assistente especializada em sistemas de iluminação inteligente criada por Gildo Komba. Como posso ajudá-lo hoje? Posso analisar dados do sistema, controlar as luzes ou programar tarefas.');
  }
  
  if (lowerMessage.includes('bom dia')) {
    return streamResponse('Bom dia! ☀️ Espero que esteja tendo um ótimo dia! Sou a Luma e estou aqui para ajudá-lo com o sistema de iluminação. O que precisa hoje?');
  }
  
  if (lowerMessage.includes('boa tarde')) {
    return streamResponse('Boa tarde! 🌤️ Sou a Luma, sua assistente de IA para sistemas de iluminação. Como posso ajudá-lo esta tarde?');
  }
  
  if (lowerMessage.includes('boa noite')) {
    return streamResponse('Boa noite! 🌙 Sou a Luma e estou aqui para ajudá-lo com o sistema de iluminação. O que precisa hoje?');
  }

  // Análise de sistema
  if (lowerMessage.includes('analis') || lowerMessage.includes('dados') || lowerMessage.includes('sistema')) {
    if (systemData?.circuito) {
      const { corrente, potencia, tensao, saude, status, info } = systemData.circuito;
      
      let analysis = '📊 **Análise do Sistema:**\n\n';
      
      if (saude === 'OK') {
        analysis += '✅ **Sistema Saudável** - Nenhuma falha detectada\n\n';
      } else if (saude === 'ALERT') {
        analysis += '🚨 **Alerta no Sistema** - Falhas detectadas\n\n';
      } else if (saude === 'WARNING') {
        analysis += '⚠️ **Atenção** - Sistema requer monitoramento\n\n';
      }
      
      analysis += '**Parâmetros Elétricos:**\n';
      if (corrente) analysis += `• Corrente: ${corrente}A\n`;
      if (potencia) analysis += `• Potência: ${potencia}W\n`;
      if (tensao) analysis += `• Tensão: ${tensao}V\n`;
      
      analysis += `• Status: ${status === 'on' ? 'Ativo' : 'Inativo'}\n\n`;
      
      if (info && info.includes('Falha')) {
        analysis += `**Diagnóstico:** ${info}\n\n`;
        analysis += '**Recomendações:**\n';
        analysis += '• Verificar conexões dos postes afetados\n';
        analysis += '• Inspecionar sensores de zona\n';
        analysis += '• Considerar manutenção preventiva\n';
      } else {
        analysis += '**Status:** Todos os sistemas operando normalmente.\n';
        analysis += '**Recomendação:** Manter monitoramento regular.';
      }
      
      return streamResponse(analysis);
    } else {
      return streamResponse('📊 Analisando sistema... Não foi possível acessar os dados no momento. Verifique a conectividade e tente novamente.');
    }
  }

  // Controle de luzes
  if (lowerMessage.includes('ligar') && (lowerMessage.includes('luz') || lowerMessage.includes('poste'))) {
    return streamResponse('💡 Comando executado! As luzes dos postes foram ligadas com sucesso. O sistema está agora em modo ativo.');
  }
  
  if (lowerMessage.includes('desligar') && (lowerMessage.includes('luz') || lowerMessage.includes('poste'))) {
    return streamResponse('🔌 Comando executado! As luzes dos postes foram desligadas. O sistema está agora em modo inativo.');
  }

  // Programação de tarefas
  if (lowerMessage.includes('programar') || lowerMessage.includes('agendar') || lowerMessage.includes('temporizador')) {
    return streamResponse('⏰ Tarefa programada com sucesso! O sistema executará a ação no tempo especificado. Você pode acompanhar o progresso no painel de temporizador.');
  }

  // Perguntas sobre resistores e componentes elétricos
  if (lowerMessage.includes('resistor')) {
    return streamResponse('🔧 **Resistor** é um componente eletrônico que limita a corrente elétrica em um circuito. Em sistemas de iluminação, são usados para:\n\n• Controlar a intensidade luminosa\n• Proteger LEDs contra sobrecorrente\n• Dividir tensão em circuitos de controle\n\nA resistência é medida em Ohms (Ω) e segue a Lei de Ohm: V = I × R');
  }

  // Perguntas sobre o criador
  if (lowerMessage.includes('gildo') || lowerMessage.includes('criador') || lowerMessage.includes('quem te criou')) {
    return streamResponse('👨‍💻 Fui criada por **Gildo Komba**, estudante de Engenharia Elétrica e Engenharia de Software. Ele é apaixonado por tecnologia e busca sempre resolver problemas através da inovação.\n\nGildo é contribuidor ativo nas comunidades de desenvolvimento em Angola e na 42 Network. Você pode conhecer mais sobre seu trabalho em: github.com/gkomba');
  }

  // Perguntas sobre capacidades
  if (lowerMessage.includes('o que você pode') || lowerMessage.includes('suas funções') || lowerMessage.includes('como pode ajudar')) {
    return streamResponse('🤖 **Minhas Capacidades:**\n\n• **Análise Técnica:** Interpreto dados do sistema de iluminação\n• **Controle Remoto:** Ligo/desligo luzes dos postes\n• **Programação:** Crio tarefas temporizadas\n• **Diagnóstico:** Identifico falhas e sugiro soluções\n• **Consultoria:** Respondo questões sobre engenharia elétrica\n\nSou especializada em sistemas IoT, automação industrial e aplicação de IA em sistemas elétricos!');
  }

  // Perguntas sobre eficiência energética
  if (lowerMessage.includes('eficiência') || lowerMessage.includes('economia') || lowerMessage.includes('energia')) {
    return streamResponse('⚡ **Eficiência Energética:**\n\n• **LEDs** consomem até 80% menos energia que lâmpadas convencionais\n• **Sensores** permitem acionamento inteligente baseado em movimento\n• **Temporizadores** otimizam horários de funcionamento\n• **Monitoramento** identifica desperdícios em tempo real\n\n**Dica:** Use programação automática para máxima economia!');
  }

  // Resposta padrão inteligente
  const responses = [
    'Entendo sua pergunta! Como engenheira elétrica especializada em iluminação inteligente, posso ajudá-lo com análises técnicas, controle de dispositivos e otimização do sistema. Pode ser mais específico sobre o que precisa?',
    'Interessante! Estou aqui para ajudá-lo com o sistema de iluminação. Posso analisar dados, controlar luzes, programar tarefas ou responder questões técnicas. O que gostaria de fazer?',
    'Como sua assistente especializada em sistemas elétricos, posso ajudá-lo de várias formas. Quer que eu analise o sistema atual, controle as luzes ou programe alguma tarefa específica?'
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  return streamResponse(randomResponse);
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
  
  return { type: 'general' };
}