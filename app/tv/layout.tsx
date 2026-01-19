'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import '@/app/globals.css'

export default function TVLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen dark bg-background text-foreground">
        {children}
      </div>
    </QueryClientProvider>
  )
}
