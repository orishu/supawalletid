"use client"

import { walletAuth } from "@/auth"
import { useMiniKit } from "@worldcoin/minikit-js/minikit-provider"
import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react"
import { User } from "@supabase/supabase-js"
import { createBasicClient } from "@/utils/supabase/client"

const SupaUserContext = createContext<
    {
        supaUser: User | null
        setSupaUser: React.Dispatch<React.SetStateAction<User | null>>
    } | undefined
>(undefined)

export const useSupaUser = () => {
    const context = useContext(SupaUserContext)
    if (!context) {
        throw new Error("useSupaUser must be used within SupaWalletUser")
    }
    return context
}

export const SupaWalletUser = ({ children, loadingChildren }: {
    children: React.ReactNode
    loadingChildren: React.ReactNode
}) => {
    const [supaUser, setSupaUser] = useState<User | null>(null)
    const supabase = createBasicClient()

    const { isInstalled } = useMiniKit()

    useEffect(() => {
        //supabase.auth.signOut(); return
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                walletAuth().then((maybeUser) => {
                    setSupaUser(maybeUser)
                })
            } else {
                setSupaUser(user)
            }
        })
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSupaUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    if (!isInstalled) {
        return <div>This is a mini-app that should run from World App</div>
    }

    return (
        <SupaUserContext.Provider value={{ supaUser, setSupaUser }}>
            {supaUser ? children : loadingChildren}
        </SupaUserContext.Provider>
    )
}
