<script setup lang="ts">
import { reactive, shallowRef } from 'vue'

const { loggedIn, user, fetch: refreshSession } = useUserSession()
const route = useRoute()
const pending = shallowRef(false)
const error = shallowRef('')
const form = reactive({ email: '', password: '' })

useSeoMeta({ title: 'Entrar — Dasha Cave' })

async function submit() {
  pending.value = true
  error.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: form,
    })
    await refreshSession()

    const destination = route.query.redirect === '/livros/admin' ? '/livros/admin' : '/blog'
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
          Entrar
        </h1>
        <form class="auth-page__form" @submit.prevent="submit">
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
            autocomplete="current-password"
            required
            size="lg"
          />
          <p v-if="error" class="auth-page__error" role="alert">
            {{ error }}
          </p>
          <UButton type="submit" block size="lg" :loading="pending">
            Entrar
          </UButton>
          <p class="auth-page__hint" role="status">
            A criação de contas continua desativada.
          </p>
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

.auth-page__error {
  margin: 0;
  color: #ff7b7b;
  font-size: 0.875rem;
}
</style>
