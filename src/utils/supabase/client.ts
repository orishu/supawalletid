import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton instance to prevent multiple GoTrueClient instances
let basicClientInstance: SupabaseClient | null = null;

export const createBasicClient = () => {
  if (!basicClientInstance) {
    console.log('SupaWalletID: Creating new basicClient instance');
    basicClientInstance = createClient(
      supabaseUrl!,
      supabaseKey!,
      {
        auth: {
          persistSession: true,
          storageKey: 'supabase.auth.token', // Use consistent storage key
        }
      }
    );
  } else {
    console.log('SupaWalletID: Reusing existing basicClient instance');
  }
  return basicClientInstance;
}
