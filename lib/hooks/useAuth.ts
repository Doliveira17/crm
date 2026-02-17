'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export type AppRole = 'admin' | 'limitada'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<AppRole>('admin')
  const [roleLoading, setRoleLoading] = useState(true)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    
    const resolveRole = async (userId: string | null) => {
      if (!isMounted || !userId) {
        if (isMounted) {
          setRole('admin')
          setRoleLoading(false)
        }
        return
      }

      try {
        const { data, error } = await (supabase as any)
          .from('user_roles')
          .select('role, permissions')
          .eq('user_id', userId)
          .maybeSingle()
        
        if (!isMounted) return
        
        // Se a tabela não existir, assume admin por padrão
        if (error && (error.message?.includes('does not exist') || error.code === '42P01')) {
          console.warn('Tabela user_roles não encontrada. Usando role padrão: admin')
          setRole('admin')
          setPermissions({})
          setRoleLoading(false)
          return
        }

        const roleValue = (data as { role?: AppRole; permissions?: Record<string, boolean> } | null)?.role
        const userPermissions = (data as { role?: AppRole; permissions?: Record<string, boolean> } | null)?.permissions || {}

        if (roleValue === 'limitada' || roleValue === 'admin') {
          setRole(roleValue)
          setPermissions(userPermissions)
        } else {
          setRole('admin')
          setPermissions({})
        }
        setRoleLoading(false)
      } catch (err) {
        if (isMounted) {
          console.warn('Erro ao buscar role, usando padrão:', err)
          setRole('admin')
          setPermissions({})
          setRoleLoading(false)
        }
      }
    }

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (isMounted) {
          setUser(user)
          await resolveRole(user?.id ?? null)
          setLoading(false)
          setInitialized(true)
        }
      } catch (error) {
        if (isMounted) {
          setUser(null)
          setRole('admin')
          setPermissions({})
          setRoleLoading(false)
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    if (!initialized) {
      getUser()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isMounted) {
        setUser(session?.user || null)
        await resolveRole(session?.user?.id ?? null)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [initialized])

  const logout = async () => {
    try {
      // Limpar estados imediatamente
      setUser(null)
      setRole('admin')
      setPermissions({})
      setRoleLoading(false)
      
      // Fazer signOut do Supabase
      await supabase.auth.signOut({ scope: 'local' })
      
      // Redirecionar para login
      router.push('/login')
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, tentar redirecionar
      router.push('/login')
    }
  }

  return { user, loading, role, roleLoading, permissions, logout }
}
