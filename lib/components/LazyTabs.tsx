'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReactNode, useState, useMemo } from 'react'

interface LazyTabsProps {
  tabs: Array<{
    value: string
    label: string
    icon?: ReactNode
  }>
  children: ReactNode
  defaultValue?: string
}

export function LazyTabs({ tabs, children, defaultValue }: LazyTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value)
  
  // Renderizar apenas o conteúdo da aba ativa
  const renderedChildren = useMemo(() => {
    return children
  }, [children])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="mt-4">
        {renderedChildren}
      </div>
    </Tabs>
  )
}
