'use client'

import { useRouter } from 'next/navigation'
import { useCreateCliente } from '@/lib/hooks/useClientes'
import { ClienteForm } from '@/components/clientes/ClienteForm'
import { ClienteFormData } from '@/lib/validators/cliente'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NovoClientePage() {
  const router = useRouter()
  const createCliente = useCreateCliente()

  const handleSubmit = async (data: ClienteFormData) => {
    await createCliente.mutateAsync(data)
    router.push('/clientes')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo Cliente</h1>
          <p className="text-muted-foreground">Cadastrar um novo cliente no sistema</p>
        </div>
      </div>

      <ClienteForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/clientes')}
        loading={createCliente.isPending}
      />
    </div>
  )
}
