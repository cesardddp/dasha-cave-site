# Login: Google e verificação de e-mail

Estado atual da autenticação: login com Google, cadastro por senha com confirmação
de e-mail e recuperação de senha. O único item pendente é a credencial do Google.
Fora de escopo: bloqueios de cadastro/login, rate limiting, CAPTCHA.

## Stack

- [`nuxt-auth-utils`](https://github.com/atinux/nuxt-auth-utils) `^0.6.2` — módulo Nuxt
  para sessão (cookie selado com `NUXT_APP_SECRET`) e handlers OAuth. Não é SDK oficial
  do Google; internamente usa `openid-client` (OpenID Connect certificada).
- Registro via módulo em [nuxt.config.ts](../nuxt.config.ts) (`nuxt-auth-utils`).
- Sessão no cliente via composable `useUserSession()` (não é Pinia).
- Papéis: `admin` derivado de `NUXT_ADMIN_USER_IDS`; demais contas `commenter`.

## O que já está implementado

### Login com Google (código pronto, falta credencial)

- Endpoint: [server/routes/auth/google.get.ts](../server/routes/auth/google.get.ts),
  rota `GET /auth/google` usando `defineOAuthGoogleEventHandler` do módulo
  (scope `openid email profile`). Redireciona para `/blog` no sucesso e
  `/login?error=google` em falha.
- Só aceita contas com `email_verified === true` retornado pelo Google.
- Perfil normalizado em `googleAccountProfile` (`sub`, e-mail, nome, avatar HTTPS).
- Persistência: [server/utils/db.ts](../server/utils/db.ts), função
  `getOrCreateGoogleAccount` — transação que:
  1. acha conta Google existente por `sub` na tabela `oauth_accounts`;
  2. senão, vincula a conta local com o mesmo e-mail;
  3. senão, cria usuário novo com hash aleatório (não há senha conhecida) e vincula.
- Tabela `oauth_accounts` (ver [server/database/schema.ts](../server/database/schema.ts))
  com unicidade `(provider, provider_user_id)` e `(user_id, provider)`.
- UI: botão "Continuar com Google" em [app/pages/login.vue](../app/pages/login.vue)
  (link simples para `/auth/google`, ícone `i-simple-icons-google` via `@nuxt/icon`).

### O que falta para o Google funcionar de verdade

O código está completo; falta apenas configuração externa:

1. Criar OAuth Client no Google Cloud Console (tipo "Web application").
2. Cadastrar a URI de retorno autorizada: URL pública terminando em `/auth/google`
   (ex.: `https://dominio/auth/google`).
3. Definir no ambiente:
   - `NUXT_OAUTH_GOOGLE_CLIENT_ID`
   - `NUXT_OAUTH_GOOGLE_CLIENT_SECRET`
   - `NUXT_APP_SECRET` (obrigatório em produção; sem ele a sessão responde 500)
   - opcional `NUXT_OAUTH_GOOGLE_REDIRECT_URL` (URL pública fixa terminando em `/auth/google`)
4. Testar OAuth de ponta a ponta — **nunca foi testado** porque não há credenciais.
   Casos a cobrir: login novo, vínculo com conta local de mesmo e-mail, e-mail
   não verificado no Google (deve falhar com erro), volta para `/login?error=google`.

## Verificação de e-mail (cadastro por senha)

### Como funciona

1. `POST /api/auth/register` valida nome/e-mail/senha, cria a conta com
   `email_verified_at` nulo, gera um token de confirmação e envia o e-mail.
   A resposta é `201 { email, verificationSent: true }` — **não abre sessão**.
2. O e-mail leva a `/verificar?token=...`. A página chama
   `POST /api/auth/verify` com `{ token }`; o endpoint consome o token
   (uso único), marca `email_verified_at` e responde `{ verified: true }`.
3. `POST /api/auth/login` responde `403` com `data.code = 'email_not_verified'`
   quando a senha está certa mas o e-mail não foi confirmado. A UI mostra a tela
   de confirmação com botão de reenvio.
4. `POST /api/auth/resend-verification` gera um novo token e reenvia o e-mail.
   A resposta é sempre `202` com a mesma mensagem, para não revelar se o e-mail
   existe na base. Contas já verificadas e reenvios dentro de 60 s são ignorados.

### Tokens

- Tabela `auth_tokens` ([server/database/schema.ts](../server/database/schema.ts)):
  `user_id`, `purpose` (`email_verification` | `password_reset`), `token_hash`
  único, `expires_at`, `created_at`.
- Só o hash SHA-256 do token fica no banco; o valor em claro existe apenas no link.
- Validade: 24 h para confirmação de e-mail, 1 h para redefinição de senha.
- Uso único: a linha é apagada na primeira validação.
- Um novo token do mesmo `purpose` apaga os anteriores daquele usuário.
- Intervalo mínimo de 60 s entre envios do mesmo tipo.

### Contas que não passam pelo fluxo

- Contas criadas pelo painel administrativo
  ([server/utils/user-management.ts](../server/utils/user-management.ts)) já nascem
  verificadas — o administrador entrega a senha pessoalmente.
- Contas Google chegam com e-mail verificado pelo provedor
  (`getOrCreateGoogleAccount` grava `email_verified_at`), inclusive no vínculo com
  uma conta local de mesmo e-mail.
- Contas anteriores a esta mudança recebem `email_verified_at = created_at` na
  migração automática de [server/utils/db.ts](../server/utils/db.ts).

## Recuperação de senha

1. `/login` → "Esqueci minha senha" chama `POST /api/auth/forgot-password`.
   A resposta é sempre `202` com mensagem genérica; o e-mail só é enviado se a
   conta existir e estiver fora do intervalo de 60 s.
2. O e-mail leva a `/redefinir-senha?token=...`, que pede senha e confirmação
   (8 a 128 caracteres).
3. `POST /api/auth/reset-password` com `{ token, password }` consome o token,
   grava o novo hash e marca o e-mail como verificado — quem recebeu o link já
   provou ser dono da caixa de entrada. Responde `{ reset: true }`.
4. Sessões abertas antes da troca continuam válidas: o cookie de sessão é
   autocontido e não é invalidado pelo reset.

## Transporte de e-mail

O app monta o e-mail (assunto, HTML e texto) e entrega ao seu servidor de e-mail
por SMTP, com Nodemailer, em [server/utils/mail.ts](../server/utils/mail.ts):

- `NUXT_SMTP_HOST` — host do servidor. Sem ele, os e-mails são impressos no
  console do servidor, útil em desenvolvimento.
- `NUXT_SMTP_PORT` — porta. Padrão `587` (STARTTLS); `465` liga TLS direto.
- `NUXT_SMTP_USER` / `NUXT_SMTP_PASS` — conta autenticada no servidor.
- `NUXT_MAIL_FROM` — remetente padrão. Precisa ser a conta autenticada ou um
  alias autorizado por ela, senão o servidor recusa ou marca como spam. Se ficar
  vazio, usamos `NUXT_SMTP_USER`.
- `NUXT_MAIL_CONSOLE` — com `true`, nada sai pelo SMTP: o conteúdo do e-mail
  (inclusive o link) é impresso no console. Útil para testar os fluxos.
- `NUXT_PUBLIC_SITE_URL` — base dos links enviados; sem ela, usamos a origem da
  requisição.
- Falha de envio (conexão, TLS ou autenticação) fora de produção imprime o e-mail
  no console, para o link não se perder. Em produção a falha vai para o log: o
  cadastro responde `502` e os fluxos que respondem sempre `202` (reenvio de
  confirmação e recuperação de senha) mantêm o `202`, para não revelar se o
  e-mail existe.
- Para trocar de provedor, basta adaptar `mailTransport()` — o resto do código
  não muda.

## Arquivos relevantes

| Arquivo | Papel |
| --- | --- |
| `server/routes/auth/google.get.ts` | Callback OAuth do Google |
| `server/api/auth/register.post.ts` | Cadastro por e-mail/senha |
| `server/api/auth/login.post.ts` | Login por e-mail/senha |
| `server/utils/db.ts` | Contas, vínculo Google e acesso ao SQLite |
| `server/database/schema.ts` | Tabelas `users`, `auth_tokens`, `oauth_accounts`, `posts` |
| `app/pages/login.vue` | UI de login, cadastro, confirmação pendente e "esqueci minha senha" |
| `app/pages/verificar.vue` | Página de resultado da confirmação de e-mail |
| `app/pages/redefinir-senha.vue` | Formulário de nova senha |
| `server/api/auth/verify.post.ts` | Confirma o e-mail a partir do token |
| `server/api/auth/resend-verification.post.ts` | Reenvia o link de confirmação |
| `server/api/auth/forgot-password.post.ts` | Inicia a recuperação de senha |
| `server/api/auth/reset-password.post.ts` | Grava a nova senha |
| `server/utils/auth-tokens.ts` | Emissão, consumo e intervalo dos tokens |
| `server/utils/mail.ts` | Transporte de e-mail e composição das mensagens |
| `.env.example` | Variáveis de Google, sessão e servidor de e-mail |
| `README.md` (seção "Autenticação") | Resumo público do transporte de e-mail |


## Editor de livros

O cadastro e o login por e-mail e senha estão disponíveis. Novas contas recebem o papel
de comentadora do blog. O login com Google pode ser ativado com as variáveis
`NUXT_OAUTH_GOOGLE_CLIENT_ID` e `NUXT_OAUTH_GOOGLE_CLIENT_SECRET`; o endereço de retorno
`/auth/google` também deve estar cadastrado no Google Cloud. O cadastro por senha exige
confirmação de e-mail, e há recuperação de senha por e-mail. Veja
[docs/login-google-email.md](./docs/login-google-email.md) para o fluxo completo e as
variáveis do servidor de e-mail.

Na primeira leitura dos livros, o servidor cria o schema e carrega o catálogo de
[`shared/data/books.ts`](./shared/data/books.ts) no SQLite; depois, a conexão fica somente para leitura.
Essa carga inicial é feita pelo sistema, não pela API de edição.

As páginas públicas continuam lendo os dados do banco.

O banco de livros fica em `.data/books.sqlite`; o banco do blog fica em `.data/blog.sqlite`.
O volume Docker `books_data:/app/.data` já persiste os dois bancos, e `book_uploads` persiste
as imagens enviadas. Não é necessário adicionar outro volume. Em outros ambientes, configure
armazenamento persistente para `.data` e `public/uploads`.

As páginas públicas usam renderização no servidor com os dados do SQLite; a hospedagem precisa
executar o servidor Nuxt. O catálogo inicial é carregado pelo servidor no primeiro acesso aos livros.
