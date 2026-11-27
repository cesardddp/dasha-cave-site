<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'

const route = useRoute()
const { loggedIn, user, fetch: refreshSession } = useUserSession()

type AuthMode = 'login' | 'register' | 'forgot'
const mode = shallowRef<AuthMode>('login')
const pending = shallowRef(false)
const error = shallowRef('')
const notice = shallowRef('')
const awaitingVerification = shallowRef('')
const form = reactive({ name: '', email: '', password: '' })

const title = computed(() => {
  if (awaitingVerification.value) return 'Confirme seu e-mail'
  if (mode.value === 'register') return 'Criar conta'
  if (mode.value === 'forgot') return 'Recuperar senha'
  return 'Entrar'
})

useSeoMeta({ title: () => `${title.value} — Dasha Cave` })

const visibleError = computed(() => error.value || (
  route.query.error === 'google' && mode.value === 'login'
    ? 'Não foi possível entrar com o Google. Tente novamente.'
    : ''
))

function isEmailNotVerified(cause: unknown): boolean {
  const data = cause && typeof cause === 'object'
    ? (cause as { data?: { data?: { code?: string } } }).data
    : undefined
  return data?.data?.code === 'email_not_verified'
}

const redirectTo = () => {
  const next = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return ['/livros/admin', '/admin/usuarios'].includes(next) ? next : '/blog'
}

async function submit() {
  pending.value = true
  error.value = ''
  notice.value = ''

  try {
    if (mode.value === 'forgot') {
      const response = await $fetch<{ message?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: form.email },
      })
      notice.value = response.message ?? 'Se este e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.'
      return
    }

    if (mode.value === 'register') {
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: { name: form.name, email: form.email, password: form.password },
      })
      awaitingVerification.value = form.email
      return
    }

    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: form.email, password: form.password },
    })
    await refreshSession()
    await navigateTo(redirectTo())
  }
  catch (cause) {
    if (mode.value === 'login' && isEmailNotVerified(cause)) {
      awaitingVerification.value = form.email
      return
    }
    error.value = getErrorMessage(cause, 'Não foi possível concluir a operação. Tente novamente.')
  }
  finally {
    pending.value = false
  }
}

async function resendVerification() {
  pending.value = true
  notice.value = ''
  error.value = ''
  try {
    const response = await $fetch<{ message?: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: { email: awaitingVerification.value },
    })
    notice.value = response.message ?? 'Enviamos um novo link de confirmação.'
  }
  catch {
    notice.value = 'Não foi possível reenviar agora. Tente novamente em instantes.'
  }
  finally {
    pending.value = false
  }
}

function backToLogin() {
  awaitingVerification.value = ''
  notice.value = ''
  error.value = ''
  form.password = ''
  mode.value = 'login'
}

function switchMode(next: AuthMode) {
  mode.value = next
  error.value = ''
  notice.value = ''
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshSession()
}
</script>

<template>
  <main class="auth-page">
    <NuxtLink class="auth-page__back" to="/">
      ← Voltar
    </NuxtLink>

    <div class="auth-page__card">
      <template v-if="loggedIn">
        <h1 class="auth-page__title">
          Você já está conectada
        </h1>
        <p class="auth-page__hint">
          Você está conectado como {{ user?.email }}.
        </p>
        <p class="auth-page__hint">
          Perfil: {{ user?.role === 'admin' ? 'Administrador' : 'Comentador do blog' }}.
        </p>
        <UButton block color="error" variant="soft" @click="logout">
          Sair
        </UButton>
      </template>

      <template v-else-if="awaitingVerification">
        <h1 class="auth-page__title">
          Confirme seu e-mail
        </h1>
        <p class="auth-page__hint">
          Enviamos um link de confirmação para <strong>{{ awaitingVerification }}</strong>.
          Ele vale por 24 horas. Confirme o e-mail para poder entrar.
        </p>
        <p v-if="notice" class="auth-page__notice" role="status">
          {{ notice }}
        </p>
        <div class="auth-page__actions">
          <UButton block size="lg" :loading="pending" @click="resendVerification">
            Reenviar link de confirmação
          </UButton>
          <button class="auth-page__mode-toggle" type="button" @click="backToLogin">
            Voltar para o login
          </button>
        </div>
      </template>

      <template v-else>
        <h1 class="auth-page__title">
          {{ title }}
        </h1>
        <form class="auth-page__form" @submit.prevent="submit">
          <UInput
            v-if="mode === 'register'"
            v-model="form.name"
            type="text"
            placeholder="Nome"
            autocomplete="name"
            minlength="2"
            maxlength="100"
            required
            size="lg"
          />
          <UInput
            v-model="form.email"
            type="email"
            placeholder="E-mail"
            autocomplete="email"
            required
            size="lg"
          />
          <UInput
            v-if="mode !== 'forgot'"
            v-model="form.password"
            type="password"
            placeholder="Senha"
            :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
            :minlength="mode === 'register' ? 8 : undefined"
            maxlength="128"
            required
            size="lg"
          />
          <p v-if="notice" class="auth-page__notice" role="status">
            {{ notice }}
          </p>
          <p v-if="visibleError" class="auth-page__error" role="alert">
            {{ visibleError }}
          </p>
          <UButton type="submit" block size="lg" :loading="pending">
            {{ mode === 'register' ? 'Criar conta' : mode === 'forgot' ? 'Enviar instruções' : 'Entrar' }}
          </UButton>
          <p v-if="mode === 'register'" class="auth-page__hint">
            Sua conta será criada como comentadora do blog. Enviaremos um e-mail para confirmar seu endereço.
          </p>
          <p v-if="mode === 'forgot'" class="auth-page__hint">
            Enviaremos um link válido por 1 hora para você definir uma nova senha.
          </p>
          <div class="auth-page__actions">
            <button
              v-if="mode !== 'forgot'"
              class="auth-page__mode-toggle"
              type="button"
              @click="switchMode(mode === 'login' ? 'register' : 'login')"
            >
              {{ mode === 'register' ? 'Já tem uma conta? Entre' : 'Não tem uma conta? Cadastre-se' }}
            </button>
            <button
              v-if="mode === 'login'"
              class="auth-page__mode-toggle"
              type="button"
              @click="switchMode('forgot')"
            >
              Esqueci minha senha
            </button>
            <button
              v-if="mode !== 'login'"
              class="auth-page__mode-toggle"
              type="button"
              @click="switchMode('login')"
            >
              Voltar para o login
            </button>
          </div>
          <div v-if="mode !== 'forgot'" class="auth-page__separator" aria-hidden="true">
            <span>ou</span>
          </div>
          <a v-if="mode !== 'forgot'" class="auth-page__google" href="/auth/google">
            <UIcon name="i-simple-icons-google" aria-hidden="true" />
            Continuar com Google
          </a>
        </form>
      </template>
    </div>
  </main>
</template>

<style scoped>
.auth-page {
  box-sizing: border-box;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem 3rem;
  color: #fff;
}

.auth-page__back {
  align-self: flex-start;
  margin-bottom: 1.5rem;
  color: #00ffaa;
  font-size: 0.9rem;
  text-decoration: none;
}

.auth-page__card {
  box-sizing: border-box;
  width: min(100%, 360px);
  padding: 1.75rem 1.5rem;
  border: 1px solid rgb(112 230 218 / 35%);
  border-radius: 1.25rem;
  background: rgb(9 18 16 / 65%);
  box-shadow: 0 12px 32px rgb(0 0 0 / 45%);
}

.auth-page__title {
  margin: 0 0 1.25rem;
  font-size: 1.6rem;
  text-align: center;
}

.auth-page__hint {
  margin: 0 0 1.25rem;
  color: rgb(255 255 255 / 70%);
  text-align: center;
}

.auth-page__form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.auth-page__actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.auth-page__notice {
  margin: 0;
  color: #7bf7c4;
  font-size: 0.875rem;
  text-align: center;
}

.auth-page__mode-toggle {
  padding: 0.35rem;
  border: 0;
  background: transparent;
  color: #00ffaa;
  cursor: pointer;
  font: inherit;
}

.auth-page__separator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgb(255 255 255 / 55%);
  font-size: 0.8rem;
}

.auth-page__separator::before,
.auth-page__separator::after {
  height: 1px;
  flex: 1;
  background: rgb(255 255 255 / 18%);
  content: "";
}

.auth-page__google {
  display: flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 0.65rem;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.auth-page__google:hover {
  background: rgb(255 255 255 / 8%);
}

.auth-page__google:focus-visible,
.auth-page__mode-toggle:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.auth-page__error {
  margin: 0;
  color: #ff7b7b;
  font-size: 0.875rem;
}
</style>
