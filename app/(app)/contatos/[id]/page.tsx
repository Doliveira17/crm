'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useContatoById, useUpdateContato, useDeleteContato } from '@/lib/hooks/useContatos'
import { useVinculosByContato } from '@/lib/hooks/useVinculos'
import { ContatoForm } from '@/components/contatos/ContatoForm'
import { LoadingState } from '@/components/common/LoadingState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { ContatoFormData } from '@/lib/validators/contato'

export default function ContatoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contatoId = params.id as string

  const { data: contato, isLoading } = useContatoById(contatoId)
  const { data: vinculos } = useVinculosByContato(contatoId)
  const updateContato = useUpdateContato()
  const deleteContato = useDeleteContato()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (isLoading) {
    return <LoadingState />
  }

  if (!contato) {
    return <div>Contato não encontrado</div>
  }

  const handleUpdate = async (data: ContatoFormData) => {
    await updateContato.mutateAsync({ id: contatoId, data })
  }

  const handleDelete = async () => {
    await deleteContato.mutateAsync(contatoId)
    router.push('/contatos')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contatos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{contato.nome_completo}</h1>
            <p className="text-muted-foreground">Editar informações do contato</p>
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

      <ContatoForm
        initialData={contato as any}
        onSubmit={handleUpdate}
        onCancel={() => router.push('/contatos')}
        loading={updateContato.isPending}
      />

      {vinculos && vinculos.length > 0 && (
        <>
          <Separator className="my-8" />
          <Card>
            <CardHeader>
              <CardTitle>Clientes Vinculados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vinculos.map((vinculo: any) => (
                  <div 
                    key={vinculo.id} 
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <Link 
                      href={`/clientes/${vinculo.cliente_id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <p className="font-medium hover:text-primary hover:underline">
                        {vinculo.cliente?.nome_cadastro}
                      </p>
                      {vinculo.cliente?.tipo_cliente && (
                        <p className="text-sm text-muted-foreground">
                          {vinculo.cliente.tipo_cliente === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </p>
                      )}
                    </Link>
                    <Link href={`/clientes/${vinculo.cliente_id}`}>
                      <Button size="sm" variant="outline">
                        Ver Cliente
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

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
