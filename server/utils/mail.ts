import type { H3Event } from 'h3'
import { createTransport } from 'nodemailer'

/**
 * A aplicação monta o e-mail (assunto, html e texto) e entrega direto no
 * servidor SMTP configurado. O contrato com o servidor é o protocolo SMTP,
 * então trocar de provedor é só ajustar as variáveis NUXT_SMTP_*.
 */
export interface MailMessage {
  to: string
  subject: string
  html: string
  text: string
}

interface MailConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
  consoleOnly: boolean
}

function mailConfig(): MailConfig {
  const config = useRuntimeConfig()
  const port = Number.parseInt(String(config.smtpPort), 10)

  return {
    host: (config.smtpHost as string).trim(),
    port: Number.isInteger(port) && port > 0 ? port : 587,
    user: (config.smtpUser as string).trim(),
    pass: config.smtpPass as string,
    from: (config.mailFrom as string).trim() || (config.smtpUser as string).trim() || 'nao-responda@localhost',
    consoleOnly: String(config.mailConsole).trim() === 'true',
  }
}

// Em produção um token nunca deve aparecer no log; fora dela o console é o
// fallback natural quando o SMTP não responde.
const isProduction = process.env.NODE_ENV === 'production'

function printToConsole(config: MailConfig, message: MailMessage, reason: string): void {
  console.info(
    [
      '',
      `── e-mail não enviado (${reason}) ──`,
      `De: ${config.from}`,
      `Para: ${message.to}`,
      `Assunto: ${message.subject}`,
      '',
      message.text,
      '───────────────────────────────────────────────────',
      '',
    ].join('\n'),
  )
}

export function siteOrigin(event: H3Event): string {
  const configured = (useRuntimeConfig().public.siteUrl as string).trim()
  return configured ? configured.replace(/\/+$/, '') : getRequestURL(event).origin
}

// Cada conexão SMTP custa handshake + TLS, então reaproveitamos o transporter
// por combinação de host/porta/usuário em vez de abrir uma por e-mail.
const transporters = new Map<string, ReturnType<typeof createTransport>>()

function mailTransport({ host, port, user, pass }: MailConfig): ReturnType<typeof createTransport> {
  const key = `${host}:${port}:${user}`
  const cached = transporters.get(key)
  if (cached) return cached

  const transport = createTransport({
    host,
    port,
    // 465 espera TLS desde o primeiro byte; nas demais portas a conexão sobe
    // em claro e o STARTTLS é negociado em seguida.
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
    // Sem isso um host fora do ar deixa a requisição pendurada por minutos.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })

  transporters.set(key, transport)
  return transport
}

export async function sendMail(message: MailMessage): Promise<void> {
  const config = mailConfig()

  if (!config.host) {
    printToConsole(config, message, 'NUXT_SMTP_HOST ausente')
    return
  }
  if (config.consoleOnly) {
    printToConsole(config, message, 'NUXT_MAIL_CONSOLE ativo')
    return
  }

  try {
    await mailTransport(config).sendMail({ from: config.from, ...message })
    console.info(`[mail] enviado para ${message.to}: ${message.subject}`)
  }
  catch (cause) {
    console.error(`[mail] falha ao enviar por SMTP para ${message.to}:`, cause)

    // Em desenvolvimento o link precisa aparecer em algum lugar, então cai no
    // console em vez de derrubar o fluxo. Em produção só registramos o erro.
    if (!isProduction) {
      printToConsole(config, message, 'falha no SMTP')
      return
    }

    throw createError({
      statusCode: 502,
      message: 'Não foi possível enviar o e-mail. Tente novamente em instantes.',
    })
  }
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;line-height:1.6">${text}</p>`
}

function layout(title: string, body: string): string {
  return [
    '<div style="font-family:system-ui,-apple-system,\'Segoe UI\',sans-serif;font-size:16px;color:#0f172a">',
    `<h1 style="margin:0 0 20px;font-size:20px">${title}</h1>`,
    body,
    '<p style="margin:24px 0 0;font-size:13px;color:#64748b">Dasha Cave Blog</p>',
    '</div>',
  ].join('')
}

function actionButton(label: string, url: string): string {
  return [
    `<p style="margin:0 0 16px"><a href="${url}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#00b37e;color:#ffffff;text-decoration:none;font-weight:600">${label}</a></p>`,
    `<p style="margin:0 0 16px;font-size:13px;color:#64748b;word-break:break-all">Se o botão não funcionar, copie o endereço: ${url}</p>`,
  ].join('')
}

export async function sendVerificationEmail(event: H3Event, account: { name: string, email: string }, token: string): Promise<void> {
  const url = `${siteOrigin(event)}/verificar?token=${encodeURIComponent(token)}`

  await sendMail({
    to: account.email,
    subject: 'Confirme seu e-mail para Dasha Cave Blog',
    html: layout('Confirme seu e-mail', [
      paragraph(`Olá, ${account.name}!`),
      paragraph('Falta pouco para ativar sua conta. Clique no botão abaixo para confirmar seu e-mail.'),
      actionButton('Confirmar e-mail', url),
      paragraph('O link vale por 24 horas. Se você não criou esta conta, ignore esta mensagem.'),
    ].join('')),
    text: [
      `Olá, ${account.name}!`,
      '',
      'Falta pouco para ativar sua conta. Abra o link abaixo para confirmar seu e-mail:',
      url,
      '',
      'O link vale por 24 horas. Se você não criou esta conta, ignore esta mensagem.',
    ].join('\n'),
  })
}

export async function sendPasswordResetEmail(event: H3Event, account: { name: string, email: string }, token: string): Promise<void> {
  const url = `${siteOrigin(event)}/redefinir-senha?token=${encodeURIComponent(token)}`

  await sendMail({
    to: account.email,
    subject: 'Redefinir sua senha na Dasha Cave Blog',
    html: layout('Redefinir senha', [
      paragraph(`Olá, ${account.name}!`),
      paragraph('Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para escolher uma nova senha.'),
      actionButton('Redefinir senha', url),
      paragraph('O link vale por 1 hora e só pode ser usado uma vez. Se você não fez este pedido, ignore esta mensagem: sua senha continua a mesma.'),
    ].join('')),
    text: [
      `Olá, ${account.name}!`,
      '',
      'Recebemos um pedido para redefinir a senha da sua conta. Abra o link abaixo:',
      url,
      '',
      'O link vale por 1 hora e só pode ser usado uma vez. Se você não fez este pedido, ignore esta mensagem: sua senha continua a mesma.',
    ].join('\n'),
  })
}
