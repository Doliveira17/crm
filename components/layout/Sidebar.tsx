'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, FileText, MessageSquare, Tag, Zap, ChevronLeft, ChevronRight, Wrench } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Clientes',
    href: '/clientes',
    icon: Users,
  },
  {
    title: 'Dados Técnicos',
    href: '/tecnica',
    icon: Wrench,
  },
  {
    title: 'Interações',
    href: '/interacoes',
    icon: MessageSquare,
  },
  {
    title: 'Tags',
    href: '/tags',
    icon: Tag,
  },
  {
    title: 'Faturas',
    href: '/faturas',
    icon: Zap,
  },
  {
    title: 'Relatórios',
    href: '/relatorios',
    icon: FileText,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') {
      setIsCollapsed(true)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed))
    }
  }, [isCollapsed, mounted])

  return (
    <aside className={cn(
      'bg-white border-r border-slate-200 transition-all duration-300 relative shadow-sm',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className={cn(
        'px-6 py-6 flex items-center border-b border-slate-100',
        isCollapsed ? 'justify-center px-3' : 'justify-between'
      )}>
        {!isCollapsed && (
          <h1 className="flex items-baseline gap-1">
            <span className="text-xl font-light tracking-tight text-emerald-600">Solar</span>
            <span className="text-xl font-semibold tracking-tight text-slate-800">Energy</span>
            <span className="ml-2 text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wider">CRM</span>
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'h-8 w-8 hover:bg-slate-100 text-slate-400 hover:text-slate-600',
            isCollapsed && 'mx-auto'
          )}
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'border border-black text-slate-900 bg-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className={cn(
                'h-5 w-5 flex-shrink-0 transition-colors',
                isActive ? 'text-black' : 'text-slate-500 group-hover:text-blue-600'
              )} />
              {!isCollapsed && <span className="truncate">{item.title}</span>}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>
      
      {/* Indicador visual para sidebar colapsada */}
      {isCollapsed && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-col space-y-1">
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      )}
    </aside>
  )
}
