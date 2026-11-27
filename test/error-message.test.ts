import { describe, expect, it } from 'vitest'

import { getErrorMessage } from '../shared/utils/error-message'

describe('getErrorMessage', () => {
  it('usa o corpo JSON quando o statusText vem vazio (HTTP/2)', () => {
    const error = {
      statusCode: 401,
      statusMessage: '',
      statusText: '',
      message: '[POST] "/api/auth/login": 401 ',
      data: { statusCode: 401, statusMessage: 'Server Error', message: 'E-mail ou senha inválidos' },
    }
    expect(getErrorMessage(error, 'falhou')).toBe('E-mail ou senha inválidos')
  })

  it('ignora o placeholder "Server Error" do Nitro', () => {
    const error = { data: { statusCode: 500, statusMessage: 'Server Error', message: 'Server Error' } }
    expect(getErrorMessage(error, 'falhou')).toBe('falhou')
  })

  it('cai no fallback quando o erro não traz mensagem', () => {
    expect(getErrorMessage(new Error(''), 'falhou')).toBe('falhou')
    expect(getErrorMessage(null, 'falhou')).toBe('falhou')
  })
})
