// app/providers/auth-provider.tsx
'use client'

import { createContext, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import supabase from '@/utils/useSupabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface AuthContextType {
  loading: boolean
  supabase: ReturnType<typeof createBrowserClient>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const { refresh, loading, logout } = useAuth();

  const { getItem } = useLocalStorage();
  const isAuthenticated = !!getItem("accessToken");

  useEffect(() => {
    // Only guard client routes after the initial load
    if (loading) return;

    const publicRoutes = ['/login', '/signup', '/forgot-password'];
    const isPublic = publicRoutes.includes(pathname);
    const authed = isAuthenticated;

    if (!authed && !isPublic) {
      // remember the intended route so we can send the user back after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectAfterLogin', pathname);
      }
      router.push('/login');
    }
  }, [loading, pathname, router, isAuthenticated]);

  const content = loading ? <div>Loading...</div> : children;

  return (
    <AuthContext.Provider
      value={{
        loading,
        supabase,
        signOut: logout as () => Promise<void>,
        refresh: async () => {
          await refresh();
        },
      }}
    >
      {content}
    </AuthContext.Provider>
  )
}
