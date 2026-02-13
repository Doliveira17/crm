'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ThemeToggle } from './ThemeToggle'

export function Topbar() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logout realizado com sucesso')
      router.push('/login')
    } catch (error) {
      toast.error('Erro ao fazer logout')
      console.error(error)
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <User className="h-4 w-4 text-slate-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">Usuário</span>
            <span className="text-xs text-slate-500">Sistema CRM</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="h-5 w-px bg-slate-200"></div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  )
}
