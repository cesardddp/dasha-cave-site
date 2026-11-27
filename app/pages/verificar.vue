<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'

const route = useRoute()
const state = shallowRef<'pending' | 'success' | 'error'>('pending')
const message = shallowRef('')

useSeoMeta({ title: 'Confirmar e-mail — Dasha Cave' })

const title = computed(() => {
  if (state.value === 'success') return 'E-mail confirmado'
  if (state.value === 'error') return 'Não foi possível confirmar'
  return 'Confirmando seu e-mail'
})

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token.trim() : ''
  if (!token) {
    state.value = 'error'
    message.value = 'O link de confirmação está incompleto. Peça um novo link na página de login.'
    return
  }

  try {
    await $fetch('/api/auth/verify', { method: 'POST', body: { token } })
    state.value = 'success'
    message.value = 'Seu e-mail foi confirmado. Agora você já pode entrar na sua conta.'
  }
  catch (cause) {
    state.value = 'error'
    message.value = getErrorMessage(cause, 'Este link de confirmação é inválido ou expirou.')
  }
})
</script>

<template>
  <main class="auth-page">
    <NuxtLink class="auth-page__back" to="/">
      ← Voltar
    </NuxtLink>

    <div class="auth-page__card">
      <h1 class="auth-page__title">
        {{ title }}
      </h1>
      <p v-if="state === 'pending'" class="auth-page__hint">
        Aguarde um instante enquanto validamos o link.
      </p>
      <p v-else class="auth-page__hint">
        {{ message }}
      </p>
      <div class="auth-page__actions">
        <UButton v-if="state === 'success'" block size="lg" to="/login">
          Entrar
        </UButton>
        <UButton v-else-if="state === 'error'" block size="lg" to="/login">
          Ir para o login
        </UButton>
      </div>
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
  display: flex;
  width: min(100%, 360px);
  flex-direction: column;
  gap: 0.75rem;
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
  margin: 0;
  color: rgb(255 255 255 / 70%);
  text-align: center;
}

.auth-page__actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
