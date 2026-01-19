'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClienteById, useUpdateCliente, useDeleteCliente } from '@/lib/hooks/useClientes'
import { useVinculosByCliente, useDeleteVinculo, useSetContatoPrincipal } from '@/lib/hooks/useVinculos'
import { ClienteForm } from '@/components/clientes/ClienteForm'
import { ClienteContactsPanel } from '@/components/clientes/ClienteContactsPanel'
import { LoadingState } from '@/components/common/LoadingState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Trash2, Star, Copy } from 'lucide-react'
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

  const handleDuplicar = async () => {
    const { tags, favorito, created_at, updated_at, id, ...dadosCliente } = cliente as any
    
    const novoCliente = {
      ...dadosCliente,
      nome_cadastro: `${dadosCliente.nome_cadastro} (Cópia)`,
    }

    const { data, error } = await supabase
      .from('crm_clientes')
      .insert(novoCliente)
      .select()
      .single<{ id: string }>()

    if (error) {
      toast.error('Erro ao duplicar cliente')
      return
    }

    if (data) {
      toast.success('Cliente duplicado com sucesso!')
      router.push(`/clientes/${data.id}`)
    }
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
              <h1 className="text-3xl font-bold">{cliente.nome_cadastro}</h1>
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
            variant="outline"
            size="sm"
            onClick={handleDuplicar}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </Button>
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

      <ClienteForm
        initialData={cliente as any}
        onSubmit={handleUpdate}
        onCancel={() => router.push('/clientes')}
        loading={updateCliente.isPending}
      />

      <Separator className="my-8" />

      <ClienteContactsPanel
        clienteId={clienteId}
        vinculos={vinculos || []}
        onDeleteVinculo={handleDeleteVinculo}
        onSetPrincipal={handleSetPrincipal}
      />

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
