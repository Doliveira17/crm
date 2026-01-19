'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Keyboard } from 'lucide-react'

export function KeyboardShortcutsHelp() {
  const shortcuts = [
    { keys: ['Ctrl', 'N'], description: 'Novo Cliente' },
    { keys: ['Ctrl', 'K'], description: 'Focar Busca' },
    { keys: ['Ctrl', 'B'], description: 'Ir para Dashboard' },
    { keys: ['Esc'], description: 'Voltar' },
  ]

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Atalhos de Teclado</h3>
        </div>
        <div className="space-y-2">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, j) => (
                  <Badge key={j} variant="outline" className="font-mono text-xs">
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
