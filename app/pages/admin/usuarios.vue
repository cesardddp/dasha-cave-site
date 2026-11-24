<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { ManagedUser, ManagedUserRole } from '#shared/types/user'

const { loggedIn, user, fetch: refreshSession } = useUserSession()

useSeoMeta({
  title: 'Usuários | Dasha Cave',
  robots: 'noindex, nofollow',
})

const accounts = ref<ManagedUser[]>([])
const query = ref('')
const errorMessage = ref('')
const notice = ref('')

const draft = reactive({
  name: '',
  email: '',
  password: '',
  role: 'commenter' as ManagedUserRole,
})
const creating = ref(false)
const busyId = ref<number | null>(null)
const passwordTargetId = ref<number | null>(null)
const newPassword = ref('')

const filteredAccounts = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term)
    return accounts.value

  return accounts.value.filter(account =>
    account.name.toLowerCase().includes(term) || account.email.toLowerCase().includes(term),
  )
})
const adminCount = computed(() =>
  accounts.value.filter(account => account.role === 'admin').length,
)

function showError(cause: unknown) {
  if (cause && typeof cause === 'object' && 'statusMessage' in cause && typeof cause.statusMessage === 'string') {
    errorMessage.value = cause.statusMessage
  }
  else if (cause instanceof Error) {
    errorMessage.value = cause.message
  }
  else {
    errorMessage.value = 'Não foi possível concluir a operação.'
  }
}

function resetMessages() {
  errorMessage.value = ''
  notice.value = ''
}

async function loadAccounts() {
  accounts.value = await $fetch<ManagedUser[]>('/api/admin/users')
}

onMounted(async () => {
  try {
    await $fetch('/api/auth/me')
    await refreshSession()
    if (loggedIn.value && user.value?.role === 'admin')
      await loadAccounts()
  }
  catch (cause) {
    showError(cause)
  }
})

async function logout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refreshSession()
    accounts.value = []
    resetMessages()
  }
  catch (cause) {
    showError(cause)
  }
}

async function createAccount() {
  creating.value = true
  resetMessages()
  try {
    const result = await $fetch<{ generatedPassword?: string }>('/api/admin/users', {
      method: 'POST',
      body: {
        name: draft.name,
        email: draft.email,
        password: draft.password,
        role: draft.role,
      },
    })
    notice.value = result.generatedPassword
      ? `Conta de ${draft.email} criada. Senha temporária: ${result.generatedPassword}`
      : `Conta de ${draft.email} criada.`
    draft.name = ''
    draft.email = ''
    draft.password = ''
    draft.role = 'commenter'
    await loadAccounts()
  }
  catch (cause) {
    showError(cause)
  }
  finally {
    creating.value = false
  }
}

async function changeRole(account: ManagedUser, role: ManagedUserRole) {
  busyId.value = account.id
  resetMessages()
  try {
    await $fetch(`/api/admin/users/${account.id}/role`, { method: 'PATCH', body: { role } })
    notice.value = role === 'admin'
      ? `${account.name} agora é administrador.`
      : `${account.name} agora é comentador.`
    await loadAccounts()
  }
  catch (cause) {
    showError(cause)
  }
  finally {
    busyId.value = null
  }
}

function startPasswordReset(account: ManagedUser) {
  resetMessages()
  passwordTargetId.value = passwordTargetId.value === account.id ? null : account.id
  newPassword.value = ''
}

async function submitPasswordReset(account: ManagedUser) {
  busyId.value = account.id
  resetMessages()
  try {
    await $fetch(`/api/admin/users/${account.id}/password`, {
      method: 'PUT',
      body: { password: newPassword.value },
    })
    notice.value = `Senha de ${account.name} atualizada.`
    passwordTargetId.value = null
    newPassword.value = ''
  }
  catch (cause) {
    showError(cause)
  }
  finally {
    busyId.value = null
  }
}

async function removeAccount(account: ManagedUser) {
  if (!window.confirm(`Excluir a conta de ${account.name} (${account.email})? Esta ação não pode ser desfeita.`))
    return

  busyId.value = account.id
  resetMessages()
  try {
    await $fetch(`/api/admin/users/${account.id}`, { method: 'DELETE' })
    notice.value = `Conta de ${account.name} excluída.`
    await loadAccounts()
  }
  catch (cause) {
    showError(cause)
  }
  finally {
    busyId.value = null
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}
</script>

<template>
  <main class="user-admin">
    <NuxtLink class="user-admin__back" to="/livros/admin">
      ← Voltar ao editor de livros
    </NuxtLink>

    <section v-if="!loggedIn" class="user-admin__gate">
      <p class="user-admin__eyebrow">
        Área de administração
      </p>
      <h1>Usuários</h1>
      <p>Entre com uma conta de administrador para gerenciar as contas do site.</p>
      <NuxtLink
        class="user-admin__gate-action"
        :to="{ path: '/login', query: { redirect: '/admin/usuarios' } }"
      >
        Entrar
      </NuxtLink>
    </section>

    <section v-else-if="user?.role !== 'admin'" class="user-admin__gate">
      <p class="user-admin__eyebrow">
        Perfil de comentador
      </p>
      <h1>Usuários</h1>
      <p>Sua conta pode ler o blog e comentar. Somente administradores gerenciam contas.</p>
      <button class="user-admin__gate-action" type="button" @click="logout">
        Sair
      </button>
    </section>

    <template v-else>
      <header class="user-admin__header">
        <div>
          <p class="user-admin__eyebrow">
            Área de administração
          </p>
          <h1>Usuários</h1>
          <p>{{ accounts.length }} contas · {{ adminCount }} administradores</p>
        </div>
        <button class="user-admin__ghost" type="button" @click="logout">
          Sair
        </button>
      </header>

      <p v-if="errorMessage" class="user-admin__message user-admin__message--error" role="alert">
        {{ errorMessage }}
      </p>
      <p v-if="notice" class="user-admin__message user-admin__message--notice" role="status">
        {{ notice }}
      </p>

      <section class="user-admin__panel" aria-labelledby="create-account-title">
        <h2 id="create-account-title">
          Nova conta
        </h2>
        <form class="user-admin__create-form" @submit.prevent="createAccount">
          <label>
            Nome
            <input v-model="draft.name" minlength="2" maxlength="100" autocomplete="off" required>
          </label>
          <label>
            E-mail
            <input v-model="draft.email" type="email" maxlength="254" autocomplete="off" required>
          </label>
          <label>
            Senha (deixe em branco para gerar)
            <input
              v-model="draft.password"
              type="text"
              minlength="8"
              maxlength="128"
              autocomplete="off"
              placeholder="Mínimo de 8 caracteres"
            >
          </label>
          <label>
            Perfil
            <select v-model="draft.role">
              <option value="commenter">Comentador</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <button type="submit" :disabled="creating">
            {{ creating ? 'Criando…' : 'Criar conta' }}
          </button>
        </form>
      </section>

      <section class="user-admin__panel" aria-labelledby="account-list-title">
        <div class="user-admin__list-heading">
          <h2 id="account-list-title">
            Contas
          </h2>
          <label class="user-admin__search">
            <span>Buscar</span>
            <input v-model="query" type="search" placeholder="Nome ou e-mail" autocomplete="off">
          </label>
        </div>

        <p v-if="!filteredAccounts.length" class="user-admin__empty">
          {{ accounts.length ? 'Nenhuma conta corresponde à busca.' : 'Ainda não há contas cadastradas.' }}
        </p>

        <ul v-else class="user-admin__list">
          <li v-for="account in filteredAccounts" :key="account.id" class="user-admin__row">
            <div class="user-admin__identity">
              <span class="user-admin__avatar" aria-hidden="true">
                {{ initials(account.name) }}
              </span>
              <div>
                <p class="user-admin__name">
                  {{ account.name }}
                  <span v-if="account.id === user?.id" class="user-admin__you">você</span>
                </p>
                <p class="user-admin__email">
                  {{ account.email }}
                </p>
                <p class="user-admin__meta">
                  Desde {{ formatDate(account.createdAt) }}
                  <template v-if="account.isConfigAdmin">
                    · admin por configuração
                  </template>
                </p>
              </div>
            </div>

            <div class="user-admin__row-actions">
              <span class="user-admin__badge" :class="{ 'user-admin__badge--admin': account.role === 'admin' }">
                {{ account.role === 'admin' ? 'Administrador' : 'Comentador' }}
              </span>

              <button
                v-if="account.role === 'admin'"
                type="button"
                :disabled="busyId === account.id || account.isConfigAdmin"
                :title="account.isConfigAdmin ? 'Definido pela configuração do servidor' : undefined"
                @click="changeRole(account, 'commenter')"
              >
                Tornar comentador
              </button>
              <button
                v-else
                type="button"
                :disabled="busyId === account.id"
                @click="changeRole(account, 'admin')"
              >
                Tornar administrador
              </button>

              <button
                type="button"
                :disabled="busyId === account.id"
                @click="startPasswordReset(account)"
              >
                {{ passwordTargetId === account.id ? 'Cancelar senha' : 'Redefinir senha' }}
              </button>

              <button
                class="user-admin__danger"
                type="button"
                :disabled="busyId === account.id || account.isConfigAdmin || account.id === user?.id"
                :title="account.isConfigAdmin
                  ? 'Definido pela configuração do servidor'
                  : account.id === user?.id ? 'Você não pode excluir a própria conta' : undefined"
                @click="removeAccount(account)"
              >
                Excluir
              </button>
            </div>

            <form
              v-if="passwordTargetId === account.id"
              class="user-admin__password-form"
              @submit.prevent="submitPasswordReset(account)"
            >
              <label>
                Nova senha para {{ account.name }}
                <input
                  v-model="newPassword"
                  type="text"
                  minlength="8"
                  maxlength="128"
                  autocomplete="off"
                  required
                >
              </label>
              <button type="submit" :disabled="busyId === account.id">
                Salvar senha
              </button>
            </form>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

<style scoped>
.user-admin {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 2rem 1rem 4rem;
  color: #fff;
}

.user-admin__back {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  margin-bottom: 1.5rem;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.user-admin__back:hover {
  color: #00ffaa;
}

.user-admin__gate,
.user-admin__panel {
  border: 1px solid rgb(112 230 218 / 30%);
  border-radius: 1rem;
  background: rgb(9 18 16 / 72%);
  box-shadow: 0 12px 32px rgb(0 0 0 / 30%);
}

.user-admin__gate {
  width: min(100%, 440px);
  margin: 4vh auto 0;
  padding: 2rem;
}

.user-admin__gate h1,
.user-admin__header h1 {
  margin: 0;
  font-size: clamp(1.7rem, 5vw, 2.4rem);
}

.user-admin__gate > p:not(.user-admin__eyebrow) {
  color: rgb(255 255 255 / 75%);
  line-height: 1.55;
}

.user-admin__eyebrow {
  margin: 0 0 0.4rem;
  color: #00ffaa;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.user-admin__gate-action {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  margin-top: 1.5rem;
  border: 1px solid rgb(112 230 218 / 50%);
  border-radius: 0.6rem;
  background: linear-gradient(135deg, #005d50 0%, #00626f 100%);
  color: #fff;
  font: inherit;
  font-weight: 700;
  text-decoration: none;
}

.user-admin__gate-action:hover,
.user-admin__gate-action:focus-visible {
  border-color: #00ffaa;
  color: #00ffaa;
}

.user-admin__header {
  display: flex;
  max-width: 1100px;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto 1.5rem;
  gap: 1rem;
}

.user-admin__header p:not(.user-admin__eyebrow) {
  margin: 0.35rem 0 0;
  color: rgb(255 255 255 / 70%);
}

.user-admin__panel,
.user-admin__message {
  width: min(100%, 1100px);
  margin: 0 auto 1rem;
}

.user-admin__panel {
  padding: clamp(1rem, 3vw, 1.5rem);
}

.user-admin__panel h2 {
  margin: 0 0 1rem;
  font-size: 1.2rem;
}

.user-admin__create-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  align-items: end;
  gap: 0.75rem;
}

.user-admin__create-form label,
.user-admin__password-form label,
.user-admin__search {
  display: grid;
  gap: 0.4rem;
  color: rgb(255 255 255 / 75%);
  font-size: 0.8rem;
}

.user-admin input,
.user-admin select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 42px;
  padding: 0.65rem 0.8rem;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 0.55rem;
  background: rgb(0 0 0 / 30%);
  color: #fff;
  font: inherit;
}

.user-admin select {
  padding-right: 2rem;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #00ffaa 50%),
    linear-gradient(135deg, #00ffaa 50%, transparent 50%);
  background-position: calc(100% - 18px) 50%, calc(100% - 13px) 50%;
  background-repeat: no-repeat;
  background-size: 5px 5px, 5px 5px;
}

.user-admin button {
  min-height: 42px;
  padding: 0.6rem 1rem;
  border: 1px solid rgb(112 230 218 / 45%);
  border-radius: 0.65rem;
  background: linear-gradient(135deg, #0f382a, #1b2622);
  color: #00ffaa;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.user-admin button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.user-admin button:focus-visible,
.user-admin input:focus-visible,
.user-admin select:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 2px;
}

.user-admin .user-admin__ghost {
  background: transparent;
}

.user-admin .user-admin__danger {
  border-color: rgb(255 105 105 / 55%);
  background: rgb(110 20 24 / 50%);
  color: #ffb6b6;
}

.user-admin__list-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 0.75rem;
}

.user-admin__list-heading h2 {
  margin: 0;
}

.user-admin__search {
  width: min(100%, 260px);
}

.user-admin__empty {
  margin: 1rem 0 0;
  color: rgb(255 255 255 / 65%);
}

.user-admin__list {
  display: grid;
  margin: 1rem 0 0;
  padding: 0;
  gap: 0.65rem;
  list-style: none;
}

.user-admin__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  padding: 0.85rem;
  gap: 0.75rem;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 0.75rem;
  background: rgb(0 0 0 / 22%);
}

.user-admin__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
}

.user-admin__avatar {
  display: grid;
  width: 2.4rem;
  height: 2.4rem;
  flex: none;
  place-items: center;
  border: 1px solid rgb(0 255 170 / 40%);
  border-radius: 50%;
  background: rgb(0 70 48 / 55%);
  color: #b7ffe6;
  font-weight: 800;
}

.user-admin__name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin: 0;
  gap: 0.4rem;
  font-weight: 700;
}

.user-admin__you {
  padding: 0.05rem 0.4rem;
  border: 1px solid rgb(0 255 170 / 35%);
  border-radius: 999px;
  color: #b7ffe6;
  font-size: 0.65rem;
  font-weight: 700;
}

.user-admin__email {
  margin: 0.15rem 0 0;
  overflow-wrap: anywhere;
  color: rgb(255 255 255 / 70%);
  font-size: 0.85rem;
}

.user-admin__meta {
  margin: 0.2rem 0 0;
  color: rgb(255 255 255 / 45%);
  font-size: 0.72rem;
}

.user-admin__row-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
}

.user-admin__row-actions button {
  min-height: 36px;
  padding: 0.4rem 0.7rem;
  font-size: 0.78rem;
}

.user-admin__badge {
  padding: 0.2rem 0.55rem;
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 999px;
  color: rgb(255 255 255 / 70%);
  font-size: 0.7rem;
  font-weight: 700;
}

.user-admin__badge--admin {
  border-color: rgb(0 255 170 / 45%);
  background: rgb(0 255 170 / 10%);
  color: #b7ffe6;
}

.user-admin__password-form {
  display: flex;
  grid-column: 1 / -1;
  flex-wrap: wrap;
  align-items: end;
  padding-top: 0.75rem;
  gap: 0.6rem;
  border-top: 1px solid rgb(255 255 255 / 10%);
}

.user-admin__password-form label {
  flex: 1 1 240px;
}

.user-admin__message {
  padding: 0.8rem 1rem;
  border-radius: 0.6rem;
}

.user-admin__message--error {
  border: 1px solid rgb(255 110 110 / 45%);
  background: rgb(110 20 24 / 55%);
  color: #ffd1d1;
}

.user-admin__message--notice {
  border: 1px solid rgb(0 255 170 / 35%);
  background: rgb(0 70 48 / 55%);
  color: #b7ffe6;
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .user-admin__row {
    grid-template-columns: 1fr;
  }

  .user-admin__row-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 520px) {
  .user-admin__header {
    align-items: stretch;
    flex-direction: column;
  }

  .user-admin__search {
    width: 100%;
  }
}
</style>
