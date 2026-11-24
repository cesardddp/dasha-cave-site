<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'

const { loggedIn, user, fetch: refreshSession } = useUserSession()
const route = useRoute()
const mode = shallowRef<'login' | 'register'>('login')
const pending = shallowRef(false)
const error = shallowRef('')
const form = reactive({ name: '', email: '', password: '' })
const visibleError = computed(() => error.value || (
  route.query.error === 'google' && mode.value === 'login'
    ? 'Não foi possível entrar com o Google. Tente novamente.'
    : ''
))

useSeoMeta({ title: () => mode.value === 'register' ? 'Criar conta — Dasha Cave' : 'Entrar — Dasha Cave' })

async function submit() {
  pending.value = true
  error.value = ''

  try {
    await $fetch(mode.value === 'register' ? '/api/auth/register' : '/api/auth/login', {
      method: 'POST',
      body: form,
    })
    await refreshSession()

    const requestedRedirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    const destination = ['/livros/admin', '/admin/usuarios'].includes(requestedRedirect)
      ? requestedRedirect
      : '/blog'
    await navigateTo(destination)
  }
  catch (cause) {
    error.value = cause && typeof cause === 'object' && 'statusMessage' in cause
      && typeof cause.statusMessage === 'string'
      ? cause.statusMessage
      : cause instanceof Error
        ? cause.message
        : 'Não foi possível entrar.'
  }
  finally {
    pending.value = false
  }
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
          Olá, {{ user?.name }}
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

      <template v-else>
        <h1 class="auth-page__title">
          {{ mode === 'register' ? 'Criar conta' : 'Entrar' }}
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
            v-model="form.password"
            type="password"
            placeholder="Senha"
            :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
            :minlength="mode === 'register' ? 8 : undefined"
            maxlength="128"
            required
            size="lg"
          />
          <p v-if="visibleError" class="auth-page__error" role="alert">
            {{ visibleError }}
          </p>
          <UButton type="submit" block size="lg" :loading="pending">
            {{ mode === 'register' ? 'Criar conta' : 'Entrar' }}
          </UButton>
          <p v-if="mode === 'register'" class="auth-page__hint">
            Sua conta será criada como comentadora do blog. Ainda não enviamos e-mail de confirmação.
          </p>
          <button
            class="auth-page__mode-toggle"
            type="button"
            @click="mode = mode === 'login' ? 'register' : 'login'; error = ''"
          >
            {{ mode === 'register' ? 'Já tem uma conta? Entre' : 'Não tem uma conta? Cadastre-se' }}
          </button>
          <div class="auth-page__separator" aria-hidden="true">
            <span>ou</span>
          </div>
          <a class="auth-page__google" href="/auth/google">
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
