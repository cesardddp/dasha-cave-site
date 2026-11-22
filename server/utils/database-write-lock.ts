export function rejectDatabaseWrite() {
  throw createError({
    statusCode: 503,
    statusMessage: 'As gravações no banco de dados estão temporariamente desativadas.',
  })
}

export function rejectAuthentication() {
  throw createError({
    statusCode: 503,
    statusMessage: 'Entradas e criação de contas estão temporariamente desativadas.',
  })
}
