'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/lib/hooks/useAuth'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, role, roleLoading, permissions } = useAuth()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30000,
          },
        },
      })
  )

  useEffect(() => {
    if (loading || roleLoading) return

    if (!user) {
      router.replace('/login')
      return
    }

    //Se for role limitada, verificar permissões
    if (role === 'limitada') {
      // Pegar primeira parte da rota (ex: /clientes/123 -> clientes)
      const routeSegment = pathname.split('/')[1]
      
      // Se não tem permissão para essa seção, redirecionar para primeira permitida
      if (!permissions[routeSegment]) {
        const firstAllowedRoute = Object.keys(permissions).find(key => permissions[key])
        if (firstAllowedRoute) {
          router.replace(`/${firstAllowedRoute}`)
        } else {
          // Sem permissões, redirecionar para mensagem de acesso negado
          router.replace('/sem-acesso')
        }
      }
    }
  }, [loading, roleLoading, user, role, permissions, pathname, router])

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Carregando...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>{children}</AppShell>
      <Toaster />
    </QueryClientProvider>
  )
}
