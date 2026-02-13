'use client'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts'

export function AppShell({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts()

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
