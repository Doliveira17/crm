'use client'

import { useRouter } from 'next/navigation'
import { useCreateCliente } from '@/lib/hooks/useClientes'
import { ClienteForm } from '@/components/clientes/ClienteForm'
import { ClienteFormData } from '@/lib/validators/cliente'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Building2, User, Users, Plus, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'
import { EmptyState } from '@/components/common/EmptyState'

export default function NovoClientePage() {
  const router = useRouter()
  const createCliente = useCreateCliente()
  const [tipoCliente, setTipoCliente] = useState<'PF' | 'PJ'>('PJ')

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

        <div className="flex gap-2 ml-6">
          <Button
            variant={tipoCliente === 'PF' ? 'default' : 'outline'}
            onClick={() => setTipoCliente('PF')}
            className="flex items-center gap-2"
            size="sm"
          >
            <User className="h-4 w-4" />
            Pessoa Física
          </Button>
          <Button
            variant={tipoCliente === 'PJ' ? 'default' : 'outline'}
            onClick={() => setTipoCliente('PJ')}
            className="flex items-center gap-2"
            size="sm"
          >
            <Building2 className="h-4 w-4" />
            Pessoa Jurídica
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Formulário (2/3) */}
        <div className="lg:col-span-2">
          <ClienteForm
            key={tipoCliente} // Força re-render quando muda o tipo
            initialData={{ tipo_cliente: tipoCliente }}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/clientes')}
            loading={createCliente.isPending}
          />
        </div>

        {/* Coluna Direita - Relacionamentos (1/3) */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg sticky top-6">
            <CardHeader className="pb-4 border-b bg-gray-50">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Relacionamentos
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  0 contatos
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="w-full justify-start"
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Vincular Existente
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    disabled
                    className="w-full justify-start"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar e Vincular
                  </Button>
                </div>
                
                <div className="mt-6">
                  <EmptyState
                    icon={<Users className="h-12 w-12" />}
                    title="Nenhum contato vinculado"
                    description="Cadastre o cliente primeiro para depois vincular contatos."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
