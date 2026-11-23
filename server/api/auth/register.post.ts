import { rejectRegistration } from '../../utils/database-write-lock'

export default defineEventHandler(() => rejectRegistration())
