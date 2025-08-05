"use client"

import { useSupaUser } from '@/components/SupaWalletIdentity'

export const SupaWalletText = () => {
    const { supaUser } = useSupaUser()

    return <p>{supaUser?.id} : {supaUser?.email}</p>
}

