import { MiniKit } from '@worldcoin/minikit-js'
import { getNewNonces } from './getNewNonces'
import { createBasicClient } from '../utils/supabase/client'
import { SignInWithPasswordCredentials } from '@supabase/supabase-js'

export const walletAuth = async () => {
  const { nonce, signedNonce } = await getNewNonces()

  const result = await MiniKit.commandsAsync.walletAuth({
    nonce,
    expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
    statement: `Authenticate (${crypto.randomUUID().replace(/-/g, '')}).`,
  })

  if (!result) {
    throw new Error('Wallet authentication failed')
  }

  if (result.finalPayload.status !== 'success') {
    throw new Error('Wallet authentication failed')
  }

  const supabase = createBasicClient()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  const signInResponse = await fetch(`${baseUrl}/api/sign-in-with-wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nonce,
      signedNonce,
      finalPayloadJson: JSON.stringify(result.finalPayload),
    }),
  })
  const responsePayload = await signInResponse.json() as SignInWithPasswordCredentials
  console.log(`sign in response payload: ${JSON.stringify(responsePayload)}`)

  const authResp = await supabase.auth.signInWithPassword(responsePayload)
  console.log(`Auth response: ${JSON.stringify(authResp)}`)

  const userResponse = await supabase.auth.getUser()
  console.log(`user after signing in with wallet: ${JSON.stringify(userResponse)}`)
  return userResponse.data.user
}
