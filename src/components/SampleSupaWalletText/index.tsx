"use client"

import { useSupaWalletUser } from '../SupaWalletUserProvider'

export const SampleSupaWalletText = () => {
    const { supaUser } = useSupaWalletUser()

    return <div>
        <table>
            <tbody>
                <tr><td>User ID</td><td>{supaUser?.id}</td></tr>
                <tr><td>World username</td><td>{supaUser?.user_metadata['worldUsername']}</td></tr>
                <tr><td>World profile pic</td><td><img width={32} src={supaUser?.user_metadata['worldProfilePictureUrl']} /></td></tr>
            </tbody>
        </table>
    </div>
}

