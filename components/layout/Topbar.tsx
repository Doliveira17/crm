'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ThemeToggle } from './ThemeToggle'

export function Topbar() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      // Limpar storage local primeiro
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Fazer signOut do Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      
      if (error) {
        console.error('Erro ao fazer logout:', error)
      }
      
      // Aguardar um pouco para garantir que tudo foi limpo
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast.success('Logout realizado com sucesso')
      
      // Redirecionar usando router.push e depois forçar reload
      router.push('/login')
      
      // Forçar reload completo para garantir que todo estado foi limpo
      await new Promise(resolve => setTimeout(resolve, 800))
      window.location.href = '/login'
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      
      // Force logout mesmo se houver erro
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Redirecionar mesmo assim
      await new Promise(resolve => setTimeout(resolve, 500))
      window.location.href = '/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
      <div />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="h-5 w-px bg-border"></div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          {isLoggingOut ? 'Saindo...' : 'Sair'}
        </Button>
      </div>
    </header>
  )
}
