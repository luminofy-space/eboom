// app/providers/auth-provider.tsx
'use client'

import { createContext, useContext, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import supabase from '@/utils/useSupabaseClient'
import { useAuth } from '@/src/hooks/useAuth'
import useQueryApi from '@/src/api/useQuery'
import API_ROUTES from '@/src/api/urls'
import { User } from '@backend/db/schema'

interface AuthContextType {
  loading: boolean
  supabase: ReturnType<typeof createBrowserClient>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  user: Partial<User> | null
  userLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const { refresh, loading, logout, accessToken } = useAuth();

  const isAuthenticated = !!accessToken;

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQueryApi<{ user: Partial<User> }>(
    API_ROUTES.USERS_GET_ME,
    {
      queryKey: ["user"],
      hasToken: true,
      enabled: isAuthenticated,
    }
  );

  const user = userData?.user || null;

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
        user,
        userLoading,
      }}
    >
      {content}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
