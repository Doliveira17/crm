'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useContatoById, useUpdateContato, useDeleteContato } from '@/lib/hooks/useContatos'
import { ContatoForm } from '@/components/contatos/ContatoForm'
import { ClientesVinculadosSection } from '@/components/contatos/ClientesVinculadosSection'
import { LoadingState } from '@/components/common/LoadingState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Trash2, Handshake } from 'lucide-react'
import { ContatoFormData, PreferenciasClienteData } from '@/lib/validators/contato'

export default function ContatoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contatoId = params.id as string

  const { data: contato, isLoading } = useContatoById(contatoId)
  const updateContato = useUpdateContato()
  const deleteContato = useDeleteContato()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientesVinculados, setClientesVinculados] = useState<PreferenciasClienteData[]>([])

  // Sincronizar clientes vinculados quando contato muda
  useEffect(() => {
    if (contato?.clientes_vinculados) {
      setClientesVinculados(contato.clientes_vinculados)
    }
  }, [contato?.clientes_vinculados])

  if (isLoading) {
    return <LoadingState />
  }

  if (!contato) {
    return <div>Contato não encontrado</div>
  }

  const handleUpdate = async (data: ContatoFormData) => {
    // Incluir clientes vinculados com as alterações
    const dataWithClientes = {
      ...data,
      clientes_vinculados: clientesVinculados,
    }
    await updateContato.mutateAsync({ id: contatoId, data: dataWithClientes })
  }

  const handleDelete = async () => {
    await deleteContato.mutateAsync(contatoId)
    router.push('/contatos')
  }

  const handleCancel = () => {
    router.back()
  }

  const handleClienteUpdate = (clienteId: string, data: Partial<PreferenciasClienteData>) => {
    setClientesVinculados((prev) =>
      prev.map((cliente) =>
        cliente.cliente_id === clienteId ? { ...cliente, ...data } : cliente
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{contato.nome_completo}</h1>
            <p className="text-muted-foreground">Editar informações da pessoa</p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir Contato
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Formulário (2/3) */}
        <div className="lg:col-span-2">
          <ContatoForm
            initialData={contato as any}
            onSubmit={handleUpdate}
            onCancel={handleCancel}
            loading={updateContato.isPending}
            hideClientsSection
          />
        </div>

        {/* Coluna Direita - Clientes Vinculados (1/3) */}
        <div className="lg:col-span-1">
          {clientesVinculados && clientesVinculados.length > 0 ? (
            <div className="sticky top-6">
              <ClientesVinculadosSection
                clientes={clientesVinculados}
                onUpdate={handleClienteUpdate}
              />
            </div>
          ) : (
            <Card className="shadow-lg sticky top-6">
              <div className="p-8 text-center">
                <Handshake className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum Cliente Vinculado
                </h3>
                <p className="text-sm text-muted-foreground">
                  Adicione clientes para este contato na página de clientes.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Excluir Contato"
        description="Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="destructive"
      />
    </div>
  )
}
