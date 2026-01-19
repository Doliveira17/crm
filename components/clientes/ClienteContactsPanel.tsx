'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VinculoWithDetails, useCreateVinculo } from '@/lib/hooks/useVinculos'
import { useContatosList, useCreateContato } from '@/lib/hooks/useContatos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, Star, Trash2, UserPlus, ExternalLink } from 'lucide-react'
import { formatPhoneBR } from '@/lib/utils/normalize'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contatoSchema, ContatoFormData } from '@/lib/validators/contato'
import { Input } from '@/components/ui/input'
import { phoneMask } from '@/lib/utils/masks'

interface ClienteContactsPanelProps {
  clienteId: string
  vinculos: VinculoWithDetails[]
  onDeleteVinculo: (vinculoId: string) => void
  onSetPrincipal: (vinculoId: string) => void
}

export function ClienteContactsPanel({
  clienteId,
  vinculos,
  onDeleteVinculo,
  onSetPrincipal,
}: ClienteContactsPanelProps) {
  const router = useRouter()
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [newContactDialogOpen, setNewContactDialogOpen] = useState(false)
  const [selectedContatoId, setSelectedContatoId] = useState<string>('')
  const [deleteVinculoId, setDeleteVinculoId] = useState<string | null>(null)

  const { data: contatos } = useContatosList()
  const createVinculo = useCreateVinculo()
  const createContato = useCreateContato()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ContatoFormData>({
    resolver: zodResolver(contatoSchema),
  })

  const [celularValue, setCelularValue] = useState('')

  const handleLinkExisting = async () => {
    if (!selectedContatoId) return

    await createVinculo.mutateAsync({
      cliente_id: clienteId,
      contato_id: selectedContatoId,
      contato_principal: false,
    })

    setLinkDialogOpen(false)
    setSelectedContatoId('')
  }

  const handleCreateAndLink = async (data: ContatoFormData) => {
    const newContato = await createContato.mutateAsync(data) as any

    await createVinculo.mutateAsync({
      cliente_id: clienteId,
      contato_id: newContato.id,
      contato_principal: false,
    })

    setNewContactDialogOpen(false)
    reset()
    setCelularValue('')
  }

  const availableContatos = contatos?.filter(
    (c) => !vinculos.some((v) => v.contato_id === c.id)
  )

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contatos Vinculados</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLinkDialogOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Vincular Existente
              </Button>
              <Button
                size="sm"
                onClick={() => setNewContactDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar e Vincular
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vinculos.length === 0 ? (
            <EmptyState
              title="Nenhum contato vinculado"
              description="Adicione contatos para este cliente"
            />
          ) : (
            <div className="space-y-3">
              {vinculos.map((vinculo) => (
                <div
                  key={vinculo.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => router.push(`/contatos/${vinculo.contato.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium hover:text-primary hover:underline">
                        {vinculo.contato.nome_completo}
                      </p>
                      {vinculo.contato_principal && (
                        <Badge variant="default">
                          <Star className="mr-1 h-3 w-3" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    {vinculo.contato.cargo && (
                      <p className="text-sm text-muted-foreground">
                        {vinculo.contato.cargo}
                      </p>
                    )}
                    {vinculo.contato.celular && (
                      <p className="text-sm text-muted-foreground">
                        {formatPhoneBR(vinculo.contato.celular)}
                      </p>
                    )}
                    {vinculo.contato.email && (
                      <p className="text-sm text-muted-foreground">
                        {vinculo.contato.email}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/contatos/${vinculo.contato.id}`)}
                      title="Ver contato"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {!vinculo.contato_principal && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSetPrincipal(vinculo.id)}
                        title="Definir como principal"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteVinculoId(vinculo.id)}
                      title="Remover vínculo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Contato Existente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione um contato</Label>
              <Select value={selectedContatoId} onValueChange={setSelectedContatoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um contato..." />
                </SelectTrigger>
                <SelectContent>
                  {availableContatos?.map((contato) => (
                    <SelectItem key={contato.id} value={contato.id}>
                      {contato.nome_completo}
                      {contato.cargo && ` - ${contato.cargo}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleLinkExisting}
                disabled={!selectedContatoId || createVinculo.isPending}
              >
                Vincular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={newContactDialogOpen} onOpenChange={setNewContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar e Vincular Novo Contato</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreateAndLink)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input id="nome_completo" {...register('nome_completo')} />
              {errors.nome_completo && (
                <p className="text-sm text-destructive">{errors.nome_completo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo/Relacionamento</Label>
              <Input
                id="cargo"
                placeholder="Ex: Esposa, Sócio, Gerente..."
                {...register('cargo')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                value={celularValue}
                onChange={(e) => {
                  const masked = phoneMask(e.target.value)
                  setCelularValue(masked)
                  setValue('celular', masked)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewContactDialogOpen(false)
                  reset()
                  setCelularValue('')
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createContato.isPending || createVinculo.isPending}>
                {createContato.isPending || createVinculo.isPending
                  ? 'Criando...'
                  : 'Criar e Vincular'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteVinculoId}
        onOpenChange={(open) => !open && setDeleteVinculoId(null)}
        onConfirm={() => {
          if (deleteVinculoId) {
            onDeleteVinculo(deleteVinculoId)
            setDeleteVinculoId(null)
          }
        }}
        title="Remover Vínculo"
        description="Tem certeza que deseja desvincular este contato do cliente?"
        confirmText="Remover"
        variant="destructive"
      />
    </>
  )
}
