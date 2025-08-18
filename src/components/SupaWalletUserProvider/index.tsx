"use client"

import Cookies from 'js-cookie'
import { Session } from '@supabase/supabase-js'
import { walletAuth } from "../../auth"
import { useMiniKit } from "@worldcoin/minikit-js/minikit-provider"
import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react"
import { User } from "@supabase/supabase-js"
import { createBasicClient } from "../../utils/supabase/client"

const SupaUserContext = createContext<
    {
        supaUser: User | null
        setSupaUser: React.Dispatch<React.SetStateAction<User | null>>
        supabase: ReturnType<typeof createBasicClient>
    } | undefined
>(undefined)

export const useSupaWalletUser = () => {
    const context = useContext(SupaUserContext)
    if (!context) {
        throw new Error("useSupaWalletUser must be used within SupaWalletUserProvider")
    }
    return context
}

export const SupaWalletUserProvider = ({ children, loadingChildren }: {
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
            updateCookieForSession(session)
            setSupaUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    if (!isInstalled) {
        return <div>This is a mini-app that should run from World App</div>
    }

    return (
        <SupaUserContext.Provider value={{ supaUser, setSupaUser, supabase }}>
            {supaUser ? children : loadingChildren}
        </SupaUserContext.Provider>
    )
}

const updateCookieForSession = (session: Session | undefined | null) => {
  if (!session) {
    Cookies.remove('supa-token')
    return
  }
  const accessToken = session.access_token
  const expires = new Date((new Date()).getTime() + session.expires_in * 1000);
  Cookies.set('supa-token', accessToken, { expires })
}
