'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SemAcessoPage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <Card className="max-w-lg border border-amber-200 dark:border-amber-900/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
          <CardDescription className="text-base">
            Nenhuma permissão configurada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Olá <strong>{user?.email}</strong>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Seu usuário não possui permissões configuradas para acessar nenhuma seção do sistema.
            </p>
          </div>

          <div className="space-y-2 text-left rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 p-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              O que fazer?
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
              <li>Entre em contato com o administrador do sistema</li>
              <li>Solicite permissões para as seções que você precisa acessar</li>
              <li>Aguarde a configuração ser realizada</li>
            </ul>
          </div>

          <Button onClick={logout} variant="outline" className="w-full">
            Fazer Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
