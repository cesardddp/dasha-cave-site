import { rejectAuthentication } from '../../utils/database-write-lock'

export default defineEventHandler(() => rejectAuthentication())
