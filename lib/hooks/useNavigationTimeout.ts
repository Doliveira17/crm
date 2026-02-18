'use client'

import { useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const NAVIGATION_TIMEOUT = 6000 // 6 segundos

export function useNavigationTimeout() {
  const router = useRouter()
  const [isPending] = useTransition()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const navigationStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (isPending) {
      // Navegação iniciada
      navigationStartRef.current = Date.now()
      
      timeoutRef.current = setTimeout(() => {
        // Se ainda estiver pendente após 6 segundos, redirecionar
        console.warn('⏱️ Navegação demorou mais de 6 segundos, redirecionando para dashboard')
        toast.error('Página demorou muito para carregar. Redirecionando...')
        router.push('/dashboard')
      }, NAVIGATION_TIMEOUT)
    } else if (navigationStartRef.current) {
      // Navegação completou
      const timeElapsed = Date.now() - navigationStartRef.current
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      navigationStartRef.current = null
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isPending, router])
}

