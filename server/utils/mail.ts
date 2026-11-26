import type { H3Event } from 'h3'

/**
 * A aplicação monta o e-mail (assunto, html e texto) e apenas repassa o
 * conteúdo pronto para o servidor de e-mail, via HTTP. O contrato é um POST
 * JSON simples, para que o relay possa ser trocado sem mexer no app.
 */
export interface MailMessage {
  to: string
  subject: string
  html: string
  text: string
}

interface MailRelayPayload extends MailMessage {
  from: string
}

function mailConfig() {
  const config = useRuntimeConfig()
  return {
    endpoint: config.mailEndpoint as string,
    token: config.mailToken as string,
    from: config.mailFrom as string,
  }
}

export function siteOrigin(event: H3Event): string {
  const configured = (useRuntimeConfig().public.siteUrl as string).trim()
  return configured ? configured.replace(/\/+$/, '') : getRequestURL(event).origin
}

export async function sendMail(message: MailMessage): Promise<void> {
  const { endpoint, token, from } = mailConfig()
  const payload: MailRelayPayload = { from, ...message }

  if (!endpoint) {
    // Fallback de desenvolvimento: sem relay configurado, o e-mail vai para o log.
    console.info(
      [
        '',
        '── e-mail não enviado (NUXT_MAIL_ENDPOINT ausente) ──',
        `De: ${payload.from}`,
        `Para: ${payload.to}`,
        `Assunto: ${payload.subject}`,
        '',
        payload.text,
        '───────────────────────────────────────────────────',
        '',
      ].join('\n'),
    )
    return
  }

  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`relay respondeu ${response.status} ${detail}`.trim())
    }
  }
  catch (cause) {
    console.error('Falha ao enviar e-mail pelo relay:', cause)
    throw createError({
      statusCode: 502,
      statusMessage: 'Não foi possível enviar o e-mail. Tente novamente em instantes.',
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
    '<p style="margin:24px 0 0;font-size:13px;color:#64748b">Caverna da Dasha</p>',
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
    subject: 'Confirme seu e-mail na Caverna da Dasha',
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
    subject: 'Redefinir sua senha na Caverna da Dasha',
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
