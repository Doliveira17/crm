'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N ou Cmd+N - Novo Cliente
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        router.push('/clientes/novo')
      }

      // Ctrl+K ou Cmd+K - Focar busca (se existir)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"]')
        searchInput?.focus()
      }

      // Ctrl+B ou Cmd+B - Voltar para Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        router.push('/dashboard')
      }

      // Esc - Voltar
      if (e.key === 'Escape') {
        const isOnDetailPage = window.location.pathname.includes('/clientes/') || 
                                window.location.pathname.includes('/contatos/')
        if (isOnDetailPage && !window.location.pathname.endsWith('/novo')) {
          router.back()
        }
      }

      // Ctrl+S - Salvar (se estiver em um formulário)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const isFormPage = window.location.pathname.includes('/novo') || 
                          window.location.pathname.includes('/editar')
        if (isFormPage) {
          // O evento será tratado pelos componentes de formulário individuais
          // Apenas prevenimos o comportamento padrão do navegador
          e.preventDefault()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])
}
