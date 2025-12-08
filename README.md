# 🌟 SIPI - Sistema de Iluminação Pública Inteligente

Sistema de monitoramento e controle em tempo real de iluminação pública, desenvolvido com Next.js, TypeScript e integração com ESP32 via Firebase Realtime Database.

![Next.js](https://img.shields.io/badge/Next.js-13.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Configuração](#️-configuração)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Desenvolvimento](#-desenvolvimento)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## 🎯 Visão Geral

O SIPI é uma solução completa para gestão inteligente de iluminação pública que integra:

- **Dashboard em tempo real** para monitoramento de circuitos elétricos
- **Controle remoto** de postes de iluminação via ESP32
- **Sistema de alertas** automático por email
- **Assistente virtual (Luma)** com IA generativa (Google Gemini)
- **Agendamento de tarefas** para automação
- **Detecção de falhas** e diagnóstico automático

## ✨ Funcionalidades

### 🔌 Monitoramento de Circuito
- Leitura em tempo real de:
  - **Tensão** (V)
  - **Corrente** (A)
  - **Potência** (W)
- Status de saúde do sistema (OK, ALERT, WARNING)
- Identificação de zonas com falhas
- Histórico de última atualização

### 💡 Controle de Iluminação
- Ligar/desligar postes remotamente
- Status individual de cada poste
- Visualização do tipo de LED instalado
- Controle via interface web ou comandos de voz

### ⏰ Temporizador & Automação
- Agendamento de tarefas (ligar/desligar)
- Configuração de minutos e segundos
- Fila de tarefas programadas
- Execução automática em segundo plano

### 🤖 Assistente Virtual Luma
- IA especializada em sistemas elétricos
- Comandos por texto ou voz
- Geracao de Relatorios
- Ações rápidas (quick actions):
  - Ligar/desligar luzes
  - Agendar tarefas
  - Diagnóstico de problemas
- Upload de arquivos para análise
- Streaming de respostas em tempo real
- Integração com Google Gemini 1.5 Flash

### 📧 Sistema de Alertas
- Envio automático de emails via Nodemailer
- Notificações de falhas detectadas
- Template HTML personalizado
- Identificação de zonas afetadas

### 🎨 Interface
- Design responsivo (mobile-first)
- Tema claro/escuro
- Animações suaves
- Ícones Lucide React
- Estilização com TailwindCSS

## 🛠 Tecnologias

### Frontend
- **Next.js 13.5** - Framework React com SSR e App Router
- **React 18.3** - Biblioteca para interfaces
- **TypeScript 5.0** - Tipagem estática
- **TailwindCSS 3.4** - Estilização utility-first
- **Lucide React** - Biblioteca de ícones

### Backend / APIs
- **Next.js API Routes** - Endpoints serverless
- **Firebase Realtime Database** - Banco de dados em tempo real
- **Nodemailer** - Envio de emails
- **Google AI SDK** - Integração com Gemini
- **Vercel AI SDK** - Streaming de respostas IA

### IoT / Hardware
- **ESP32** - Microcontrolador para controle de postes
- **Sensores de corrente/tensão** - Monitoramento elétrico
- **Firebase** - Comunicação IoT-Cloud

### DevOps
- **Edge Runtime** - Execução otimizada na edge
- **PostCSS** - Processamento de CSS
- **ESLint** - Linting de código

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    SIPI Dashboard (Next.js)             │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Dashboard │  │  Luma AI │  │  Email Service   │    │
│  └─────┬─────┘  └────┬─────┘  └────────┬─────────┘    │
│        │             │                  │               │
└────────┼─────────────┼──────────────────┼───────────────┘
         │             │                  │
         ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│           Firebase Realtime Database                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐            │
│  │circuito │  │   led   │  │  sistema    │            │
│  └────┬────┘  └────┬────┘  └──────┬──────┘            │
└───────┼────────────┼──────────────┼─────────────────────┘
        │            │              │
        ▼            ▼              ▼
┌─────────────────────────────────────────────────────────┐
│                  ESP32 + Sensores                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐         │
│  │ Sensor V │  │ Sensor A │  │  Relé LED    │         │
│  └──────────┘  └──────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **ESP32** lê sensores e envia dados ao Firebase
2. **Dashboard** consome dados via hooks React
3. **Luma AI** processa comandos do usuário
4. **Sistema de alertas** detecta falhas e envia emails
5. **Comandos de controle** atualizam Firebase → ESP32 executa

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Firebase
- Conta Google AI (Gemini API Key)
- Conta Gmail (para envio de emails)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/gkomba/SIPI.git
cd SIPI

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente (veja seção seguinte)
cp .env.example .env.local

# 4. Execute em desenvolvimento
npm run dev

# 5. Acesse no navegador
# http://localhost:3000
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_URL=https://seu-projeto.firebaseio.com

# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=sua-chave-aqui

# Email (Nodemailer)
EMAIL_USER=sistemadeiluminacaopublica@gmail.com
EMAIL_PASS=sua-senha-de-app-aqui
EMAIL_RECIPIENT=destino@gmail.com

# API Externa (opcional)
EXTERNAL_API_URL=https://api-lsts.onrender.com
```

### Firebase Setup

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative o **Realtime Database**
3. Configure as regras de segurança:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

4. Estruture o banco de dados:

```json
{
  "circuito": {
    "corrente": 2.5,
    "potencia": 550,
    "tensao": 220,
    "time": "2025-12-08 10:30:00",
    "status": "on",
    "info": "Falha(s) Encontrada(s) no(s) zona(s): 2 3",
    "saude": "ALERT"
  },
  "led": {
    "status": "on",
    "type": "LED 50W"
  }
}
```

### Google Gemini API

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Gere uma API Key
3. Adicione ao `.env.local`

### Configuração de Email

1. Ative a verificação em 2 etapas no Gmail
2. Gere uma **senha de app** em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use essa senha no `EMAIL_PASS`

## 🚀 Uso

### Dashboard

```typescript
// Acesse o dashboard principal
http://localhost:3000

// Visualize:
// - Status do circuito em tempo real
// - Estado dos postes (ON/OFF)
// - Alertas e falhas
// - Temporizador de tarefas
```

### Luma Assistant

```typescript
// Abra o assistente clicando no botão no header
// Comandos de exemplo:

"Ligar todas as luzes"
"Desligar poste 3"
"Agendar desligar em 5 minutos"
"Qual a potência atual?"
"Diagnosticar zona 2"
```

### API Programática

```typescript
// Controlar LED
await fetch('/api/led/control', {
  method: 'POST',
  body: JSON.stringify({ status: 'on' })
})

// Obter dados do sistema
const response = await fetch('/api/system-data')
const data = await response.json()
```

## 🔌 API Endpoints

### `POST /api/chat`
Chat com a assistente Luma (streaming)

```typescript
// Request
{
  "messages": [
    { "role": "user", "content": "Ligar luz" }
  ]
}

// Response: Stream de texto
```

### `GET /api/system-data`
Obtém todos os dados do sistema

```typescript
// Response
{
  "allData": {
    "circuito": { ... },
    "led": { ... },
    "sistema": { ... }
  }
}
```

### `POST /api/email`
Envia alerta por email

```typescript
// Request
{
  "data": {
    "postes": "2 3",
    "lastUpdate": "2025-12-08 10:30:00"
  }
}
```

## 📁 Estrutura do Projeto

```
SIPI/
├── app/
│   ├── api/                      # API Routes
│   │   ├── chat/
│   │   │   ├── route.ts          # Endpoint Luma AI
│   │   │   └── tool.ts           # Ferramentas AI
│   │   ├── email/
│   │   │   ├── route.ts          # Envio de emails
│   │   │   ├── template.html     # Template HTML
│   │   │   └── utils.ts          # Helpers email
│   │   └── system-data/
│   │       └── route.ts          # Dados do sistema
│   ├── components/               # Componentes React
│   │   ├── CircuitCard.tsx       # Card circuito
│   │   ├── Dashboard.tsx         # Dashboard principal
│   │   ├── Header.tsx            # Cabeçalho
│   │   ├── LumaAssistant.tsx     # Assistente AI
│   │   ├── PostesCard.tsx        # Card postes
│   │   ├── StatusBadge.tsx       # Badge status
│   │   └── TemporizadorCard.tsx  # Card temporizador
│   ├── hooks/                    # Custom Hooks
│   │   ├── useCurrentTime.ts     # Hook tempo atual
│   │   ├── useFirebaseData.ts    # Hook Firebase
│   │   └── useTheme.ts           # Hook tema
│   ├── types/                    # TypeScript Types
│   │   ├── aiStreamParser.ts     # Parser streaming AI
│   │   └── index.ts              # Types principais
│   ├── globals.css               # Estilos globais
│   ├── layout.tsx                # Layout root
│   └── page.tsx                  # Página inicial
├── public/                       # Assets estáticos
├── .env.local                    # Variáveis ambiente
├── next.config.js                # Config Next.js
├── package.json                  # Dependências
├── postcss.config.js             # Config PostCSS
├── tailwind.config.js            # Config Tailwind
├── tsconfig.json                 # Config TypeScript
└── README.md                     # Este arquivo
```

## 👨‍💻 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build produção
npm run build

# Iniciar produção
npm run start

# Linting
npm run lint
```

### Padrões de Código

- **Componentes**: PascalCase (`Dashboard.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useFirebaseData.ts`)
- **Types**: PascalCase (`CircuitData`)
- **Constantes**: UPPER_SNAKE_CASE (`FIREBASE_BASE_URL`)

### Commit Convention

```bash
feat: Nova funcionalidade
fix: Correção de bug
docs: Documentação
style: Formatação
refactor: Refatoração
test: Testes
chore: Manutenção
```

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

**Gildo Komba**

- GitHub: [@gkomba](https://github.com/gkomba)
- Email: kombagildo@gmail.com

## 🙏 Agradecimentos

- Google pela API Gemini
- Vercel pelo hosting e AI SDK
- Comunidade Next.js
- Firebase Team

---

<div align="center">

**⭐ Se este projeto foi útil, deixe uma estrela! ⭐**

Desenvolvido com ❤️ por Gildo Komba

</div>

