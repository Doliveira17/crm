'use client'

import { useState, useEffect } from 'react'
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
import { SearchInput } from '@/components/common/SearchInput'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const [quickCreateName, setQuickCreateName] = useState('')

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
  ) || []

  const filteredContatos = availableContatos.filter((contato) => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase().trim()
    const nomeMatch = contato.nome_completo.toLowerCase().includes(searchLower)
    const cargoMatch = contato.cargo?.toLowerCase().includes(searchLower) || false
    
    // Busca por telefone (remove formatação para comparar apenas números)
    const searchNumbers = searchTerm.replace(/\D/g, '')
    const telefoneMatch = contato.celular && searchNumbers.length >= 3 ? 
      contato.celular.replace(/\D/g, '').includes(searchNumbers) : false
    
    return nomeMatch || cargoMatch || telefoneMatch
  })

  // Detectar se a busca parece ser um número de telefone
  const isPhoneSearch = /[\d\s\(\)\-\+\.]{8,}/.test(searchTerm.trim())
  const showQuickCreate = searchTerm.trim().length > 0 && filteredContatos.length === 0 && isPhoneSearch

  // Limpar seleção quando os contatos filtrados mudarem
  useEffect(() => {
    if (selectedContatoId && !filteredContatos.some(c => c.id === selectedContatoId)) {
      setSelectedContatoId('')
    }
  }, [filteredContatos, selectedContatoId])

  const handleLinkDialogClose = () => {
    setLinkDialogOpen(false)
    setSearchTerm('')
    setSelectedContatoId('')
  }

  const handleQuickCreate = () => {
    setQuickCreateName('')
    setQuickCreateOpen(true)
  }

  const handleQuickCreateSubmit = async () => {
    if (!quickCreateName.trim()) return

    try {
      const novoContato = await createContato.mutateAsync({
        nome_completo: quickCreateName.trim(),
        celular: searchTerm.trim(),
        cargo: null,
        email: null,
        observacoes: null
      })

      // Vincular o contato recém-criado
      await createVinculo.mutateAsync({
        cliente_id: clienteId,
        contato_id: novoContato.id,
        cargo_no_cliente: null,
        contato_principal: false
      })

      setQuickCreateOpen(false)
      setQuickCreateName('')
      setLinkDialogOpen(false)
      setSearchTerm('')
    } catch (error) {
      console.error('Erro ao criar e vincular contato:', error)
    }
  }

  return (
    <>
      <div className="w-full max-w-full space-y-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Lista de Contatos</h3>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setLinkDialogOpen(true)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Vincular Existente
            </Button>
            <Button
              onClick={() => setNewContactDialogOpen(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Plus className="mr-2 h-5 w-5" />
              Criar e Vincular
            </Button>
          </div>
        </div>
        <div className="w-full max-w-full min-h-[500px]">
          {vinculos.length === 0 ? (
            <div className="text-center py-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="mx-auto w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-8">
                <Users className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-gray-700 font-semibold text-2xl mb-3">Nenhum contato vinculado</h3>
              <p className="text-gray-500 text-lg">Adicione contatos para este cliente usando os botões acima</p>
            </div>
          ) : (
            <div className="space-y-5 w-full">
              {vinculos.map((vinculo) => (
                <div
                  key={vinculo.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border border-gray-200 p-6 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md w-full"
                >
                  <div 
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() => router.push(`/contatos/${vinculo.contato.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-lg hover:text-blue-700 hover:underline transition-colors cursor-pointer">
                        {vinculo.contato.nome_completo}
                      </p>
                      {vinculo.contato_principal && (
                        <Badge className="bg-blue-600 text-white border-0 shadow-sm text-sm px-3 py-1">
                          <Star className="mr-1 h-4 w-4" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    {vinculo.contato.cargo && (
                      <p className="text-base text-gray-600 mt-1">
                        {vinculo.contato.cargo}
                      </p>
                    )}
                    {vinculo.contato.celular && (
                      <p className="text-sm text-gray-600">
                        {formatPhoneBR(vinculo.contato.celular)}
                      </p>
                    )}
                    {vinculo.contato.email && (
                      <p className="text-sm text-gray-600">
                        {vinculo.contato.email}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/contatos/${vinculo.contato.id}`)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                      title="Ver contato"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {!vinculo.contato_principal && (
                      <Button
                        variant="outline"
                        onClick={() => onSetPrincipal(vinculo.id)}
                        title="Definir como principal"
                        className="border-amber-400 text-amber-600 hover:bg-amber-50 hover:border-amber-500"
                        size="sm"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setDeleteVinculoId(vinculo.id)}
                      title="Remover vínculo"
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={handleLinkDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Contato Existente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar contato</Label>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Digite o nome, cargo ou telefone do contato..."
              />
            </div>
            <div className="space-y-2">
              <Label>Selecione um contato</Label>
              {filteredContatos && filteredContatos.length > 0 ? (
                <Select value={selectedContatoId} onValueChange={setSelectedContatoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um contato..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredContatos.map((contato) => (
                      <SelectItem key={contato.id} value={contato.id}>
                        {contato.nome_completo}
                        {contato.cargo && ` - ${contato.cargo}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center h-10 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md border">
                    {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
                  </div>
                  {showQuickCreate && (
                    <div className="p-4 border-2 border-dashed border-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Não encontrou o contato? Crie rapidamente:
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleQuickCreate}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Criar contato com telefone {searchTerm}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleLinkDialogClose}>
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

      <Dialog open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Contato Rapidamente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input 
                value={searchTerm}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Telefone será salvo automaticamente
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quick-name">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quick-name"
                value={quickCreateName}
                onChange={(e) => setQuickCreateName(e.target.value)}
                placeholder="Digite o nome completo..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickCreateName.trim()) {
                    handleQuickCreateSubmit()
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setQuickCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleQuickCreateSubmit}
                disabled={!quickCreateName.trim() || createContato.isPending || createVinculo.isPending}
              >
                {(createContato.isPending || createVinculo.isPending) ? 'Criando...' : 'Criar e Vincular'}
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
