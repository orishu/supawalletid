"use client"

import { useSupaWalletUser } from '../SupaWalletUserProvider'

export const SampleSupaWalletText = () => {
    const { supaUser } = useSupaWalletUser()

    return <p>{supaUser?.id} : {supaUser?.email}</p>
}

