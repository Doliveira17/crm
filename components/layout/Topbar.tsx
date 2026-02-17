'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ThemeToggle } from './ThemeToggle'

export function Topbar() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Limpar storage local primeiro
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Fazer signOut do Supabase
      await supabase.auth.signOut({ scope: 'global' })
      
      toast.success('Logout realizado com sucesso')
      
      // Redirecionar e forçar reload completo
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Force logout even if error
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      window.location.href = '/login'
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
          className="text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  )
}
