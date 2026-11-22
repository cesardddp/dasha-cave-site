declare module '#auth-utils' {
  interface User {
    id: number
    name: string
    email: string
    avatar?: string | null
    role: 'admin' | 'commenter'
  }

  interface UserSession {
    loggedInAt: string
  }
}

export {}
