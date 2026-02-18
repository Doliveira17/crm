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
import { Plus, Star, Trash2, UserPlus, ExternalLink, Users, CheckCircle } from 'lucide-react'
import { formatPhoneBR } from '@/lib/utils/normalize'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ContatoForm } from '@/components/contatos/ContatoForm'
import { ContatoFormData } from '@/lib/validators/contato'
import { Input } from '@/components/ui/input'
import { SearchInput } from '@/components/common/SearchInput'
import { toast } from 'sonner'

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
      }) as { id: string } | null

      // Vincular o contato recém-criado
      if (novoContato?.id) {
        await createVinculo.mutateAsync({
          cliente_id: clienteId,
          contato_id: novoContato.id,
          cargo_no_cliente: null,
          contato_principal: false
        })
      }

      setQuickCreateOpen(false)
      setQuickCreateName('')
      setLinkDialogOpen(false)
      setSearchTerm('')
      toast.success('Contato criado e vinculado com sucesso')
    } catch (error) {
      console.error('Erro ao criar e vincular contato:', error)
      toast.error('Erro ao criar contato. Verifique os dados e tente novamente.')
    }
  }

  return (
    <>
      {/* Seção Relacionamentos */}
      <div className="bg-white border border-slate-300 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Relacionamentos</h3>
          <div className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
            {vinculos.length} contatos
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h4 className="text-lg font-medium text-slate-800 tracking-tight">Lista de Contatos</h4>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setLinkDialogOpen(true)}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-medium"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Vincular Existente
              </Button>
              <Button
                onClick={() => setNewContactDialogOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 transition-all duration-200 font-medium"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar e Vincular
              </Button>
            </div>
          </div>
          <div className="w-full max-w-full min-h-[400px]">
            {vinculos.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-slate-700 font-semibold text-xl mb-2 tracking-tight">Nenhum contato vinculado</h3>
                <p className="text-slate-500 text-base">Adicione contatos para este cliente usando os botões acima</p>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {vinculos.map((vinculo) => (
                  <div
                    key={vinculo.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border border-slate-200 p-5 bg-white hover:bg-slate-50/50 transition-all duration-200 shadow-sm hover:shadow-md w-full"
                  >
                    <div 
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => router.push(`/contatos/${vinculo.contato.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-lg text-slate-900 hover:text-slate-700 hover:underline transition-colors cursor-pointer tracking-tight">
                          {vinculo.contato.nome_completo}
                        </p>
                        {vinculo.contato_principal && (
                          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs px-2 py-1 font-medium">
                            <Star className="mr-1 h-3 w-3" />
                            Principal
                          </Badge>
                        )}
                      </div>
                      {vinculo.contato.cargo && (
                        <p className="text-sm text-slate-600 mt-1 font-medium">
                          {vinculo.contato.cargo}
                        </p>
                      )}
                      <div className="flex flex-col gap-1 mt-2">
                        {vinculo.contato.celular && (
                          <p className="text-sm text-slate-500">
                            {formatPhoneBR(vinculo.contato.celular)}
                          </p>
                        )}
                        {vinculo.contato.email && (
                          <p className="text-sm text-slate-500">
                            {vinculo.contato.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {vinculo.contato.canal_relatorio && vinculo.contato.canal_relatorio.length > 0 && (
                        <Button
                          variant="outline"
                          disabled
                          title={`Autorizado para: ${vinculo.contato.canal_relatorio.join(', ')}`}
                          className="bg-emerald-50 border border-emerald-200 text-emerald-600 cursor-default font-medium"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/contatos/${vinculo.contato.id}`)}
                        className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-medium"
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
                          className="bg-white border border-yellow-200 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 font-medium"
                          size="sm"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setDeleteVinculoId(vinculo.id)}
                        title="Remover vínculo"
                        className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 font-medium"
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
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={handleLinkDialogClose}>
        <DialogContent className="bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900 tracking-tight">Vincular Contato Existente</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Buscar contato</Label>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Digite o nome, cargo ou telefone do contato..."
                className="bg-white border border-slate-300 focus:border-slate-400"
              />
            </div>
            {filteredContatos && filteredContatos.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Resultados ({filteredContatos.length})</Label>
                <div className="max-h-60 overflow-y-auto border rounded-lg border-slate-200">
                  {filteredContatos.map((contato) => (
                    <button
                      key={contato.id}
                      type="button"
                      onClick={() => setSelectedContatoId(contato.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                        selectedContatoId === contato.id ? 'bg-slate-100 border-l-4 border-l-slate-400' : ''
                      }`}
                    >
                      <div className="font-medium text-slate-900">{contato.nome_completo}</div>
                      {contato.cargo && (
                        <div className="text-sm text-slate-600">{contato.cargo}</div>
                      )}
                      {contato.celular && (
                        <div className="text-sm text-slate-500">{contato.celular}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {searchTerm && filteredContatos && filteredContatos.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-center h-12 px-4 py-3 text-sm text-slate-600 bg-slate-50 rounded-lg border border-slate-200">
                  Nenhum contato encontrado
                </div>
                {showQuickCreate && (
                  <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/50">
                    <p className="text-sm text-slate-600 mb-3 font-medium">
                      Não encontrou o contato? Crie rapidamente:
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleQuickCreate}
                        className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar contato com telefone {searchTerm}
                    </Button>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={handleLinkDialogClose}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleLinkExisting}
                disabled={!selectedContatoId || createVinculo.isPending}
                className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-900"
              >
                {createVinculo.isPending ? 'Vinculando...' : 'Vincular'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
        <DialogContent className="bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900 tracking-tight">Criar Contato Rapidamente</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Telefone</Label>
              <Input 
                value={searchTerm}
                disabled
                className="bg-slate-50 border border-slate-200 text-slate-600"
              />
              <p className="text-xs text-slate-500">
                Telefone será salvo automaticamente
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quick-name" className="text-sm font-medium text-slate-700">
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quick-name"
                value={quickCreateName}
                onChange={(e) => setQuickCreateName(e.target.value)}
                placeholder="Digite o nome completo..."
                className="bg-white border border-slate-300 focus:border-slate-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickCreateName.trim()) {
                    handleQuickCreateSubmit()
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setQuickCreateOpen(false)}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleQuickCreateSubmit}
                disabled={!quickCreateName.trim() || createContato.isPending || createVinculo.isPending}
                className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-900"
              >
                {(createContato.isPending || createVinculo.isPending) ? 'Criando...' : 'Criar e Vincular'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={newContactDialogOpen} onOpenChange={setNewContactDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900 tracking-tight">Criar e Vincular Nova Pessoa</DialogTitle>
          </DialogHeader>
          <ContatoForm
            onSubmit={async (data: ContatoFormData) => {
              try {
                console.log('=== INICIANDO CRIAÇÃO DE CONTATO ===')
                console.log('Dados do formulário:', JSON.stringify(data, null, 2))
                
                const novoContato = await createContato.mutateAsync(data) as { id: string } | null
                console.log('✅ Contato criado com sucesso:', novoContato)
                
                if (!novoContato?.id) {
                  throw new Error('Contato não foi criado corretamente - ID não retornado')
                }
                
                const vinculoData = {
                  cliente_id: clienteId,
                  contato_id: novoContato.id,
                  cargo_no_cliente: data.cargo || null,
                  contato_principal: false
                }
                console.log('=== INICIANDO VINCULAÇÃO DE CONTATO ===')
                console.log('Dados do vínculo:', JSON.stringify(vinculoData, null, 2))
                
                const novoVinculo = await createVinculo.mutateAsync(vinculoData)
                console.log('✅ Vínculo criado com sucesso:', novoVinculo)
                
                // Fechar modal e mostrar sucesso
                setNewContactDialogOpen(false)
                toast.success('Contato criado e vinculado com sucesso')
                
              } catch (error: any) {
                console.error('❌ ERRO COMPLETO:', error)
                console.error('❌ Tipo:', typeof error)
                console.error('❌ Mensagem:', error?.message)
                console.error('❌ Código:', error?.code)
                console.error('❌ Detalhes:', error?.details)
                console.error('❌ Stack:', error?.stack)
                
                const errorMessage = error?.message || error?.toString() || 'Erro desconhecido ao criar contato'
                toast.error(`Erro: ${errorMessage}`)
                
                throw error // Re-throw para o form saber que falhou
              }
            }}
            onCancel={() => setNewContactDialogOpen(false)}
          />
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
