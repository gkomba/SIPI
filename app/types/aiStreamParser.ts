interface TextDelta {
  type: 'text-delta'
  textDelta: string
}

interface Finish {
  type: 'finish'
  finishReason: string
}

type StreamChunk = TextDelta | Finish | { type: string; [key: string]: any }

/**
 * Interpreta uma linha do stream da API de IA
 */
export function parseAIStreamChunk(line: string): string | null {
  try {
    if (!line.startsWith('0:')) return null

    const json = JSON.parse(line.slice(2)) as StreamChunk

    if (json.type === 'text-delta' && typeof json.textDelta === 'string') {
      return json.textDelta
    }

    return null // ignora finish, tool-call, etc.
  } catch {
    return null
  }
}
