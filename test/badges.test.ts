import { describe, expect, it } from 'vitest'

import { parseBadges } from '../shared/utils/badges'

describe('parseBadges', () => {
  it('separa o texto por espaços, inclusive múltiplos', () => {
    expect(parseBadges('Single  Ao Vivo')).toEqual(['Single', 'Ao', 'Vivo'])
  })

  it('ignora espaços nas pontas e valores vazios', () => {
    expect(parseBadges('  Single  ')).toEqual(['Single'])
    expect(parseBadges('   ')).toEqual([])
    expect(parseBadges('')).toEqual([])
  })

  it('não repete badges iguais', () => {
    expect(parseBadges('Single Ao Single')).toEqual(['Single', 'Ao'])
  })

  it('devolve lista vazia quando o campo não tem texto', () => {
    expect(parseBadges(null)).toEqual([])
    expect(parseBadges(undefined)).toEqual([])
  })
})
