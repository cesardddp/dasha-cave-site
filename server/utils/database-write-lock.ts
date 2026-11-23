export function rejectDatabaseWrite() {
  throw createError({
    statusCode: 503,
    statusMessage: 'As gravações no banco de dados estão temporariamente desativadas.',
  })
}

export function rejectRegistration() {
  throw createError({
    statusCode: 503,
    statusMessage: 'A criação de contas está temporariamente desativada.',
  })
}
