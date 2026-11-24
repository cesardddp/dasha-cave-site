<script setup lang="ts">
// Navbar discreta: sem bordas, fundo transparente, texto pequeno.
// Serve também como indicador de sessão — quando logado, mostra o nome
// do usuário e um link discreto para sair.
const { loggedIn, user, fetch: refreshSession } = useUserSession()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshSession()
  await navigateTo('/login')
}
</script>

<template>
  <nav class="topbar" aria-label="Navegação do site">
    <div class="topbar__left">
      <NuxtLink to="/" class="topbar__link">Dasha Cave</NuxtLink>
      <NuxtLink to="/blog" class="topbar__link">Blog</NuxtLink>
      <NuxtLink to="https://www.amazon.com.br/stores/Dasha-Cave/author/B0G86SCW8B" class="topbar__link flex items-center gap-1" target="_blank">
        Amazon
        <Icon name="lucide:external-link" class="topbar__link-icon" aria-hidden="true" />
      </NuxtLink>
    </div>
    <div class="topbar__right">
      <template v-if="loggedIn">
        <span class="topbar__session">
          <Icon name="lucide:user-round" class="topbar__link-icon" aria-hidden="true" />
          <span class="topbar__user">{{ user?.name || 'Logado' }}</span>
        </span>
        <button class="topbar__link topbar__button" type="button" @click="logout">Sair</button>
      </template>
      <NuxtLink v-else to="/login" class="topbar__link">
        <span class="topbar__session">
          <Icon name="lucide:user-round" class="topbar__link-icon" aria-hidden="true" />
          <span>Entrar</span>
        </span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.topbar {
  position: absolute;
  inset: 0 0 auto 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.4rem 1.25rem;
  background: transparent;
  border: none;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  color: rgb(255 255 255 / 45%);
}

.topbar__left,
.topbar__right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.topbar__link {
  color: rgb(255 255 255 / 45%);
  text-decoration: none;
  transition: color 0.2s ease;
}

.topbar__session {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.topbar__link-icon {
  width: 0.9rem;
  height: 0.9rem;
  flex: none;
}

.topbar__link:hover {
  color: #00ffaa;
}

.topbar__button {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  cursor: pointer;
}

.topbar__user {
  color: rgb(255 255 255 / 60%);
}

@media (max-width: 480px) {
  .topbar__left {
    gap: 0.75rem;
  }
}
</style>
