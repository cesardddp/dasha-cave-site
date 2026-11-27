// Stub de "bun:test" para o runner vitest.
// @nuxt/test-utils faz `await import("bun:test")` apenas quando o runner
// detectado é o bun; sob vitest este módulo nunca é executado em runtime,
// só precisa resolver em build-time para o Vite não quebrar.
export const mock = () => {}
export const beforeAll = () => {}
export const beforeEach = () => {}
export const afterEach = () => {}
export const afterAll = () => {}
