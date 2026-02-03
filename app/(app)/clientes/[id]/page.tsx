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
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Trash2, Star, Copy, Users, Sparkles } from 'lucide-react'
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
  const [contactsModalOpen, setContactsModalOpen] = useState(false)

  // Atalho Ctrl+V para vincular contato
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        setContactsModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
      razao_social: `${dadosCliente.razao_social} (Cópia)`,
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
              <h1 className="text-3xl font-bold">{cliente.razao_social}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorito}
              >
                <Star className={`h-5 w-5 ${cliente.favorito ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>
              
              {/* Botão de contatos próximo ao título */}
              <Dialog open={contactsModalOpen} onOpenChange={setContactsModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 ml-4"
                    title="Abrir contatos vinculados (Ctrl+V)"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Contatos ({vinculos?.length || 0})
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-7xl w-[96vw] h-[92vh] overflow-hidden border border-gray-200 bg-white rounded-xl shadow-xl">
                  <DialogHeader className="bg-gray-50 border-b border-gray-100 pb-6 px-8 pt-8 -mx-6 -mt-6 rounded-t-xl">
                    <DialogTitle className="flex items-center gap-4 text-2xl font-semibold">
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-xl">
                        <Users className="h-6 w-6 text-gray-700" />
                      </div>
                      <span className="text-gray-800">Contatos Vinculados</span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="px-8 py-8 overflow-y-auto overflow-x-hidden h-[calc(92vh-140px)]">
                    <ClienteContactsPanel
                      clienteId={clienteId}
                      vinculos={vinculos || []}
                      onDeleteVinculo={handleDeleteVinculo}
                      onSetPrincipal={handleSetPrincipal}
                    />
                  </div>
                </DialogContent>
              </Dialog>
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
