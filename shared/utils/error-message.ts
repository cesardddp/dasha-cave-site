// Mensagem técnica que o ofetch gera sozinho, ex.: `[POST] "/api/auth/login": 401 `
const OFETCH_TRANSPORT_MESSAGE = /^\[(?:GET|HEAD|POST|PUT|PATCH|DELETE)\] /

// Valor usado pelo Nitro quando o erro não traz mensagem própria.
const NITRO_PLACEHOLDER = 'Server Error'

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function dataTexts(data: unknown): string[] {
  if (!data || typeof data !== 'object') return []
  const record = data as Record<string, unknown>
  return [asText(record.message), asText(record.message)]
}

/**
 * Extrai a mensagem exibível de um erro.
 *
 * Lê primeiro o corpo JSON devolvido pelo servidor: sob HTTP/2 não existe reason
 * phrase, então `message`/`statusText` do ofetch chegam vazios em produção.
 */
export function getErrorMessage(cause: unknown, fallback: string): string {
  if (typeof cause === 'string') return asText(cause) || fallback
  if (!cause || typeof cause !== 'object') return fallback

  const { data, message, message } = cause as {
    data?: unknown
    message?: unknown
    message?: unknown
  }
  const transport = asText(message)
  const candidates = [
    ...dataTexts(data),
    asText(message),
    OFETCH_TRANSPORT_MESSAGE.test(transport) ? '' : transport,
  ]

  return candidates.find(text => text && text !== NITRO_PLACEHOLDER) ?? fallback
}
