'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClienteById, useUpdateCliente, useDeleteCliente } from '@/lib/hooks/useClientes'
import { useVinculosByCliente, useDeleteVinculo, useSetContatoPrincipal } from '@/lib/hooks/useVinculos'
import { ClienteForm } from '@/components/clientes/ClienteForm'
import { ClienteContactsPanel } from '@/components/clientes/ClienteContactsPanel'
import { LoadingState } from '@/components/common/LoadingState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trash2, Star, Users, Wrench, ShieldAlert } from 'lucide-react'
import { ClienteFormData } from '@/lib/validators/cliente'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clienteId = params.id as string

  const { data: cliente, isLoading } = useClienteById(clienteId)
  const { data: vinculos } = useVinculosByCliente(clienteId)
  const updateCliente = useUpdateCliente()
  const deleteCliente = useDeleteCliente()
  const deleteVinculo = useDeleteVinculo()
  const setContatoPrincipal = useSetContatoPrincipal()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (isLoading) {
    return <LoadingState />
  }

  if (!cliente) {
    return <div>Cliente não encontrado</div>
  }

  const handleUpdate = async (data: ClienteFormData) => {
    await updateCliente.mutateAsync({ id: clienteId, data })
  }

  const handleDelete = async () => {
    await deleteCliente.mutateAsync(clienteId)
    router.push('/clientes')
  }

  const handleToggleFavorito = async () => {
    await updateCliente.mutateAsync({
      id: clienteId,
      data: { favorito: !cliente.favorito }
    })
  }

  const handleDeleteVinculo = async (vinculoId: string) => {
    await deleteVinculo.mutateAsync(vinculoId)
  }

  const handleSetPrincipal = async (vinculoId: string) => {
    await setContatoPrincipal.mutateAsync({ vinculoId, clienteId })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{cliente.razao_social}</h1>
              {cliente.status === 'BLOQUEADO' && (
                <Badge variant="destructive">
                  BLOQUEADO
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorito}
              >
                <Star className={`h-5 w-5 ${cliente.favorito ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>
            </div>
            <p className="text-muted-foreground">Editar informações do cliente</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Formulário (2/3) */}
        <div className="lg:col-span-2">
          <ClienteForm
            initialData={cliente as any}
            onSubmit={handleUpdate}
            onCancel={() => router.push('/clientes')}
            loading={updateCliente.isPending}
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
                  {vinculos?.length || 0} contato{(vinculos?.length || 0) !== 1 ? 's' : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ClienteContactsPanel
                clienteId={clienteId}
                vinculos={vinculos || []}
                onDeleteVinculo={handleDeleteVinculo}
                onSetPrincipal={handleSetPrincipal}
              />
              
              <div className="mt-6 pt-4 border-t">
                <Link href={`/tecnica/${clienteId}`}>
                  <Button variant="outline" className="w-full" size="lg">
                    <Wrench className="mr-2 h-4 w-4" />
                    Dados Técnicos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="destructive"
      />
    </div>
  )
}
