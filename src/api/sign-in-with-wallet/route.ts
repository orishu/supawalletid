import { NextRequest, NextResponse } from 'next/server';
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from '@worldcoin/minikit-js'
import { getSignedNonce } from '../../auth/getSignedNonce'
import { SignInWithPasswordCredentials, User } from '@supabase/supabase-js';
import { createServiceRoleClient } from '../../utils/supabase/server';
import { randomBytes, randomUUID } from 'crypto';

interface IWalletAuthRequest {
    nonce: string
    signedNonce: string
    finalPayloadJson: string
}

export async function POST(req: NextRequest): Promise<NextResponse<SignInWithPasswordCredentials | null>> {
    const { nonce, signedNonce, finalPayloadJson } = (await req.json()) as IWalletAuthRequest

    const expectedSignedNonce = getSignedNonce({ nonce })

    if (signedNonce !== expectedSignedNonce) {
        console.log('Invalid signed nonce')
        return NextResponse.json(null, { status: 400, statusText: 'invalid signed nonce' })
    }

    const finalPayload: MiniAppWalletAuthSuccessPayload = JSON.parse(finalPayloadJson)
    const result = await verifySiweMessage(finalPayload, nonce)

    if (!result.isValid || !result.siweMessageData.address) {
        console.log('Invalid final payload')
        return NextResponse.json(null, { status: 400, statusText: 'invalid final payload' })
    }
    const address = result.siweMessageData.address!

    const supabase = createServiceRoleClient()
    const { data: existing_user } = await supabase
        .from('wallet_user')
        .select('user_id')
        .eq('wallet', address)
        .maybeSingle()
    const genPassword = (): string => randomBytes(16).toString('hex')
    if (existing_user?.user_id) {
        const user: User = (await supabase.auth.admin.getUserById(existing_user.user_id)).data.user!
        const newPassword = genPassword()
        await supabase.auth.admin.updateUserById(
            user.id,
            {
                password: newPassword,
            })
        return NextResponse.json({
            email: user.email!,
            password: newPassword,
        }, { status: 200 })
    }

    const internalUid = randomUUID()
    const fakeEmailAddress = `placeholder-${internalUid}@example.com`
    const newPassword = genPassword()
    const userResponse = await supabase.auth.admin.createUser({
        email: fakeEmailAddress,
        email_confirm: true,
        password: newPassword,
        user_metadata: { address: address },
        app_metadata: {
            internalUid: internalUid,
        },
    })
    if (userResponse.error) {
        console.log(`Failed to create new user: ${userResponse.error}`)
        return NextResponse.json(null, { status: 400, statusText: 'failed to create user' })
    }
    const userId = userResponse.data.user.id
    await supabase
        .from('wallet_user')
        .insert({
            user_id: userId,
            wallet: address,
        })

    return NextResponse.json({
        email: fakeEmailAddress,
        password: newPassword,
    }, { status: 200 })
}
