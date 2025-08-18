// Server-only exports that use next/headers or other server-side APIs
export { getServerSideAccessToken } from './utils/supabase/server'
export { POST as signInWalletPostHandler } from './api/sign-in-with-wallet/route'
export { updateSession as updateSessionMiddleware } from './utils/supabase/middleware'