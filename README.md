

## Autenticação

Cadastro por e-mail/senha, login com Google, confirmação de e-mail e recuperação de
senha. O fluxo completo está em [docs/login-google-email.md](./docs/login-google-email.md).

### Transporte de e-mail

O app monta o e-mail (assunto, HTML e texto) e entrega por SMTP usando
[Nodemailer](https://nodemailer.com) e a conta configurada em `NUXT_SMTP_USER`.

Variáveis de ambiente:

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `NUXT_SMTP_HOST` | não | Host do servidor SMTP. Sem ele, os e-mails vão para o console. |
| `NUXT_SMTP_PORT` | não | Porta SMTP. Padrão `587` (STARTTLS). Use `465` para TLS direto. |
| `NUXT_SMTP_USER` | não | Conta autenticada no servidor. |
| `NUXT_SMTP_PASS` | não | Senha da conta. |
| `NUXT_MAIL_FROM` | não | Remetente padrão. |
| `NUXT_MAIL_CONSOLE` | não | Com `true`, nenhum e-mail sai pelo SMTP: o conteúdo vai para o console. |
| `NUXT_PUBLIC_SITE_URL` | não | Base dos links enviados. Sem ela, usamos a origem da requisição. |

O remetente (`NUXT_MAIL_FROM`) precisa ser a própria conta autenticada ou um alias
autorizado por ela; caso contrário o servidor recusa a mensagem ou a marca como spam.
Se ficar vazio, usamos `NUXT_SMTP_USER`.

Quando o envio pelo SMTP falha (conexão, TLS ou autenticação), o e-mail é impresso no
console do servidor fora de produção, para o link não se perder. Em produção a falha
aparece no log e a API responde `502` no cadastro; nos fluxos que respondem sempre
`202` (reenvio de confirmação e recuperação de senha) o erro fica só no log, para não
revelar se o e-mail existe. Todo o transporte vive em
[`server/utils/mail.ts`](./server/utils/mail.ts): para trocar de provedor, basta mexer
em `mailTransport()`.

Consulte a [documentação de ícones](./docs/icones.md) para saber quais conjuntos estão instalados e como usá-los.
