<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'

const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token.trim() : ''
const form = reactive({ password: '', confirmation: '' })
const pending = shallowRef(false)
const error = shallowRef('')
const done = shallowRef(false)

useSeoMeta({ title: 'Redefinir senha — Dasha Cave' })

const title = computed(() => {
  if (!token) return 'Link inválido'
  if (done.value) return 'Senha redefinida'
  return 'Definir nova senha'
})

async function submit() {
  error.value = ''

  if (form.password !== form.confirmation) {
    error.value = 'As senhas não conferem.'
    return
  }

  pending.value = true
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password: form.password },
    })
    done.value = true
  }
  catch (cause) {
    error.value = getErrorMessage(cause, 'Não foi possível redefinir a senha. Tente novamente.')
  }
  finally {
    pending.value = false
  }
}
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

      <p v-if="!token" class="auth-page__hint">
        Este link de redefinição está incompleto. Peça um novo link na página de login.
      </p>

      <template v-else-if="done">
        <p class="auth-page__hint">
          Sua senha foi alterada. Use a nova senha para entrar.
        </p>
        <div class="auth-page__actions">
          <UButton block size="lg" to="/login">
            Entrar
          </UButton>
        </div>
      </template>

      <form v-else class="auth-page__form" @submit.prevent="submit">
        <UInput
          v-model="form.password"
          type="password"
          placeholder="Nova senha"
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
          size="lg"
        />
        <UInput
          v-model="form.confirmation"
          type="password"
          placeholder="Repita a nova senha"
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
          size="lg"
        />
        <p v-if="error" class="auth-page__error" role="alert">
          {{ error }}
        </p>
        <UButton type="submit" block size="lg" :loading="pending">
          Salvar nova senha
        </UButton>
        <p class="auth-page__hint">
          A senha deve ter entre 8 e 128 caracteres.
        </p>
      </form>
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

.auth-page__error {
  margin: 0;
  color: #ff7b7b;
  font-size: 0.875rem;
}
</style>
